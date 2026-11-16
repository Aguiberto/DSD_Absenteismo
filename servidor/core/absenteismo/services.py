from datetime import datetime
from django.db.models import Count, Sum, Avg
from spyne import ServiceBase, rpc, String, Integer, Date, Iterable, Fault

from .models import AtestadoMedico
from .schemas import RegistrarAtestadoResponse, CidMetrica, MetricasAbsenteismoResponse

class AbsenteismoService(ServiceBase):

    # Namespace que identifica as operações deste serviço no contrato SOAP/WSDL.
    __namespace__ = "absenteismo.soap"  

    # O decorator publica a operação no SOAP e declara os tipos dos parâmetros e da resposta.
    @rpc(String, String, String, Integer, Date, String, String, _returns=RegistrarAtestadoResponse)
    def registrar_atestado(ctx, cpf_funcionario, nome_funcionario, cid, dias_afastamento, data_emissao, nome_medico, crm_medico):
        """
        Registra um atestado médico no banco de dados
        """
        # Remove caracteres não numéricos para validar e armazenar o CPF padronizado.
        cpf_valido = ''.join(filter(str.isdigit, str(cpf_funcionario or '')))
        if len(cpf_valido) != 11:
            raise Fault(
                faultcode="Client.ValidationError",
                faultstring="O CPF do funcionário deve conter exatamente 11 dígitos numéricos."
            )

        if dias_afastamento is None or dias_afastamento <= 0:
            raise Fault(
                faultcode="Client.ValidationError",
                faultstring="O número de dias de afastamento deve ser maior que 0."
            )

        if not nome_funcionario or not cid or not crm_medico:
            raise Fault(
                faultcode="Client.ValidationError",
                faultstring="Os campos nome_funcionario, cid e crm_medico são de preenchimento obrigatório."
            )

        # Cria e salva o registro; o Django fornece o ID gerado no banco.
        atestado = AtestadoMedico.objects.create(
            cpf_funcionario=cpf_valido,
            nome_funcionario=nome_funcionario.strip(),
            cid=cid.strip().upper(),
            dias_afastamento=dias_afastamento,
            data_emissao=data_emissao,
            nome_medico=nome_medico.strip() if nome_medico else "",
            crm_medico=crm_medico.strip()
        )

        # O objeto retornado corresponde ao tipo de resposta declarado no @rpc.
        return RegistrarAtestadoResponse(
            sucesso=True,
            mensagem="Atestado registrado com sucesso!",
            id_atestado=atestado.id
        )

    # Publica uma operação SOAP sem parâmetros de entrada e com resposta estruturada.
    @rpc(_returns=MetricasAbsenteismoResponse)
    def consultar_metricas_absenteismo(ctx):
        """
        Consulta métricas consolidadas de absenteísmo e os 5 CIDs mais frequentes
        """
        # aggregate() calcula totais gerais em uma consulta ao banco.
        agregados = AtestadoMedico.objects.aggregate(
            total_atestados=Count("id"),
            total_dias=Sum("dias_afastamento"),
            media_dias=Avg("dias_afastamento")
        )

        # Garante valores numéricos caso o banco ainda esteja vazio (evita erro de serialização XML)
        total_atestados = agregados["total_atestados"] or 0
        total_dias = agregados["total_dias"] or 0
        media_dias = round(float(agregados["media_dias"] or 0.0), 2)

        # Agrupa por CID, conta os atestados e mantém somente os cinco mais frequentes.
        ranking_cids = (
            AtestadoMedico.objects
            .values("cid")
            .annotate(quantidade=Count("id"))
            .order_by("-quantidade")[:5]
        )

        # Converte os resultados da consulta para os tipos reconhecidos pelo contrato SOAP.
        top_cids = [
            CidMetrica(cid=item["cid"], quantidade=item["quantidade"])
            for item in ranking_cids
        ]

        return MetricasAbsenteismoResponse(
            total_atestados=total_atestados,
            total_dias_afastados=total_dias,
            medias_dias_por_atestado=media_dias,
            top_cids=top_cids
        )
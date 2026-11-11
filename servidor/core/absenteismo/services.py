from datetime import datetime
from django.db.models import Count, Sum, Avg
from spyne import ServiceBase, rpc, String, Integer, Date, Iterable, Fault

from .models import AtestadoMedico
from . schemas import RegistrarAtestadoResponse, CidMetrica, MetricasAbsenteismoResponse

class AbsenteismoService(ServiceBase):

    __namespace__ = "absenteismo.soap"

    @rpc(String, String, String, Integer, Date, String, String, _returns=RegistrarAtestadoResponse)
    def registrar_atestado(ctx, cpf_funcionario, nome_funcionario, cid, dias_afastamento, data_emissao, nome_medico, crm_medico):

        '''
        Registra um atestado médico no banco de dados
        '''

        cpf_valido = ''.join(filter(str.isdigit, str(cpf_funcionario or '')))
        if len(cpf_valido != 11):
            raise Fault(faultcode = "Cliente.ValidationError", faultstring = "O CF do funcinário deve conter exatamente 11 dígitos numéricos." )

        if dias_afastamento is None or dias_afastamento <= 0:
            raise Fault(faultcode = "Cliente.ValidationError", faultstring = "O número de afastamento deve ser maior que 0")

        if not nome_funcionario or not cid or not crm_medico:
            raise Fault(
                faultcode="Client.ValidationError",
                faultstring="Os campos nome_funcionario, cid e crm_medico são de preenchimento obrigatório"
            )

        atestado = AtestadoMedico.objects.create(
            cpf_funcionario = cpf_valido,
            nome_funcionario = nome_funcionario.strip(),
            cid = cid.strip().upper(),
            dias_afastamento = dias_afastamento,
            data_emissao = data_emissao,
            nome_medico = nome_medico.strip() if nome_medico else "",
            crm_medico = crm_medico.strip()

        )

        return RegistrarAtestadoResponse(sucesso = True, mensagem = "Atestado registrado com sucesso!", id_atestado= atestado.id)
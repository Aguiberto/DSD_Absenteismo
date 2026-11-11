# biblioteca para garantir o tipo de dado no contrato WSDL
from spyne import (ComplexModel, Integer, String, Float, Date, Boolean, Iterable)

class RegistrarAtestadoResponse(ComplexModel):

    __namespace__ = "absenteismo.soap"

    sucesso = Boolean
    mensagem = String
    id_atestado = Integer


class CidMetrica(ComplexModel):

    __namespace__ = "absenteismo.soap"

    cid = String
    quantidade = Integer

class MetricasAbsenteismoResponse(ComplexModel):

    __namespace__ ="absenteismo.soap"

    total_atestados = Integer
    total_dias_afastados = Integer
    medias_dias_por_atestado = Float
    top_cids = Iterable(CidMetrica)

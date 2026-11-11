from django.db import models

# Create your models here.

class AtestadoMedico(models.Model):

    cpf_funcionario = models.CharField(max_length=11)
    nome_funcionario = models.CharField(max_length=100)
    cid = models.CharField(max_length=10)
    dias_afastamento = models.IntegerField()
    data_emissao = models.DateField()
    nome_medico = models.CharField(max_length=100)
    crm_medico = models.CharField(max_length=20)
    criado_em = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.nome} - CID {self.cid}, {self.dias_afastamento} dias"
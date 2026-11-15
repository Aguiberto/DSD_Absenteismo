import * as soap from "soap";

const WSDL_URL = "http://localhost:8000/soap/absenteismo/?wsdl";

async function executarTestes() {
  const client = await soap.createClientAsync(WSDL_URL);

  // 1. Chamada válida: registrar_atestado
  console.log("=== 1. REGISTRANDO ATESTADO ===");
  const [resRegistro] = await client.registrar_atestadoAsync({
    cpf_funcionario: "12345678901",
    nome_funcionario: "Ana Beatriz Silva",
    cid: "J01.9",
    dias_afastamento: 3,
    data_emissao: "2026-11-15",
    nome_medico: "Dr. Carlos Mendes",
    crm_medico: "CRM-RN 4512",
  });
  console.log(resRegistro.registrar_atestadoResult, "\n");

  // 2. Chamada válida: consultar_metricas_absenteismo
  console.log("=== 2. CONSULTANDO MÉTRICAS ===");
  const [resMetricas] = await client.consultar_metricas_absenteismoAsync({});
  console.log(JSON.stringify(resMetricas.consultar_metricas_absenteismoResult, null, 2), "\n");
  // 3. Chamada inválida: forçando SOAP Fault (CPF inválido)
  console.log("=== 3. TESTANDO ERRO (SOAP FAULT) ===");
  try {
    await client.registrar_atestadoAsync({
      cpf_funcionario: "123",
      nome_funcionario: "Teste Erro",
      cid: "A09",
      dias_afastamento: 1,
      data_emissao: "2026-11-15",
      nome_medico: "Dr. Carlos Mendes",
      crm_medico: "CRM-RN 4512",
    });
  } catch (erro: any) {
    const fault = erro?.root?.Envelope?.Body?.Fault;
    console.log("FaultCode:", fault?.faultcode);
    console.log("FaultString:", fault?.faultstring);
  }
}

executarTestes().catch((err) => console.error("Erro na requisição:", err.message));
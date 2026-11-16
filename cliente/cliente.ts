import * as soap from "soap";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const WSDL_URL = "http://localhost:8000/soap/absenteismo/?wsdl";

async function iniciarCliente() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("Conectando ao servidor SOAP e lendo contrato WSDL...");
    const client = await soap.createClientAsync(WSDL_URL);
    console.log("Conectado com sucesso!\n");

    let executando = true;

    while (executando) {
      console.log("==========================================");
      console.log("   SISTEMA DE ABSENTEÍSMO (CLIENTE SOAP)  ");
      console.log("==========================================");
      console.log("1 - Registrar novo atestado médico");
      console.log("2 - Consultar métricas de absenteísmo");
      console.log("0 - Sair");
      console.log("------------------------------------------");

      const opcao = (await rl.question("Escolha uma opção: ")).trim();

      if (opcao === "1") {
        console.log("\n--- Preencha os dados do atestado ---");
        const cpf_funcionario = (await rl.question("CPF do funcionário (11 dígitos): ")).trim();
        const nome_funcionario = (await rl.question("Nome do funcionário: ")).trim();
        const cid = (await rl.question("CID (ex: J01.9): ")).trim();
        const diasStr = (await rl.question("Dias de afastamento: ")).trim();
        const data_emissao = (await rl.question("Data de emissão (AAAA-MM-DD): ")).trim();
        const nome_medico = (await rl.question("Nome do médico: ")).trim();
        const crm_medico = (await rl.question("CRM do médico (ex: CRM-RN 4512): ")).trim();

        const diasNumerico = parseInt(diasStr, 10);
        const dias_afastamento = Number.isNaN(diasNumerico) ? 0 : diasNumerico;

        console.log("\nEnviando Envelope SOAP...");
        try {
          const [resRegistro] = await client.registrar_atestadoAsync({
            cpf_funcionario,
            nome_funcionario,
            cid,
            dias_afastamento,
            data_emissao,
            nome_medico,
            crm_medico,
          });

          console.log("\nResposta do Servidor:");
          console.log(JSON.stringify(resRegistro.registrar_atestadoResult, null, 2), "\n");
        } catch (erro: any) {
          exibirErroSoap(erro);
        }
      } else if (opcao === "2") {
        console.log("\nConsultando métricas no servidor SOAP...");
        try {
          const [resMetricas] = await client.consultar_metricas_absenteismoAsync({});
          console.log("\nMétricas Consolidadas:");
          console.log(
            JSON.stringify(resMetricas.consultar_metricas_absenteismoResult, null, 2),
            "\n"
          );
        } catch (erro: any) {
          exibirErroSoap(erro);
        }
      } else if (opcao === "0") {
        executando = false;
        console.log("Encerrando cliente SOAP...");
      } else {
        console.log("\nOpção inválida. Digite 1, 2 ou 0.\n");
      }
    }
  } catch (err: any) {
    console.error("Falha ao conectar ao serviço WSDL:", err.message);
  } finally {
    rl.close();
  }
}

function exibirErroSoap(erro: any) {
  const fault = erro?.root?.Envelope?.Body?.Fault;
  console.log("\n[SOAP FAULT RECEBIDO]");
  if (fault) {
    console.log("FaultCode:", fault.faultcode);
    console.log("FaultString:", fault.faultstring, "\n");
  } else {
    console.log("Erro na requisição:", erro.message, "\n");
  }
}

iniciarCliente();
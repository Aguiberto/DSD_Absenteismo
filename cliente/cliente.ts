import * as soap from "soap";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Endereço do WSDL publicado pelo servidor local; o parâmetro ?wsdl solicita a descrição do serviço.
const WSDL_URL = "http://localhost:8000/soap/absenteismo/?wsdl";

async function iniciarCliente() {
  // Liga as perguntas do readline à entrada e à saída padrão do terminal.
  const rl = readline.createInterface({ input, output });

  try {
    console.log("Conectando ao servidor SOAP e lendo contrato WSDL...");
    // O WSDL descreve as operações e os tipos; a biblioteca usa isso para criar o cliente SOAP.
    const client = await soap.createClientAsync(WSDL_URL);
    console.log("Conectado com sucesso!\n");

    let executando = true;

    // Mantém o menu disponível até o usuário escolher sair.
    while (executando) {
      console.log("==========================================");
      console.log("   SISTEMA DE ABSENTEÍSMO (CLIENTE SOAP)  ");
      console.log("==========================================");
      console.log("1 - Registrar novo atestado médico");
      console.log("2 - Consultar métricas de absenteísmo");
      console.log("0 - Sair");
      console.log("------------------------------------------");

      // question() retorna uma Promise; await espera a resposta digitada antes de continuar.
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

        // parseInt interpreta o texto como inteiro na base decimal (10).
        const diasNumerico = parseInt(diasStr, 10);
        // Number.isNaN detecta falha de conversão; 0 deixa a validação final a cargo do servidor.
        const dias_afastamento = Number.isNaN(diasNumerico) ? 0 : diasNumerico;

        console.log("\nEnviando Envelope SOAP...");
        try {
          // A versão Async do node-soap retorna uma tupla; o primeiro item contém o resultado.
          const [resRegistro] = await client.registrar_atestadoAsync({
            // Os nomes das propriedades precisam corresponder aos parâmetros definidos no serviço/WSDL.
            cpf_funcionario,
            nome_funcionario,
            cid,
            dias_afastamento,
            data_emissao,
            nome_medico,
            crm_medico,
          });

          console.log("\nResposta do Servidor:");
          // null não substitui propriedades e 2 define a indentação para facilitar a leitura.
          console.log(JSON.stringify(resRegistro.registrar_atestadoResult, null, 2), "\n");
        } catch (erro: any) {
          exibirErroSoap(erro);
        }
      } else if (opcao === "2") {
        console.log("\nConsultando métricas no servidor SOAP...");
        try {
          // A operação não recebe parâmetros; envia-se um objeto vazio. O método retorna uma tupla,
          // da qual o primeiro item contém o resultado da operação.
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
    // Captura falhas gerais, como não conseguir acessar ou ler o WSDL.
    console.error("Falha ao conectar ao serviço WSDL:", err.message);
  } finally {
    // Fecha a interface mesmo se houver erro, liberando os recursos de entrada do terminal.
    rl.close();
  }
}

function exibirErroSoap(erro: any) {
  // A biblioteca organiza o XML recebido em objetos; optional chaining evita erro
  // se algum nível da estrutura não existir (por exemplo, em uma falha de rede).
  const fault = erro?.root?.Envelope?.Body?.Fault;
  console.log("\n[SOAP FAULT RECEBIDO]");
  if (fault) {
    console.log("FaultCode:", fault.faultcode);
    console.log("FaultString:", fault.faultstring, "\n");
  } else {
    // Nem todo erro tem um Fault SOAP; erros de rede ou transporte podem vir sem essa estrutura.
    console.log("Erro na requisição:", erro.message, "\n");
  }
}

iniciarCliente();
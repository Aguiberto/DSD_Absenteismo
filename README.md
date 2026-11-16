# Serviço Web SOAP — Gestão de RH e Absenteísmo

Micro-serviço acadêmico desenvolvido para demonstrar a **interoperabilidade entre tecnologias distintas** utilizando o protocolo **SOAP (Simple Object Access Protocol)**. O projeto simula a integração corporativa entre um portal de saúde ocupacional e um sistema central de Recursos Humanos (ERP), permitindo o registro de atestados médicos e a extração de indicadores consolidados de absenteísmo via contrato **WSDL**.

---

## Escopo e Arquitetura

A comunicação segue o padrão **Cliente-Servidor** sobre HTTP, utilizando exclusivamente mensagens estruturadas em **XML** (Envelopes SOAP), sem uso de REST ou JSON.

* **Provedor (Servidor):** Desenvolvido em **Python (3.11)** com **Django** e a biblioteca **Spyne**. Expõe o contrato WSDL dinamicamente, valida os esquemas XML de entrada com `lxml` e persiste os registros em banco de dados relacional (SQLite) via Django ORM.
* **Consumidor (Cliente):** Desenvolvido em **TypeScript (Node.js)** utilizando a biblioteca **`soap`**. Consome o contrato WSDL publicado pelo servidor, realiza chamadas assíncronas tipadas e captura exceções nativas do protocolo (`SOAP Fault`).
* **Validação e Documentação:** Realizadas via **SoapUI**, validando requisições bem-sucedidas, falhas de negócio, estrutura de namespaces (`absenteismo.soap`) e exportação da documentação técnica do serviço.

```text
+-----------------------+       HTTP POST (XML / SOAP Envelope)       +--------------------------+
|  Cliente Consumidor   | ------------------------------------------> |    Servidor Provedor     |
|  TypeScript (node-soap)| <------------------------------------------ |  Python / Django / Spyne |
+-----------------------+       XML Response / SOAP Fault             +--------------------------+
            |                                                                      |
            +------------------ Lê contrato WSDL (?wsdl) --------------------------+
```

---

## Contrato WSDL e Operações Expostas

* **Endpoint SOAP:** `http://localhost:8000/soap/absenteismo/`
* **Contrato WSDL:** `http://localhost:8000/soap/absenteismo/?wsdl`
* **Target Namespace:** `absenteismo.soap`

### 1. `registrar_atestado` (Escrita e Validação)
Registra um novo atestado médico na base de dados após validar as regras de negócio.
* **Parâmetros de Entrada:**
  * `cpf_funcionario` (`xs:string`): CPF com 11 dígitos numéricos.
  * `nome_funcionario` (`xs:string`): Nome completo do colaborador.
  * `cid` (`xs:string`): Código da Classificação Internacional de Doenças (ex: `J01.9`).
  * `dias_afastamento` (`xs:integer`): Quantidade de dias (deve ser maior que zero).
  * `data_emissao` (`xs:date`): Data de emissão no formato ISO (`AAAA-MM-DD`).
  * `nome_medico` (`xs:string`): Nome do profissional emitente.
  * `crm_medico` (`xs:string`): Registro profissional do médico.
* **Retorno (`RegistrarAtestadoResponse`):** `sucesso` (`xs:boolean`), `mensagem` (`xs:string`) e `id_atestado` (`xs:integer`).
* **Tratamento de Erro (`SOAP Fault`):** Caso o CPF não possua 11 dígitos, os dias sejam menores ou iguais a zero, ou campos obrigatórios estejam vazios, o servidor interrompe o processamento e retorna um envelope de falha padronizado com `faultcode="Client.ValidationError"`.

### 2. `consultar_metricas_absenteismo` (Leitura e Agregação)
Consulta os dados armazenados e retorna os indicadores consolidados de afastamento.
* **Parâmetros de Entrada:** Nenhum.
* **Retorno (`MetricasAbsenteismoResponse`):**
  * `total_atestados` (`xs:integer`): Quantidade total de registros.
  * `total_dias_afastados` (`xs:integer`): Soma de todos os dias de afastamento.
  * `medias_dias_por_atestado` (`xs:float`): Média de dias por ocorrência.
  * `top_cids` (`CidMetrica[]`): Ranking dos 5 códigos CID mais recorrentes com suas respectivas quantidades.

---

## Estrutura do Projeto

```text
DSD_Absenteismo/
├── servidor/                   # Aplicação Provedora (Python + Django + Spyne)
│   ├── requirements.txt        # Dependências do ambiente Python
│   └── core/
│       ├── manage.py
│       ├── core/
│       │   └── urls.py         # Configuração do Spyne e rota /soap/absenteismo/
│       └── absenteismo/
│           ├── models.py       # Modelo relacional AtestadoMedico
│           ├── schemas.py      # Tipos ComplexModel para geração do WSDL
│           └── services.py     # Implementação das operações @rpc e SOAP Faults
├── cliente/                    # Aplicação Consumidora (Node.js + TypeScript)
│   ├── package.json
│   └── cliente.ts              # Script de testes de interoperabilidade
└── docs/                       # Contrato WSDL, documentação SoapUI e evidências PDF
```

---

## Passo a Passo de Execução

### Pré-requisitos
* **Python 3.11** (recomendado via Conda ou `venv` para compatibilidade total com os módulos internos do `spyne`).
* **Node.js (v18+)** e **npm**.
* **SoapUI Open Source** (para inspeção dos envelopes XML e documentação).

### 1. Executar o Servidor (Django + Spyne)

Abra um terminal na pasta `servidor`, ative seu ambiente Python e instale as dependências:

```bash
cd servidor
pip install -r requirements.txt
```

Entre no diretório `core`, aplique as migrações do banco de dados e inicie o servidor local:

```bash
cd core
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

O servidor ficará ativo em `http://localhost:8000/`. Para confirmar que o contrato XML está acessível, abra `http://localhost:8000/soap/absenteismo/?wsdl` no navegador.

### 2. Executar o Cliente (TypeScript)

Com o servidor Django rodando no primeiro terminal, abra um **segundo terminal**, acesse a pasta `cliente`, instale os pacotes e execute o script:

```bash
cd cliente
npm install
npx tsx cliente.ts
```

A execução automatizada realiza três etapas em sequência:
1. Envia uma requisição válida para `registrar_atestado` e exibe o ID persistido no banco.
2. Consulta `consultar_metricas_absenteismo` e imprime os indicadores e o ranking de CIDs.
3. Dispara propositalmente um CPF inválido (`"123"`) para demonstrar a captura e o tratamento do `SOAP Fault` no TypeScript.

### 3. Validar e Exportar Documentação no SoapUI

1. Abra o **SoapUI** e clique em **SOAP** na barra superior.
2. Em *Initial WSDL*, informe `http://localhost:8000/soap/absenteismo/?wsdl` e confirme.
3. Expanda as operações `registrar_atestado` e `consultar_metricas_absenteismo` para enviar requisições XML manuais (testando entradas válidas e inválidas).
4. Para gerar a documentação estática do contrato, clique com o botão direito sobre a interface **`Application`** (ou binding do serviço) no painel esquerdo e selecione **Generate Documentation**.

---

## Decisões Técnicas e Arquiteturais

* **Escolha do Protocolo SOAP:** Cenários corporativos de RH e sistemas ERP demandam contratos rígidos e tipagem forte para evitar inconsistências em registros trabalhistas e médicos. O esquema XSD embutido no WSDL garante validação estrutural antes mesmo da execução da regra de negócio, enquanto o padrão `SOAP Fault` uniformiza o tratamento de erros entre sistemas heterogêneos.

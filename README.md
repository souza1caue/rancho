# Rancho

**Gestão leiteira do nascimento à produção.**

Aplicação web full stack para organizar o rebanho e a rotina de uma propriedade leiteira. Reúne cadastro individual de animais, produção de leite, reprodução, cuidados sanitários e acompanhamento financeiro em uma interface responsiva e instalável como PWA.

**[Acessar demonstração](https://rancho-gestao-leiteira.pages.dev)** · [Documentação de operação](docs/OPERACAO.md)


> Projeto em evolução — beta 0.3. A demonstração inicial utiliza animais e dados fictícios.

## Funcionalidades

- **Rebanho:** identificação, filiação, pesagens e histórico de cada animal desde o nascimento.
- **Produção:** lançamento de ordenha de vários animais em uma única tela, com identificação do destino do leite.
- **Reprodução:** acompanhamento de gestação e lactação simultâneas, previsões de manejo e parto vinculado ao cadastro da cria.
- **Cuidados:** agenda, tratamentos e calendário de vacinação configurável por protocolo.
- **Gestão:** receitas, despesas, relatórios por período e exportação de dados em CSV e JSON.
- **Histórico:** filtros, agrupamentos e correções com justificativa e preservação da versão anterior.
- **Conta:** autenticação, recuperação de acesso por código e isolamento dos dados entre contas.
- **Mobilidade:** instalação pelo navegador, uso offline e sincronização entre dispositivos.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | React 19, JavaScript, Tailwind CSS 4, CSS responsivo, Lucide React |
| Build | Vite 8 |
| API | Cloudflare Pages Functions |
| Banco de dados | Cloudflare D1 / SQLite |
| Offline | Service Worker, Cache API, Web App Manifest e localStorage |
| Autenticação | Web Crypto API, PBKDF2, sessões com cookies HttpOnly |
| Testes | Python, pytest, testes HTTP, Node.js, SQLite em memória e jsdom |
| Relatórios de testes | JUnit XML |
| Hospedagem | Cloudflare Pages |

## Destaques técnicos

### Sincronização com suporte offline

As alterações são persistidas no aparelho antes do envio. Ao reconectar, a aplicação compara a base sincronizada com as versões local e remota para combinar alterações independentes. Conflitos no mesmo registro exigem resolução explícita e permanecem pendentes mesmo após fechar e reabrir o aplicativo.

### Consistência de dados

A API utiliza controle de revisão para evitar sobrescritas concorrentes. Cada gravação sincronizada gera um backup na mesma transação do banco. A sincronização também identifica lançamentos concorrentes da mesma ordenha para evitar duplicidade.

### Modelagem do ciclo animal

A fase produtiva é separada da situação reprodutiva. Eventos confirmados atualizam o ciclo, enquanto previsões geram lembretes sem registrar automaticamente acontecimentos reais.

### Experiência de uso

Navegação inferior dividida em cinco áreas, formulários voltados às tarefas da rotina e históricos agrupados por dia, animal, tipo ou categoria. As atualizações do PWA são oferecidas com confirmação para preservar o trabalho em andamento.

## Executar localmente

Requisitos: Node.js 24, npm e Python 3.11+ para os testes.

```bash
git clone https://github.com/souza1caue/rancho.git
cd rancho
npm ci
npm run dev
```

Para gerar a versão de produção, executar os testes e visualizar o PWA:

Prepare o ambiente Python uma vez, sem precisar ativar o ambiente virtual:

```bash
python -m venv .venv
```

No Windows:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

No Linux/macOS:

```bash
.venv/bin/python -m pip install -r requirements-dev.txt
```

```bash
npm run build
npm test
npm run preview
```

O preview estático executa a interface. A API exige configuração do Cloudflare D1 e da chave de autenticação; consulte a [documentação de operação](docs/OPERACAO.md).

## Estrutura

```text
src/          Interface, componentes e regras do domínio
functions/    API e autenticação no Cloudflare
shared/       Validação e mesclagem de dados
migrations/   Estrutura do banco D1 / SQLite
public/       Manifesto, ícones e configuração do PWA
scripts/      Geração de ícones e cache offline
tests/python/ Testes de integração HTTP em Python/pytest
tests/support/ Servidor local de testes e adaptador SQLite
tests/        Testes JavaScript de domínio, sincronização e interface
docs/         Documentação de operação e publicação
```

## Validação

A suíte automatizada cobre ciclos reprodutivos, lançamentos de produção, histórico, autenticação, recuperação, isolamento entre contas, backups, sincronização, conflitos, uso offline e instalação simulada. Cadastro, login, gravação no D1 e controle de revisão também foram verificados no ambiente publicado.

### Testes de API com Python e pytest

Os testes Python enviam requisições HTTP ao handler JavaScript real da API. Cada teste inicia um servidor em loopback com porta dinâmica e SQLite em memória, criado com a migração do projeto. As respostas de negócio não são simuladas e não há acesso ao banco de produção.

A suíte usa fixtures para servidor, clientes, contas e documentos; parametrização para entradas inválidas; e requisições concorrentes para verificar que dois aparelhos não sobrescrevem a mesma revisão. Também cobre autenticação, recuperação de senha, sessões, isolamento de contas, limite de tentativas, retenção de backups e tratamento de JSON inválido.

```bash
npm run test:python
npm run test:python -- -m auth -v
npm run test:python -- -m sync -v
npm run test:python -- -m backup -v
npm run test:js
```

`npm test` executa JavaScript e pytest. O script encontra automaticamente `.venv` no Windows/Linux; sem ambiente virtual, utiliza o Python instalado. O relatório JUnit é salvo em `reports/pytest.xml`.

Os testes verificam contratos HTTP e SQL em ambiente local; a instalação em navegadores e as particularidades do runtime Cloudflare exigem validação complementar.

## Estado do projeto

A beta possui um conjunto de dados independente por conta. Convites e permissões por função ainda não estão implementados. A instalação em dispositivos e a rotina com usuários reais precisam de validação acompanhada. Os protocolos sanitários devem ser definidos pelo responsável técnico da propriedade.

## Referências de interface

Composição inspirada nos padrões de dashboard, formulários e tabelas do [shadcn/ui](https://github.com/shadcn-ui/ui), com CSS e silhuetas de animais próprios. Ícones: [Lucide](https://github.com/lucide-icons/lucide).

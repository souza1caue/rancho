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
| Interface | React 19, JavaScript, CSS responsivo, Lucide React |
| Build | Vite 8 |
| API | Cloudflare Pages Functions |
| Banco de dados | Cloudflare D1 / SQLite |
| Offline | Service Worker, Cache API, Web App Manifest e localStorage |
| Autenticação | Web Crypto API, PBKDF2, sessões com cookies HttpOnly |
| Testes | Node.js, assert, SQLite em memória e jsdom |
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

Requisitos: Node.js 24 e npm.

```bash
git clone https://github.com/souza1caue/rancho.git
cd rancho
npm ci
npm run dev
```

Para gerar a versão de produção, executar os testes e visualizar o PWA:

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
tests/        Testes de domínio, API, sincronização e interface
docs/         Documentação de operação e publicação
```

## Validação

A suíte automatizada cobre ciclos reprodutivos, lançamentos de produção, histórico, autenticação, recuperação, isolamento entre contas, backups, sincronização, conflitos, uso offline e instalação simulada. Cadastro, login, gravação no D1 e controle de revisão também foram verificados no ambiente publicado.

## Estado do projeto

A beta possui um conjunto de dados independente por conta. Convites e permissões por função ainda não estão implementados. A instalação em dispositivos e a rotina com usuários reais precisam de validação acompanhada. Os protocolos sanitários devem ser definidos pelo responsável técnico da propriedade.

## Referências de interface

Composição inspirada nos padrões de dashboard, formulários e tabelas do [shadcn/ui](https://github.com/shadcn-ui/ui), com CSS e silhuetas de animais próprios. Ícones: [Lucide](https://github.com/lucide-icons/lucide).
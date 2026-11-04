# Rancho — Gestão leiteira · beta 0.3

Sistema React/Vite instalável pelo navegador, hospedado em https://rancho-gestao-leiteira.pages.dev. Código privado: https://github.com/souza1caue/rancho.

## Usar

A navegação inferior reúne Início, Animais, Produção, Cuidados e Gestão. As áreas de atividade possuem Registrar e Histórico, com filtros, agrupamento por dia/animal/tipo/categoria e exportação CSV.

- Animais: cadastro desde o nascimento, filiação, pesagens, categorias e ficha individual. Ciclos produtivo e reprodutivo são separados, permitindo gestação e lactação simultâneas.
- Produção: uma única tela de ordenha lista as vacas em lactação. Campos vazios não criam medição; zero é uma medição de zero litros. Um animal não recebe dois lançamentos da mesma ordenha/data; corrija o registro no Histórico. Também há alimentação por lote.
- Reprodução: cio, cobertura/inseminação, diagnóstico, secagem, parto e aborto. Um parto pode cadastrar uma cria e vinculá-la à mãe na mesma operação. Em parto gemelar, cadastre a segunda cria separadamente e vincule a mesma mãe.
- Cuidados: agenda, sanidade e calendário de vacinas. Protocolos são cadastrados por responsável/UF, com idade inicial, sexo/categoria, reforços e revacinação. Apenas protocolos confirmados como validados geram lembretes. Não existe protocolo universal ativado automaticamente.
- Gestão: financeiro, relatórios por período, conta, sincronização, backups e instalação do aplicativo.
- Correções: no detalhe de um registro do Histórico, Corrigir registro mantém o identificador, animal e tipo e guarda a versão anterior com data e motivo. Para mudar a situação de um ciclo, use a ficha do animal.

## Conta e sincronização

Sem login, o modo local mantém os dados antigos do navegador, inclusive a demonstração fictícia. Nenhum registro local é enviado automaticamente para uma conta nova.

Em Gestão → Configurações e backup, crie uma conta com usuário e senha (mínimo 12 caracteres). Guarde o código de recuperação, mostrado na criação: ele permite redefinir a senha sem depender de email. O código é substituído quando usado. Entre na mesma conta nos demais aparelhos.

Cada conta representa um conjunto independente de dados. Esta beta não possui convites, funcionários ou permissões por função. Não compartilhe credenciais para simular contas individuais.

Depois de entrar, Importar dados deste aparelho combina os dados do modo local com a conta, mediante confirmação. Dados fictícios ainda existentes também são importados; confira o cadastro antes. Conflitos de identificadores ou brincos são recusados nessa importação.

As alterações são salvas localmente primeiro. Quando conectado, o aplicativo busca a versão remota e faz mesclagem por registro com uma base comum. Inclusões independentes são combinadas. Alterações diferentes no mesmo registro exigem escolha explícita entre aparelho e nuvem. O servidor usa revisão otimista para impedir sobrescritas concorrentes. A fila e a base de mesclagem são preservadas no armazenamento por conta. A consulta remota ocorre ao entrar, reconectar e periodicamente enquanto o app está aberto.

Sessões usam cookie HttpOnly, Secure e SameSite=Strict. Senhas são protegidas por PBKDF2-SHA256 com salt e pepper do servidor. Há limitação de tentativas de autenticação e recuperação por IP. A chave AUTH_PEPPER está no Cloudflare, fora do Git. Não substitua essa chave em uma instalação existente: isso invalida a verificação das senhas existentes.

A sessão dura 30 dias. Se expirar, os registros locais são preservados e o usuário entra novamente para sincronizar. Ao sair, o modo local é reaberto; os dados em cache da conta continuam neste aparelho para o próximo acesso. Proteja dispositivos compartilhados. O armazenamento local não é criptografado.

## Backups

Cada sincronização que altera dados cria um snapshot na mesma transação da gravação. São mantidas as últimas 30 versões por conta. Em Configurações, Ver backups automáticos permite baixar as versões como JSON; para restaurar, importe o JSON com a confirmação de substituição. Faça também backups manuais fora do dispositivo. A beta limita cada documento sincronizado a 1,5 MB e cada coleção a 20 mil registros.

## Instalação e uso offline

Em Configurações, o botão de instalação aparece quando o navegador oferece a instalação. Android/Chrome: menu → Instalar aplicativo. iPhone/iPad: Safari → Compartilhar → Adicionar à Tela de Início. Computador: instalação pelo Chrome/Edge.

Abra conectado e aguarde Preparado para uso sem internet. Depois, a interface e os registros locais funcionam sem rede. Alterações da conta aguardam a próxima sincronização. Instalar, sozinho, não cria uma conta. Fontes externas podem usar a fonte alternativa do dispositivo. Não limpe o armazenamento antes de sincronizar e exportar um backup.

Atualizações são oferecidas por aviso, com ação bloqueada enquanto uma ficha ou formulário estiver aberto. O cache de interface é versionado; a API nunca é armazenada pelo service worker. A atualização não apaga os dados do aplicativo.

## Desenvolvimento e testes

Além de Node.js 24 e npm, os testes requerem Python 3.11+. Prepare `.venv` com `python -m venv .venv` e instale `requirements-dev.txt` com o Python desse ambiente. O script npm encontra esse interpretador automaticamente, sem ativação manual. Consulte o README para os comandos de Windows e Linux.

```powershell
npm ci
npm run build
npm test
npm run preview
```

O preview estático permite testar a interface e o PWA. Para testar a API, use Wrangler Pages dev com D1 local e um AUTH_PEPPER de teste, diferente da chave de produção. A migração SQL está em migrations/0001_cloud.sql. Os testes de API usam SQLite em memória, sem dados reais.

`npm test` executa as suítes JavaScript e Python/pytest. `npm run test:python` inicia servidores de teste em portas locais dinâmicas e usa o handler real da API com a migração SQLite em memória. Cada caso possui dados e processo isolados, sem acesso ao D1 remoto. `npm run test:python -- -m auth -v` filtra autenticação; os marcadores `sync` e `backup` selecionam sincronização e snapshots. O relatório está em `reports/pytest.xml`; os ambientes e relatórios não são versionados.

Os testes abrangem ciclos, histórico, ícones/manifesto, cache offline, contas e sessões, recuperação, isolamento, CAS, backups, mesclagem/conflitos, ordenha em lote, parto vinculado, correções, calendário e fluxos da interface. A instalação visual em dispositivos e um teste acompanhado com o cliente continuam necessários antes da operação real.

## Publicação

Cloudflare Pages: rancho-gestao-leiteira, branch main. D1: rancho-db, binding DB. Aplicar novas migrações antes de publicar funções que dependam delas. Não recrie o banco nem a chave de autenticação ao atualizar.

```powershell
npm run build
npm test
git add .
git commit -m "Atualiza Rancho"
git push origin main
npx wrangler@4.157.0 pages deploy dist --project-name rancho-gestao-leiteira --branch main
```

O deploy compila a pasta functions e envia a interface dist. O push no GitHub sozinho não publica automaticamente. Os registros antigos do localhost pertencem a outro domínio: use exportação/importação para transportá-los.

## Referências de UX e manejo

Composição visual baseada na biblioteca local C:/Projetos_pessoais/ui-references e nos padrões de dashboard/cards/tabelas do shadcn/ui, commit 4aaea19d9cff3e0908e12a8c1d504b8c5ec34610. CSS e silhuetas próprias; ícones lucide-react. Os ícones instaláveis podem ser regenerados com scripts/generate-icons.ps1 no Windows.

Intervalos iniciais do ciclo são referências editáveis, não prescrições: gestação 280 dias, período seco 60, pré-parto 21, espera pós-parto 45 e retorno para diagnóstico 30. Devem ser validados pelo veterinário. Previsões não confirmam gestação, parto, secagem ou liberação reprodutiva. Tratamentos não bloqueiam automaticamente a ordenha. Não há formulação de dieta ou integração contábil. Relatórios usam medições reais e não estimam dias sem medição. Custos de alimentação não são lançados novamente no financeiro automaticamente.

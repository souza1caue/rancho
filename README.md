# Rancho — Gestão leiteira (beta)

Beta local para apresentação comercial, criada com React e Vite. A fazenda e os animais iniciais são fictícios.

## Publicação

### Versão 0.2 — aplicativo instalável

O Rancho possui manifesto, ícones para Android/iOS, modo standalone e service worker com cache da interface. Em Gestão → Configurações, a opção de instalação aparece nos navegadores que fornecem o evento de instalação; nos demais são exibidas instruções para instalação pelo menu. No iPhone/iPad, use Safari → Compartilhar → Adicionar à Tela de Início.

Para trabalhar offline, abra o endereço publicado com internet e aguarde “Preparado para uso sem internet”. A interface, os arquivos JavaScript, os ícones e os dados locais ficam disponíveis para as próximas aberturas sem rede. Fontes externas podem usar a fonte alternativa do dispositivo. O primeiro acesso precisa de internet e a disponibilidade depende da preservação do armazenamento/cache pelo navegador.

Atualizações são oferecidas por aviso; o usuário escolhe Atualizar agora após salvar suas alterações. A ação fica desabilitada com ficha/formulário aberto. O cache é versionado e não apaga localStorage, registros ou backups. Uma versão anterior da interface é mantida para abas abertas.

A instalação não cria sincronização ou backup em nuvem. O aplicativo pode ter armazenamento separado em alguns dispositivos; confira os dados e use exportação/importação de backup se necessário. Não limpe dados do navegador/aplicativo sem antes exportar o backup.

`npm run build` gera a interface e o service worker; `npm test` verifica os ciclos, históricos, manifesto, ícones, cache offline e fluxos da aplicação. O modo de desenvolvimento não registra o service worker; para testar a instalação localmente, use `npm run build` e `npm run preview`. Os ícones podem ser regenerados no Windows com `powershell -File scripts/generate-icons.ps1`.

Código-fonte: `https://github.com/souza1caue/rancho` (repositório privado).

Endereço publicado: https://rancho-gestao-leiteira.pages.dev

Hospedagem: Cloudflare Pages, projeto `rancho-gestao-leiteira`, branch de produção `main`. Publicação por upload direto da pasta `dist`; o push no GitHub, sozinho, não publica automaticamente.

Para atualizar, com GitHub CLI e Wrangler autenticados:

```powershell
npm ci
npm run build
node tests/animal-cycle.mjs
node tests/history-groups.mjs
node tests/smoke.mjs
git add .
git commit -m "Atualiza Rancho"
git push origin main
npx wrangler@4.157.0 pages deploy dist --project-name rancho-gestao-leiteira --branch main
```

O site hospedado continua usando armazenamento local: os registros do endereço localhost não são transferidos automaticamente para o novo domínio. Exporte um backup no endereço antigo e importe em Gestão → Configurações e backup no site publicado, caso queira levar os dados. Não há sincronização entre usuários ou dispositivos.

## Executar localmente

```powershell
npm install
npm run dev
```

Abra a URL indicada pelo Vite. Para gerar a versão de produção: `npm run build`.

## Apresentação sugerida

1. Mostre o painel e a distribuição dos animais por fase.
2. Abra Rebanho, busque Mimosa e consulte sua ficha.
3. Cadastre uma bezerra com identificação, filiação, raça, nascimento e peso.
4. Na ficha, registre colostragem ou pesagem e consulte a linha do tempo.
5. Registre uma ordenha e veja o painel ser atualizado.
6. Apresente os registros reprodutivos, tratamentos, alimentação e financeiro.
7. Conclua um cuidado na Agenda.
8. Baixe um backup completo em Configurações.

## Escopo e limites

### Consulta de atividades

Leite, alimentação, agenda, sanidade, reprodução e financeiro possuem as abas Registrar e Histórico. Ao salvar um registro na área atual, o Histórico abre automaticamente. A consulta permite filtrar por intervalo de datas, tipo, busca textual e animal nas áreas com vínculo individual. A agenda também permite filtrar pendentes e concluídas e registra a data de conclusão das novas conclusões. Registros antigos sem essa data continuam disponíveis.

A exportação CSV contém somente os resultados filtrados e seus campos de detalhe. Na agenda, os cuidados pendentes permanecem na aba Registrar; as tarefas concluídas continuam disponíveis no Histórico. Essa organização mantém o armazenamento local existente, sem migração ou remoção dos dados.

O Histórico é agrupado por dia, com datas mais recentes primeiro e identificação de Hoje e Ontem. Os grupos podem ser recolhidos e cada atividade tem detalhes expansíveis. O primeiro grupo inicia aberto. Os cabeçalhos resumem litros e animais na produção, receitas/despesas/saldo no financeiro, pendentes/concluídas na agenda e quantidade fornecida na alimentação. A seleção Agrupar por permite alternar para animal, tipo, categoria financeira ou lote de alimentação, conforme a área. Os resumos são recalculados sobre os registros filtrados; o CSV exporta todas as atividades filtradas, inclusive as recolhidas.

Dados salvos no localStorage do navegador; não há servidor, autenticação, sincronização, anexos ou usuários compartilhados. A exportação JSON permite backup e restauração, e o rebanho pode ser exportado em CSV. A agenda reúne tarefas manuais e lembretes calculados do ciclo. Eventos reprodutivos confirmados atualizam separadamente as situações produtiva e reprodutiva; as previsões não confirmam acontecimentos. Registros de parto não cadastram automaticamente a cria. Tratamentos não bloqueiam automaticamente a ordenha. Campos complementares podem ser consultados na ficha para registros vinculados ao animal. Financeiro e alimentação possuem histórico básico, sem integração contábil ou formulação de dieta.

Antes de operação real: validar cadastro e regras de manejo com produtor e veterinário, implementar banco de dados, login e permissões, auditoria, rotinas de backup e recuperação, alertas de carência, acompanhamento de lactações e reprodução, controle de estoque e integrações.

## Referência de UX

### Ciclo individual

A ficha de novilhas e vacas separa fase produtiva e situação reprodutiva. O modelo permite lactação e gestação simultâneas. O cadastro antigo é preservado, sem inventar datas ou assumir lactação para animais classificados apenas como gestantes.

Registros em Reprodução atualizam o ciclo em ordem cronológica: inseminação/monta deixa o animal aguardando diagnóstico; diagnóstico positivo confirma gestação; negativo ou aborto encerra a previsão de gestação; secagem confirmada encerra a contagem de lactação na data real; parto confirmado inicia nova lactação e pós-parto. Eventos com datas futuras não representam fatos ocorridos. Um parto ainda não cadastra a cria automaticamente.

Na ficha, Atualizar situação e referências do ciclo permite registrar a situação inicial ou corrigir referências conhecidas, salvando uma atualização no histórico reprodutivo. Intervalos de planejamento editáveis por animal: gestação 280 dias, período seco 60 dias, pré-parto 21 dias, espera pós-parto 45 dias e retorno para diagnóstico 30 dias. São referências iniciais, não prescrições; o veterinário deve validar os valores, o método de diagnóstico e a liberação reprodutiva.

Agenda, Reprodução e Início mostram lembretes para os próximos 30 dias e previsões passadas a revisar. O usuário abre a ficha e registra/confirma o evento real; chegar à data prevista não confirma gestação, secagem, parto ou liberação. Lembretes são calculados ao abrir o aplicativo; não há notificações fora dele. O preparo pré-parto permanece como referência até revisão do ciclo ou confirmação do parto. A exportação do rebanho inclui as duas situações e as datas de referência.

Biblioteca local `C:/Projetos_pessoais/ui-references`: composição do dashboard-01 e padrões de cards, tabelas e formulários do shadcn/ui, commit `4aaea19d9cff3e0908e12a8c1d504b8c5ec34610`. Implementação visual própria adaptada em CSS, sem incorporação do código dos componentes. Ícones lucide-react.
## Navegação simplificada

A barra inferior centralizada reúne cinco seções, tanto no computador quanto no celular:

- Início: resumo do dia e atalhos para registrar leite, consultar animal e agendar cuidado.
- Animais: todos os animais, cria e recria, reprodução.
- Produção: leite e alimentação.
- Cuidados: agenda e saúde dos animais.
- Gestão: financeiro, configurações e backup.

As páginas internas aparecem em abas no topo da seção. Os dados existentes permanecem no mesmo armazenamento local.

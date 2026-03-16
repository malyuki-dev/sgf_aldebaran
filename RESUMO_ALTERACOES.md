# Resumo das Alterações Recentes

Este documento lista todas as alterações realizadas no código para conclusão da **Fase 1 (Épico 1 - Cadastros)** e estabilização de ambos os projetos (Frontend e Backend).

## 1. Backend (NestJS + Prisma)
Ocorriam erros durante o comando `npm run build` no backend devido à forma como o Prisma estava gerando os tipos e exportando os módulos. Os seguintes ajustes foram feitos:

* **`prisma/schema.prisma`**:
  * Removida a configuração estrita de output customizado (`output = "../generated/prisma"` e `moduleFormat = "cjs"`).
  * O `provider` foi atualizado para o padrão da comunidade: `"prisma-client-js"`. Com isso, os tipos passam a ser gerados corretamente dentro de `node_modules/@prisma/client`.
* **Corrigidos os Caminhos de Importação do Prisma**:
  * `src/prisma/prisma.service.ts`
  * `src/motorista/motorista.service.ts`
  * `src/motorista/motorista.controller.ts`
  * `src/caminhao/caminhao.service.ts`
  * `src/caminhao/caminhao.controller.ts`
  * Todos os arquivos acima agora importam os tipos diretamente de `@prisma/client`, eliminando o erro de *Cannot find module*.
* **Remoção de Duplicação**:
  * `src/caminhao/caminhao.module.ts`: Removida importação duplicada e conflitante do `CaminhaoService`.

Após essas mudanças, executou-se `npx prisma generate` e em seguida `npm run build`, e o backend compilou **sem erros**.

## 2. Frontend (Angular)
O Angular estava acusando falhas de compilação durante o `ng build` devido a objetos de ícones mal configurados no layout pai do painel administrativo.

* **`src/app/layouts/admin-layout/admin-layout.component.ts`**:
  * Adicionada a importação dos ícones ausentes (`User`, `Truck`) importados de `lucide-angular`.
  * Corrigida a tipagem da propriedade `icons`, adicionando as chaves correspondentes aos ícones que estavam sendo chamados no `.html` (ex: `user: User`, `truck: Truck`, `users: Users`).
* **`src/app/app.routes.ts`**:
  * Confirmada a configuração de roteamento preguiçoso (lazy load) para as novas rotas de `/admin/motoristas` e `/admin/caminhoes` mapeadas corretamente.

Após essas mudanças, o frontend compilou com **sucesso** (Exit code 0).

## 3. Scripts Utilitários
* **`iniciar-projeto.bat`**:
  * Criado na raiz do projeto (`c:\Users\ResTIC16\sgf_aldebaran\iniciar-projeto.bat`).
  * Trata-se de um executável simples para o Windows que permite ao time iniciar os dois servidores (NestJS na 3000 e Angular na 4200) com um único duplo clique, abrindo 2 janelas de terminal integradas. 

## 4. Gestão de Usuários e RBAC (US-0033 / US-0034)
Foi implementada a gestão administrativa de usuários (funcionários operacionais).

* **Backend (`UsuarioService` e `UsuarioController`)**:
  * Implementado CRUD completo sob a rota `/usuarios` protegida por JWT.
  * O modelo do Prisma foi atualizado, adicionando controle de `perfil` (`ADMIN`, `SUPERVISOR`, `OPERADOR`) e também flags de soft delete (`ativo`, `deletadoEm`). As senhas são agora codificadas utilizando bcrypt (`hash 12`).
  * Uma nova funcionalidade customizada de "Redefinir Senha" foi criada de uso exclusivo administrativo.
* **Frontend (`UsuariosComponent`)**:
  * Criado o componente administrativo dentro de `src/app/pages/admin/usuarios` usando Angular 18+.
  * A tabela exibe perfis com identificação visual por emblemas (badges) coloridos e contém modais integrados para criação, edição e redefinição de senhas sem expor os hashes originais.

## 5. Gestão de Clientes - Fase 1 (US-0001 / US-0002)
Foi iniciada a arquitetura principal em torno do núcleo de **Clientes (Pessoa Física e Pessoa Jurídica)**.

* **Backend (`ClientService` e `ClientController`)**:
  * Foi garantido o roteamento de dois fluxos base distintos:
    1. **Autocadastro Público** (`POST /clientes/autocadastro`): Onde o usuário digita a própria senha via App de forma segregada.
    2. **Cadastro Operacional**: A base de operações protegida (`GET`, `PUT`, `PATCH /status`, `PATCH /senha`) restrita apenas a quem tiver Token JWT.
  * O Prisma valida adequadamente a exigência de CPF ou CNPJ baseado no campo `tipo`.
* **Frontend (`SignupComponent` e `ClientesComponent`)**:
  * O `SignupComponent` foi refatorado para consumir o novo *endpoint* público e adaptado para alternar os campos de formulários dependendo se o tipo escolhido for pessoa jurídica (razão e cnpj) ou física (nome completo e cpf).
  * O `ClientesComponent` foi originado construindo o dashboard de administração no Admin Layout (`/admin/clientes`), acompanhado do visual padronizado em Cards embutindo modais de gestão operacional (Listagem, Edição, Alternância de Status e Redefinição).
* **Correções de Build no Angular (`Totem Modules`)**:
  * Durante o processo, identificou-se que três arquivos `.scss` (`totem-categoria`, `totem-checkin`, e `painel-tv`) injetavam fontes externas diretamente no estilo (ex: *Google Fonts Inter/Roboto*), causando falhas via `angular-css-inline-fonts-plugin`.
  * As importações locais foram removidas em favor da tipografia consolidada global. Após as correções o comando `ng build` confirmou `Exit Code 0` limpo. 

## 6. Overhaul Visual do Admin (Design Mockups)
Para que a identidade visual administrativa acompanhasse o material de design (Cores: Ciano e Verde Petróleo Escuro), um overhaul foi executado na estrutura da classe Pai Crud.

* **Layout e Sidebar (`admin-layout.component.html/.scss`)**:
  * Imagem de logo aplicada `logo-aldebaran.png` no topo do menu lateral expansível.
  * Cores de gradientes atualizadas com a variável Ciano/Verde (#005f6b / #007685).
  * O HTML do menu esquerdo agora é renderizado usando uma estrutura otimizada `*ngFor` baseando-se por um Array `menuItems` exportado dinamicamente no Typecript, garantindo a visualização e ordem restrita idêntica aos mockups (Dashboard -> Usuários -> Clientes -> Motoristas -> Caminhões -> Serviços -> Agendamentos -> Configurações -> Totem).
* **Estilos Globais Minimalistas (`motoristas.component.scss` / `usuarios.component.scss`)**:
  * Adicionado padronização para o card pai `.data-card`, inputs focados e botões radiais com cantos suavizados e foco (glow-boxes) azuis `.btn-primary` com fundo em `linear-gradient(#0ea5e9, #0284c7)`. As sombras foram sutisizadas (Drop-shadows clean).
* **Correções de Build Angular Rigoroso (`TS4111`)**:
  * Durante a re-compilação, os chamados no Layout aos vetores `<lucide-icon [img]="icons.iconeAqui">` causaram o erro Typescript *TS4111 Index Signature* devido a propriedade `icons: Record<string, any>`.
  * Os bindings do dot-notation foram convertidos globalmente para bracket-notation dinâmico (`icons['icone Aqui']`) suprimindo erros estritos de tipagem no Angular. Compilação retornou estável com *Exit Code 0*.

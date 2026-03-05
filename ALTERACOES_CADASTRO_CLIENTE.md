# Alterações — Cadastro de Clientes (Signup)

> Data: 04/03/2026  
> Escopo: Frontend (Angular) + Backend (NestJS) — fluxo de autocadastro público de clientes

---

## 1. Diagnóstico: o que estava errado

| Problema | Onde |
|---|---|
| Formulário mostrava "Nome Completo" para PF **e** PJ ao mesmo tempo | `signup.component.html` |
| PJ não tinha campo de Razão Social separado do nome | `signup.component.html` |
| Campo **Telefone** ausente em ambos os tipos | `signup.component.html` |
| Senha e Confirmar Senha ficavam lado a lado (layout incorreto) | `signup.component.html` |
| Nenhuma máscara de formatação em CPF, CNPJ ou Telefone | `signup.component.ts` |
| Nenhuma validação real de CPF (dígitos verificadores) | `signup.component.ts` |
| Nenhuma validação real de CNPJ (dígitos verificadores) | `signup.component.ts` |
| Erros não eram exibidos inline — apenas `alert()` genérico | `signup.component.ts` / `.html` |
| DTO do backend usava campo `documento` genérico (incompatível com o payload real) | `create-client.dto.ts` |
| Mínimo de senha no backend era **6** mas no frontend **8** (inconsistência) | `client.service.ts` |
| Controller do autocadastro recebia `any` em vez do DTO tipado | `client.controller.ts` |

---

## 2. O banco de dados precisa ser alterado?

**Não.** O model `clientes` do `schema.prisma` já contém **todos os campos necessários**:

```prisma
model clientes {
  id        String    @id   -- UUID automático
  nome      String          -- Nome (PF) ou Razão Social (PJ)
  email     String    @unique
  senha     String          -- Armazenada com bcrypt (hash)
  telefone  String?         -- Opcional ✅
  tipo      String          -- "PF" ou "PJ" ✅
  cpf       String?   @unique  -- Apenas para PF ✅
  cnpj      String?   @unique  -- Apenas para PJ ✅
  createdAt DateTime
  updatedAt DateTime
  deletedAt DateTime?       -- Soft delete ✅
}
```

### 2.1 Remoção do model legado `cliente` (sem "s")

Havia um model duplicado/legado chamado `cliente` (singular), que **não era utilizado pelo autocadastro** (o autocadastro usa `clientes`).

Para evitar confusão, ele foi removido do schema e a tabela correspondente foi removida do banco com segurança:

- Backup do banco antes da remoção: `backend/backup_pre_remove_cliente_20260304111518.dump`
- Migration aplicada: `backend/prisma/migrations/20260304120000_drop_cliente_model/migration.sql`

---

## 3. Alterações no Frontend

### 3.1 `signup.component.html`

**Antes:** Um único bloco de campos para PF e PJ misturados, sem telefone, senha lado a lado.

**Depois:** Campos separados por tipo com `<ng-container *ngIf>`, telefone adicionado, erros inline.

#### Campos por tipo de cadastro

| Campo | Pessoa Física | Pessoa Jurídica |
|---|:---:|:---:|
| Nome Completo | ✅ | ❌ |
| CPF | ✅ | ❌ |
| Razão Social | ❌ | ✅ |
| CNPJ | ❌ | ✅ |
| E-mail | ✅ | ✅ |
| Telefone / Celular | ✅ (opcional) | ✅ (opcional) |
| Senha | ✅ | ✅ |
| Confirmar Senha | ✅ | ✅ |

#### Validação inline por campo

Cada campo recebe `[class.has-error]="erros['campo']"` e exibe uma mensagem abaixo:

```html
<span class="field-error" *ngIf="erros['cpf']">
  <lucide-icon [img]="icons.alert" size="13"></lucide-icon> {{ erros['cpf'] }}
</span>
```

A validação é disparada no `(blur)` (quando o usuário sai do campo) e novamente no submit.

Máscaras aplicadas via evento `(input)` com `maxlength` para impedir ultrapassar o formato:
- CPF usa `maxlength="14"` → `000.000.000-00`
- CNPJ usa `maxlength="18"` → `00.000.000/0000-00`
- Telefone usa `maxlength="15"` → `(00) 00000-0000`

---

### 3.2 `signup.component.ts`

#### Máscaras de formatação (aplicadas enquanto digita)

```typescript
// CPF: 000.000.000-00
aplicarMascaraCPF(valor: string): string { ... }

// CNPJ: 00.000.000/0000-00
aplicarMascaraCNPJ(valor: string): string { ... }

// Telefone: detecta fixo (10 dígitos) ou celular (11 dígitos) automaticamente
aplicarMascaraTelefone(valor: string): string { ... }
```

#### Validações com algoritmo oficial

**CPF — dois dígitos verificadores:**
```
1º dígito: soma dos 9 primeiros dígitos × pesos 10..2, módulo 11
2º dígito: soma dos 10 primeiros dígitos × pesos 11..2, módulo 11
CPFs com todos os dígitos iguais (111.111.111-11) são rejeitados
```

**CNPJ — dois dígitos verificadores:**
```
1º dígito: soma 12 dígitos × pesos [5,4,3,2,9,8,7,6,5,4,3,2], módulo 11
2º dígito: soma 13 dígitos × pesos [6,5,4,3,2,9,8,7,6,5,4,3,2], módulo 11
CNPJs com todos os dígitos iguais são rejeitados
```

**E-mail:** regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Telefone:** aceita 10 dígitos (fixo) ou 11 dígitos (celular)

**Senha:** mínimo 8 caracteres (alinhado com o backend)

#### Objeto de erros reativo

```typescript
erros: Record<string, string> = {};

validarCampo(campo: string): void {
  // atualiza this.erros conforme o campo
}
```

O método `formularioValido()` bloqueia o submit enquanto qualquer campo obrigatório falhar:

```typescript
formularioValido(): boolean {
  // verifica PF ou PJ, e-mail, telefone, senha, confirmar
}
```

#### Payload enviado ao backend

```typescript
const payload = {
  nome:    tipo === 'PF' ? dados.nome    : dados.razao,  // campo unificado no backend
  email:   dados.email,
  telefone: dados.telefone || null,
  senha:   dados.senha,
  tipo:    'PF' | 'PJ',
  cpf:     tipo === 'PF' ? dados.cpf  : null,
  cnpj:    tipo === 'PJ' ? dados.cnpj : null,
};
```

---

### 3.3 `signup.component.scss`

Adicionados estilos para estado de erro:

```scss
.input-group.has-error {
  input        → borda vermelha + sombra suave
  .input-icon  → vermelho
  label        → vermelho
}

.field-error {
  display: flex; gap: 4px;
  font-size: 0.72rem; font-weight: 600; color: #e53935;
}
```

---

## 4. Alterações no Backend

### 4.1 `src/cliente/dto/create-client.dto.ts`

**Antes:** DTO com campo genérico `documento: string` — incompatível com o payload real enviado pelo frontend.

**Depois:** DTO reflete exatamente o payload:

```typescript
export class CreateClienteDto {
  nome:     string;   // obrigatório
  email:    string;   // obrigatório, validado como e-mail
  senha:    string;   // obrigatório, mínimo 8 caracteres
  tipo:     'PF' | 'PJ';  // obrigatório
  cpf?:     string;   // opcional, regex 000.000.000-00
  cnpj?:    string;   // opcional, regex 00.000.000/0000-00
  telefone?: string;  // opcional, regex (00) 00000-0000
}
```

O `ValidationPipe` global (já configurado em `main.ts` com `whitelist: true`) rejeita automaticamente qualquer payload mal-formado antes de chegar ao service.

### 4.2 `src/cliente/client.service.ts`

**Mínimo de senha corrigido:** de 6 para **8 caracteres** — alinhado com frontend e DTO.

O service já salvava `telefone` corretamente via `prisma.clientes.create({ data: { telefone: data.telefone || null } })` — **nenhuma mudança estrutural necessária**.

### 4.3 `src/cliente/client.controller.ts`

**Antes:** `@Body() createClienteDto: any` — sem validação automática.

**Depois:** `@Body() createClienteDto: CreateClienteDto` — o NestJS valida o body com o DTO antes de chegar no service, devolvendo erros 400 detalhados automaticamente.

---

## 5. Fluxo completo de cadastro (ponta a ponta)

```
[Usuário digita CPF]
    → máscara aplica formato 000.000.000-00 em tempo real
    → (blur) dispara validarCampo('cpf')
    → algoritmo dos dígitos verificadores é executado
    → se inválido: borda vermelha + mensagem abaixo do campo

[Usuário clica "Criar Conta"]
    → todos os campos são revalidados
    → formularioValido() bloqueia se qualquer campo falhar
    → payload {nome, email, telefone, senha, tipo, cpf|cnpj} enviado para
      POST http://localhost:3000/clientes/autocadastro

[Backend recebe]
    → ValidationPipe valida CreateClienteDto (formato CPF/CNPJ/telefone, tamanho senha)
    → Service verifica duplicidade de CPF/CNPJ e e-mail no banco
    → bcrypt.hash(senha, 12) — senha NUNCA salva em texto puro
    → prisma.clientes.create({ nome, email, telefone, tipo, cpf, cnpj, senha: hash })
    → retorna { id, nome, email, tipo, cpf, cnpj, telefone, createdAt }

[Frontend]
    → step = 'SUCCESS' → tela de confirmação
```

---

## 6. Resumo: o que não precisou mudar

| Item | Situação |
|---|---|
| `schema.prisma` — model `clientes` | ✅ Já tinha todos os campos necessários |
| `auth.service.ts` | ✅ Login de cliente já funcionava |
| `auth.service.ts` (frontend) | ✅ Endpoint `/clientes/autocadastro` já apontado corretamente |
| `main.ts` — ValidationPipe global | ✅ Já estava configurado com `whitelist: true` |
| `class-validator` / `class-transformer` | ✅ Já instalados no package.json |

> Observação: apesar do cadastro em si não exigir mudança em `clientes`, foi feita uma limpeza removendo o model/tabela legado `cliente`.

---

## 7. Manual — Postgres/IPv6 + Prisma Shadow DB (por que deu erro e como evitar)

Esta seção explica por que apareceu o erro de conexão e por que o Prisma reclamava de "shadow database" mesmo com o Postgres ligado.

### 7.1 Por que `localhost` pode falhar (IPv6 vs IPv4)

Em muitos ambientes (principalmente Linux), `localhost` resolve primeiro para IPv6:

```
localhost -> ::1
```

Se o Postgres estiver escutando apenas em IPv4 (por exemplo `127.0.0.1:5432`) e **não** em IPv6 (`::1`), algumas ferramentas vão falhar ao tentar conectar por `localhost`.

**Sintoma típico:**
- `psql` conecta usando `127.0.0.1`
- mas o Prisma falha com `Can't reach database server at localhost:5432`

**Correção aplicada no projeto:**
- O `DATABASE_URL` foi ajustado para usar `127.0.0.1` no lugar de `localhost` (arquivo `backend/.env`).

Isso tende a funcionar tanto em Linux quanto em Windows. No Windows, dependendo da instalação do Postgres, `localhost` pode funcionar porque ele escuta IPv4 e IPv6, mas usar `127.0.0.1` continua sendo uma opção mais previsível.

> Nota: o parâmetro `?schema=public` é entendido pelo Prisma, mas o `psql` não aceita `schema` na URI (se você precisar testar via `psql`, use a URL sem `?schema=public`).

### 7.2 O que é o “Shadow Database” do Prisma

O comando `prisma migrate dev` (modo desenvolvimento) usa um *shadow database* para:

1) Aplicar migrations do zero em um banco vazio
2) Verificar se as migrations são reproduzíveis e consistentes
3) Calcular diffs com segurança

Ou seja: mesmo que o Postgres “principal” esteja ok, o Prisma também precisa conseguir:
- criar/conectar em um banco auxiliar (shadow), ou
- usar uma URL de shadow configurada.

No projeto foi criado um banco auxiliar `aldebaran_shadow` e adicionada a variável:

- `SHADOW_DATABASE_URL=postgresql://.../aldebaran_shadow?...`

E o `prisma.config.ts` foi configurado para usar esse shadow.

### 7.3 Por que o Prisma dizia que `0_init` não estava aplicado

O Prisma Migrate controla o histórico de migrations na tabela:

- `_prisma_migrations`

Se o banco foi criado “por fora” (por exemplo via `prisma db push`, scripts manuais, restore, etc.), ele pode ter todas as tabelas **mas não** ter `_prisma_migrations`.

Nessa situação, `prisma migrate status` pode listar a migration `0_init` como pendente, mesmo com as tabelas existindo.

**Como resolver (baseline):**

```
npx prisma migrate resolve --applied 0_init
```

Isso cria/atualiza o histórico sem recriar tabelas.

### 7.4 Como aplicar migrations em PCs diferentes (Windows/Linux)

Checklist recomendado ao clonar o projeto em outra máquina:

1) Confirme conectividade do Postgres (use IPv4 se precisar):

```
psql "postgresql://postgres:postgres@127.0.0.1:5432/aldebaran_db" -c "select 1;"
```

2) Garanta que `backend/.env` tenha `DATABASE_URL` apontando para `127.0.0.1` (ou que o Postgres esteja escutando IPv6 também).

3) Crie o shadow DB uma vez (se for usar `migrate dev`):

```
createdb -h 127.0.0.1 -U postgres aldebaran_shadow
```

4) Se o banco já existe e foi criado fora do Prisma Migrate:

```
npx prisma migrate status
npx prisma migrate resolve --applied 0_init
```

5) Aplicar migrations do repositório:

- Em produção/ambientes já existentes: `npx prisma migrate deploy`
- Em dev (querendo o fluxo completo com shadow): `npx prisma migrate dev`

6) Regerar client:

```
npx prisma generate
```

### 7.5 O que foi feito especificamente neste caso

1) Backup do banco.
2) Remoção do model `cliente` do schema.
3) Baseline do histórico (`resolve --applied 0_init`) porque não existia `_prisma_migrations`.
4) Aplicação da migration que remove a tabela `cliente` via `migrate deploy`.


# Event-Check — Tecnologias Utilizadas

Documento de referência do stack do projeto **Event-Check**: plataforma web de gerenciamento de eventos, com cadastro de usuários, inscrição, check-in por QR code, mapas de localização e painel administrativo.

Arquitetura em **monorepo**: `frontend/` (interface) e `backend/` (API REST).

---

## 1. Visão geral do stack

| Camada | Tecnologias |
|--------|-------------|
| Linguagem | TypeScript (frontend e backend) |
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | NestJS 10, Node.js, Express |
| Banco de dados | PostgreSQL (hospedado no Supabase) |
| ORM | Prisma 7 |
| Autenticação | JWT + cookie httpOnly + bcrypt |
| E-mail | Brevo (padrão), com opção de Resend ou Mandrill |
| Mapas | Leaflet, OpenStreetMap e Nominatim |
| Check-in | QR Code (geração no backend, leitura no frontend) |
| Hospedagem | Vercel (frontend e backend serverless) |
| CI | GitHub Actions |

---

## 2. Linguagens e runtime

### TypeScript
Linguagem principal do projeto (frontend 5.5.x e backend 5.9.x).

- Adiciona tipos estáticos sobre o JavaScript.
- Reduz erros em tempo de desenvolvimento (interfaces de `User`, `Event`, `Enrollment`, DTOs).
- Melhora autocomplete e documentação do código.

### Node.js
Ambiente de execução JavaScript no servidor.

- Roda a API NestJS.
- Executa scripts (Prisma, seed, build).
- CI usa Node.js 18.

### JavaScript
Linguagem que o navegador e o Node executam depois da compilação do TypeScript.

---

## 3. Frontend (`frontend/`)

### Next.js 14.0.0
Framework React usado para a aplicação web.

- **App Router**: rotas em `app/`, com grupos `(auth)`, `(user)` e `(admin)`.
- Renderização de páginas, layouts e otimização de imagens.
- Servidor de desenvolvimento (`next dev`) e build de produção (`next build`).
- Deploy na Vercel.

### React 18.2.0
Biblioteca de interface com componentes reutilizáveis.

- Componentes como `Button`, `EventCard`, `AuthForm`, `QrCheckInScanner`.
- Estado com hooks (`useState`, `useEffect`, etc.).
- `react-dom` renderiza a árvore no navegador.

### Tailwind CSS 3
Framework de CSS utilitário.

- Estilização dos componentes sem CSS manual em massa.
- Layout responsivo (mobile-first: `sm`, `md`, `lg`, `xl`).
- Dark mode por classe (`darkMode: 'class'`).
- Tema com tokens de cor (primary, muted, destructive, etc.).

### PostCSS + Autoprefixer
Pipeline de CSS.

- **PostCSS**: processa o CSS no build.
- **Autoprefixer**: adiciona prefixos de navegador automaticamente.

### React Hook Form 7
Gerenciamento de formulários.

- Login, cadastro, perfil, criação/edição de eventos.
- Menos re-renders do que controle manual de cada campo.

### Zod 3 + @hookform/resolvers
Validação de dados no frontend.

- **Zod**: schemas tipados (`loginSchema`, `registerSchema`, `eventSchema`).
- **@hookform/resolvers**: liga o Zod ao React Hook Form e exibe erros no formulário.

### Recharts
Gráficos no painel admin.

- Pizza de ocupação do evento.
- Gráficos de inscritos / check-in.

### Leaflet + react-leaflet
Mapas interativos.

- **Leaflet**: biblioteca de mapas.
- **react-leaflet**: componentes React sobre o Leaflet.
- Exibe localização do evento e permite escolher ponto no mapa.

### OpenStreetMap + Nominatim
Dados geográficos (sem chave de API paga).

- **OpenStreetMap**: tiles (imagens) do mapa.
- **Nominatim**: busca de endereço e geocodificação reversa, via backend (`/api/geocode`).

### html5-qrcode
Leitura de QR code pela câmera no check-in do admin (`QrCheckInScanner`).

### lucide-react
Ícones SVG (setas, usuário, mapa, calendário, etc.).

### Radix UI (`@radix-ui/react-label`, `@radix-ui/react-slot`)
Primitivos de acessibilidade para rótulos e composição de botões.

### class-variance-authority (CVA) + clsx + tailwind-merge + tailwindcss-animate
Utilitários de estilo.

- **CVA**: variantes de componente (ex.: botão `default` / `destructive`).
- **clsx**: junta classes CSS de forma condicional.
- **tailwind-merge**: evita conflito entre classes Tailwind.
- **tailwindcss-animate**: animações prontas.

### ESLint + eslint-config-next
Análise estática do código frontend (regras de Next.js e Web Vitals).

---

## 4. Backend (`backend/`)

### NestJS 10
Framework Node.js da API REST.

Pacotes usados:

- `@nestjs/common` — decoradores, pipes, guards, exceções.
- `@nestjs/core` — núcleo do framework.
- `@nestjs/platform-express` — HTTP via Express.

Organização em módulos:

| Módulo | Função |
|--------|--------|
| `auth` | Login, registro, verificação de e-mail, reset de senha |
| `users` | Perfil e listagem de usuários (admin) |
| `events` | CRUD de eventos |
| `enrollments` | Inscrições e check-in |
| `geocoding` | Proxy de busca de endereço (Nominatim) |
| `notifications` | E-mails transacionais e token do QR |

Padrão em camadas: **controller** (HTTP) → **service** (regras de negócio) → **repository** (Prisma).

Prefixo da API: `/api`.

### Express
Servidor HTTP por baixo do NestJS.

- CORS (frontend local e Vercel).
- Cookies.
- Limite de body JSON (imagens em base64, até 10 MB).

### class-validator + class-transformer
Validação da entrada da API.

- **class-validator**: decoradores nos DTOs (`@IsEmail`, `@IsNotEmpty`, `@MinLength`).
- **class-transformer**: converte JSON em instâncias de classe.
- `ValidationPipe` global: `whitelist`, `transform`, rejeita valores desconhecidos.

### reflect-metadata
Necessário para decoradores do NestJS, `class-validator` e `class-transformer`.

### RxJS
Observables usados internamente pelo NestJS (ciclo de vida, interceptors, streams).

### cookie-parser
Lê cookies HTTP. O token de sessão pode ir no cookie httpOnly, além do header `Authorization`.

### dotenv
Carrega variáveis do arquivo `.env` (porta, banco, chaves de e-mail, segredos JWT).

### uuid
Geração de identificadores únicos (tokens de verificação, reset, etc., além dos UUIDs do Prisma).

---

## 5. Banco de dados e persistência

### PostgreSQL
Banco relacional.

Modelos principais:

- **User** — usuários (roles `admin` e `user`), verificação de e-mail, perfil.
- **Event** — eventos (data, local, coordenadas, capacidade, status, capa).
- **Enrollment** — inscrição (token de check-in, horário de check-in).
- **EmailVerification** — tokens de confirmação de e-mail.
- **PasswordReset** — tokens de redefinição de senha.

Hospedagem: **Supabase** (PostgreSQL gerenciado), com:

- `DATABASE_URL` — pooler em modo transação (porta 6543) para a aplicação.
- `DIRECT_URL` — conexão direta (porta 5432) para migrations.

### Prisma 7
ORM (mapeamento objeto-relacional).

- Schema em `backend/prisma/schema.prisma`.
- Migrations versionadas em `prisma/migrations/`.
- Cliente gerado em `src/generated/prisma`.
- Seed (`prisma/seed.ts`) para dados iniciais.
- `@prisma/client` — acesso ao banco no código.
- `@prisma/adapter-pg` — adaptador PostgreSQL (driver `pg`).
- `pg` — driver Node.js do PostgreSQL.

### tsx
Executa TypeScript direto no Node (seed do Prisma: `tsx prisma/seed.ts`).

---

## 6. Segurança e autenticação

### bcryptjs
Hash de senhas. A senha nunca é gravada em texto puro.

### jsonwebtoken (JWT)
Tokens assinados.

- **Sessão** (`AUTH_TOKEN_SECRET`): login; validade de 7 dias; enviado no header Bearer ou cookie httpOnly.
- **QR de check-in** (`QR_TOKEN_SECRET`): inscrição do participante; lido no scanner do admin.

### Guards NestJS
Proteção de rotas (usuário autenticado, admin, ou o próprio usuário).

---

## 7. E-mail transacional

O backend envia e-mails de verificação de cadastro, reset de senha, confirmação de inscrição (com QR) e cancelamento de evento.

Provedor escolhido por `EMAIL_PROVIDER` no `.env`:

| Provedor | Pacote / API | Função |
|----------|----------------|--------|
| **Brevo** (padrão) | API HTTP v3 (`api.brevo.com`) | Envio transacional |
| **Resend** | pacote `resend` | Alternativa |
| **Mandrill** | API Mailchimp Transactional | Alternativa |
| **Console** | log no terminal | Desenvolvimento local, sem chave |

`MAIL_FROM` define o remetente. `FRONTEND_URL` entra nos links dos e-mails.

---

## 8. QR Code e check-in

### qrcode (backend)
Gera a imagem do QR da inscrição (anexada no e-mail e exibida no dashboard do usuário).

### html5-qrcode (frontend)
Lê o QR pela câmera na tela de check-in do admin.

Fluxo: inscrição → token JWT no QR → admin escaneia → API marca `checkedInAt`.

---

## 9. Mapas e localização

| Tecnologia | Onde | Função |
|------------|------|--------|
| Nominatim (OpenStreetMap) | Backend (`GeocodingService`) | Busca de endereço e geocodificação reversa |
| Leaflet / react-leaflet | Frontend | Mapa interativo |
| OpenStreetMap tiles | Frontend | Imagens do mapa |

O frontend não chama o Nominatim direto: passa pelo backend (`/api/geocode`) para respeitar a política de uso (User-Agent e intervalo entre requisições).

---

## 10. Infraestrutura, deploy e CI

### Vercel
Hospedagem serverless.

- Frontend: app Next.js.
- Backend: função serverless (`backend/src/serverless.ts` + `vercel.json`), reaproveitando a instância NestJS entre invocações.

### GitHub Actions
CI em pull requests para `main`, `master` e `develop`.

- Instala dependências do frontend.
- Roda `npm run lint` e `npm test` no Node 18.

### Git
Controle de versão do repositório.

---

## 11. Ferramentas de desenvolvimento

| Ferramenta | Função |
|------------|--------|
| **ts-node** | Roda o backend em TypeScript no modo dev (`npm run start:dev`) |
| **tsconfig-paths** | Resolve aliases de importação do TypeScript |
| **tsx** | Executa scripts TS (seed) |
| **Prisma CLI** | `generate`, `migrate`, `seed` |
| **@types/\*** | Tipagens para Node, React, JWT, cookie-parser, pg, qrcode, uuid, Leaflet |
| **ESLint** | Qualidade do código frontend |

---

## 12. Fluxo de uma requisição

```
Navegador (Next.js + React)
        │  fetch  (JSON + cookie/JWT)
        ▼
API NestJS  (/api/...)
        │  ValidationPipe (class-validator)
        │  Guard (JWT)
        ▼
Service (regras de negócio)
        │
        ▼
Prisma  →  PostgreSQL (Supabase)
        │
        ▼
Resposta JSON  →  interface React
```

E-mails e geocoding saem do service para Brevo/Resend e Nominatim, respectivamente.

---

## 13. Scripts principais

### Frontend

```bash
npm run dev      # servidor de desenvolvimento (porta 3000)
npm run build    # build de produção
npm run start    # sobe o build
npm run lint     # ESLint
```

### Backend

```bash
npm run start:dev       # API em modo desenvolvimento (porta 3001)
npm run build           # compilação TypeScript
npm run start           # sobe o JS compilado
npm run prisma:generate # gera o cliente Prisma
npm run prisma:migrate  # aplica migrations
npm run prisma:seed     # popula o banco
```

---

## 14. Resumo por responsabilidade

| Preciso de… | Tecnologia |
|-------------|------------|
| Interface web | React + Next.js |
| Visual e responsividade | Tailwind CSS |
| Formulários confiáveis | React Hook Form + Zod |
| Gráficos no admin | Recharts |
| Mapa do evento | Leaflet + OpenStreetMap |
| Busca de endereço | Nominatim (via NestJS) |
| Ícones | lucide-react |
| API REST | NestJS |
| Validar body da API | class-validator |
| Guardar dados | PostgreSQL + Prisma |
| Hospedar o banco | Supabase |
| Senha segura | bcryptjs |
| Sessão do usuário | JWT + cookie |
| Check-in | qrcode + html5-qrcode |
| E-mails | Brevo (ou Resend / Mandrill) |
| Publicar o sistema | Vercel |
| Checar o código no PR | GitHub Actions + ESLint |

---

*Documento gerado a partir do código atual do repositório Event-Check (dependências em `frontend/package.json` e `backend/package.json`, schema Prisma, módulos NestJS e configuração de deploy).*

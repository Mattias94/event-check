# Testes de Autenticação e Proteção de Rotas — Event-Check

Documento de validação manual da autenticação, proteção de rotas e fluxos relacionados.

**Última atualização:** 03/09/2026  
**Ambientes:** localhost (`npm run dev`) e produção (Vercel)

---

## Credenciais de teste (seed)

Após `npm run prisma:seed` no backend:

| Papel | E-mail | Senha | Role |
|-------|--------|-------|------|
| Admin | `admin@test.com` | `admin123` | `admin` |
| Usuário | `joao@test.com` | `senha123` | `user` |
| Usuário | `maria@test.com` | `senha123` | `user` |

O **primeiro usuário** registrado no sistema (sem seed) torna-se admin automaticamente.

---

## URLs

| Ambiente | Frontend | API |
|----------|----------|-----|
| Local | http://localhost:3000 | http://localhost:3001/api |
| Produção | https://event-check-seven.vercel.app | https://event-check-backend.vercel.app/api |

---

## Rotas e proteção

### Públicas (sem login)
- `/` — redireciona para registro ou dashboard conforme sessão
- `/login`, `/register`
- `/forgot-password`, `/reset-password`
- `/verify-email`

### Usuário (`UserProtection` + `UserShell`)
- `/dashboard` — Meus eventos
- `/events` — Descobrir eventos
- `/events/[id]` — Detalhes e inscrição

### Admin (`AdminProtection` + `AdminShell`)
- `/admin/events` — Lista de eventos
- `/admin/events/create` — Criar evento (botão **Cancelar** volta para lista)
- `/admin/events/[id]` — Editar evento
- `/admin/events/[id]/check-in` — Scanner QR
- `/admin/dashboard?eventId=...` — Dashboard do evento
- `/admin/users` — Pesquisa de usuários

---

## Testes realizados

### TESTE 1 — Login como usuário comum

**Passos:** Login com `joao@test.com` / `senha123`

**Resultado esperado:**
- Redirecionamento para `/dashboard`
- Sidebar com **Meus eventos** e **Descobrir eventos**
- Lista de inscrições e QR codes quando houver eventos inscritos

**Status:** ✅ Passou

---

### TESTE 2 — Usuário comum tenta acessar admin

**Passos:** Logado como user, acessar `/admin/events`

**Resultado esperado:**
- Redirecionamento automático para `/dashboard`
- Conteúdo admin não é exibido

**Status:** ✅ Passou

---

### TESTE 3 — Login como admin

**Passos:** Login com `admin@test.com` / `admin123`

**Resultado esperado:**
- Redirecionamento para `/admin/events`
- Sidebar admin: Eventos, Usuários, Criar evento
- Acesso a dashboard, check-in, CRUD de eventos e usuários

**Status:** ✅ Passou (local e produção)

---

### TESTE 4 — Admin tenta acessar área do usuário

**Passos:** Logado como admin, acessar `/dashboard`

**Resultado esperado:**
- Redirecionamento para `/admin/events`

**Status:** ✅ Passou

---

### TESTE 5 — Acesso sem autenticação

**Passos:** Limpar `localStorage` (`currentUser`, `authToken`); acessar `/dashboard` ou `/admin/events`

**Resultado esperado:**
- Redirecionamento para `/login`

**Status:** ✅ Passou

---

### TESTE 6 — Verificação de e-mail (novo cadastro)

**Passos:** Registrar novo usuário (não sendo o primeiro do sistema)

**Resultado esperado:**
- E-mail de verificação enviado (Brevo em produção; link no terminal em dev com `EMAIL_DEV_CONSOLE=true`)
- Login bloqueado até confirmar e-mail

**Status:** ✅ Configurado (validar com conta real em produção)

---

## Comportamento dos guards (implementação atual)

### `AdminProtection.tsx`
- Lê usuário via `getCurrentUser()` (síncrono)
- `role !== 'admin'` → `router.replace('/dashboard')` ou `/login`
- Retorna `null` enquanto redireciona — **sem** tela “Verificando permissões…”

### `UserProtection.tsx`
- Prop `requireUserRole` (padrão `true`)
- Admin em rota de user → `/admin/events`
- Não autenticado → `/login`

Proteção centralizada nos layouts:
- `app/(user)/layout.tsx` → `UserProtection` + `UserShell`
- `app/(admin)/layout.tsx` → `AdminProtection` + `AdminShell`

---

## Fluxo resumido

```
Usuário comum → /login → /dashboard (UserShell)
    ↓ tenta /admin/*
AdminProtection → /dashboard

Admin → /login → /admin/events (AdminShell)
    ↓ tenta /dashboard
UserProtection → /admin/events

Sem sessão → qualquer rota protegida → /login
```

---

## Checklist de validação rápida

| # | Cenário | OK? |
|---|---------|-----|
| 1 | Login user → dashboard | ☐ |
| 2 | User bloqueado em `/admin/*` | ☐ |
| 3 | Login admin → `/admin/events` | ☐ |
| 4 | Admin bloqueado em `/dashboard` | ☐ |
| 5 | Sem auth → `/login` | ☐ |
| 6 | Logout limpa sessão e vai para login | ☐ |
| 7 | Admin: criar / editar / cancelar / deletar evento | ☐ |
| 8 | Admin: check-in QR | ☐ |
| 9 | User: inscrever-se e ver QR | ☐ |
| 10 | Cancelamento notifica inscritos por e-mail | ☐ |

---

## Componentes relacionados

- `frontend/components/AdminProtection.tsx`
- `frontend/components/UserProtection.tsx`
- `frontend/components/user/UserShell.tsx`
- `frontend/app/(admin)/layout.tsx`
- `frontend/app/(user)/layout.tsx`
- `frontend/lib/auth-guard.ts`
- `frontend/lib/auth.ts`

---

## Observações

- Testes **automatizados** (Jest/Playwright) ainda não estão configurados — o job `npm test` no CI é placeholder.
- Em produção, use contas seed ou crie usuários via registro; confirme remetente Brevo para receber e-mails.
- Ver também `CORRECOES_ACESSO.md` para histórico da implementação de proteção de rotas.

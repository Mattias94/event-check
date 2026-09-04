# Wireframes de Baixa Fidelidade — Event-Check

Documento alinhado à interface implementada (Next.js + Tailwind, set/2026).

## Índice
1. [Estrutura de navegação](#estrutura-de-navegação)
2. [Fluxo de Usuário Regular](#fluxo-de-usuário-regular)
3. [Fluxo de Admin](#fluxo-de-admin)
4. [Componentes Reutilizáveis](#componentes-reutilizáveis)
5. [Design Tokens](#design-tokens)
6. [Estados de Componentes](#estados-de-componentes)

---

## Estrutura de navegação

### UserShell (layout `(user)`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ Event-Check  │  [≡ menu mobile]  Event-Check             │
│              ├─────────────────────────────────────────────┤
│ Meus eventos │                                             │
│ Descobrir    │           Conteúdo da página                │
│              │                                             │
│ [Painel Admin│                                             │
│  (se admin)] │                                             │
│              │                                             │
│ [Sair]       │                                             │
└──────────────┴─────────────────────────────────────────────┘
Sidebar fixa (lg+); drawer no mobile.
```

### AdminShell (layout `(admin)`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ Event-Check  │  [≡ menu mobile]  Event-Check             │
│ [Admin]      ├─────────────────────────────────────────────┤
│              │                                             │
│ Eventos      │           Conteúdo da página                │
│ Usuários     │                                             │
│ Criar evento │                                             │
│              │                                             │
│ [Sair]       │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

---

## Fluxo de Usuário Regular

### 1️⃣ Tela de Login
```
┌─────────────────────────────────────┐
│         EventCheck 📋               │
│                                     │
│      Bem-vindo ao Event-Check       │
│  Crie sua conta para se inscrever   │
│                                     │
│    ┌──────────────────────────┐     │
│    │  Fazer Login             │     │
│    ├──────────────────────────┤     │
│    │ [E-mail..................] │     │
│    │ [Senha...................] │     │
│    │        [Login]            │     │
│    │    ou registre-se    │     │
│    │   [Esqueceu senha?]  │     │
│    └──────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘

Componentes:
- Input de e-mail
- Input de senha
- Botão Login (state: default, hover, disabled, loading)
- Links de navegação
```

### 2️⃣ Tela de Registro
```
┌─────────────────────────────────────┐
│         EventCheck 📋               │
│                                     │
│      Bem-vindo ao Event-Check       │
│  Crie sua conta para se inscrever   │
│                                     │
│    ┌──────────────────────────┐     │
│    │  Criar Conta             │     │
│    ├──────────────────────────┤     │
│    │ [Nome Completo..........]  │     │
│    │ [E-mail..................] │     │
│    │ [Data de Nascimento.....] │     │
│    │ [Senha...................] │     │
│    │     [Registrar]         │     │
│    │   ou faça login    │     │
│    │  [Recuperar Senha]  │     │
│    └──────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘

Validações:
- Nome mínimo 3 caracteres
- E-mail formato válido
- Senha mínima 6 caracteres
- Data de nascimento válida
```

### 3️⃣ Dashboard do Usuário (`/dashboard`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ UserShell    │  Meus eventos                               │
│ (sidebar)    ├─────────────────────────────────────────────┤
│              │  Próximos eventos inscritos                 │
│              │  ┌─────────────────────────────────────┐   │
│              │  │ [Capa] Título · data · local        │   │
│              │  │ [Ver detalhes]  [QR code ampliável] │   │
│              │  └─────────────────────────────────────┘   │
│              │                                             │
│              │  Histórico (eventos passados / check-in)    │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘

Navegação lateral: Meus eventos | Descobrir eventos
Admin logado como user: link "Painel Admin" na sidebar
```

### 4️⃣ Página de Exploração (`/events`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ UserShell    │  Descobrir eventos                          │
│              ├─────────────────────────────────────────────┤
│              │ [Buscar] [Categoria ▼] [De] [Até]          │
│              │                                             │
│              │  Grid de EventCard (1/2/3 colunas)         │
│              │  - capa, título, local, data, vagas        │
│              │  - Inscrever-se | Ver detalhes | Cheio     │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

### 5️⃣ Detalhes do Evento (`/events/[id]`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ UserShell    │  [← Voltar]  Detalhes                       │
│              ├─────────────────────────────────────────────┤
│              │  Capa + título + data/hora + categoria      │
│              │  Mapa Leaflet (localização)                 │
│              │  Descrição · barra de vagas                 │
│              │  [Inscrever-se] ou QR + [Cancelar inscrição]│
└──────────────┴─────────────────────────────────────────────┘

Estados: disponível | cheio | já inscrito (QR ampliável)
```

---

## Fluxo de Admin

### 1️⃣ Lista de Eventos (`/admin/events`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ AdminShell   │  Meus eventos · estatísticas (cards)      │
│              ├─────────────────────────────────────────────┤
│              │  EventCard admin:                           │
│              │  status · data · inscritos/capacidade       │
│              │  [Dashboard] [Editar] [Check-in]            │
│              │  [Cancelar] [Deletar]                       │
│              │                                             │
│              │  Deletar: sempre habilitado; com inscritos  │
│              │  remove inscrições em cascata (confirmação) │
└──────────────┴─────────────────────────────────────────────┘
```

### 2️⃣ Criar / Editar Evento
```
┌──────────────┬─────────────────────────────────────────────┐
│ AdminShell   │  Criar novo evento (ou editar)              │
│              ├─────────────────────────────────────────────┤
│              │  Capa (upload JPEG/PNG/WebP)                │
│              │  Título · Descrição · Categoria             │
│              │  Data · Horário · Capacidade                │
│              │  Localização + mapa (LocationPickerDialog)  │
│              │                                             │
│              │  [Cancelar]  [Criar Evento / Salvar]        │
└──────────────┴─────────────────────────────────────────────┘

Validações: data futura, capacidade ≥ 1, campos obrigatórios (Zod)
```

### 3️⃣ Dashboard do Evento (`/admin/dashboard?eventId=`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ AdminShell   │  Métricas: inscritos · check-in · vagas     │
│              │  Gráficos Recharts (pizza + linha)          │
│              │  Lista inscritos · busca · export CSV       │
│              │  Check-ins recentes                         │
│              │  [Ir para check-in QR]                      │
└──────────────┴─────────────────────────────────────────────┘
```

### 4️⃣ Check-in QR (`/admin/events/[id]/check-in`)
```
┌──────────────┬─────────────────────────────────────────────┐
│ AdminShell   │  [← Voltar ao dashboard]                    │
│              │  Check-in — {título do evento}              │
│              │  ┌─────────────────────────────────────┐   │
│              │  │  Preview câmera / upload / manual   │   │
│              │  │  QrCheckInScanner                   │   │
│              │  └─────────────────────────────────────┘   │
│              │  Toast: sucesso | já fez check-in | erro   │
└──────────────┴─────────────────────────────────────────────┘
```

### 5️⃣ Pesquisar Usuários (`/admin/users`)
```
┌────────────────────────────────────────────────────────────┐
│  [← Voltar]        Pesquisar Usuários          [Logout]    │
│                    Visualize inscrições                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │ 🔍 Pesquisar     │  │                                │ │
│  ├──────────────────┤  │  Evento 1                      │ │
│  │ [🔍 Buscar....] │  │  📅 20/09/2026 às 14:00       │ │
│  │                  │  │  Status: ✓ Ativo              │ │
│  │ Usuário 1 (sel) │  │  Inscrito em: 15 ago às 10:30 │ │
│  │ Usuário 2       │  │                                │ │
│  │ Usuário 3       │  │  Evento 2                      │ │
│  │ Usuário 4       │  │  📅 25/09/2026 às 09:00       │ │
│  │                  │  │  Status: ✓ Ativo              │ │
│  │ Total: 4        │  │  Inscrito em: 16 ago às 14:20 │ │
│  │ usuários        │  │                                │ │
│  └──────────────────┘  │  [Desinscrever]                │ │
│                        └────────────────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘

Layout: 2 colunas
- Esquerda: Search + Lista de usuários (scrollável)
- Direita: Histórico de inscrições do usuário selecionado
```

---

## 🧩 Componentes Reutilizáveis

### Card Base
```
┌─────────────────────────────────┐
│ [Título]                        │
│ Subtexto ou descrição           │
│                                 │
│ [Botão Primário] [Botão Sec]   │
└─────────────────────────────────┘

Props:
- title: string
- subtitle?: string
- children?: ReactNode
- actions?: Button[]
- onClick?: () => void
```

### Input
```
┌───────────────────────────────────────┐
│ Label                                 │
│ ┌─────────────────────────────────┐   │
│ │ [Placeholder ou valor...]        │   │
│ └─────────────────────────────────┘   │
│ ⚠️ Mensagem de erro (se houver)      │
└───────────────────────────────────────┘

Props:
- label: string
- placeholder?: string
- error?: string
- type: 'text' | 'email' | 'password' | 'date' | 'time'
- value: string
- onChange: (value: string) => void
```

### Button
```
Estados:
[Default]  [Hover]    [Disabled]   [Loading]
────────   ────────   ──────────   ──────────
─ Botão  ─ Botão   ─ Botão     ─ Carregando...
────────   ────────   ──────────   ──────────

Props:
- label: string
- onClick: () => void
- disabled?: boolean
- loading?: boolean
- variant: 'primary' | 'secondary' | 'danger'
- size?: 'sm' | 'md' | 'lg'
```

### Badge/Status
```
Status:
🟢 Ativo      🔴 Cancelado      ⚫ Finalizado      🟡 Moderado
✓ Confirmado  ✗ Cancelado       (Vagas) Com Vagas (Vagas) Cheio
```

### Empty State
```
┌─────────────────────────────────┐
│                                 │
│          📋 (Ícone)             │
│                                 │
│    Nenhum evento encontrado     │
│                                 │
│  [+ Criar Seu Primeiro Evento]  │
│                                 │
└─────────────────────────────────┘

Props:
- icon: string | ReactNode
- message: string
- action?: { label: string, onClick: () => void }
```

### Loading State
```
┌─────────────────────────────────┐
│                                 │
│        ⟲ (spinner)              │
│      Carregando...              │
│                                 │
└─────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│  ⚠️ Erro ao carregar dados      │
│                                 │
│  [Tentar Novamente]             │
└─────────────────────────────────┘
```

### Toast/Notification
```
┌──────────────────────────────────────┐
│ ✅ Evento criado com sucesso!        │ (posição: top-right)
└──────────────────────────────────────┘

Estados:
- Success (verde): ✅ Mensagem
- Error (vermelho): ❌ Mensagem
- Info (azul): ℹ️ Mensagem
- Warning (amarelo): ⚠️ Mensagem
```

---

## Design Tokens

Paleta implementada via CSS variables (`globals.css`) — tema **teal** (shadcn-style).

### Cores (light mode)

| Token | HSL | Uso |
|-------|-----|-----|
| **primary** | `174 84% 28%` (~ `#0F766E`) | Botões, marca, links |
| **accent** | `174 60% 92%` | Item ativo na sidebar |
| **destructive** | `0 72% 45%` | Excluir, erros |
| **success** | `152 65% 28%` | Confirmações, vagas OK |
| **warning** | `36 92% 32%` | Alertas |
| **background** | `180 20% 99%` | Fundo da página |
| **foreground** | `200 50% 8%` | Texto principal |
| **muted-foreground** | `200 18% 32%` | Texto secundário |
| **border** | `200 16% 88%` | Bordas, divisores |

Dark mode: classe `.dark` no `<html>` — mesmos tokens com valores invertidos.

### Tipografia

- **Font stack:** system UI (`Segoe UI`, `-apple-system`, sans-serif)
- **Títulos de página:** `text-2xl` / `text-3xl`, `font-bold`
- **Corpo:** `text-sm` / `text-base`
- **Labels de formulário:** `text-sm font-medium`

### Espaçamento e radius

- **Radius padrão:** `--radius: 0.75rem`
- **Sidebar:** `w-60` (240px) desktop
- **Touch targets:** `min-h-11` em links de navegação
- **Container:** padding responsivo `1rem` → `2rem`

---

## 🔄 Estados de Componentes

### Button States
```
┌─────────────────────────────────────────────┐
│  Default   Hover   Focus   Disabled Loading │
│                                             │
│   [Botão]  [►] ▌ [░]      [-]    […]      │
│  ──────    ──── ── ────    ────── ──────    │
│   Normal   Opacity Alt    Opacity Spinner  │
│            +10%    Color  50%    Visible   │
└─────────────────────────────────────────────┘
```

### Input States
```
┌──────────────────────────────────┐
│ Default         Focus            │
│ ┌──────────────────────────────┐ │
│ │ [Placeholder]               │ │
│ └──────────────────────────────┘ │
│   border: gray-200              │
│                                  │
│ Filled              Error         │
│ ┌──────────────────────────────┐ │
│ │ [Valor preenchido]          │ │
│ └──────────────────────────────┘ │
│   background: gray-50           │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ [Valor]                     │ │
│ └──────────────────────────────┘ │
│   border: red-500, bg: red-50   │
│   ⚠️ Mensagem de erro            │
└──────────────────────────────────┘
```

### Card States
```
┌─────────────────────────────────┐
│  Default  │  Hover  │  Selected │
│ ┌───────┐ │ ┌───────┐│ ┌───────┐ │
│ │ Card  │ │ │ Card  ││ │ Card  │ │
│ │       │ │ │       ││ │  ✓    │ │
│ └───────┘ │ └───────┘│ └───────┘ │
│ shadow: 1 │ shadow:2 │ border:   │
│           │ cursor:  │ primary   │
│           │ pointer  │           │
└─────────────────────────────────┘
```

### Barra de Progresso
```
Vazia:        Parcial (50%):     Cheia:        Overflow:
═══════════   █████░░░░░░        ███████████   ███████████
0%            50%                100%          >100% (error)

Cores:
- 0-30%: 🟢 Verde (Com vagas)
- 30-70%: 🟡 Amarelo (Moderado)
- 70-100%: 🔴 Vermelho (Quase cheio)
- >100%: 🔴 Vermelho (Cheio)
```

---

## 📱 Responsividade

### Breakpoints
```
Mobile:     < 640px  (sm)
Tablet:     640px - 1024px (md)
Desktop:    > 1024px (lg, xl)
```

### Grid Layouts

#### Mobile (1 coluna)
```
┌──────┐
│ Seç. │
├──────┤
│ Seç. │
├──────┤
│ Seç. │
└──────┘
```

#### Tablet (2 colunas)
```
┌──────────────────────┐
│ Seção 1 │ Seção 2    │
├──────────────────────┤
│ Seção 3 │ Seção 4    │
└──────────────────────┘
```

#### Desktop (3 colunas)
```
┌─────────────────────────────┐
│ Seção 1 │ Seção 2 │ Seção 3 │
├─────────────────────────────┤
│ Seção 4 │ Seção 5 │ Seção 6 │
└─────────────────────────────┘
```

### Espaçamento Responsivo
```
- Padding:
  Mobile: 16px
  Tablet: 24px
  Desktop: 32px

- Margin Vertical:
  Mobile: 16px
  Tablet: 24px
  Desktop: 32px

- Gap (grid/flex):
  Mobile: 12px
  Tablet: 16px
  Desktop: 20px
```

---

## 🌙 Dark Mode

### Aplicação de Cores em Dark Mode
```
Background:  #111827 (Gray 900)
Surface:     #1f2937 (Gray 800)
Border:      #374151 (Gray 700)
Text Primary: #f9fafb (Gray 50)
Text Secondary: #d1d5db (Gray 300)

Exemplos:
- Card: bg-white dark:bg-gray-800
- Text: text-gray-900 dark:text-gray-50
- Border: border-gray-200 dark:border-gray-700
```

---

## Checklist de implementação

- [x] **Design tokens** — CSS variables em `globals.css`
- [x] **Componentes base** — Button, Input, Card, Badge, Toast
- [x] **Estados** — loading, error, empty, disabled
- [x] **Dark mode** — tokens `.dark` definidos
- [x] **Mobile + desktop** — sidebar + drawer
- [x] **Ícones** — lucide-react
- [x] **Responsividade** — Tailwind `sm` / `md` / `lg`
- [x] **Protótipo funcional** — app Next.js em produção
- [ ] **Figma** — wireframes de baixa fidelidade (este documento)

**Versão:** 2.0  
**Status:** Wireframes alinhados ao código implementado (set/2026)  
**Produção:** https://event-check-seven.vercel.app

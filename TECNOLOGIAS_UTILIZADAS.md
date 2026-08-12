# Event-Check: Tecnologias Utilizadas e Suas Funções

## 📋 Visão Geral do Projeto

Event-Check é uma plataforma de gerenciamento de eventos moderna e responsiva, construída com tecnologias de ponta para oferecer uma experiência de usuário excelente tanto para usuários comuns quanto para administradores de eventos.

---

## 🛠️ Stack Tecnológico

### **Frontend**

#### **Next.js 14.0.0**
- **Função Principal**: Framework React para aplicação web de página única (SPA) com suporte a renderização do lado do servidor (SSR) e geração estática de sites (SSG)
- **Uso no Projeto**: 
  - Roteamento de aplicação (App Router)
  - Renderização de páginas
  - Otimização automática de imagens
  - Middleware de autenticação

#### **React 18.2.0**
- **Função Principal**: Biblioteca JavaScript para construção de interfaces de usuário com componentes reutilizáveis
- **Uso no Projeto**:
  - Criação de componentes de interface (Button, Input, EventCard)
  - Gerenciamento de estado com hooks (useState, useEffect, useContext)
  - Renderização condicional e listas de eventos

#### **TypeScript 5.5.6**
- **Função Principal**: Superset de JavaScript que adiciona tipagem estática
- **Uso no Projeto**:
  - Tipagem de componentes React
  - Definição de interfaces de dados (Event, User, Enrollment)
  - Validação de tipos em tempo de desenvolvimento
  - Melhor documentação de código

#### **Tailwind CSS 3.0.0**
- **Função Principal**: Framework de CSS utilitário para estilização rápida e responsiva
- **Uso no Projeto**:
  - Estilização de todos os componentes
  - Sistema de grid responsivo (breakpoints: sm, md, lg)
  - Dark mode nativo
  - Temas de cores (slate, green, blue, red)

#### **React Hook Form 7.45.1**
- **Função Principal**: Biblioteca para gerenciamento eficiente de formulários em React
- **Uso no Projeto**:
  - Validação de formulários (login, registro, criação de eventos)
  - Redução de re-renders desnecessários
  - Integração com resolvers de validação (Zod)

#### **Zod 3.21.4**
- **Função Principal**: Biblioteca TypeScript-first para validação de esquemas
- **Uso no Projeto**:
  - Validação de dados de entrada de formulários
  - Schemas fortemente tipados (loginSchema, registerSchema, eventSchema)
  - Geração automática de tipos TypeScript

#### **@hookform/resolvers 2.9.11**
- **Função Principal**: Resolvedor de validação que conecta Zod com React Hook Form
- **Uso no Projeto**:
  - Validação integrada de formulários com Zod
  - Exibição de mensagens de erro

#### **Recharts 3.10.1**
- **Função Principal**: Biblioteca de gráficos React baseada em componentes
- **Uso no Projeto**:
  - Gráfico de pizza (PieChart) - Status dos inscritos
  - Gráfico de linhas (LineChart) - Taxa de ocupação e check-in
  - ResponsiveContainer - Adaptação a diferentes tamanhos de tela

#### **clsx 1.2.1**
- **Função Principal**: Utilitário para mesclar classes CSS condicionalmente
- **Uso no Projeto**:
  - Merge de classes Tailwind em componentes (Button, Input)
  - Aplicação condicional de estilos baseada em props

---

### **Backend**

#### **NestJS 10.4.8**
- **Função Principal**: Framework Node.js progressivo para construção de aplicações back-end escaláveis
- **Componentes Utilizados**:
  - `@nestjs/common` - Decoradores e funcionalidades comuns
  - `@nestjs/core` - Core do framework
  - `@nestjs/platform-express` - Integração com Express para HTTP

- **Uso no Projeto**:
  - Criação de controllers e endpoints REST
  - Middleware de autenticação
  - Pipes de validação global
  - CORS para comunicação com frontend

#### **TypeScript 5.8.3**
- **Função Principal**: Tipagem estática para maior segurança e documentação de código
- **Uso no Projeto**:
  - Tipagem de controllers, services e DTOs
  - Validação em tempo de compilação
  - Melhor autocomplete em IDEs

#### **class-validator 0.14.1**
- **Função Principal**: Decoradores para validação de classes
- **Uso no Projeto**:
  - Validação de DTOs (Data Transfer Objects)
  - Decoradores como @IsEmail, @IsNotEmpty, @MinLength
  - Transformação de dados de entrada

#### **class-transformer 0.5.1**
- **Função Principal**: Transformação de objetos JavaScript em instâncias de classes tipadas
- **Uso no Projeto**:
  - Conversão automática de JSON de entrada em instâncias de DTOs
  - Serialização de respostas

#### **reflect-metadata 0.2.2**
- **Função Principal**: Polyfill para suportar metadados de reflexão em TypeScript
- **Uso no Projeto**:
  - Suporte a decoradores do NestJS
  - Metadados utilizados por class-validator e class-transformer

#### **rxjs 7.8.1**
- **Função Principal**: Biblioteca para programação reativa com observáveis
- **Uso no Projeto**:
  - Programação reativa nos observáveis do NestJS
  - Tratamento de eventos e streams de dados
  - Operadores para transformação de dados

---

### **Ferramentas de Desenvolvimento**

#### **Autoprefixer 10.4.14**
- **Função Principal**: PostCSS plugin para adicionar prefixos de fornecedor automaticamente
- **Uso no Projeto**: Compatibilidade de CSS em navegadores antigos

#### **PostCSS 8.4.21**
- **Função Principal**: Ferramenta para transformar CSS com plugins
- **Uso no Projeto**: Pipeline de processamento de CSS (Tailwind, Autoprefixer)

#### **ts-node 10.9.2**
- **Função Principal**: Executor TypeScript para Node.js
- **Uso no Projeto**: Execução de scripts e desenvolvimento backend em tempo real

#### **tsconfig-paths 4.2.0**
- **Função Principal**: Suporte para path mapping em TypeScript
- **Uso no Projeto**: Importações com caminhos absolutos (ex: `@/lib/types`)

---

## 🏗️ Arquitetura e Padrões

### **Frontend**
```
frontend/
├── app/                      # App Router do Next.js
│   ├── (auth)/              # Rotas de autenticação
│   ├── (admin)/             # Rotas adminitradas
│   ├── events/              # Listagem e detalhes de eventos
│   ├── dashboard/           # Dashboard do usuário
│   └── layout.tsx           # Layout raiz
├── components/              # Componentes reutilizáveis
│   ├── ui/                  # Componentes base (Button, Input)
│   └── admin/               # Componentes específicos de admin
├── lib/                     # Utilitários e lógica
│   ├── api.ts              # Cliente HTTP
│   ├── auth.ts             # Autenticação
│   ├── events.ts           # Lógica de eventos
│   └── types.ts            # Tipos TypeScript
└── globals.css             # Estilos globais
```

### **Backend**
```
backend/
├── src/
│   ├── main.ts             # Entrada da aplicação
│   ├── app.module.ts       # Módulo raiz
│   ├── controllers/        # Controllers REST
│   ├── services/           # Lógica de negócio
│   └── dto/                # Data Transfer Objects
└── dist/                   # Código compilado
```

---

## 🔐 Funcionalidades Principais

### **Autenticação e Autorização**
- Sistema de login/registro com validação
- Armazenamento seguro de credenciais
- Roles (Admin, User)
- Proteção de rotas baseada em roles

### **Gerenciamento de Eventos**
- CRUD completo de eventos (Admin)
- Busca e filtro por categoria
- Exibição em grid responsivo
- Status de eventos (Ativo, Cancelado, Finalizado)

### **Sistema de Inscrições**
- Inscrição/Desinscrição em eventos
- Tracking de vagas disponíveis
- Cálculo dinâmico de capacidade
- Histórico de eventos do usuário

### **Dashboard Admin**
- Visualização de inscritos
- Gráficos de ocupação
- Exportação de dados (CSV)
- Check-in de participantes

---

## 📱 Responsividade e Compatibilidade

### **Breakpoints Tailwind (Mobile-First)**
- `sm`: 640px (Tablets pequenos)
- `md`: 768px (Tablets)
- `lg`: 1024px (Desktops)
- `xl`: 1280px (Desktops grandes)

### **Suporte Dark Mode**
- Implementado via `dark:` classes do Tailwind
- Persistência de preferência do usuário

### **Meta Tags e SEO**
- Charset UTF-8
- Viewport responsivo
- Theme color

---

## 🚀 Melhorias Implementadas

1. ✅ **Correção de Bug**: Sintaxe do `toUpperCase()` em DashboardClient.tsx
2. ✅ **Meta Tags**: Adicionadas ao layout raiz para melhor responsividade
3. ✅ **Merge de Classes**: Corrigido em Button.tsx e Input.tsx usando clsx
4. ✅ **Responsividade**: Melhorada em:
   - Admin Dashboard (cards, grid, tabelas)
   - Event Detail Page (layout, botões)
   - All components (padding, font-sizes, gaps)
5. ✅ **Acessibilidade**: Improved semantic HTML e ARIA attributes

---

## 📊 Banco de Dados

O projeto utiliza localStorage para persistência de dados no frontend e um backend em memória para a demonstração. Em produção, seria utilizado:
- **PostgreSQL** ou **MongoDB** para persistência
- **Prisma** ou **TypeORM** como ORM
- **JWT** para tokens de autenticação

---

## 🎯 Fluxo de Requisições

```
Cliente (React/Next.js)
    ↓ (fetch/axios)
API REST (NestJS)
    ↓
Validação (class-validator)
    ↓
Controllers & Services
    ↓
localStorage/Memory Storage
    ↓
Response JSON
    ↓
Cliente (Renderização com React)
```

---

## 📦 Dependências de Produção vs Desenvolvimento

### **Produção** (executadas no build final)
- next, react, react-dom
- react-hook-form, @hookform/resolvers
- zod
- recharts
- clsx

### **Desenvolvimento** (apenas durante compilação)
- typescript
- @types/react, @types/node
- tailwindcss, autoprefixer, postcss

---

## 🔄 Scripts Disponíveis

### **Frontend**
```bash
npm run dev           # Inicia servidor de desenvolvimento
npm run build         # Compila para produção
npm run start         # Inicia servidor de produção
npm run lint          # Executa linter
```

### **Backend**
```bash
npm run build         # Compila TypeScript
npm run start         # Inicia servidor
npm run start:dev     # Inicia com ts-node
```

---

## 🎓 Conclusão

O Event-Check utiliza uma stack moderna e bem estabelecida que combina:
- **Performance**: Next.js com otimizações automáticas
- **Tipo-segurança**: TypeScript em frontend e backend
- **UX/UI**: Tailwind CSS com responsividade completa
- **Validação**: Zod + class-validator para dados confiáveis
- **Escalabilidade**: NestJS como framework robusto

Esta arquitetura garante um código manutenível, escalável e pronto para produção, com excelente experiência de usuário em todos os dispositivos.

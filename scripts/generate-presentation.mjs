import PptxGenJS from 'pptxgenjs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputPath = join(__dirname, '..', 'apresentacao-event-check.pptx')

const COLORS = {
  primary: '0F766E',
  primaryDark: '115E59',
  accent: '4F46E5',
  dark: '1E293B',
  light: 'F8FAFC',
  white: 'FFFFFF',
}

const FONT = 'Segoe UI'
const HEADER_H = 1.15
const MARGIN_X = 0.6
const CONTENT_W = 8.8

const TEXT = {
  body: { fontSize: 14, lineSpacing: 22, paraSpaceAfter: 10 },
  bodySmall: { fontSize: 13, lineSpacing: 20, paraSpaceAfter: 8 },
  title: { fontSize: 22, lineSpacing: 28 },
}

function addHeader(slide, title, subtitle) {
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: HEADER_H,
    fill: { color: COLORS.primary },
  })
  slide.addText(title, {
    x: MARGIN_X,
    y: 0.2,
    w: CONTENT_W,
    h: 0.55,
    fontSize: TEXT.title.fontSize,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
    wrap: true,
    valign: 'top',
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: MARGIN_X,
      y: 0.72,
      w: CONTENT_W,
      h: 0.38,
      fontSize: 12,
      color: 'CCFBF1',
      fontFace: FONT,
      wrap: true,
      valign: 'top',
    })
  }
}

function addParagraph(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x ?? MARGIN_X,
    y: opts.y ?? HEADER_H + 0.2,
    w: opts.w ?? CONTENT_W,
    h: opts.h ?? 1.2,
    fontSize: opts.fontSize ?? TEXT.body.fontSize,
    color: opts.color ?? COLORS.dark,
    fontFace: FONT,
    wrap: true,
    valign: 'top',
    lineSpacing: opts.lineSpacing ?? TEXT.body.lineSpacing,
  })
}

function addBullets(slide, items, opts = {}) {
  const cfg = opts.small ? TEXT.bodySmall : TEXT.body
  slide.addText(
    items.map((item) => ({
      text: item,
      options: {
        bullet: { code: '2022' },
        breakLine: true,
        paraSpaceAfter: cfg.paraSpaceAfter,
      },
    })),
    {
      x: opts.x ?? MARGIN_X,
      y: opts.y ?? HEADER_H + 0.2,
      w: opts.w ?? CONTENT_W,
      h: opts.h ?? 5.2,
      fontSize: opts.fontSize ?? cfg.fontSize,
      color: COLORS.dark,
      fontFace: FONT,
      wrap: true,
      valign: 'top',
      lineSpacing: cfg.lineSpacing,
    },
  )
}

function addTwoColumns(slide, leftTitle, leftItems, rightTitle, rightItems, startY = HEADER_H + 0.15) {
  const colW = 4.15
  const leftX = MARGIN_X
  const rightX = MARGIN_X + colW + 0.35
  const titleH = 0.4
  const listY = startY + titleH + 0.08
  const listH = 5.6 - (listY - HEADER_H)

  slide.addText(leftTitle, {
    x: leftX,
    y: startY,
    w: colW,
    h: titleH,
    fontSize: 16,
    bold: true,
    color: COLORS.primaryDark,
    fontFace: FONT,
    wrap: true,
  })
  addBullets(slide, leftItems, {
    x: leftX,
    y: listY,
    w: colW,
    h: listH,
    small: true,
  })

  slide.addText(rightTitle, {
    x: rightX,
    y: startY,
    w: colW,
    h: titleH,
    fontSize: 16,
    bold: true,
    color: COLORS.primaryDark,
    fontFace: FONT,
    wrap: true,
  })
  addBullets(slide, rightItems, {
    x: rightX,
    y: listY,
    w: colW,
    h: listH,
    small: true,
  })
}

function addStackTable(slide, rows, startY = HEADER_H + 0.2) {
  slide.addTable(rows, {
    x: MARGIN_X,
    y: startY,
    w: CONTENT_W,
    colW: [2.4, 6.4],
    rowH: 0.42,
    fontSize: 12,
    fontFace: FONT,
    border: { type: 'solid', color: 'E2E8F0', pt: 1 },
    fill: { color: COLORS.light },
    color: COLORS.dark,
    valign: 'middle',
    autoPage: false,
  })
}

const pres = new PptxGenJS()
pres.layout = 'LAYOUT_16x9'
pres.author = 'Event-Check'
pres.title = 'Event-Check — Apresentação Comercial'

// 1 — Capa
{
  const slide = pres.addSlide()
  slide.background = { color: COLORS.primaryDark }
  slide.addShape('rect', { x: 0, y: 4.85, w: '100%', h: 0.7, fill: { color: COLORS.accent } })
  slide.addText('Event-Check', {
    x: 0.7, y: 1.45, w: 8.6, h: 0.95,
    fontSize: 42, bold: true, color: COLORS.white, fontFace: FONT,
  })
  slide.addText('Plataforma completa para gestão de eventos, inscrições e check-in digital', {
    x: 0.7, y: 2.55, w: 8.6, h: 0.95,
    fontSize: 19, color: 'CCFBF1', fontFace: FONT, wrap: true, lineSpacing: 26,
  })
  slide.addText('Apresentação técnica e comercial', {
    x: 0.7, y: 3.65, w: 8.6, h: 0.35,
    fontSize: 14, color: '99F6E4', fontFace: FONT,
  })
  slide.addText('TypeScript · Next.js · NestJS · PostgreSQL', {
    x: 0.7, y: 4.0, w: 8.6, h: 0.35,
    fontSize: 13, color: '99F6E4', fontFace: FONT,
  })
}

// 2 — Agenda
{
  const slide = pres.addSlide()
  addHeader(slide, 'Agenda', 'O que você verá nesta apresentação')
  addBullets(slide, [
    'Desafios do cliente e proposta de valor',
    'Visão geral da solução Event-Check',
    'Arquitetura e stack tecnológico',
    'Funcionalidades para participantes e administradores',
    'Check-in por QR Code e comunicação automatizada',
    'Segurança, infraestrutura e benefícios entregues',
    'Demonstração em produção',
  ], { h: 4.9 })
}

// 3 — Problemas
{
  const slide = pres.addSlide()
  addHeader(slide, 'Desafios do cliente', 'Dores comuns na gestão de eventos presenciais')
  addBullets(slide, [
    'Controle manual de listas — erros e falta de visão em tempo real',
    'Filas na portaria com planilhas impressas',
    'Comunicação tardia em cancelamentos ou mudanças',
    'Overbooking em inscrições simultâneas',
    'Participante sem acesso fácil ao ingresso e QR code',
    'Ausência de painel com métricas de ocupação e presença',
  ], { small: true, h: 4.9 })
}

// 4 — Solução
{
  const slide = pres.addSlide()
  addHeader(slide, 'Nossa solução', 'Event-Check — do cadastro ao check-in')
  addParagraph(slide,
    'Plataforma web responsiva que integra organizadores e participantes: descoberta de eventos, inscrição segura, QR code por e-mail e validação na portaria.',
    { y: HEADER_H + 0.15, h: 0.85, fontSize: 14, lineSpacing: 22 },
  )
  addTwoColumns(
    slide,
    'Para o organizador',
    ['Criar eventos com mapa e capa', 'Dashboard de inscritos', 'Check-in por QR Code', 'Exportação CSV e e-mails'],
    'Para o participante',
    ['Descobrir eventos com filtros', 'Inscrição online', 'QR no app e no e-mail', 'Área Meus eventos'],
    HEADER_H + 1.05,
  )
}

// 5 — Arquitetura
{
  const slide = pres.addSlide()
  addHeader(slide, 'Arquitetura', 'Monorepo escalável na nuvem')
  addParagraph(slide, 'Frontend (Vercel)  →  API NestJS (Vercel)  →  PostgreSQL (Supabase)', {
    y: HEADER_H + 0.12, h: 0.45, fontSize: 14, color: COLORS.accent,
  })
  addTwoColumns(
    slide,
    'Camadas',
    ['frontend/ — Next.js 14', 'backend/ — NestJS', 'controller → service → repository', 'Prisma ORM + migrations'],
    'Integrações',
    ['Brevo — e-mails', 'OpenStreetMap — mapas', 'GitHub Actions — CI', 'Deploy via Git → Vercel'],
    HEADER_H + 0.65,
  )
}

// 6 — Stack
{
  const slide = pres.addSlide()
  addHeader(slide, 'Stack tecnológico', 'Visão geral')
  addStackTable(slide, [
    [
      { text: 'Camada', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
      { text: 'Tecnologias', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
    ],
    ['Linguagem', 'TypeScript (frontend e backend)'],
    ['Frontend', 'Next.js 14, React 18, Tailwind, Zod'],
    ['Backend', 'NestJS 10, Express, class-validator'],
    ['Banco', 'PostgreSQL + Prisma 7'],
    ['Auth', 'JWT + cookie httpOnly + bcrypt'],
    ['E-mail', 'Brevo (verificação, reset, QR)'],
    ['Hospedagem', 'Vercel + Supabase'],
  ])
}

// 7 — Frontend
{
  const slide = pres.addSlide()
  addHeader(slide, 'Frontend', 'Experiência moderna e responsiva')
  addBullets(slide, [
    'Next.js 14 — rotas auth, usuário e admin',
    'UserShell + AdminShell — sidebar responsiva',
    'React Hook Form + Zod — validação de formulários',
    'Tailwind CSS — mobile-first e acessível',
    'Leaflet + OpenStreetMap — mapas dos eventos',
    'html5-qrcode — leitor de QR na câmera',
    'Recharts — gráficos no dashboard admin',
    'ESLint + GitHub Actions — qualidade de código',
  ], { small: true, h: 4.9 })
}

// 8 — Backend
{
  const slide = pres.addSlide()
  addHeader(slide, 'Backend e dados', 'API REST segura')
  addBullets(slide, [
    'NestJS modular: auth, events, enrollments, geocoding',
    'PostgreSQL — User, Event, Enrollment',
    'Inscrição atômica — evita estouro de vagas',
    'Exclusão em cascata — remove inscrições + evento',
    'Token JWT no QR code — anti-fraude',
    'Check-in idempotente com horário registrado',
    'Geocodificação Nominatim — sem custo de API',
    'Migrations Prisma versionadas',
  ], { small: true, h: 4.9 })
}

// 9 — Segurança
{
  const slide = pres.addSlide()
  addHeader(slide, 'Segurança', 'Proteção em todas as camadas')
  addTwoColumns(
    slide,
    'Autenticação',
    ['Senhas com bcrypt', 'Papéis USER e ADMIN', 'Verificação de e-mail', 'Guards síncronos no layout'],
    'Boas práticas',
    ['Secrets fora do Git (.env)', 'CORS restrito', 'Cookies httpOnly', 'ESLint no CI (bloqueia PR)'],
  )
}

// 10 — Participante
{
  const slide = pres.addSlide()
  addHeader(slide, 'Funcionalidades — Participante', 'Jornada do usuário')
  addBullets(slide, [
    'Cadastro com confirmação de e-mail',
    'Descobrir eventos — busca e filtros',
    'Detalhes com mapa e vagas restantes',
    'Inscrição única por evento',
    'E-mail com QR code (PNG anexo)',
    'Dashboard Meus eventos com QR mobile',
    'Perfil editável com avatar',
  ], { small: true, h: 4.9 })
}

// 11 — Admin (parte 1)
{
  const slide = pres.addSlide()
  addHeader(slide, 'Funcionalidades — Admin (1/2)', 'Gestão de eventos')
  addBullets(slide, [
    'CRUD completo — capa, mapa, capacidade',
    'Validação de data e capacidade mínima',
    'Dashboard por evento em tempo real',
    'Gráficos de ocupação e check-in',
  ], { h: 4.5 })
}

// 12 — Admin (parte 2)
{
  const slide = pres.addSlide()
  addHeader(slide, 'Funcionalidades — Admin (2/2)', 'Operação e comunicação')
  addBullets(slide, [
    'Busca de inscritos e exportação CSV',
    'Cancelamento com e-mail aos inscritos (Brevo)',
    'Exclusão com remoção em cascata de inscrições',
    'Gestão de usuários e histórico',
    'Leitor QR mobile na portaria',
  ], { h: 4.5 })
}

// 13 — QR
{
  const slide = pres.addSlide()
  addHeader(slide, 'Check-in por QR Code', 'Portaria rápida e confiável')
  addParagraph(slide, 'Fluxo resumido:', {
    y: HEADER_H + 0.12, h: 0.35, fontSize: 15, color: COLORS.primaryDark,
  })
  addParagraph(slide,
    'Inscrição → Token seguro → QR no e-mail e no app → Admin escaneia → API valida → Presença registrada',
    { y: HEADER_H + 0.48, h: 0.75, fontSize: 13, lineSpacing: 20 },
  )
  addBullets(slide, [
    'Câmera, upload de imagem ou digitação manual',
    'Rejeita QR inválido ou de outro evento',
    'Check-in duplo informa data/hora anterior',
    'Dashboard atualizado na hora',
  ], { y: HEADER_H + 1.35, small: true, h: 3.8 })
}

// 14 — E-mail
{
  const slide = pres.addSlide()
  addHeader(slide, 'Comunicação automatizada', 'E-mails via Brevo')
  addTwoColumns(
    slide,
    'Quando envia',
    ['Verificação de conta', 'Recuperação de senha', 'Confirmação + QR', 'Cancelamento de evento'],
    'Benefício',
    ['Menos ligações ao suporte', 'Comunicação profissional', 'QR como anexo PNG', 'Links para o sistema'],
  )
}

// 15 — Benefícios
{
  const slide = pres.addSlide()
  addHeader(slide, 'Benefícios entregues', 'Problema → Solução')
  addStackTable(slide, [
    [
      { text: 'Problema', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
      { text: 'Solução Event-Check', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
    ],
    ['Listas manuais', 'Dashboard digital + CSV'],
    ['Filas na portaria', 'Check-in QR em segundos'],
    ['Overbooking', 'Inscrição atômica'],
    ['Falta de comunicação', 'E-mails automáticos'],
    ['Baixa visibilidade', 'Gráficos de presença'],
    ['Processos lentos', '100% web e mobile'],
  ])
}

// 16 — Produção
{
  const slide = pres.addSlide()
  addHeader(slide, 'Sistema em produção', 'Demonstração ao vivo')
  addParagraph(slide, 'Frontend:', {
    y: HEADER_H + 0.2, h: 0.3, fontSize: 13, color: COLORS.primaryDark,
  })
  slide.addText('https://event-check-seven.vercel.app', {
    x: MARGIN_X, y: HEADER_H + 0.52, w: CONTENT_W, h: 0.35,
    fontSize: 15, color: COLORS.accent, fontFace: FONT, wrap: true,
    hyperlink: { url: 'https://event-check-seven.vercel.app' },
  })
  addParagraph(slide, 'Backend API:', {
    y: HEADER_H + 1.05, h: 0.3, fontSize: 13, color: COLORS.primaryDark,
  })
  slide.addText('https://event-check-backend.vercel.app/api', {
    x: MARGIN_X, y: HEADER_H + 1.37, w: CONTENT_W, h: 0.35,
    fontSize: 15, color: COLORS.accent, fontFace: FONT, wrap: true,
    hyperlink: { url: 'https://event-check-backend.vercel.app/api/events' },
  })
  addBullets(slide, [
    'Deploy automático a cada push (Git → Vercel)',
    'CI com ESLint — falha bloqueia o pull request',
    'PostgreSQL gerenciado (Supabase)',
    'E-mail transacional Brevo em produção',
  ], { y: HEADER_H + 1.95, small: true, h: 3.2 })
}

// 17 — Encerramento
{
  const slide = pres.addSlide()
  slide.background = { color: COLORS.primaryDark }
  slide.addText('Obrigado!', {
    x: 0.7, y: 2.0, w: 8.6, h: 0.85,
    fontSize: 38, bold: true, color: COLORS.white, fontFace: FONT, align: 'center',
  })
  slide.addText('Event-Check — Gestão inteligente de eventos', {
    x: 0.7, y: 2.95, w: 8.6, h: 0.55,
    fontSize: 18, color: 'CCFBF1', fontFace: FONT, align: 'center', wrap: true,
  })
  slide.addText('Dúvidas? Vamos agendar uma demonstração ao vivo.', {
    x: 0.7, y: 3.65, w: 8.6, h: 0.5,
    fontSize: 15, color: '99F6E4', fontFace: FONT, align: 'center', wrap: true,
  })
}

await pres.writeFile({ fileName: outputPath })
console.log(`Apresentação gerada: ${outputPath}`)

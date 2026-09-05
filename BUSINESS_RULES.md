# Regras de Negócio — Event Check

## Eventos (Admin)

### Criação
- A data do evento **não pode ser no passado**.
- Capacidade mínima: **1 vaga**.
- Novos eventos iniciam com status `active` e `currentEnrollments = 0`.
- Formulário com capa (imagem), mapa (Leaflet) e botão **Cancelar** que volta para a lista.

### Edição
- Eventos **cancelados** ou **finalizados** não podem ser editados.
- A data não pode ser alterada para uma data passada.
- A capacidade **não pode ser menor** que o número atual de inscritos.

### Cancelamento vs Exclusão

| Situação | Ação permitida | Comportamento |
|----------|----------------|---------------|
| Evento com inscritos | **Cancelar** | Status vira `cancelled`. Inscrições permanecem. Inscritos recebem e-mail de cancelamento (Brevo). Novas inscrições bloqueadas. |
| Evento com inscritos | **Excluir** | **Permitido** — remove todas as inscrições do evento e depois exclui o evento permanentemente. |
| Evento sem inscritos | **Excluir** | Exclusão permanente do evento. |

**Fluxo recomendado para comunicar participantes:** cancelar o evento (notifica por e-mail) → aguardar → excluir quando não precisar mais do histórico.

### Check-in
- QR code contém token JWT da inscrição.
- Check-in é **idempotente** — segunda leitura informa data/hora anterior.
- Scanner admin: câmera, upload de imagem ou digitação manual.

### Inscrições
- Usuário não pode se inscrever em eventos passados, cancelados ou finalizados.
- Vagas são reservadas atomicamente (proteção contra corrida de concorrência).
- Ao confirmar inscrição, o usuário recebe **e-mail com QR code** de check-in (PNG anexo).
- Ao **cancelar a inscrição** (usuário ou admin), o participante recebe e-mail de confirmação do cancelamento.

## Usuários

### Registro
- E-mail deve ser único.
- O **primeiro usuário** do sistema torna-se admin e tem e-mail verificado automaticamente.
- Demais usuários recebem **e-mail com token de verificação** (validade: 24 h).
- Login bloqueado até confirmar o e-mail.

### Provedores de e-mail
Configure no `.env` do backend:
- `EMAIL_PROVIDER=brevo` (padrão) + `BREVO_API_KEY`
- `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`
- `EMAIL_PROVIDER=mandrill` + `MANDRILL_API_KEY` (Mailchimp Transactional)
- Dev sem provedor: `EMAIL_DEV_CONSOLE=true` — links no terminal

## Listagem pública (User)
- Exibe apenas eventos **ativos** com data **≥ hoje**.
- Ordenação: data mais próxima primeiro.
- Filtros: busca textual, categoria, intervalo de datas.

## Autenticação e rotas
- Guards no frontend: `AdminProtection` e `UserProtection` (layouts `(admin)` e `(user)`).
- Admin não acessa `/dashboard`; user não acessa `/admin/*`.
- Sessão: JWT + cookie httpOnly + `localStorage` (`currentUser`, `authToken`).

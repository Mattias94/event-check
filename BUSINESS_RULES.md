# Regras de Negócio — Event Check

## Eventos (Admin)

### Criação
- A data do evento **não pode ser no passado**.
- Capacidade mínima: **1 vaga**.
- Novos eventos iniciam com status `active` e `currentEnrollments = 0`.

### Edição
- Eventos **cancelados** ou **finalizados** não podem ser editados.
- A data não pode ser alterada para uma data passada.
- A capacidade **não pode ser menor** que o número atual de inscritos.

### Cancelamento vs Exclusão

| Situação | Ação permitida | Comportamento |
|----------|----------------|---------------|
| Evento com inscritos | **Cancelar** | Status vira `cancelled`. Inscrições permanecem. Inscritos recebem e-mail de cancelamento. Novas inscrições são bloqueadas. |
| Evento com inscritos | **Excluir** | **Bloqueado** — não é possível excluir enquanto houver inscritos. |
| Evento sem inscritos | **Excluir** | Exclusão permanente do evento e registros de inscrição associados. |

**Fluxo recomendado:** cancelar o evento → aguardar/cancelar inscrições individualmente → excluir quando `currentEnrollments = 0`.

### Inscrições
- Usuário não pode se inscrever em eventos passados, cancelados ou finalizados.
- Vagas são reservadas atomicamente (proteção contra corrida de concorrência).
- Ao confirmar inscrição, o usuário recebe **e-mail com QR code** de check-in.

## Usuários

### Registro
- E-mail deve ser único.
- O **primeiro usuário** do sistema torna-se admin e tem e-mail verificado automaticamente.
- Demais usuários recebem **e-mail com token de verificação** (validade: 24 h).
- Login bloqueado até confirmar o e-mail.

### Provedores de e-mail
Configure no `.env` do backend:
- `EMAIL_PROVIDER=resend` (padrão) + `RESEND_API_KEY`
- `EMAIL_PROVIDER=mandrill` + `MANDRILL_API_KEY` (Mailchimp Transactional)

## Listagem pública (User)
- Exibe apenas eventos **ativos** com data **≥ hoje**.
- Ordenação: data mais próxima primeiro.
- Filtros: busca textual, categoria, intervalo de datas.

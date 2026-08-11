# Event-check backend

NestJS API with layered architecture:

- `controller` handles HTTP
- `service` holds business rules
- `repository` manages persistence (currently in-memory)

## Run

```bash
npm install
npm run start:dev
```

API prefix: `/api`

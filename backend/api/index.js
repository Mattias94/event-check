// Entrada das funções serverless da Vercel.
// Arquivo .js de propósito: o esbuild da Vercel não emite decorator metadata
// (exigido pelo NestJS), então o TypeScript é compilado pelo tsc no build
// (npm run build) e aqui apenas delegamos para o resultado em dist/.
module.exports = require('../dist/serverless').default

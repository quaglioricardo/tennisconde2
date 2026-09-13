# Tennis Conde 2 — Ranking

Ranking de tênis **todos contra todos** para a competição local: cada jogador enfrenta todos os outros uma vez, ~3 jogos por mês, com pontuação em que **derrota ainda pontua e WO pontua menos que derrota**.

Vocabulário do domínio: [`CONTEXT.md`](./CONTEXT.md). Decisões de arquitetura: [`docs/adr/`](./docs/adr).

## Rodando

Pré-requisito: Docker.

```bash
make up        # sobe Postgres + app em http://localhost:3000
make logs      # logs do app
make down      # para (mantém o banco)
make reset     # para e apaga o banco
```

Os 20 jogadores do clube são criados automaticamente na primeira subida. O usuário é o próprio nome, sem acentos (`taka`, `caue`…), e a senha é derivada dele. Para gerar a lista de acessos e distribuir individualmente:

```bash
make credentials   # escreve credentials.txt (ignorado pelo git)
```

Admins: `thales` e `ricardo` (lista em `ADMIN_USERNAMES`). Todo mundo pode trocar a senha no menu do avatar. Demais variáveis em [`.env.example`](./.env.example).

Desenvolvimento com hot reload (Postgres no Docker, API em :4000 e Vite em :3000 no host):

```bash
make dev
make credentials  # gera credentials.txt
make test      # vitest: domínio (sorteio, pontuação, placar) + smoke da UI
make lint      # typecheck web + server
```

### Banco externo (Supabase)

As migrações rodam automaticamente na subida do app. Para apontar para um Postgres já provisionado (ex.: Supabase), defina `DATABASE_URL` no `.env`:

```bash
DATABASE_URL=postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=server/certs/supabase-prod-ca-2021.crt
```

Use o **session pooler** (porta 5432; a conexão direta é só IPv6). O certificado raiz da Supabase está em `server/certs/` — com ele o TLS é verificado por completo (sem ele, `pg` falha com `SELF_SIGNED_CERT_IN_CHAIN`). O caminho é relativo ao diretório de onde o processo roda.

Para aplicar as migrações sem subir o app (ex.: passo de deploy):

```bash
npm run db:migrate
```

## Como funciona

**Papéis.** `admin` (os usuários em `ADMIN_USERNAMES`) e `player` (todo mundo que se cadastra). Não existe tela de gestão de papéis de propósito.

**Ciclo de um ranking.**
1. Admin cria um **rascunho**: nome, mês inicial, jogos por mês (padrão 3), pontuação em escala ATP (padrão vitória 300 / derrota 100 / WO −100) e participantes.
2. Admin **sorteia**: os participantes são embaralhados e todos os jogos são gerados (round-robin), agrupados em meses. O jogador da esquerda de cada jogo (🎾) leva as bolas. A partir daí **nada pode ser alterado** — só apagar o ranking inteiro (útil para testar).
3. Jogadores **reportam** o resultado dos próprios jogos (melhor de 3 sets com super tie-break no lugar do terceiro, ou WO de um dos dois); o oponente **confirma** ou **rejeita**. Só depois de confirmado os pontos contam. Admins definem qualquer resultado diretamente, inclusive sobrescrevendo um confirmado.
4. No fim de cada mês (fuso São Paulo) todo jogo daquele mês sem resultado confirmado vira **WO duplo** automaticamente (os dois recebem os pontos de WO). Pode-se jogar adiantado (um ranking que começa em outubro pode ter jogos disputados em setembro), mas não atrasado — só um admin conserta depois.

**Classificação.** Calculada a partir dos jogos confirmados a cada leitura. Desempate: pontos → vitórias → menos WOs → confronto direto → saldo de sets → saldo de games.

**Notificações.** Só dentro do app (sino no topo): ranking sorteado, resultado reportado / confirmado / rejeitado, resultado definido pela admin, WO duplo. Abrir o sino marca tudo como lido; clicar numa notificação leva ao jogo.

## Estrutura

```
server/src/          API Express + TypeScript (rodada com tsx)
  migrations/        SQL aplicado na subida (ou via npm run db:migrate)
  certs/             CA raiz da Supabase (para sslmode=verify-full)
  domain/            sorteio, placar, classificação (puro, testado)
  services/          rankings, jogos, notificações, varredura de WO
  routes/            HTTP + validação (zod) + RBAC
shared/types.ts      tipos compartilhados API ↔ SPA
src/                 SPA React (Vite + Tailwind)
src/legacy/          protótipo original, não montado (ver ADR 0001)
scripts/migrate.ts   aplica migrações pendentes e sai
```

### API (resumo)

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/logout` · `/password` | público / logado |
| GET | `/api/users` | logado |
| GET | `/api/rankings` · `/api/rankings/:id` | logado |
| POST/PUT/DELETE | `/api/rankings` · `/api/rankings/:id` · `/api/rankings/:id/draw` | admin |
| POST | `/api/matches/:id/report` · `/confirm` · `/reject` · DELETE `/report` | jogador do jogo |
| PUT | `/api/matches/:id/result` | admin |
| GET/POST | `/api/notifications` · `/api/notifications/read` | logado |
| GET | `/api/me/pending` | logado |

---
status: accepted
---
# Backend próprio com Postgres e migrações SQL

O repositório era um protótipo apenas de front-end (Vite/React) com dados fictícios em `localStorage`, sem banco, sem API e sem login. O ranking exige identidade real (quem reportou, quem confirmou) e regras aplicadas fora do navegador, então adicionamos um backend Node 22 + Express + TypeScript (Express e tsx já eram dependências) com Postgres 16, migrações SQL escritas à mão (`server/src/migrations`) e sem ORM. Um ORM não compensa para meia dúzia de tabelas e adiciona pontos de falha no build Docker.

## Consequências

- O protótipo antigo (torneios, quadras, chat, placar ao vivo, troca de usuário) foi movido intacto para `src/legacy/` e não é montado. Ele não pode coexistir com login real (usava um seletor "trocar usuário"). Fica lá como referência para portar funcionalidades para a API.
- `node_modules/` e `dist/` deixaram de ser versionados.

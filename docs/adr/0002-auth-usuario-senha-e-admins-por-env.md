---
status: accepted
---
# Login por nome de usuário e senha; admins definidos por variável de ambiente

Sem e-mail transacional (decisão do produto: nenhuma notificação por e-mail) não há magic link, e OAuth exigiria credenciais que ninguém provisionou. Também não há por que pedir e-mail: nunca seria usado. Ficamos com **nome de usuário** (`^[a-z0-9._-]{2,30}$`, sem acentos) + senha (bcrypt) e sessão em JWT dentro de cookie httpOnly.

Os 20 jogadores do clube são semeados na subida com usuário igual ao nome (`taka`, `caue`…) e senha derivada dele (8 hex de sha256), regenerável com `make credentials`. Cadastro continua aberto: qualquer pessoa vira `player`. O papel `admin` é atribuído exclusivamente aos usuários em `ADMIN_USERNAMES` (hoje `thales` e `ricardo`), aplicado na subida e no cadastro. Não existe tela de gestão de papéis de propósito: o produto pediu exatamente dois admins.

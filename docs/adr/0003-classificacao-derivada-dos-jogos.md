---
status: accepted
---
# A Classificação é calculada, nunca armazenada

O protótipo guardava `points` em cada jogador e somava a cada partida. Aqui a Classificação é derivada dos Jogos Confirmados a cada leitura: pontos, vitórias, WOs, saldo de sets e de games. Isso torna triviais os casos que o produto exige — admin sobrescrevendo um resultado, WO duplo aplicado pelo sistema, ranking apagado para testes — sem lógica de estorno. O custo (recalcular n(n-1)/2 jogos por leitura) é irrelevante para um ranking de clube.

## Desempate

Pontos → vitórias → menos WOs → confronto direto → saldo de sets → saldo de games → nome.

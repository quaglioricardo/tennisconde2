---
status: accepted
---
# Sorteio imutável, agrupado em Meses, com WO duplo automático

No Sorteio os Participantes são embaralhados e os Jogos gerados pelo método do círculo (round-robin): n-1 Rodadas (n Rodadas com folga se n for ímpar), agrupadas em Meses de `matches_per_month` Rodadas (padrão 3). Cada Jogo nasce com o Mês em que deve acontecer e com o Responsável pelas bolas (o jogador da esquerda; o sorteio alterna os lados para distribuir a carga). Depois do Sorteio nada muda — nem participantes nem jogos — porque qualquer alteração invalidaria os Jogos já Confirmados; a única saída é apagar o Ranking inteiro, o que os admins usam para testar.

Jogadores podem Reportar desde o Sorteio até o fim do Mês do Jogo (fuso America/Sao_Paulo) — jogar adiantado é permitido. Um varredor no servidor (na subida e a cada 10 min) converte em WO Duplo todo Jogo não Confirmado de um Mês já encerrado e notifica os dois. Só admins mexem depois disso.

## Alternativa rejeitada

Calcular o WO "na leitura" (sem materializar) evitaria o job, mas não permitiria notificar os jogadores nem registrar quando o WO foi aplicado.

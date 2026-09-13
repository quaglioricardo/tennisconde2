# Tennis Conde 2 — Ranking

Ranking de tênis por pontos corridos para uma competição local: todos jogam contra todos, uma vez, ao longo de meses.

## Language

### Pessoas

**Usuário** (User):
Uma conta autenticada por nome de usuário e senha. Tem exatamente um papel: `admin` ou `player`.
_Avoid_: e-mail, login (como substantivo)
_Avoid_: jogador cadastrado, conta, atleta

**Admin**:
Usuário com poder total: cria, sorteia e apaga rankings e define qualquer resultado.
_Avoid_: organizador, gestor, diretoria

**Jogador** (Player):
Usuário sem poderes administrativos. Só age nos próprios jogos.
_Avoid_: tenista, atleta, participante (este último tem outro sentido, abaixo)

**Participante** (Participant):
Um Usuário inscrito em um Ranking específico. Admins também podem ser Participantes.

### Ranking

**Ranking**:
Uma competição de todos contra todos entre um conjunto fixo de Participantes, distribuída em Meses. Tem uma Pontuação própria.
_Avoid_: torneio, campeonato, ladder, barragem, circuito

**Rascunho** (Draft):
Estado do Ranking antes do Sorteio: nome, mês inicial, Pontuação e Participantes ainda podem mudar.

**Sorteio** (Draw):
O ato, irreversível, que gera todos os Jogos de um Ranking em ordem aleatória. Depois do Sorteio o Ranking é imutável — só pode ser apagado.
_Avoid_: gerar chave, iniciar, publicar

**Sorteado** (Drawn):
Estado do Ranking após o Sorteio.

**Rodada** (Round):
Um conjunto de Jogos em que cada Participante joga no máximo uma vez. Com número ímpar de Participantes, um deles folga (Bye) na Rodada.

**Mês** (Month):
Janela de calendário (fuso America/Sao_Paulo) que agrupa Rodadas consecutivas — por padrão 3 por Mês. Todo Jogo pertence a exatamente um Mês.

**Classificação** (Standings):
A tabela ordenada de Participantes com seus pontos, calculada a partir dos Jogos. Nunca é armazenada.
_Avoid_: ranking (já é o nome da competição), tabela de pontos

**Pontuação** (Points scheme):
Os pontos por Vitória, Derrota e WO de um Ranking, em escala ATP. Padrão 300 / 100 / -100. Congelada no Sorteio.

### Jogo

**Jogo** (Match):
O confronto entre dois Participantes de um Ranking, dentro de um Mês. Estados: Pendente, Reportado, Confirmado. Pode ser disputado antes do seu Mês, nunca depois.
_Avoid_: partida, confronto, duelo

**Responsável pelas bolas** (Ball provider):
O Participante listado à esquerda de um Jogo (🎾). Definido no Sorteio, alternando entre os jogadores para equilibrar.
_Avoid_: mandante, anfitrião

**Reportar** (Report):
Um dos dois Participantes informa o Resultado do Jogo. O Jogo passa a Reportado e aguarda o oponente.
_Avoid_: lançar placar, registrar

**Confirmar** (Confirm):
O oponente aceita o Resultado Reportado. O Jogo passa a Confirmado e passa a contar na Classificação.

**Rejeitar** (Reject):
O oponente recusa o Resultado Reportado. O Jogo volta a Pendente.
_Avoid_: contestar, disputar

**Resultado** (Result):
Como o Jogo terminou: Jogado (com placar em sets) ou WO. Um Resultado definido por um Admin é Confirmado na hora e pode substituir qualquer Resultado anterior.

**Placar** (Score):
Resultado de um Jogo Jogado em melhor de 3: dois sets, ou dois sets divididos decididos por um Super Tie-break.

**Super Tie-break** (Match tie-break):
Tie-break de 10 pontos que substitui o terceiro set quando os dois primeiros ficam 1 a 1. Registrado como o terceiro set do Placar.
_Avoid_: terceiro set, match tie-break

**WO** (Walkover):
Resultado em que um Participante não jogou. Quem deu WO recebe os pontos de WO; o outro recebe os de Vitória.
_Avoid_: W.O., desistência, ausência

**WO Duplo** (Double walkover):
WO dos dois Participantes. Aplicado automaticamente pelo sistema quando o Mês do Jogo termina sem Resultado Confirmado, ou definido por um Admin.

**Vitória / Derrota** (Win / Loss):
Desfecho de um Jogo Jogado para cada Participante. Uma Derrota ainda pontua; um WO pontua menos que uma Derrota.

### Notificação

**Notificação** (Notification):
Aviso dentro do app para um Usuário sobre um evento de Ranking ou Jogo. Fica Lida quando o Usuário abre o sino.
_Avoid_: alerta, e-mail, push

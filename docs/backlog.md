# Backlog VettiConfig

Itens registrados durante o desenvolvimento que ficam para um próximo ciclo. Documento interno (vive em `docs/`, fora do git).

---

## Documentação

### Refazer o README explicando o funcionamento tela a tela

O README atual fala da arquitetura, da estrutura de diretórios e dos protocolos, mas **não explica o uso final** — o que cada botão faz, o fluxo do usuário ao clicar em "Gravar", "Salvar", "Importar JSON", etc.

Adicionar uma seção do tipo "Manual do usuário" com:

- Para cada tela (Status, Sistema, Partição, Zona compartilhada, Configurações):
  - O que ela faz no fluxo de uso.
  - Cada aba/card detalhado.
  - Cada botão e o resultado esperado (ex.: "Gravar novo dispositivo → entra em modo de cadastro RF por N segundos; aperte o pareamento do sensor → o app detecta automaticamente e atualiza a lista").
- Diferenças entre conexão local e remota.
- Como interpretar o logger e os toasts.

Item nasceu da percepção de que recursos como "polling pós-CMD 8 com atualização automática" só são entendidos por quem leu o código; o usuário final não sabe que isso acontece.

---

## Estratégia de versões — modelo de central + firmware (registrado 2026-05-19)

**Contexto**: o VettiConfig hoje suporta múltiplas versões de modelo/firmware. Há centenas de pontos no código que olham `_vcCentralMod` / `_vcCentralVer` pra decidir comportamento (ex.: aba Usuários só funciona em `mod==5&&ver>=550`, aba Agendamento em `mod==6&&ver>=605`, etc.).

**Direcionamento futuro**: o produto novo é **somente** o modelo **SmartAlarm-M4**. O VettiConfig:

1. Deve **rejeitar conexão** com SmartAlarm32 (não listar como disponível na descoberta UDP nem permitir conexão remota).
2. Não precisa manter compatibilidade com firmwares legados — todo gate `if (mod==5 && ver>=NNN)` vira código morto.
3. **A versão de firmware do M4 começa em 1** (reset do contador), então as comparações `ver >= 550 / 605 / 661` ficam obsoletas.

**O que precisa ser feito quando atacar isso:**

- Mapear todo gate de compatibilidade no código:
  - `grep -n "_vcCentralMod\|_vcCentralVer" src/renderer/js/vetticonfig.js` — varrer cada ocorrência.
  - Lista atual de gates documentados:
    - Aba Usuários: `_vcUserApplyCompat` (mod==5&&ver>=550 ou mod==6&&ver>=650 ou mod>=7) — `vetticonfig.js:_vcUserLoad`
    - Aba Agendamento: `_vcAgendaApplyCompat` (hasAgenda mod 5/516, mod 6/605, mod>=7; hasMsgTesteCid 5/561, 6/661, mod>=7) — `vetticonfig.js:_vcAgendaLoad`
    - Dispositivos Tier 2 (não implementado, mas mapeado em `comandos-que-faltam.md:7.6`): `DevCfgLr` v5≥514+dev≥703, `DevCfgPlrExt` devVer≥800, `DevCfgTxLr` v707/v709, `DevStat` v5.54/v6.54, `DevCfgAutom` v5.53/v6.53.
  - Comandos com gate por versão: `LOGX STAT` (firmware ≥ x54) vs `LOG <N>` legacy.
- Filtro de descoberta UDP: na resposta `[R001 ...]`, detectar o modelo da central e ignorar SmartAlarm32 (mod 4 ou anterior).
- Filtro de conexão remota: ao receber `INFO` após autenticar, se o modelo for SmartAlarm32, encerrar a sessão com mensagem clara.
- Remover toda lógica condicional de versão — manter só o caminho M4.
- Definir um número mínimo de firmware do M4 que vamos suportar (ex.: `ver >= 1`) e adicionar gate único de "firmware suportado" em vez de espalhar pelo código.
- Atualizar `comandos-que-faltam.md` removendo as menções a V1-V4 e centrais antigas. Várias seções (§6.6, §7.6, §8.6, §10) têm itens "skip V1-V4" que podem virar bugs corrigidos depois desse cleanup.

**Quando fazer**: não atacar agora. Esperar definição do firmware M4 estável + comunicação clara com a equipe de produto antes de remover gates.

---

## Investigar perda de conexão remota após uso prolongado (2026-05-20)

**Sintoma observado**: durante teste da aba Partição na sessão remota (`receptora.segalla.eng.br:8003`), a conexão TCP cai depois de algum tempo de uso. Usuário relatou: "perdemos a conexão remota após algum tempo".

**Logs do momento da queda** (não capturados ainda — incidental):
- Sessão remota TCP funcionando normalmente
- Após N minutos / N comandos, próximo `sendCommand` dá timeout silencioso
- App não reage (não tenta reconectar, não mostra erro)

**Investigar:**

1. **Keep-alive** (`_vcStartKeepAlive` em `vetticonfig.js`): qual a frequência? Faz `STAT 4` / `CMD 7` a cada X segundos. Se a sessão TCP cai entre dois keep-alives, próximo comando do usuário só descobre quando timeout.

2. **TCP socket no main** (`src/main/services/network.js` em `authenticateRemote` / `sendCommand` TCP): há detecção de `socket.on('close')` ou `socket.on('error')`? Se sim, emite evento pro renderer? Onde o renderer trata?

3. **Servidor de monitoramento** (`receptora.segalla.eng.br:8003`): tem timeout idle? Provável que sim — derruba TCP após N minutos sem dados, mesmo com keep-alive na aplicação.

4. **Reconexão automática**: implementar — se socket cair, app re-autentica com mesmo MAC/senha/host/porta e refaz STAT pra continuar a sessão sem o usuário perceber. Java provavelmente faz isso (procurar em `TcpCom.java` / `Comm.java:reconnect`).

5. **Indicador visual de "reconectando"**: toast persistente "Conexão caiu — tentando reconectar…" enquanto retenta, e "Reconectado." em sucesso.

**Quando fazer**: depois do roadmap atual de telas. Capturar logs no momento da queda ajuda muito — reproduzir deixando a tela aberta por 10-15 min sem interação.

---

## Perguntas pendentes do trabalho do dia (registradas conforme aparecem)

Ver `docs/perguntas-pendentes.md` quando estiver presente.

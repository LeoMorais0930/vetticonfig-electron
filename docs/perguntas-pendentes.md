# Perguntas pendentes — sessão 2026-05-19

Lista de bloqueios que encontrei trabalhando offline. Cada item indica
o módulo, o que estava sendo feito e a pergunta. Quando o usuário voltar,
apresento tudo de uma vez.

---

## ~~1. Partição → Dispositivos — campos extras do form de edição~~ ✅ RESOLVIDO (2026-05-20)

Confirmado pelo usuário: os campos extras (Status row, Funções da zona por partição, Grupo de zonas pareadas, Monitoramento do tamper) **são recursos do firmware novo M4** — não existem no firmware atual nem no Kotlin v3. UI foi restaurada visualmente conforme o Figma, com **todos os controles desabilitados** + banner amarelo "aguardando firmware novo". Implementação real fica pendente até a documentação do M4 chegar. Ver §11.5 de `comandos-que-faltam.md`.

Botão "Editar atributos completos" mantido — leva pra Sistema → Dispositivos com pré-seleção via `?disp=N`.

---

## 2. Aba Buffer — capacidade do log

**Módulo**: Tela Sistema → aba Buffer.

Auditoria contra `CtrlLog.kt` (Kotlin v3) indicou capacidade real de **1024 registros** (`CtrlLog.kt:119, 376`). Nosso HTML hoje mostra "2048" hardcoded (`sistema.html:1257`).

Vou usar **1024** na re-implementação. Confirmar se está certo ou se o M4 novo terá outro limite (e atualizar o ponto na sequência).

---

## 3. Aba Buffer — suporte a firmware antigo (LOG legacy)

**Módulo**: Tela Sistema → aba Buffer.

Firmware **< V5.54** usa comando `LOG <N>` que viola o protocolo padrão — devolve resposta SEM o envelope `[R<seq> ...]`, apenas 33 bytes ASCII puros (ex.: `[1629763323 0005 1627 0000 00 01]`). Nosso `network.sendCommand` correlaciona resposta por `[R<seq>]` — então pra LOG legacy daria timeout.

**Java implementa** um flag `flagLegacyCmdLog` que muda o pipeline pra aceitar resposta sem envelope.

**Pergunta**: vamos suportar firmware legacy? Como confirmamos no backlog que o produto novo é **só M4 com firmware reiniciado em 1**, posso assumir que **não precisamos** dar suporte e tratar essas centrais antigas com mensagem "atualize o firmware". Confirmar.

Por enquanto: implementação só com `LOGX *` (V5.54+). Logs em centrais antigas mostram toast "firmware não suporta".

---

## 4. Aba Buffer — critérios do filtro

**Módulo**: Tela Sistema → aba Buffer, botão de filtro (`vcBufferBtnFiltro`).

Hoje o botão é decorativo (sem handler). Sugestões de critérios pra implementar:

1. **Por tipo/severidade** (combo): Todos / Disparos (vermelho) / Falhas (amarelo) / Armagem (ciano) / Sistema (cinza).
2. **Por partição** (combo P1..P6 ou Todas).
3. **Por zona/usuário** (input numérico).
4. **Por intervalo de data** (date pickers de/até).
5. **Texto livre** que casa com descrição.

Aplicação: in-memory sobre o array de registros já carregados. Export PDF/CSV usa a lista filtrada.

**Pergunta**: quais desses critérios você quer no MVP? Posso fazer só 1 (severidade), os 5, ou um meio termo (severidade + texto livre). Por enquanto deixo o botão sem handler e desabilitado.

---

## 5. Buffer i18n — reaproveitar ou novo namespace

**Módulo**: Buffer.

Java tem 40+ descrições de evento (`panico_audivel`, `coacao`, `usuario_arme`, etc.) em `strings_pt_BR.properties`. Algumas chaves se chocam com namespaces existentes:

- Java tem `usuario_arme` / `usuario_desarme` — temos `usuario.arme` / `usuario.desarme` no `pt-BR.json:546-547` (mas pra outra UI).
- Java tem `atualizacao_de_firmware_*` — não temos.

**Sugestão**: criar namespace `buffer.eventos.<hex4>` (ex.: `buffer.eventos.0120` = "pânico audível (sirene)") pra evitar colisão e facilitar lookup direto pelo código do evento.

Vou seguir com essa sugestão. Se preferir outra estrutura, avise.

---

## 6. Dispositivos PGM — Tier 2/3 (modal Cfg avançadas + IR + combos globais)

**Módulo**: Tela Sistema → aba Dispositivos, dispositivos PGM.

Implementei **Tier 1**: parser de `Acao:` no BD response + card "Configuração de PGM" com 4 radios (Ligar/Desligar/Inverter/Pulsar) pra Plg/Int + save grava `Acao:N`. Restante documentado em §7 de comandos-que-faltam.md (Tier 2/3):

- **Tier 2 — Modal "Configurações avançadas"** (`CMD 13/15` pra ler/escrever PARs do dispositivo): Repetidor RF (par 33), Ações especiais sirene-sem-fio (par 35, v6.04+), Tempo pulso (par 23). UI tipo modal com 3 sub-cards.
- **Tier 3a — Painel "Módulo IR"** (tipo IR_CLONER): 3 radios modo + grade 20 botões (slot 1-20) + Refresh + label último cmd. Usa `CMD 9/10/11/12`.
- **Tier 3b — "Comando direto"** (botões Ligar/Desligar/Inverter/Pulso/Pulso-padrão/Ação-padrão): `CMD 3 <idx> 0/100/101/102`.
- **Tier 3c — Combos globais aba Automação**: "Dispositivo acionado quando a sirene dispara" (`PAR B1010000`) + "Dispositivo acionado por 2s no arme/desarme" (`PAR B1020000`). Podem virar 2 selects num card no Status ou em "Avançado".

**Pergunta**: ataco algum desses agora ou ficam pra próxima rodada? Tier 2 é o mais útil; Tier 3 é completude.


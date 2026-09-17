# Mapeamento da versão Java → versão Electron

Relatório do que foi extraído da versão Java em produção (`/versaoultima`) e aplicado no app novo, **mais o que ainda permanece em aberto** para perguntar à equipe de firmware.

> Doc interno (vive em `docs/`, fora do git). Complementa `docs/protocol-gaps.md` e `docs/botoes-pendentes-firmware.md`.

---

## 1. Fontes consultadas

Arquivos da versão Java analisados:

- `versaoultima/src/main/java/.../UdpCom.java` — comunicação UDP local.
- `versaoultima/src/main/java/.../TcpCom.java` — comunicação TCP remota (frames 0xAA/0xAB/0xAC).
- `versaoultima/src/main/java/.../Comm.java` — despachador de comandos, `handleMsg()`, `handlePar()` (~2600 linhas, principal fonte de mapeamento PAR).
- `versaoultima/src/main/kotlin/.../Ctrl*.kt` — controllers JavaFX de cada tela (Alarm, Superv, Partitions, ClockSet, User, Log, Calendar, Ftp, etc.).
- `versaoultima/src/main/resources/.../fxml/*.fxml` — layouts.

---

## 2. PARs mapeadas e aplicadas (25)

Trocadas de `data-par-todo="<id>"` para `data-par="<KEY>"` nos HTMLs:

### 2.1 Aplicadas em `screens/configuracoes.html`

| ID interno antigo | PAR aplicada | Tipo | Campo |
|---|---|---|---|
| `aceitar_beta` | `91050000` | bool | Aceitar atualizações BETA |
| `atualizacao_automatica` | `91100000` | bool | Atualização automática (firmware central) |
| `autorizar_mobile` | `91250000` | bool | Autorizar VettiConfig mobile |
| `preservar_senha_master` | `91230000` | bool | Preservar senha master após RESET |
| `empresa_monitor` | `E1100000` | string | Nome da empresa de monitoramento |

### 2.2 Aplicadas em `screens/particao.html`

| ID interno antigo | PAR aplicada | Tipo | Campo |
|---|---|---|---|
| `panico_clicks` | `A1160000` | select | Tempo botão pânico (1=Curto, 2=Médio, 3=Longo, 4=Muito Longo). UI usa valores 1/2/5/0 — pode precisar ajuste de mapeamento de valores. |
| `panico_silencioso` | `A1030000` | bool | Pânico silencioso |
| `permitir_arme_forcado` | `A1110000` | bool+int | Arme forçado (Java codifica bool + nº tentativas no mesmo PAR; 1=Não, 2-10=tentativas) |
| `auto_isolar_on` | `912E0000` | bool | Auto-isolar / auto-bypass |
| `senha_arme` | `91290000` | bool | Exigir senha para arme (SmartTeclado) |
| `senha_panico` | `91280000` | bool | Exigir senha para pânico |
| `senha_pgm` | `91270000` | bool | Exigir senha para PGM |
| `buzzer_saida` | `91260000` | bool | SmartTeclado: beep tempo saída |
| `rearme_lr` | `91170000` | bool | Rearme imediato LR (afeta radios 0/15/30/60/120/240) |
| `tempo_saida` | `A1190000` | int 0-240 | Tempo de saída |
| `restaurar_entrada_t` | `A12E0000` | int | Restauração tempo entrada após disparo (V≥5.64) |

### 2.3 Aplicadas em `screens/sistema.html`

| ID interno antigo | PAR aplicada | Tipo | Campo |
|---|---|---|---|
| `ac_delay` | `A11A0000` | int 10-240 | Delay AC sirene |
| `retrans_bat_baixa` | `912A0000` | bool | Retransmite bateria baixa 24h |
| `retrans_pgm_ausente` | `912B0000` | bool | Retransmite PGM/sensor ausente |
| `retrans_pgm_inibido` | `912C0000` | bool | Retransmite PGM/sensor inibido |
| `retrans_horario_var` | `912D0000` | bool | Retransmissão horário variável (0) vs fixo (1) |
| `sup_sensores_comuns` | `91180000` | bool | Tamper sensores 24h |
| `aviso_buzzer_6bips` | `91240000` | bool | Buzzer 6 bips (ausência de bateria) |
| `senha_operador` | `E1010000` | string | Senha do operador (4-10 dígitos) |

---

## 3. Implementações em `src/main/services/network.js`

### 3.1 ✅ Keep-alive TCP (frame 0xAB)

Antes: nunca enviávamos keep-alive na sessão remota — a sessão podia ser derrubada pelo receptor após período de inatividade.

Depois: timer 45s reinicia a cada `_sendInternal`. Funções: `_kaSchedule()` e `_kaCancel()`. Frame enviado: `STX(0x02) NB(0x03) FR(0xAB) CRC`. Cancelado em `endSession()`.

Referência Java: `TcpCom.java:507-525`.

### 3.2 ✅ Status codes do login 0xAA

Adicionado map `LOGIN_STATUS`:

```js
0x80: 'ok'
0x8D: 'unregistered'   // MAC/conta não cadastrada no receptor
0x8E: 'offline'        // central offline
0x8F: 'bad-hash'       // hash inválido
```

Resposta de `authenticateRemote()` agora inclui `statusName` para o renderer poder mostrar mensagem específica.

### 3.3 ✅ Helpers de RTC — CMD 7

Novos métodos exportados:

- `networkService.getClock()` → `{ok, datetime: "YYYY/MM/DD HH:MM:SS", raw}`
- `networkService.setClock(dt)` aceita `Date` ou string `"YYYY/MM/DD HH:MM:SS"`.

Expostos via IPC (`network:getClock` / `network:setClock`) e preload (`window.vettiAPI.network.getClock/setClock`).

PARs auxiliares disponíveis para integrar na UI da Configurações/Clock:

- `910B0000` (auto SNTP — **0=automático, 1=manual**)
- `910C0000` (horário de verão)
- `A10D0000` (timezone — encoding **offset + 128**, ex.: GMT-3 → `125`)

Referência Java: `CtrlClockSet.kt` + `Comm.java:731-760`.

### 3.4 (PENDENTE de implementação na UI) Parser estendido de `STAT 4`

Já documentado em `protocol-gaps.md` §4.2. Campos retornados pela central:

```
CID=<tipo> GSM=<sinal> Vdc=<mV> Vbat=<mV> Tamper=<0|1> Sir=<0|1>
Modem="<str>" Cops="<str>"
```

Conversões:
- `Vdc`/`Vbat`: mV → V (`< 3.3V` = ausente)
- `Tamper`/`Sir`: `0`=OK, `1`=violado/ausente
- `Modem`: 2G/3G/4G
- `Cops`: operadora

Referência Java: `Comm.java:875-1074`. **Aplicar no renderer** na tela Status (header de comunicação) quando for revisada.

---

## 4. Convenções confirmadas (já no `protocol-gaps.md`)

- Hash do frame 0xAA: SHA-256 sobre **8 bytes binários** (`mac_bytes + conta_hex_decoded`) — confirmado pelo receptor real.
- Sessão expira ~60s sem tráfego, app já faz re-auth automática em `ERR 7`.
- `PSW ERR Tent=<N> Tmr=<Ns>` é o formato de senha errada (não numérico).
- `BDS` retorna `Tot Max Inib` (PDF Rev 2 desatualizado diz `Del Des`).
- `ID` retorna `Mac:<MAC> IP:<IP> - <Modelo> <Versão> - Nome:"…" Interface:"…" - Empresa:"…"`.
- Conta CID (`B1060000`) — central guarda decimal, app exibe hex 4 dígitos uppercase.

---

## 5. ⚠️ O que **ainda falta** (firmware precisa esclarecer)

### 5.1 Comandos que retornam erro

| Comando | Erro | Função | Status na Java |
|---|---|---|---|
| `LOG <N>` | `ERR 8` | Buffer de eventos | Implementado (`CtrlLog.kt`), mas marcado como `flagLegacyCmdLog`. Sem substituto conhecido. |
| `CE <n>` | `ERR 8` | Calendário de feriados | UI Java existe (`CtrlFeriadoList.kt`), comando também falha. |
| `CMD 20` | `ERR 17` | Resultado RF | Pré-condição não satisfeita. Qual a sequência? |
| `PAR 41030000` | `ERR 17` | CS App | — |
| `PAR C103*–C107*` | `ERR 22` | Arme programável Terça-Sábado | Só `C101*` (Dom) e `C102*` (Seg) funcionam |
| `PAR C108*–C10E*` | `ERR 22` | Desarme programável Dom-Sáb | Nenhum dia funciona |

### 5.2 PARs sem mapeamento confirmado na Java

Campos da UI nova com `data-par-todo` que **a versão Java também não tem**. Provavelmente são novidades do firmware em desenvolvimento ou PARs que ainda não estão definidas.

**Partição → Alarme/Tempo (11):**
- `modo_arme_buzzer`, `modo_arme_sirene_aco`, `modo_arme_sirene_sf`, `modo_arme_sirene_cf` (bitmask do modo de arme — possivelmente em `A1020000`, mas estrutura precisa confirmação)
- `modo_stay_*` (idem para modo Stay — possivelmente `A1140000`)
- `auto_isolar_intervalo`, `auto_isolar_eventos` (parâmetros adicionais do auto-bypass)
- `num_tentativas` (Java junta com bool no `A1110000`; separar precisa confirmação)
- `teclado_tent` (não enviar/2/3/.../10)
- `arme_forcado_teclado` + `arme_forcado_teclado_modo`
- `pgm_*`, `on_*`, `off_*` (PGM por partição — modo, dispositivo, "não utilizado")
- `grupo_segundos*`, `grupo_minutos*`, `nao_zerar` (tempo entre detecções)
- `inativ_ini`, `inativ_fim` (arme por inatividade — horários)

**Sistema → Supervisão (11):**
- `aviso_sirene_2bips`
- `aviso_buzzer_2bips`, `aviso_buzzer_3bips`, `aviso_buzzer_4bips`, `aviso_buzzer_5bips` (avisos 2-5 bips do buzzer)
- `retrans_tamper`
- `sup_lr_ativa`, `sup_lr_intervalo`, `sup_pgm_ativa`, `sup_pgm_intervalo`

**Configurações → Avançado (7):**
- `logger_eth_porta`, `logger_wifi_porta`, `logger_url`, `logger_remote_eth`, `logger_remote_wifi`, `logger_remote_gprs`, `logger_prazo`

**Zona compartilhada (24):**
- `zc_part_1..6` (associação de partições)
- `zc_auto_isolar`, `zc_auto_isolar_intervalo`, `zc_auto_isolar_eventos`
- `zc_tempo_entrada`, `zc_tempo_saida`, `zc_restaurar_entrada`
- `zc_rearme_lr` (6 radios), `zc_tempo_pareamento`, `zc_tempo_disparo`, `zc_num_ciclos`, `zc_tempo_portao`
- `zc_minutos`, `zc_segundos`

> Total de `data-par-todo` ainda no projeto: **91 ocorrências** distribuídas em 53 IDs únicos.

### 5.3 Botões sem comando proto definido

Não fechados pela Java (ver `docs/botoes-pendentes-firmware.md` para detalhes):

1. **Importar / Exportar JSON** — Java não tem.
2. **Gerar PDF / Relatório** — Java não tem lib PDF; é client-side ou tem dados estruturados via proto?
3. **Restaurar padrão de fábrica** — Java não tem comando para disparar.
4. **Buffer** (`LOG <N>`) — falha em ambos.
5. **OTA da central** — Java só tem FTP para app, não para firmware da central.
6. **Calendário de feriados** (`CE`) — falha em ambos.
7. **Agendamento semanal** (`PAR C10x`) — falha em ambos.
8. **Cadastros** (dispositivos, usuários) — código Java existe, mas comandos de escrita não foram explorados a fundo.

### 5.4 Convenções não documentadas que continuam abertas

| Item | Status |
|---|---|
| `CMD 17` (Listar BD) e `CMD 19` (Listar Central) | Não estão na Java. Documentar comportamento. |
| `USER Idx=N` — senha em texto plano | Provavelmente legado. Confirmar comportamento esperado. |
| `STAT 1/2/3` parsing detalhado | Java tem `case 1/2/3: break;` (vazio). Documentar formato e bits. |
| `NB` do frame 0xAA | PDF §5.1 mostra `NB=0x2A` (= total). Regra geral é `total-1`. Confirmar qual é correto. |

---

## 6. Resumo numérico

| Categoria | Antes | Mapeado via Java | Pendente |
|---|---|---|---|
| Campos `data-par-todo` (ocorrências HTML) | ~150 | ~60 | 91 |
| Campos `data-par-todo` (IDs únicos) | 78 | 25 | 53 |
| Comandos com função desconhecida | 8 | 1 (CMD 7 RTC) | 7 |
| Convenções não documentadas | 12 | 8 | 4 |
| Comandos que retornam `ERR` | 6 | 0 | 6 |

---

## 7. Próximos passos sugeridos

1. **UI da hora (Configurações → Geral ou Sistema → Supervisão)**: ligar os botões "Sincronizar agora" / "Sincronizar com PC" usando `vettiAPI.network.getClock()` e `setClock()`. PARs auxiliares (auto SNTP, DST, timezone) já estão disponíveis na central.
2. **Status header (`STAT 4`) estendido**: aplicar parser dos campos extras (`Vdc`, `Vbat`, `Tamper`, `Sir`, `Modem`, `Cops`) na tela Status quando for revisada.
3. **Levar `docs/protocol-gaps.md` + `docs/botoes-pendentes-firmware.md`** para a equipe de firmware. Foco na seção §5 deste documento.
4. **Não aplicar** os 91 `data-par-todo` restantes sem antes ter a resposta do firmware — risco alto de mapeamento errado.

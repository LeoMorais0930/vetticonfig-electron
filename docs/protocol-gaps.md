# Gaps no Protocolo VettiConfig — pendências para o firmware

Este documento consolida o que precisa ser fechado com a equipe de firmware para a nova versão Electron entregar 100% das funções. **Atualizado após engenharia reversa da versão Java atual (em produção)** em `/versaoultima` — boa parte dos gaps anteriores agora tem PAR concreta vinda do código Java de referência.

Marcações:

- ✅ **Esclarecido pela versão Java** — PAR ou comando vem do código de produção. Pode ser aplicado direto no app novo.
- ⚠️ **Ainda em aberto** — Java também não tem ou o firmware testado retorna `ERR`.

> Inventário de botões/ações sem comando proto definido: ver `docs/botoes-pendentes-firmware.md`.

---

## 0. Resumo executivo

- **25 dos 50 campos `data-par-todo`** agora têm chave PAR confirmada via Java (ver §1).
- **~25 campos** continuam sem mapeamento PAR (ver §1.7).
- **8 das 12 convenções não documentadas** estão esclarecidas pela Java (ver §4).
- **Lacunas reais que dependem do firmware novo** (ver §5):
  - `LOG <N>` (buffer) → `ERR 8`. Comando legado, sem substituto na Java.
  - `CE <n>` (feriados) → `ERR 8`. UI Java existe (`CtrlFeriadoList`), comando idem.
  - `PAR C10x` (agendamento semanal) → `ERR 22` (só Domingo/Segunda funcionam).
  - OTA na central — Java tem só FTP para o app, não tem comando proto pra firmware.
  - PARs dos avisos sonoros 2-5 bips (buzzer e sirene) — não existem na Java.
  - PARs avançadas de Wi-Fi e zona compartilhada extra — não existem na Java.

---

## 1. Campos sem mapeamento PAR — status

### 1.1 ✅ Sistema → Alarme

| Card | ID interno | Função | PAR (via Java) |
|---|---|---|---|
| `alarme-identificacao` | `senha_operador` | Senha do operador (4 a 10 dígitos numéricos) | `E1010000` (string) |

### 1.2 ✅ Sistema → Avançado / Configurações

| Card | ID interno | Função | PAR (via Java) |
|---|---|---|---|
| `cfg-avancado` | `preservar_senha_master` | Preservar senha master após RESET | `91230000` (bool) |
| `cfg-avancado` | `autorizar_mobile` | Permite APP remoto via CID | `91250000` (bool) |
| `cfg-avancado` | `empresa_monitor` | Nome da empresa de monitoramento | `E1100000` (string) |

### 1.3 ✅ Partição → Alarme

| Card | ID interno | Função | PAR (via Java) |
|---|---|---|---|
| `par-alarme-arme` | `arme_forcado` | Permitido / Permitido com zona anulada (+ nº tentativas) | `A1110000` (bool+int: 1=Não, 2-10=tentativas) |
| `par-alarme-arme` | `auto_isolar_eventos` | Habilita auto-isolação (cancelar/quantidade) | `912E0000` (bool) |
| `par-alarme-arme` | `panico_silencioso` | Pânico (Silencioso / Sirene / Ambos) | `A1030000` (select 1=Sirene, 2=Silencioso, 3=Ambos); modo stay tem variante em `A1140000` |
| `par-alarme-arme` | `panico_clicks` | Tempo do botão de pânico | `A1160000` (select 1=Curto, 2=Médio, 3=Longo, 4=Muito Longo) |
| `par-alarme-teclado` | `teclado_buzzer_saida` | Tocar buzzer durante tempo de saída | `911D0000` (bool); variante p/ SmartTeclado em `91260000` |
| `par-alarme-teclado` | `teclado_feedback` | Teclado instalado (feedback sonoro) | `91200000` (bool) |
| `par-alarme-teclado` | `teclado_senha_arme` | Exigir senha para arme | `91290000` (bool) |
| `par-alarme-teclado` | `teclado_senha_panico` | Exigir senha para pânico | `91280000` (bool) |
| `par-alarme-teclado` | `teclado_senha_pgm` | Exigir senha para PGM | `91270000` (bool) |

### 1.4 ✅ Partição → Supervisão / Tempo

| Card | ID interno | Função | PAR (via Java) |
|---|---|---|---|
| `par-sup-disp` | `rearme_lr` | Rearme imediato LR (RF comum) | `91170000` (bool) |
| `par-sup-sistema` | `tempo_saida` | Tempo de saída | `A1190000` (int 0-240s); por partição em `A11B`–`A1200000` |
| `par-sup-sistema` | `restaurar_entrada` | Restauração do tempo de entrada após disparo | `A12E0000` (int; V≥5.64) |
| `par-sup-sistema` | (novo) `tempo_entrada` | Tempo de entrada | `A1180000` (int 0-240s) |

### 1.5 ✅ Sistema → Supervisão (avisos sonoros)

| Card | ID interno | Função | PAR (via Java) |
|---|---|---|---|
| `supervisao-avisos` | `aviso_buzzer_6bips` | Buzzer 6 bips (ausência de bateria) | `91240000` (bool) |
| `supervisao-lr` | `sup_sensores_comuns` | Tamper sensores 24h | `91180000` (bool); variante `911C0000` (monitora tamper) |
| `supervisao-retransmissao` | `retrans_bat_baixa` | Retransmite bateria baixa 24h | `912A0000` (bool) |
| `supervisao-retransmissao` | `retrans_horario_var` | Retransmissão em horário variável (vs fixo) | `912D0000` (bool: 0=variável, 1=fixo) |
| `supervisao-retransmissao` | `retrans_pgm_ausente` | Retransmite sensor ausente 24h | `912B0000` (bool) |
| `supervisao-retransmissao` | `retrans_pgm_inibido` | Retransmite sensor inibido 24h | `912C0000` (bool) |
| `supervisao-sirene` | `ac_delay` | Delay AC da sirene | `A11A0000` (int 0-240s) |

### 1.6 ⚠️ Ainda sem PAR — Sistema → Supervisão (avisos 2-5 bips)

A versão Java **não tem mapeamento** para estes avisos sonoros. Provável que essas PARs ainda não foram definidas no firmware.

| Card | ID interno | Função |
|---|---|---|
| `supervisao-avisos` | `aviso_buzzer_2bips` | Buzzer 2 bips (violação → disparo) |
| `supervisao-avisos` | `aviso_buzzer_3bips` | Buzzer 3 bips (violação de energia) |
| `supervisao-avisos` | `aviso_buzzer_4bips` | Buzzer 4 bips (violação tampa do painel) |
| `supervisao-avisos` | `aviso_buzzer_5bips` | Buzzer 5 bips (sirene com fio violada) |
| `supervisao-avisos` | `aviso_sirene_2bips` | Sirene 2 bips (violação → disparo) |
| `supervisao-lr` | `sup_lr_ativa` | Supervisão LR ativa (intervalo) |
| `supervisao-lr` | `sup_lr_intervalo` | Supervisão LR — intervalo |
| `supervisao-lr` | `sup_pgm_ativa` | Supervisão PGM ativa |
| `supervisao-lr` | `sup_pgm_intervalo` | Supervisão PGM — intervalo |
| `supervisao-retransmissao` | `retrans_tamper` | Retransmissão de violação tamper |
| `par-alarme-arme` | `auto_isolar_intervalo` | Intervalo da auto-isolação |
| `par-alarme-arme` | `num_tentativas` | Modo de arme (número de tentativas) |
| `par-alarme-arme` | `stay_clicks` | Stay — número de cliques (1/2/5/manter) |
| `par-alarme-pgm` | `pgm_modo` | Modo PGM (Off / On / Pulso / Inverter / Não utilizado) |
| `par-alarme-teclado` | `teclado_tentativas` | Não enviar após N tentativas |
| `par-sup-disp` | `nao_zerar_tempo` | Não zerar o tempo entre detecções |
| `par-sup-disp` | `tempo_grupo` | Tempo entre detecções de grupo |
| `par-sup-sistema` | `inativ_ini` | Horário início — arme por inatividade |
| `par-sup-sistema` | `inativ_fim` | Horário fim — arme por inatividade |

### 1.7 ⚠️ Ainda sem PAR — Zona compartilhada

Os campos `zc_modo_arme`, `zc_sirene_tamper`, `zc_part_1..6`, `zc_auto_isolar*`, `zc_tempo_*`, `zc_rearme_lr`, `zc_tempo_pareamento`, `zc_tempo_disparo`, `zc_num_ciclos`, `zc_tempo_portao` — **a versão Java não tem esses campos** (a UI Java não tem o conceito completo de "zona compartilhada" da nova UI). Aguardar firmware novo.

### 1.8 ⚠️ Ainda sem PAR — Wi-Fi avançado

Campos Wi-Fi no card `rede-wifi` (SSID, banda, modo de segurança). Java tem `cbWifiApSsidVisible` (PAR `91110000`) e `textFieldWifiSt/ApIp/Mac` (PAR `610B0000`), mas configuração completa do Wi-Fi station ainda não mapeada.

---

## 2. Comandos do protocolo

### 2.1 ✅ Comandos confirmados pela Java

| Comando | Função | Notas |
|---|---|---|
| `ID` | Identificação | Formato: `Mac:<MAC> IP:<IP> - <Modelo> <Versão> - Nome:"<Nome>" Interface:"<Interface>" - Empresa:"<Empresa>"`. Funciona em UDP e TCP. |
| `INFO` | Build info | Formato: `SmartAlarm32 V<ver> - Build date:<data> - Build time:<hora>`. |
| `PSW <senha>` | Autenticação | Sessão expira ~60s; re-auth automática ao próximo comando. |
| `STAT 1` / `STAT 2` / `STAT 3` | Status zonas/alarmes/bateria | Retorna `STAT N "<32 bytes hex separados por espaço>"`. |
| `STAT 4` | Status detalhado | `CID=<tipo> GSM=<sinal> Vdc=<mV> Vbat=<mV> Tamper=<0\|1> Sir=<0\|1> Modem="<str>" Cops="<str>"`. Parsing completo em Java (`Comm.java` linhas 875-1074). |
| `BDS` | BD de dispositivos | Formato real: `Tot:<n> Max:<m> Inib:<i>` (PDF Rev 2 desatualizado; diz `Del:<d> Des:<x>`). |
| `BDX i` / `BDX +` | Iterar BD | Sem dump completo confirmado. |
| `CMD 2` (sem args) | Estado das 6 partições | Retorna `CMD 2 (p:XXXXXX)` (6 chars: -, N, A, S, P, D, E, X). |
| **`CMD 7` (read)** | Lê RTC | Retorna `CMD 7 "<YYYY/MM/DD HH:MM:SS>"`. |
| **`CMD 7 "<data hora>"` (write)** | Grava RTC | Formato `"YYYY/MM/DD HH:MM:SS"`. |
| `CMD 8` | Timer de cadastro remoto | Tmr até timeout do modo cadastro. |
| `CMD 14 / 16` | Config RF (read/write) | VETTI_MSG_CFG_READ/WRITE em `CtrlCfgAdvanced`. |
| `CMD 18` | Timestamp do logger remoto | Validade da função VettiLogger; cliente converte hex → ms. |
| `PAR <chave>` / `PAR <chave> <valor>` | Leitura / gravação | Despachador em `Comm.java:handlePar()` linhas 1212-2600+. |
| `DCN` | Desconectar | Enviado antes de fechar a sessão. |

### 2.2 ⚠️ Ainda retornam erro na central testada

| Comando | Função esperada | Erro | Status na Java |
|---|---|---|---|
| `LOG <N>` | Listar buffer | `ERR 8` | Implementado em `CtrlLog.kt`, mas marca `flagLegacyCmdLog` (legado). Sem substituto conhecido. |
| `CE <n>` | Calendário de feriados | `ERR 8` | UI Java existe (`CtrlFeriadoList`), comando também falha. |
| `CMD 20` | Resultado RF | `ERR 17` | Pré-condição não satisfeita. Qual a sequência correta? |
| `PAR 41030000` | CS App | `ERR 17` | — |
| `PAR C1030000`–`C1070000` | Arme programável (Terça → Sábado) | `ERR 22` | Java envia mesmos comandos via `CtrlArmeProg.kt`. Domingo e Segunda funcionam, demais não. |
| `PAR C1080000`–`C10E0000` | Desarme programável (Dom → Sáb) | `ERR 22` | Nenhum dia funciona. |

---

## 3. Códigos de erro

### 3.1 ✅ Documentados

`ERR 7` (senha inválida), `ERR 8` (comando desconhecido), `ERR 17` (estado/pré-condição), `ERR 27` (fim do BD), entre outros.

### 3.2 ⚠️ Não documentados

| Código | Hipótese | Onde aparece |
|---|---|---|
| `ERR 22` | Dia da semana inválido / parâmetro não implementado | Arme / desarme programável (`PAR C103*` em diante) |
| `ERR 24` | Valor fora do range em comando estruturado | Confirmado em `AGENDA <idx> ... Freq:2 Mes:0 Dia:0 ...` — Freq:2 = Mensal e Mes precisa ser 1..12. Cliente envia Mes:0 → ERR 24. (Antes nosso app usava Freq=0..3 off-by-one e Freq:2 que pra UI era Semanal vinha como Mensal pro firmware — corrigido em 2026-05-19) |
| `ERR 32` | Valor fora do range / tipo inválido para o PAR | Tentar gravar inteiro `0` ou string vazia em PAR numérico (ex.: `PAR B1090000 0` falha; `PAR B1090000 ""` também). Cliente deve aplicar o default declarado pelo firmware (ver §6) ou pular a gravação se o campo estiver vazio. |

### 3.3 ✅ Enums confirmados via fonte Kotlin (legado v3 do VettiConfig)

**`AgendaFreq`** (campo `Freq:` em comandos `AGENDA`):

| Valor | Significado |
|---|---|
| `0` | `NONE` (inválido — não usar) |
| `1` | Anual |
| `2` | Mensal |
| `3` | Semanal |
| `4` | Feriados |

**`AgendaAcao`** (campo `Acao:`):

| Valor | Significado |
|---|---|
| `0` | `NONE` (inválido) |
| `1` | Armar |
| `2` | Desarmar |
| `3` | Ligar PGM |
| `4` | Desligar PGM |
| `5` | Pulsar PGM |
| `6` | Armar Stay |
| `7` | Msg Teste CID |

> Não existe "PGM Inverter" (toggle) no firmware — removido da UI.

### Defaults declarados pela engenharia Vetti

| PAR | Campo | Range válido | Default |
|---|---|---|---|
| `B1050000` | Porta do servidor de monitoramento principal | 1024 – 65533 | **9018** |
| `B1090000` | Porta do servidor de monitoramento backup    | 1024 – 65533 | **9018** |

> Para portas TCP, valores fora do range (`< 1024` ou `> 65533`), vazios ou não-numéricos devem ser substituídos pelo default `9018` antes da gravação. Tentativas de gravar valor inválido (incluindo `0`) retornam `ERR 32`.

---

## 4. Convenções e formatos

### 4.1 ✅ Conta CID (`PAR B1060000`)

Central retorna inteiro decimal (ex.: `55047`). UI exibe em hex 4 dígitos uppercase (`D707`). Na gravação, faz hex → decimal. Confirmado pelo campo `editIdName` (Java) e pelo loop de PAR no app Electron.

### 4.2 ✅ `STAT 4` — campos extras

A central retorna, além do que está no PDF: `Vdc`, `Vbat` (mV → V, < 3.3 V = ausente), `Tamper`, `Sir` (0=OK, 1=violado), `Modem` (2G/3G/4G), `Cops` (operadora). Parser de referência em `Comm.java` 875-1074.

### 4.3 ✅ `ID` — formato real

Como em §2.1. PAR `61010000` é alternativa para modo "limit128" (conexão remota).

### 4.4 ✅ `INFO` — formato real

Como em §2.1.

### 4.5 ✅ `BDS` — formato real

Como em §2.1 — `Tot`, `Max`, `Inib`. PDF Rev 2 §7.1.11 está desatualizado.

### 4.6 ✅ `PSW ERR Tent=<N> Tmr=<Ns>`

Senha errada retorna esse formato em vez de `ERR <n>` numérico. Cliente deve mostrar tentativas restantes e tempo de lockout.

### 4.7 ✅ Sessão (TTL ~60s)

Após `PSW OK`, sessão cai em ~60s sem tráfego. O app faz re-autenticação automática em `ERR 7`. UDP local não tem keep-alive explícito; TCP remoto **deve enviar keep-alive periódico** (ver §4.10).

### 4.8 ✅ `CMD 7` — RTC

Read: `CMD 7` retorna `CMD 7 "<YYYY/MM/DD HH:MM:SS>"`. Write: `CMD 7 "<data> <hora>"` no mesmo formato. PARs associadas: `910B0000` (auto SNTP, invertido: 0=auto/1=manual), `910C0000` (DST), `A10D0000` (timezone com encoding offset 128).

### 4.9 ✅ `CMD 18` — timestamp do logger remoto

Resposta em hex; cliente converte para ms e exibe.

### 4.10 ✅ Frame TCP 0xAA — login

- Payload: `<6 bytes MAC binário><32 bytes SHA-256>`.
- **Hash** = `SHA-256(MAC_BYTES + CONTA_BYTES)` onde `CONTA_BYTES` é a conta decodificada de hex (ex.: `D707` → 2 bytes `0xD7 0x07`). NÃO é a string ASCII concatenada — esse era o bug que tínhamos.
- **Status codes** da resposta 0xAA: `0x80` = OK, `0x8D` = central não cadastrada, `0x8E` = central offline, `0x8F` = hash inválido. **Falta no PDF Rev 2 §5.1.**
- **NB** do frame 0xAA: o PDF §5.1 mostra `NB = 0x2A` (total do frame = 42). A regra geral dos frames Vetti é `NB = total - 1`. Nossa implementação usa `NB = 0x2A` (caso especial) e foi validada contra a receptora real — funciona. A versão Java de referência aparenta usar `NB = 0x29` em alguns trechos. Pedir confirmação ao firmware: a regra correta é `total` ou `total - 1`?

### 4.11 ✅ Frame TCP 0xAB — keep-alive

Frame de 4 bytes: `STX(0x02) NB(0x03) FR(0xAB) CRC`. Cliente deve enviar a cada **45s** de inatividade na sessão TCP remota (`TcpCom.java` linhas 507-525). Resposta da central tem mesmo formato. **Nosso app Electron ainda NÃO implementa esse keep-alive** — adicionar.

### 4.12 ⚠️ `CMD 17` e `CMD 19`

`CMD 17` (Listar BD) e `CMD 19` (Listar Central) — não estão na Java. Documentar comportamento real.

### 4.13 ⚠️ `USER Idx=N`

Senha aparece em texto plano (tanto no PDF quanto na central real). Java implementa `handleUserReg()` em `CtrlUser.kt`, provavelmente legado. Confirmar.

---

## 5. Lacunas reais — aguardando firmware novo

Coisas que **a Java também não resolve** e seguem como pergunta principal para a equipe de firmware:

1. **Buffer** — `LOG <N>` retorna `ERR 8`. Java marca como legado. Existe comando substituto? Como listar/filtrar eventos no buffer?
2. **Calendário/Feriados** — `CE <n>` retorna `ERR 8`. UI Java existe mas comando idem. Como cadastrar feriados?
3. **Agendamento semanal** — `PAR C103*–C10E*` retornam `ERR 22` (só Domingo/Segunda funcionam). Mapeamento PAR está fora de sincronismo?
4. **OTA na central** — Java só tem FTP para baixar atualização do **app**, não tem fluxo de OTA para firmware da **central**. Como funciona?
5. **JSON import/export** — sem schema nem comando definido (nem na Java nem na nova UI).
6. **PDF / Relatório** — Java não tem lib PDF. É geração client-side ou tem comando proto que retorna dados estruturados?
7. **Restaurar padrão de fábrica** — Java não tem botão para disparar. Qual o comando? Apaga senhas/usuários/dispositivos? `91230000` (preservar senha master) já existe.
8. **Avisos sonoros 2-5 bips** — PARs não mapeadas em Java. Existem no firmware atual?
9. **Wi-Fi station (SSID, banda, segurança)** — PARs não mapeadas em Java. Existem?
10. **Zona compartilhada extra** — PARs não mapeadas em Java. Vai entrar no firmware novo?
11. **`ERR 22`** — adicionar à tabela §8.5.
12. **NB do frame 0xAA** — confirmar regra (`total` ou `total - 1`).

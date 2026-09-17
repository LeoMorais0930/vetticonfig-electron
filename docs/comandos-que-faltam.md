# Comandos que faltam — mapeamento por tela / aba

Inventário tela-a-tela do que **ainda não temos** para preencher 100% da UI. Foco em campos que aparecem como `---` em runtime mesmo após uma conexão bem-sucedida, ações sem comando proto definido, ou comportamentos esperados que não acontecem (ex.: refresh em tempo real).

Marcações:

- ✅ Implementado e validado contra a central real.
- ⚠️ Conhecemos o comando mas não chamamos ainda / handler incompleto.
- ❓ Não sabemos qual comando do protocolo expõe esse dado.
- ⏳ Depende de spec do firmware (ainda não definido).

> Doc interno em `docs/` (fora do git — `docs/` está no `.gitignore`). Complementa `protocol-gaps.md`, `audit-central-real.md` e `botoes-pendentes-firmware.md`.
>
> **Última atualização**: 2026-05-19. Última feature validada: aba **Agendamento** auditada contra `CtrlAgenda.kt` (v3 Kotlin) — 8 achados, 6 corrigidos, 2 implementados na sequência.

---

## 1. Tela **Status** (`vetticonfig-status.html`)

### 1.1 Identificação da central (header)

| Campo (DOM)         | Origem            | Status |
|---|---|---|
| `vcCentralName`     | `ID → Nome:"…"`        | ✅ |
| `vcCentralModel`    | `INFO → SmartAlarm32 V…`| ✅ |
| `vcCentralIp`       | `ID → IP:` (fallback PAR `71010000` se 0.0.0.0) | ✅ |
| `vcCentralMac`      | `ID → Mac:`            | ✅ |

### 1.2 Partições (`vcPartCard1..6`)

| Campo / função | Origem | Status |
|---|---|---|
| Estado (armed/stay/disarmed/alarm/unused) | `CMD 2 (p:XXXXXX)` — códigos `A`=armed, `S`=stay, `P/D`=alarm, `-`=disarmed, `N`=unused | ✅ |
| Botões Arme/Stay/Desarme/Pânico | `CMD 2 AT\|AP\|D\|P:<N>` | ✅ |
| **Nome custom da partição** (hoje "Partição 1..6") | ❓ qual PAR retorna o nome custom? Não encontrado no Java. | ❓ |
| **Atualização em tempo real** quando alguém arma/desarma fora do app | Polling CMD 2 a cada **30s**. Firmware testado **não envia** eventos assíncronos `[N CSTAT/PSTAT]` pra arme/desarme. `_vcHandleAsyncEvent` consome `[N TE/TS]` que existem (tempo entrada/saída) — flash visual no card. | ✅ |
| **Preservar seleção** da partição no refresh | snapshot+restore em `_vcApplyPartitionStates` (antes o polling estava limpando `.selected`) | ✅ corrigido 2026-05-19 |

### 1.3 Status boxes

| Campo (DOM)       | Origem (STAT 4/5)             | Status |
|---|---|---|
| `vcTensaoFonte`   | `STAT 4 Vdc=` (mV → V)         | ✅ |
| `vcTensaoBateria` | `STAT 4 Vbat=` (mV → V; <0,5 V = ausente) | ✅ |
| `vcTamperCentral` | `STAT 4 Tamper=` (0=OK / 1=violado) | ✅ |
| `vcSireneFio`     | `STAT 4 Sir=` (0=OK / 1=ausente)    | ✅ |

### 1.4 Painel de alarme (data / hora)

| Campo (DOM)    | Origem               | Status |
|---|---|---|
| `vcAlarmDate`  | `CMD 7 → "YYYY/MM/DD HH:MM:SS"` ou `STAT 5 Time=` | ✅ |
| `vcAlarmTime`  | idem                                              | ✅ |

### 1.5 Conexão com servidor

| Campo | Origem | Status |
|---|---|---|
| Status servidor (conectado / desconectado) | `STAT 4 CID=ethernet\|gprs\|wifi`     | ✅ |
| Modem GPRS — operadora, tipo (2G/3G/4G), RSSI | `STAT 4 GSM=...`                      | ✅ |
| Modem Wi-Fi (status independente do CID ativo) | ❓ qual comando? `610B0000` retorna endereços (STIP/STMAC/APIP/APMAC) mas não estado | ❓ |

### 1.6 Scan (lista de dispositivos)

| Função | Origem | Status |
|---|---|---|
| Listagem | `BDX I + BDX +` (loop até `ERR 27`) | ✅ |
| Refresh quando algum sensor abre/fecha/perde bateria | Eventos assíncronos (instantâneo) + refresh `STAT 6` periódico a cada **2 min** (safety net para RSSI/bateria %) | ✅ |
| Filtros (sinal/tamper/bateria/ausente/inibido/aberto) | Local após carregar STAT 6 | ✅ |

### 1.7 Topbar — botões

| Botão | Função esperada | Status |
|---|---|---|
| Desconectar | `endSession()` + redirect index | ✅ |
| **PDF / CSV** | Gerar relatório com snapshot da tela | ✅ implementado em 2026-05-19 — popover com 2 opções (PDF/CSV); detalhes em §1.9 |
| Tema (☀/☾) | Local (CSS `data-theme`) | ✅ |
| Idioma | Local (i18n) | ✅ |

### 1.8 Logger

Mostra tráfego com a central em tempo real. Auto-scroll opcional + 3 botões (±5 linhas, maximizar) com altura compartilhada entre telas e sessões. ✅

### 1.9 Exportação PDF / CSV (implementado 2026-05-19)

**Botão**: ícone 📄 no header (id `vcBtnPdf`).

**Comportamento**: click abre popover (`.vc-export-menu`) com 2 opções — "Exportar PDF" e "Exportar CSV". Cada uma:

1. Coleta payload do DOM via `_vcCollectStatusPayload()` — pega tudo o que está visível na tela Status no momento (não relê da central, é snapshot do que o usuário vê).
2. Chama IPC `report:exportPdf` ou `report:exportCsv` no main process.
3. Main mostra `dialog.showSaveDialog` nativo do SO com nome sugerido `vetticonfig_<nome-central>_<timestamp>.<ext>` em `~/Documents` por padrão.
4. PDF: BrowserWindow offscreen + `webContents.printToPDF()` (Chromium, sem libs externas, A4 com margens 18mm/14mm). CSV: texto puro com BOM UTF-8 (Excel reconhece pt-BR).
5. Toast de sucesso com o path, ou warn em caso de falha; "info" se o usuário cancelar o dialog.

**Conteúdo do relatório** (espelha o que está na tela Status):

- Identificação da central: Nome, Modelo, IP, MAC.
- Partições (P1..P6): número, nome, estado (textual + classe armed/stay/disarmed/alarm/unused).
- Status boxes: Tensão fonte, Tensão bateria, Tamper central, Sirene com fio.
- Painel de alarme: Data, Hora.
- Conexão com servidor: Status, Modem GPRS, Modem WiFi.
- Dispositivos (todos os visíveis no `#vcDeviceList`): #, Zona, Nome, Tipo, Versão, Partição, Bateria, Sinal (RSSI), Status, Tamper.

**Arquitetura técnica**:

| Camada | Local | O que faz |
|---|---|---|
| Backend | `src/main/services/report.js` | `exportPdf(payload)` + `exportCsv(payload)` + helpers `_buildHtml` / `_buildCsv` / `_esc` / `_esCsv` |
| IPC handlers | `src/main/ipc/handlers.js` | `report:exportPdf` e `report:exportCsv` |
| Preload | `src/main/preload.js` | `window.vettiAPI.report.{exportPdf, exportCsv}` |
| Renderer | `src/renderer/js/vetticonfig.js` | `_vcCollectStatusPayload` + `_vcOpenExportMenu` + `_vcDoExport` |
| CSS | `src/renderer/css/vetticonfig.css` | `.vc-export-menu` + `.vc-export-item` |
| i18n | `i18n/*.json` em `status.*` | `export_pdf`, `export_csv`, `exporting`, `export_ok`, `export_canceled`, `export_fail` |

**Por que offscreen BrowserWindow + printToPDF e não pdfkit?**

- Zero dependência nova (já temos Electron).
- Usa o motor de print do Chromium — fontes, layout, cores, sombras renderizam idênticos à UI.
- Permite usar o mesmo design tokens (cores `#0076CB`, `#003A63`, etc) sem reimplementar em PDF API.
- A janela offscreen é destruída logo após a geração — não vaza recurso.

**Limitações conhecidas**:

- Os campos `Bateria`, `Sinal`, `Status`, `Tamper` dos dispositivos refletem o que está exibido na lista no momento — se o STAT 6 ainda não rodou pra todos, alguns aparecem como `---`. Solução futura: aguardar primeiro tick do STAT 6 antes de habilitar o botão.
- Não há paginação inteligente: tabela de dispositivos longa quebra em página(s) extras automaticamente pelo Chromium, mas sem header repetido (header só na primeira página).

---

## 2. Resumo das pendências da tela Status

**Para a equipe de firmware (perguntas):**

1. ❓ Existe PAR para o **nome customizado de cada partição** (P1..P6)?
2. ❓ Como saber o **estado do Wi-Fi** independente do CID ativo? Se for dual GPRS+Wi-Fi, como detectar que ambos estão conectados?
**Resolvido (implementado):**

1. ✅ Eventos assíncronos `[N CSTAT/TE/TS/PSTAT]` consumidos por `_vcHandleAsyncEvent`. Refresh leve (CMD 2 + STAT 4); flash visual em TE/TS.
2. ✅ Refresh do relógio (`CMD 7`) a cada 30s.
3. ✅ Refresh periódico de `STAT 6` a cada 2 min (safety net para RSSI/bateria %). Guard `_vcStatDevBusy` evita ticks sobrepostos.
4. ✅ GSM expandido com Modem + tipo (2G/3G/4G) + operadora via `_vcGsmFullLabel`.
5. ✅ Filtro do scan corrigido (todos marcados = mostra tudo).
6. ✅ **Exportação PDF/CSV** — botão da topbar implementado (ver §1.9). Snapshot do que está visível na tela; geração client-side via Chromium printToPDF (PDF) ou texto puro com BOM UTF-8 (CSV).

---

## 3. Tela **Sistema** → aba **Contact ID** (`sistema.html`)

### 3.1 Card "Configuração de monitoramento"

| Campo                                | PAR        | Tipo | Status / Notas |
|---|---|---|---|
| Conta na empresa de monitoramento    | `B1060000` | int (hex↔dec) | ✅ Validação client-side (rejeita `0000`, prefixo `A`, não-hex). |
| Prioridade de conexão                | `A1070000` | select 1..6   | ✅ Range corrigido para `1..6` (Java). |
| Servidor monit. 1 — endereço         | `E1060000` | string | ✅ |
| Servidor monit. 1 — porta            | `B1050000` | int 1024–65533 | ✅ Default **9018** quando vazio/fora do range. Toast amarelo notifica. |
| Servidor monit. 2 — endereço         | `E10B0000` | string | ✅ |
| Servidor monit. 2 — porta            | `B1090000` | int 1024–65533 | ✅ Default 9018. |
| Número DTMF 1                        | `E9020001` | string | ✅ sem validação por enquanto |
| Número DTMF 2                        | `E9020002` | string | ✅ sem validação por enquanto |

### 3.2 Card "Mensagem de teste periódico"

| Campo                                | PAR        | Tipo | Status |
|---|---|---|---|
| Intervalo (minutos)                  | `B1070000` | int (min 1, max 1440 client-side) | ✅ Unidade corrigida (Java: minutos, não horas). |

### 3.3 Card "Eventos Contact ID"

PARs CID-relacionados trazidos da aba Avançado:

| Campo                                                                 | PAR        | Tipo | Status |
|---|---|---|---|
| Enviar evento CID ao ligar/desligar PGM                               | `911A0000` | bool | ✅ |
| Enviar evento CID de supervisão para PGM                              | `91210000` | bool | ✅ |
| Forçar discagem DTMF sem detecção de linha                            | `911F0000` | bool | ✅ |

> Mantidos também na aba Avançado (mesmos PARs aparecem nas duas telas).

### 3.4 Pendências da aba Contact ID

1. ❓ Range válido do `B1070000` (teste periódico) — Java não valida, usamos `1..1440` no client.
2. ❓ Validação dos números DTMF (`E902xxxx`) — caracteres aceitos? (+, *, #, , como pausa).

---

## 4. Tela **Sistema** → aba **Rede** (`sistema.html`)

### 4.1 Card "Configuração ethernet"

| Campo                | PAR        | Tipo   | Status |
|---|---|---|---|
| **Valores em uso** (readonly) |  |  |  |
| Endereço IP          | `71010000` | string IP | ✅ |
| Máscara de sub-rede  | `71030000` | string IP | ✅ |
| Gateway padrão       | `71020000` | string IP | ✅ |
| Servidor DNS         | `71040000` | string IP | ✅ |
| **Valores configurados manualmente** |  |  |  |
| Ativar DHCP (label)  | `910A0000` | bool **invertido** (0=DHCP, 1=Static) | ✅ |
| Endereço IP          | `F1010000` | string IP | ✅ |
| Máscara de sub-rede  | `F1030000` | string IP | ✅ |
| Gateway padrão       | `F1020000` | string IP | ✅ |
| Servidor DNS         | `F1040000` | string IP | ✅ |

> Quando IP manual nunca foi configurado, retorna `255.255.255.255` em todos os `F101..F104` — é a sentinela "não configurado".

### 4.2 Card "Configuração GPRS"

| Campo               | PAR        | Tipo            | Status |
|---|---|---|---|
| APN                 | `61070000` | string          | ✅ |
| Login               | `61050000` | string          | ✅ |
| Senha               | `61060000` | string          | ✅ |
| Modelo do modem     | `61040000` | string readonly | ✅ |
| IMEI                | `61030000` | string readonly | ✅ |
| ICC-ID              | `61080000` | string readonly | ✅ |

### 4.3 Card "Configuração Wi-Fi"

| Campo                     | PAR        | Tipo   | Status |
|---|---|---|---|
| SSID Rede Wi-Fi (station) | `E1070000` | string | ✅ |
| Senha Rede Wi-Fi (station)| `E1080000` | string | ✅ |
| SSID do Wi-Fi do Painel (AP) | `E1090000` | string | ✅ |
| Senha do Wi-Fi do Painel (AP)| `E10A0000` | string | ✅ |
| Ocultar SSID do Painel    | `91110000` | bool | ✅ |

### 4.4 Pendências da aba Rede

1. ❓ Estado atual da conexão Wi-Fi (conectado/desconectado, SSID atual, RSSI). PAR `610B0000` retorna endereços (`STIP/STMAC/APIP/APMAC`) mas não estado.

**Resolvido:**

- ✅ Valores em uso Wi-Fi: `610B0000` (suporte genérico `data-par-multi="<KEY>:<subkey>"` no `_vcLoadPanel`).
- ✅ Valores GPRS em uso: extraídos do `STAT 4` (Status, Operadora, Tipo 2G/3G/4G, RSSI).
- ✅ IP no header com fallback `71010000` quando ID retorna 0.0.0.0 (conexão remota).

**Futuro:**

1. ⚠️ Exibir IPv6 do modem (`610A0000`) e URL PING IPv6 (`E10F0000`).

---

## 5. Tela **Sistema** → aba **Supervisão** (`sistema.html`)

### 5.1 Card "Monitor sirene + Retardo AC"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Monitorar sirene com fio | `91130000` | bool **invertido** | ✅ Java: `checkBoxAlarmMonitorarSireneComFio` |
| Retardo AC (10-240s) | `A11A0000` | int | ✅ |

### 5.2 Card "Retransmissão de eventos a cada 24 horas"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Bateria baixa sensores | `912A0000` | bool | ✅ |
| Sensor/PGM ausente | `912B0000` | bool | ⚠️ Java menciona "lógica invertida conforme versão" — testar e aplicar invert se necessário |
| Sensor/PGM inibido | `912C0000` | bool | ✅ |
| Violação de tamper | `data-par-todo="retrans_tamper"` | bool | ❓ sem PAR mapeado |
| Horário variável (toggle) | `912D0000` | bool **invertido** | ✅ 0=Variável, 1=Fixo |
| Horário fixo (display + Editar) | — | time | ⚠️ sem PAR mapeado |

### 5.3 Card "Sensores comuns LR"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Supervisão sensores comuns (24h) | `91170000` | bool | ⚠️ corrigido de `91180000` (Tamper 24h) para `91170000` (Sup RF). **Confirmar firmware**. |
| Intervalo sinal de vida LR (1/2/4/8/12/24h) | `A1100000` | select 1..6 | ✅ central armazena índice 1..6 → 1h, 2h, 4h, 8h, 12h, 24h |
| Sensores LR — Ativada + intervalo | `data-par-todo="sup_lr_ativa"` / `sup_lr_intervalo` | bool + select | ❓ |
| Sirene s/fio e PGM — Ativada + intervalo | `data-par-todo="sup_pgm_ativa"` / `sup_pgm_intervalo` | bool + select | ❓ |

### 5.4 Card "Avisos sonoros"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Sirene 2 Bips (violação→disparo) | `data-par-todo="aviso_sirene_2bips"` | bool | ❓ |
| Buzzer 2 Bips (violação→disparo) | `data-par-todo="aviso_buzzer_2bips"` | bool | ❓ |
| Buzzer 3 Bips (queda energia) | `91160000` | bool | ✅ |
| Buzzer 4 Bips (violação tampa) | `91150000` | bool | ✅ |
| Buzzer 5 Bips (sirene com fio) | `91140000` | bool | ✅ |
| Buzzer 6 Bips (bateria ausente) | `91240000` | bool | ✅ |
| Buzzer beep durante tempo entrada | `911D0000` | bool | ✅ |
| Sirene beep durante tempo entrada | `911E0000` | bool | ✅ |

### 5.5 PARs descobertos no Java e adicionados à UI

| PAR | Onde foi adicionado | Status |
|---|---|---|
| `911C0000` Monitorar tamper sensores comuns (invertido) | Card "Monitor sirene + Retardo AC" | ✅ |
| `911D0000` Buzzer beep repetitivo durante tempo de entrada | Card "Avisos sonoros" | ✅ |
| `911E0000` Sirene beep repetitivo durante tempo de entrada | Card "Avisos sonoros" | ✅ |
| `91200000` Teclado RF instalado | **Card novo "Teclado RF"** | ✅ |
| `A1150000` Keep-alive teclado (min sem comunicação) | **Card novo "Teclado RF"** | ✅ |

`A12E0000` (Restauração do tempo de entrada após disparo, V≥5.64) já está mapeado na aba Partição — não duplicamos.

### 5.6 Pendências da aba Supervisão

**Confirmações com firmware:**

1. ❓ **`91180000` vs `91170000`** — qual PAR correto para "Supervisão sensores comuns: Ativada (24h)"? Aplicamos `91170000`, é incerto.
2. ⚠️ **`912B0000` "Sensor/PGM ausente"** — Java comenta "lógica invertida conforme versão". Testar.
3. ❓ **"Violação de tamper"** (retransmissão 24h) — qual PAR?
4. ❓ **Avisos 2 Bips** — entre violação e disparo. Qual PAR?
5. ❓ **Horário fixo da retransmissão** — qual PAR guarda quando o toggle "variável" está desligado?
6. ❓ **Sub-PARs LR/PGM** (`sup_lr_*`, `sup_pgm_*`).

---

## 6. Tela **Sistema** → aba **Alarme** (`sistema.html`)

### 6.1 Card "Identificação"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Nome da central | `E1020000` | string entre aspas | ✅ |
| Senha master | `data-par-todo="senha_master"` | string 4-10 dígitos | ⏳ Java só tem `E1010000` — existe PAR distinto? |
| Senha operador | `E1010000` | string 4-10 dígitos | ✅ |
| Senha de coação (SmartTeclado) | `E1110000` | string | ✅ pânico silencioso |

### 6.2 Card "Atualização"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Atualização automática | `91100000` | bool **invertido** | ✅ Corrigido bug (estava em `910F0000` fictício) |
| Versão atual firmware | `61010000` readonly | string | ✅ |
| Barra de progresso | — | visual | ⏳ sem comando OTA |

### 6.3 Cards "Exportar/Importar configurações" — **backup parcial** (implementado em 2026-05-19)

> **Não confundir com clone (§6.4).** Este é um BACKUP seletivo, salvo localmente pra reverter alterações de configuração específicas. Pra substituir uma central por outra, use Clones.

**Pasta dos snapshots:** `<userData>/backups/<nome>.json` (privado por usuário do SO).

**Schema do JSON (`vetticonfig-backup-1`):**

```jsonc
{
  "schema":    "vetticonfig-backup-1",
  "createdAt": "2026-05-19T12:34:56.000Z",
  "name":      "antes-trocar-rede",
  "source":    { "centralName": "...", "model": "...", "mac": "..." },
  "sections":  ["identificacao","contactid","rede","supervisao"],
  "pars":      { "B1060000": "1234", "E1060000": "vetti.iobi.ddns.info", ... }
}
```

**Mapeamento seção → PARs (`_VC_BACKUP_PAR_GROUPS` em `vetticonfig.js`):**

| Seção | PARs incluídos |
|---|---|
| `identificacao` | `E1020000, E1010000, E1110000` |
| `contactid`     | `B1060000, A1070000, E1060000, B1050000, E10B0000, B1090000, E9020001, E9020002, B1070000` |
| `rede`          | `910A0000, F1010000, F1030000, F1020000, F1040000, 61070000, 61050000, 61060000, E1070000, E1080000, E1090000, E10A0000, 91110000` |
| `supervisao`    | `91130000, A11A0000, 912A0000, 912B0000, 912C0000, 912D0000, 91170000, A1100000, 91140000, 91150000, 91160000, 91240000, 911C0000, 911D0000, 911E0000, 91200000, A1150000` |

**Seções fora desta v1:** `usuario` / `agendamento` / `dispositivos` usam comandos próprios (USER/AGENDA/BD), não cabem no pipeline PAR. As checkboxes existem na UI mas são ignoradas na exportação parcial. Pra incluir esses dados, use Clone completo (§6.4).

**Arquitetura:**

| Camada | Arquivo | Símbolo |
|---|---|---|
| Backend (Node, persistência) | `src/main/services/backups.js`        | `list/save/load/remove/exportAs/importFile` |
| IPC handlers                  | `src/main/ipc/handlers.js`            | `backups:list/save/load/remove/exportAs/importFile` |
| Preload (bridge)              | `src/main/preload.js`                 | `vettiAPI.backups.*` |
| Renderer (UI + leitura PAR)   | `src/renderer/js/vetticonfig.js`      | `_vcAlarmExportBackup / _vcAlarmListBackups / _vcAlarmApplyBackup / _vcAlarmExportFile / _vcAlarmDeleteBackup / _vcAlarmImportFile` |
| HTML                          | `src/renderer/screens/sistema.html`   | `#vcSysBtnSalvarClone, #vcSysBtnImportarJson, #vcSysSavedClones, .vc-backup-sec`*¹ |
| CSS                           | `src/renderer/css/vetticonfig.css`    | `.vc-backup-row / .vc-backup-info / .vc-backup-meta / .vc-backup-actions / .vc-btn.danger` |
| i18n                          | `alarme.*` em 3 JSONs                 | 14 chaves novas (exportando, exportado, aplicando, aplicado, confirmar_aplicar, …) |

*¹ Os IDs dos elementos HTML preservam o nome legado "Clone" por convenção visual e pra não churnar; internamente a feature é "backup".

**Fluxo Exportar (card direito):**

1. Usuário escolhe seções via `.vc-backup-sec`, dá nome em `#vcSysCloneNome`, clica "Salvar".
2. `_vcAlarmExportBackup`: dedupa lista de PARs das seções → envia `PAR <key>` pra cada um → parseia via `_parseParResponse` → coleta `{ <key>: value }`.
3. Monta payload com schema+createdAt+source → envia pro main via `vettiAPI.backups.save(payload)`.
4. Main grava `<userData>/backups/<nome>.json`. Refresh automático da lista no card esquerdo.

**Fluxo Importar (card esquerdo):**

- **Listar:** `_vcAlarmListBackups` → `vettiAPI.backups.list()` → main retorna resumos. Renderer monta linhas com 3 botões: Aplicar / Exportar arquivo / Excluir.
- **Aplicar:** confirmação → itera `data.pars`. Pra cada PAR busca `[data-par="<key>"]` no DOM e usa `_vcWriteParam` (inferência de tipo, validação de range, formatação de aspas). Fallback heurístico (numérico vs string) se o elemento não existir. Conta `{ok, err}`.
- **Exportar arquivo:** `dialog.showSaveDialog` pra copiar o JSON pra fora.
- **Excluir:** confirmação + `unlinkSync`.
- **Carregar arquivo** (botão no header do card): `dialog.showOpenDialog` → valida schema → salva na pasta local pra listar.

**Validação:** main rejeita JSONs cujo `schema !== "vetticonfig-backup-1"` ou sem `pars`.

### 6.4 Card "Clones" — **varredura completa pra substituir central** (implementado em 2026-05-19)

> Cenário: cliente troca a placa Vetti por outra. Geramos um clone da antiga, importamos na nova, ela fica idêntica. Pra simples backup antes de mexer na config, use §6.3.

**Localização do arquivo:** o clone NÃO é persistido no `userData/` — é um arquivo único movível, escolhido via `dialog.showSaveDialog`. Nome sugerido: `<MAC>-<YYYY-MM-DD>.json`.

**Schema do JSON (`vetticonfig-clone-1`):**

```jsonc
{
  "schema":    "vetticonfig-clone-1",
  "createdAt": "2026-05-19T15:00:00.000Z",
  "source":    { "centralName": "...", "model": "...", "mac": "..." },
  "counts":    { "pars": 82, "users": 12, "agenda": 4, "devices": 18, "skipped": 0 },
  "pars":      { "<KEY8>": "<value>", ... },
  "users":     [ { "idx": 1, "raw": "USER Idx=1 Stat=OK Flags=... Nome=\"...\" ..." }, ... ],
  "agenda":    [ { "idx": 1, "raw": "AGENDA 1 Stat:OK Hora:09:00 Freq:3 ..." }, ... ],
  "devices":   [ { "raw": "BDX I/+ raw response" }, ... ]
}
```

**Estratégia de coleta** (em `_vcCloneCollectFull`):

| Bloco | Comando | Iteração | Total típico |
|---|---|---|---|
| PARs | `PAR <key>` | Lista fixa em `_VC_CLONE_ALL_PARS` (união sistema+particao) | 82 keys |
| Usuários | `PAR 610C0000` (bitmap) → `USER Idx=N` pra cada slot `O` | até 99 slots | 1–20 típico |
| Agenda | `AGENDA <i>` em `1..64` | encerra em `Stat:LIV` ou `ERR 27` | 1–10 típico |
| Dispositivos | `BDX I` + `BDX +` | até `ERR 27` (máx 1024) | 5–50 típico |

A coleta é **serial** (UDP não suporta paralelo seguro). Toast persistente atualiza a fase ("Lendo PARs… / Usuários… / Agenda… / Dispositivos…").

**Estratégia de aplicação** (em `_vcAlarmImportClone`):

| Bloco | Como aplica |
|---|---|
| PARs | Mesma do backup: `_vcWriteParam(key, displayValue, el)` quando há `[data-par="<key>"]` no DOM; fallback heurístico numérico/string caso contrário |
| Usuários | Replay do raw: `sendCommand('USER ' + raw.replace(/^USER\s+/, ''))` — o body da resposta de leitura tem o mesmo shape do comando de gravação |
| Agenda | Replay do raw: `sendCommand('AGENDA ' + raw.replace(/^AGENDA\s+/, ''))` — idem |
| Dispositivos | **Não aplica.** Registros BD são gravados no JSON pra auditoria/histórico, mas não são reaplicados porque dependem de pareamento RF físico no painel. Documento mostra o que existia na central origem, mas reinstalação é manual. |

**Confirmação antes de aplicar:** modal `confirm()` lista contagens (PARs/usuários/agenda) e a origem (nome ou MAC), e avisa que **sobrescreve todas as configurações atuais** e que **dispositivos não são reaplicados**.

**Arquitetura:**

| Camada | Arquivo | Símbolo |
|---|---|---|
| Backend (Node, só dialog Save/Open) | `src/main/services/clones.js`         | `exportToFile / importFromFile` |
| IPC handlers                         | `src/main/ipc/handlers.js`            | `clones:exportToFile / clones:importFromFile` |
| Preload (bridge)                     | `src/main/preload.js`                 | `vettiAPI.clones.{exportToFile, importFromFile}` |
| Renderer (coleta + aplicação)        | `src/renderer/js/vetticonfig.js`      | `_vcCloneCollectFull / _vcAlarmExportClone / _vcAlarmImportClone / _vcAlarmBindCloneButtons` + `_VC_CLONE_ALL_PARS` |
| HTML                                 | `src/renderer/screens/sistema.html`   | Card `data-card="alarme-clones"`, `#vcSysBtnGerarClone`, `#vcSysBtnImportarClone` |
| i18n                                 | `alarme.clones_*` em 3 JSONs          | 14 chaves novas (`clones_titulo`, `clones_desc`, `gerar_clone`, `importar_clone`, `clone_lendo_*`, `clone_exportado`, `clone_confirmar`, `clone_aplicando`, `clone_aplicado`) |

**Lista completa de PARs varridos (82 keys):**

```
sistema.html (62 keys, união Identificação+ContactID+Rede+Supervisão+Alarme+Usuário+Avançado):
  61050000  61060000  61070000  91050000  910A0000  91100000  91110000
  91130000  91140000  91150000  91160000  91170000  911A0000  911C0000
  911D0000  911E0000  911F0000  91200000  91210000  91230000  91240000
  91250000  912A0000  912B0000  912C0000  912D0000  A1070000  A1100000
  A1120000  A1150000  A11A0000  A12C0000  A12D0000  B1030000  B1050000
  B1060000  B1070000  B1080000  B1090000  B1120000  B1130000  B1140000
  B1150000  B1160000  E1010000  E1020000  E1060000  E1070000  E1080000
  E1090000  E10A0000  E10B0000  E10E0000  E1100000  E1110000  E9020001
  E9020002  F1010000  F1020000  F1030000  F1040000  F1060000  F1070000

particao.html (extra 20 keys):
  91060000  91080000  91260000  91270000  91280000  91290000  912E0000
  A1030000  A1040000  A1050000  A1060000  A1090000  A10E0000  A10F0000
  A1110000  A1160000  A1190000  A12E0000
```

(Note: `91130000`, `91170000` aparecem em ambas — coletados uma única vez via dedup.)

**Manutenção:** sempre que adicionar um `data-par=...` novo em `sistema.html` ou `particao.html`, adicionar a key também em `_VC_CLONE_ALL_PARS` (em `vetticonfig.js`). Falta dessa sincronização → o clone exporta incompleto.

**Limitações conscientes:**

1. **Dispositivos RF não restauram** (vide acima). O JSON guarda o registro, mas pareamento é físico.
2. **PARs do tipo string com `=` ou `:` no valor** podem precisar de escape adicional ao reaplicar — não foi testado exaustivamente.
3. **Firmware mismatch**: se a central destino é versão muito diferente da origem, PARs novos/removidos podem falhar individualmente — relatório mostra `errPars` no toast final.

### 6.5 Card "Alterar número da conta"

| Campo | PAR | Status |
|---|---|---|
| Nova conta | `B1060000` (duplicado intencional da Contact ID) | ✅ validação `0000`/prefixo `A`/hex |
| Toggle "Alterar" | — UI local | ⏳ handler simples |

### 6.6 Pendências da aba Alarme

1. ⏳ PAR distinto pra senha master (além do `E1010000`)?
2. ⏳ Spec OTA da central.
3. ⏳ Pipeline de clonagem RF de **dispositivos** (atualmente ignorado no restore — só auditoria).

### 6.7 Bugs encontrados e corrigidos

| Bug | Fix |
|---|---|
| Master + Operador apontando ao **mesmo `E1010000`** → sobrescreviam | Master agora `data-par-todo`; Operador mantém `E1010000` |
| "Atualização automática" usava **`910F0000`** (PAR fictício) | Trocado pra `91100000` com `data-par-bool-invert` |
| Cards "Exportar/Importar configurações" originalmente nomeados "clone" — conceito ambíguo com restauração total | Renomeados internamente pra `backups` em 2026-05-19; novo card "Clones" introduzido pra varredura completa |

### 6.8 PARs do Java em "ctrlAlarm" que NÃO pertencem a esta aba

Java tem em `ctrlAlarm` vários PARs que no nosso app vivem na **aba Partição → Alarme** (tempo entrada/saída, modos arme, pânico, PGM, auto-isolar). Tratados quando chegarmos lá.

---

## 7. Tela **Sistema** → aba **Dispositivos** (`sistema.html`)

> **Última auditoria**: 2026-05-19. Comparado contra `CtrlMain.java` (~5300 linhas) + `Comm.java` (deviceTypeDescription) + `Func.kt` (parseType). Alvo: centrais V5+. 20 achados; 4 corrigidos (Tier 1); 16 documentados como pendências por escopo.

A aba não usa pipeline genérico de PARs — opera sobre **banco de dispositivos** via `BDX` / `BD`.

### 7.1 Comandos do BD (validados pelo Java)

| Comando | Função |
|---|---|
| `BDX I` | Inicia iteração; retorna 1º registro |
| `BDX +` | Próximo. Encerra com `ERR 27` |
| `BD <idx>` | Lê detalhado |
| `BD <idx> Nome:"…" p:… z:… zs:…` | Edita (combináveis). Nome máx **20 chars** |
| `BD <idx> Stat:DES` / `Stat:OK` | Desativa / reativa |
| `BD <idx> Stat:DEL` | Exclui (irreversível) |
| `CMD 8` | Modo "aguardando sinal RF". Retorna `CMD 8 <segundos>` |

### 7.2 Tipos de dispositivo (DevType — Func.kt:198-215 + Comm.java:214-258)

| Código BDX | DevType (Kotlin) | Label PT-BR | Sensor? | Categoria |
|---|---|---|---|---|
| `Cen` | CENTRAL | Central de alarme | — | central |
| `CR4` | CR4 | Controle remoto 4 teclas | não | remote |
| `CR8` | CR8 | Controle remoto 8 teclas | não | remote |
| `A` | MAG_CURTO | Sensor de abertura | sim | sensor |
| `ALR` | MAG_LONGO | Sensor de abertura LR | sim | sensor |
| `P` | INFRA_CURTO | Sensor de presença | sim | pir |
| `PLR` | INFRA_LONGO | Sensor de presença LR | sim | pir |
| `Plg` | SMARTPLUG | Smart plug | não | pgm |
| `Ven` | VENTILADOR | Módulo ventilador | não | pgm |
| `Shx` | ABERTURA_SHOX | Sensor de abertura Shox | sim | sensor |
| `AS` | ABERTURA_S | Sensor de abertura S | sim | sensor |
| `IR` | IR_CLONER | Smart IR cloner | não | pgm |
| `Sir` | SIRENE_SEM_FIO | Sirene sem fio | não | sirene |
| `Int` | INTERRUPTOR | Módulo interruptor | não | pgm |
| `TLR` | TRANSMISSOR_LR | Transmissor LR | sim | sensor |
| `Tec` | SMART_TECLADO | Smart teclado | não | teclado |
| `BP` | BOTAO_PANICO | Botão de pânico | não | panico |
| `Fio` | SENSOR_COM_FIO | Sensor com fio | sim | wired |

`SENSOR_COM_FIO` aparece com sufixo `" 1"` ou `" 2"` no rótulo conforme `regIdx==256` (CtrlMain.java:2027-2031).

### 7.3 Matriz Tipo × Zona habilitada (CtrlMain.java:2071-2097, implementado 2026-05-19)

| Categoria | H24 | Temp | Silenc | **Inibido** | Stay | Portão |
|---|---|---|---|---|---|---|
| **Não-sensor** (CR4/CR8/Sir/Plg/Int/IR/Ven/Tec/BP) | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **PIR** (P/PLR) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Sensor comum** (A/ALR/Shx/AS/TLR/Fio) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **UNKNOWN/NONE** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

Checkboxes incompatíveis ficam `disabled` + classe CSS `vc-form-check-disabled` (opacity 0.45). UNKNOWN/NONE também bloqueia botões Salvar/Excluir/Desativar.

### 7.4 Funcionalidades implementadas

| Função | Status |
|---|---|
| Listagem ao ativar a aba | ✅ `_vcDispLoad()` BDX I + BDX + |
| Clique → form edição | ✅ `_vcDispSelectItem(idx)`: tipo + nome + partições + zona |
| Label legível do tipo | ✅ `_vcDevTypeLabel()` mapa Func.kt + sufixo " 1"/" 2" pra SENSOR_COM_FIO |
| Matriz Tipo × Zona | ✅ `_vcDevZoneEnabled()` desabilita opções incompatíveis |
| Bloqueio UNKNOWN | ✅ Salvar/Excluir/Desativar disabled quando tipo não reconhecido |
| Salvar (nome + partições + zona) | ✅ `_vcDispSave()` BD `<idx>` Nome:"X" p:1-3--- z:2TSIPO e relê |
| Excluir | ✅ confirmação + `Stat:DEL` |
| Gravar novo | ✅ `_vcDispAddNew()` CMD 8 + toast com timer |
| Desativar/Reativar | ✅ label alterna conforme estado |
| Refresh pós-cadastro | ✅ poll BDS a cada 4s |
| **PGM Tier 1 — Ação padrão** | ✅ `_parseBdx` agora extrai `Acao:N`. Quando o dispositivo é Plg/Int e firmware suporta (mod=5&ver≥553 ou mod=6&ver≥653 ou mod≥7), o card "Atributos da zona" some e o card "Configuração de PGM" aparece com 4 radios (Ligar/Desligar/Inverter/Pulsar). `_vcDispSave` anexa `Acao:N` ao comando BD |

### 7.5 Bugs encontrados e corrigidos (2026-05-19)

| Bug | Fix |
|---|---|
| Coluna "Tipo" da lista mostrava o código cru (`PLR`, `CR4`) | Mapeamento via `_vcDevTypeLabel()` + tooltip com o código original |
| Zona configurável pra todos os tipos — CR4/CR8 deixava marcar 24h/Portão (sem sentido) | Matriz `_vcDevZoneEnabled()` por categoria |
| INFRA permitia "Portão" marcado | PIR força Portão `disabled` |
| Salvar/Excluir/Desativar funcionavam mesmo com tipo desconhecido | Botões bloqueados quando `!_vcDevIsKnown(tipo)` |
| Form de edição não tinha o tipo visível — usuário precisava ir na lista pra ver | Adicionado label readonly "Tipo:" no topo do form |
| `vcDispEditNome` sem maxlength | `maxlength="20"` |
| Dispositivo PGM (Plg/Int) — UI não permitia editar Ação padrão; save nunca enviava `Acao:` | Card "Configuração de PGM" + parser/save (CtrlMain.java:1910-1944, 4380-4399). Tier 1 |

### 7.6 Pendências (Tier 2 e Tier 3 — escopo grande)

**Tier 2 — paridade visual com Java (cards extras por tipo):**

1. ⏳ **Card "Zonas Seguidoras" (`zs:`)** — só aparece pra sensor em central V5+ ≥509. Hoje não temos o card. Java CtrlMain:2107, payload em `getStrZs`.
2. ⏳ **DevCfgLr** (sinal de vida) — pra ALR/PLR/Shx/TLR/Tec/BP em central≥514, dev≥703. CtrlMain:2150-2180.
3. ⏳ **DevCfgPresencaLr / DevCfgPlrExt** — pra PLR; antiga (devVer<800) vs extendida (devVer≥800 com sensibilidade 0-7 + sup24h). CtrlMain:2160-2195.
4. ⏳ **DevShox** — pra Shx: reedSwitch on/off, manual on/off, sensibilidade 1-5. CtrlMain:2200-2215.
5. ⏳ **DevCfgAs** — pra AS: reed-switch + shoxSens. CtrlMain:2218-2230.
6. ⏳ **DevCfgTxLr** — pra TLR: RfEnabled, TamperEnabled (v707+), InvertedLogic (v709+). CtrlMain:2232-2245.
7. ✅ **DevAutom** Tier 1 implementado (Plg/Int) — card "Configuração de PGM" com 4 radios.
8. ✅ **DevStat** (status row com Bat/Tamper/RSSI/Stat/RX) implementado em 2026-05-20 via listener `[N6]/[N7]` async (Comm.java:1080-1170). Renderiza nas duas telas (Sistema → Dispositivos + Partição). Gate `flagCentral_v554_v654`.
9. ✅ **Modal "Configurações avançadas" (`CMD 13/15`)** implementado em 2026-05-20: Repetidor RF (par 0x21), Ações especiais sirene-sem-fio (par 0x23, Plg/Int v6.04+, com bits Arme/Desarme em v6.05+), Tempo de pulso (par 0x17). Lê/escreve via fluxo CMD 13 → [N14] / CMD 15 → [N16] com encoding little-endian hex.

**Tier 3 — comportamentos auxiliares:**

10. ⏳ **Banner inibido/missing** ("Dispositivo inibido"/"Dispositivo ausente") sobre as estatísticas. CtrlMain:2232-2253.
11. ⏳ **Sufixo "Desativado" no label do tipo em vermelho** quando Stat:DES. CtrlMain:2035-2040.
12. ⏳ **CR4/CR8 em V<5**: única partição permitida (radio behavior em vez de checkbox). CtrlMain:4579-4599. Decisão: ignorar — só suportamos V5+.
13. ✅ **`Acao:` no save** pra Plg/Int (V≥5.53/6.53) — implementado. CtrlMain:4380-4400.
14. ⏳ **`cfg:` no save** pra LR/Shox/AS/TxLr (sinal de vida, sensibilidade, etc.). CtrlMain:4353-4377.
15. ✅ **Painel "Módulo IR"** (`CMD 9/10/11/12`) — implementado em 2026-05-20. 3 radios (Transmitir/Capturar/Apagar) + grid 5×4 com 20 slots. Substitui card PGM quando tipo=IR_CLONER.
16. ✅ **Painel "Comando direto"** (`CMD 3`) — implementado em 2026-05-20. Botões Ligar (100) / Desligar (0) / Inverter (102) / Pulso padrão (101) visíveis pra Plg/Int.
17. ✅ **Combos globais aba Automação** — implementado em 2026-05-20. Card "Acionamentos globais" abaixo da lista, com 2 selects (Sirene = PAR B1010000, Arme = PAR B1020000) populados com Plg/Int.
15. ⏳ **Confirmação ao desativar dispositivo** (dialog longo "ficará sem comunicação"). CtrlMain:4710-4713. Hoje aciona direto.

**Decisões e limitações conscientes:**

- **Suporte só V5+** confirmado em 2026-05-19. Skip: `z:` tamanho variável (sempre 6 chars), Stay sempre 'P'. CtrlMain:4414-4419, 4431-4436. Centrais antigas (mod<5) podem rejeitar save — `_vcUserApplyCompat` equivalente seria útil mas não foi implementado.
- **Cadastro RF** continua usando `CMD 8` + polling `BDS`. Java tem mesma estratégia.

---

## 8. Tela **Sistema** → aba **Usuários** (`sistema.html`)

> **Última auditoria**: 2026-05-19. Comparado contra `CtrlUser.kt` (1200 linhas), `CtrlUserEdit.kt` (1088), `CtrlUserAdd.kt` (116) — Kotlin v3. 18 achados; 12 corrigidos; 6 listados em pendências/TODO.

### 8.1 Comandos validados pelo Java

| Comando | Função |
|---|---|
| `PAR 610C0000` | String 99 chars: `'O'`=ocupado; outros=livre. Capacidade: **99 usuários** |
| `USER Idx=<N>` | Lê. Chaves: `Idx`, `Stat`, `Flags` (8 bits), `Nome`, `Senha`, `Armar`/`Desarmar`/`Pgm` (`part/dow/hi/hf`), `Panico` (só `part`) |
| `USER Idx=<N> Stat=OK Flags=<8> Nome="…" Senha=<4-10dig> Armar=… Desarmar=… Pgm=… Panico=…` | Cria/edita |
| `USER Idx=<N> Stat=DEL` | Exclui |

> **Não existe no protocolo USER (Rev 2 §8)**: `Ctrl`, `CtrlAssoc`, `Remoto`, `RfId` — confirmado contra `CtrlUser.kt`, `CtrlUserEdit.kt`, `UserEdit.fxml`. O campo `Prev` aparece no PDF como "uso futuro" mas o Kotlin ignora.

### 8.2 Formato dos campos

| Campo | Formato | Validação |
|---|---|---|
| `part` (6 chars) | `'1'..'6'` ou `'-'`. Ex `1-3-5-` = P1+P3+P5 | partição vazia = usuário não pode aquela ação |
| `dow` (7 chars) | `D/S/T/Q/Q/S/S` ou `'-'`. Posição é o discriminador (Dom..Sab) | Kotlin aceita qualquer char ≠ `-` como "ligado" (⚠ confirmar em hardware) |
| `hi`/`hf` (5 chars) | `HH:MM` | HH 00-23, MM 00-59, `:` em pos 2 |
| `flags` (8 bits) | armar, armarDataHora, desarmar, desarmarDataHora, pgm, pgmDataHora, panico, **enabled**. `'1'` ou `'-'`/`'0'` | **len obrigatória = 8** (`CtrlUser.kt:1004`). Hoje gravamos `"11111111"` fixo |
| `nome` | máx **20 chars** (`CtrlUser.kt:862`); sem acentos via `deAccent` | input com `maxlength="20"` |
| `senha` | 4..10 dígitos, só numérico | regex `^\d+$` + range |

### 8.3 Funcionalidades implementadas (atualizado 2026-05-19)

| Função | Como |
|---|---|
| Listagem | Lê `PAR 610C0000`, itera só `'O'` enviando `USER Idx=<N>`. Header com 3 colunas: Nome / Cód. auxiliar / Controle associado |
| Compatibilidade FW | `_vcUserApplyCompat`: `mod==5&&ver>=550` ou `mod==6&&ver>=650` ou `mod>=7`. Senão desabilita "Novo" + mostra mensagem |
| Seleção | Clique → preenche nome, senha, num_aux + 4 grupos + combo de controle |
| Salvar | Validação pré-envio (nome 1..20, senha 4..10 só dígitos, horários `HH:MM` válidos). Acentos removidos via `/[̀-ͯ]/g`. Refaz `USER Idx=N` e atualiza lista. **Fecha o card após sucesso**. Persiste controle no storage local. Recarrega bitmap |
| Excluir | Modal `vcConfirm` com sub-mensagem de irreversibilidade. Libera controle associado, recarrega bitmap |
| Novo | Primeiro slot livre via `_vcUserSlots`. Permissões vazias por default — usuário pode ser "só-desarma" sem marcar Armar/PGM/Pânico |
| Cancelar | Se houver pending changes (snapshot do form ≠ original), abre modal "Descartar alterações?" |
| Controle associado | Combo CR4/CR8 do `_vcDispCache`. Filtra `Stat:INV/DEL/LIV`. Controles em uso por outros usuários aparecem **disabled** com label "em uso por: <nome>". Opção `(sem controle)` no topo. Storage local indexado por MAC |
| Exportar usuários | Card próprio: re-fetcha USER de cada slot `O` + snapshot de `_vcUserCtrlAssoc` → JSON `vetticonfig-users-1` via dialog Save |
| Importar usuários | Modal de confirmação → replay raw "USER Idx=N Stat=OK …" pra cada → mescla ctrlAssoc no MAC corrente |

### 8.4 Bugs encontrados e corrigidos (2026-05-19)

| Bug | Fix |
|---|---|
| `_vcUserBuildFlags()` retornava `"1-1-1-11"` (7 chars). Central rejeita len ≠ 8 (`CtrlUser.kt:1004`) | Trocado pra `"11111111"` (todos habilitados) |
| Regex deAccent `/[̀-ͯ]/g` com bytes combinantes invisíveis no source — provavelmente não casava | Trocado pra `/[̀-ͯ]/g` (escape explícito) |
| `vcUserNome` aceitava 32 chars; firmware corta em 20 | `maxlength="20"` na HTML + validação no save |
| Sem validação pré-envio de horários, partição, dow, senha — enviávamos lixo | `_vcUserValidate` espelhando `CtrlUserEdit.kt:869-1060` |
| `_vcUserDelete` usava `window.confirm()` feio | Substituído por `vcConfirm` (helper `vc-confirm-*` reutilizável) |
| Cancelar descartava alterações sem perguntar | Detecta pending changes via snapshot e abre modal "Descartar?" |
| Pós-save: card permanecia aberto e lista não atualizava controle | Card fecha automaticamente; coluna "Controle" da row atualiza via `_vcUserRefreshCtrlCell` |
| Aba não checava versão da central | Gate via `_vcUserApplyCompat` antes do load |

### 8.5 Controle associado — vínculo local-only (transitório)

**Importante:** o cadastro do usuário no protocolo USER **não tem** campo de controle remoto. Hoje guardamos a associação só localmente:

| Aspecto | Valor |
|---|---|
| Storage | `app.getPath('userData')/config.json` |
| Chave | `users.ctrlAssoc.<MAC>` (por central conectada) |
| Formato | `{ "<userIdx>": "<bdIdx>", ... }` — strings |
| Origem dos controles | `_vcDispCache` filtrado por `_vcIsRemoteCtrl` (tipos CR4/CR8 case-insensitive) |
| Filtros visíveis | `Stat:INV/DEL/LIV` excluídos; em uso por outros = `disabled` |
| Importar/Exportar | Inclui no `vetticonfig-users-1` como `ctrlAssoc{}` |

> **TODO — migrar quando o firmware novo liberar suporte nativo:**
> A central nova (em desenvolvimento) terá o controle associado como campo NATIVO do comando USER. Quando o protocolo for atualizado:
> 1. Adicionar o campo no `_parseUser` (provavelmente `Ctrl=NNN` ou similar).
> 2. Adicionar o campo no monte do comando `USER Idx=N Stat=OK …` em `_vcUserSave`.
> 3. Trocar `_vcUserCtrlAssoc` (mapa local) por leitura/escrita direta do registro USER.
> 4. Migrar o storage existente (ler chave `users.ctrlAssoc.*` no boot, mandar pro firmware via writes em massa, depois deletar do storage).
> 5. Manter retrocompatibilidade: se a central detectada for versão antiga (sem campo), continuar usando o storage local com o gate atual.

### 8.6 Pendências da aba Usuários

1. ⏳ **Toggles individuais de Flags** na UI (`armar/armarDataHora/desarmar/desarmarDataHora/pgm/pgmDataHora/panico/enabled`). Hoje hardcoded `"11111111"`. Quando implementar, espelhar `updateVisualComponents` do `CtrlUserEdit.kt:822-862` (desabilita visualmente o `TitledPane` da operação quando a flag desliga).
2. ⏳ **Diálogo de seleção de slot livre** (`CtrlUserAdd.fxml` no Kotlin — tabela 99 linhas livre/ocupado). Hoje pegamos o primeiro livre automaticamente, sem deixar o usuário escolher.
3. ⏳ **Scroll automático** até item recém-criado/editado (Kotlin: `listViewUser.scrollTo`).
4. ⏳ **Botão Gravar disabled** enquanto não há mudança (espelhar `CtrlUserEdit.kt:1059` — `editedReg == originalReg`).
5. ⏳ **DOW encoding** — confirmar em hardware se a central aceita qualquer char ≠ `-` (como Kotlin parser) ou se exige `D/S/T/Q/Q/S/S` específico.
6. ⏳ **Controle associado nativo** — quando firmware liberar (ver §8.5 TODO).

---

## 9. Tela **Sistema** → aba **Agendamento** (`sistema.html`)

> **Última auditoria**: 2026-05-19. Comparado contra `CtrlAgenda.kt` (Kotlin v3 legado, 861 linhas). 8 achados; 6 corrigidos; 2 implementados na sequência.

### 9.1 Comandos validados

| Comando | Função | Status |
|---|---|---|
| `AGENDA <idx>` | Lê registro | ✅ |
| `AGENDA <idx> Stat:OK Hora:HH:MM Freq:n Feriado:0\|1 Mes:m Dia:d DDS:bitmask Acao:n Part:bitmask PGM:idx Desc:"…"` | Cria/edita | ✅ |
| `AGENDA <idx> Stat:DEL` | Exclui | ✅ |

> **Importante**: os PARs `PAR C1010000`–`PAR C10E0000` (arme/desarme programáveis por dia) **retornam `ERR 22`** na central testada — Java envia mas falha. O comando `AGENDA` substitui essa funcionalidade.

### 9.2 Enums (espelham `CtrlAgenda.kt:144-170`)

**`AgendaRegStatus`** (campo `Stat:`):

| String | Significado |
|---|---|
| `OK` | Válido e em uso |
| `LIV` | Livre — fim natural da iteração |
| `DEL` | Deletado — slot reciclável |
| `INV` | Inválido — corrupção / firmware antigo |

**`AgendaFreq`** (campo `Freq:`):

| Valor | Significado |
|---|---|
| `0` | NONE (inválido — não usar) |
| `1` | Anual |
| `2` | Mensal |
| `3` | Semanal |
| `4` | Feriados |

⚠️ Bug histórico — usávamos off-by-one (`0=Anual, 1=Mensal, 2=Semanal, 3=Feriado`). **Corrigido** 2026-05-19.

**`AgendaAcao`** (campo `Acao:`):

| Valor | Significado |
|---|---|
| `0` | NONE (inválido) |
| `1` | Armar |
| `2` | Desarmar |
| `3` | Ligar PGM |
| `4` | Desligar PGM |
| `5` | Pulsar PGM |
| `6` | Armar Stay |
| `7` | Msg Teste CID |

⚠️ Bug histórico — tínhamos `5=PGM Toggle` (não existe no firmware), e faltavam `Armar Stay` e `Msg Teste CID`. **Corrigido** 2026-05-19.

### 9.3 Formato dos campos

| Campo | Formato | Range |
|---|---|---|
| `Hora` | `HH:MM` (5 chars) | 00:00 – 23:59 |
| `Feriado` | int | 0 ou 1 |
| `Mes` | int | **1..12** (firmware exige ≥1 mesmo quando inutilizado) |
| `Dia` | int | **1..31** (idem) |
| `DDS` | 7 chars `D S T Q Q S S` | qualquer não-`-` ativa o dia. Java escreve letras (D=Dom, S=Seg, T=Ter, Q=Qua, Q=Qui, S=Sex, S=Sab); lê com qualquer não-`-` |
| `Part` | 6 chars `1 2 3 4 5 6` | idem |
| `PGM` | int | **1..256** (firmware exige ≥1 mesmo quando não-PGM) |
| `Desc` | string entre aspas | máx **40 chars**, sem acentos (`deAccent`) |

### 9.4 Normalização Mes/Dia/PGM por Freq/Acao (no save)

Firmware rejeita valores fora do range com **ERR 24**. Espelha `CtrlAgenda.kt:469-562`:

| Freq | Mes envia | Dia envia |
|---|---|---|
| 1 Anual | input (1..12, default 1) | input (1..31, default 1) |
| 2 Mensal | **1** fixo | input (1..31, default 1) |
| 3 Semanal | **1** fixo | **1** fixo |
| 4 Feriados | **1** fixo | **1** fixo |

| Acao | PGM envia |
|---|---|
| Armar / Desarmar / Stay / MsgTesteCID (1, 2, 6, 7) | **1** fixo |
| Ligar/Desligar/Pulsar PGM (3, 4, 5) | input (1..256, default 1) |

### 9.5 Visibilidade dinâmica dos campos (`_vcAgendaRefreshFieldVisibility`)

Espelha `radioButtonFreqClicked` e `radioButtonAcaoClicked` do Java.

| Freq | Mes | Dia | DDS checkboxes | Checkbox Feriado |
|---|---|---|---|---|
| 1 Anual | habilitado | habilitado | disabled | normal |
| 2 Mensal | disabled | habilitado | disabled | normal |
| 3 Semanal | disabled | disabled | habilitado | normal |
| 4 Feriados | disabled | disabled | disabled | **disabled** (já é a Freq) |

| Acao | Partições | PGM idx |
|---|---|---|
| 1/2/6 Armar/Desarmar/Stay | habilitadas | disabled |
| 3/4/5 PGM | desabilitadas | habilitado |
| 7 MsgTesteCID | desabilitadas | disabled |

### 9.6 Compatibilidade de firmware

| Feature | Mínimo (mod / version) | Comportamento app |
|---|---|---|
| Aba inteira | `mod≥5 v≥516` ou `mod≥6 v≥605` ou `mod≥7` | `_vcAgendaApplyCompat` esconde form + mostra aviso amarelo no painel |
| Acao 7 (Msg Teste CID) | `mod≥5 v≥561` ou `mod≥6 v≥661` ou `mod≥7` | `<option value="7">` é desabilitado |

`_vcCentralMod` / `_vcCentralVer` extraídos do `INFO SmartAlarm32 VX.YZ` via `_parseCentralModelVersion` (replica `Comm.java:279-303`).

### 9.7 Iteração da lista

- Capacidade máxima: **64** (confirmado em `CtrlAgenda.kt:854: regData.idx < 64`).
- Fim natural: `Stat:LIV` → break.
- Slots `DEL` e `INV` são logados no logger inferior pra debug, **não aparecem na UI**.
- 3 erros consecutivos (timeout) → break por segurança.

### 9.8 Validações no save

| Validação | Erro mostrado |
|---|---|
| `Hora` matches `HH:MM` com hour ≤ 23 e min ≤ 59 | toast warn `agenda.hora_invalida`, save cancelado |
| `Desc` ≤ 40 chars | toast warn `agenda.desc_longa`, save cancelado |

### 9.9 UI (lista)

Cabeçalho `.vc-agenda-grid-head` alinhado por grid-template-columns:

| Coluna | Largura | Conteúdo |
|---|---|---|
| `#` | 50px | idx zero-padded |
| Hora | 70px | `HH:MM` |
| Descrição | 1fr | texto |
| Ação | 100px | label do enum (Armar, Stay, etc) |

### 9.10 Pendências (Agendamento)

1. ⚠️ **Coluna PGM (índice de dispositivo)** — Java usa ComboBox de PGMs derivado do BD. Hoje nosso input é número livre 1..256.
2. ❓ **Lista de feriados** — botão "Lista de feriados" do Figma estava ligado ao comando `CE` (retorna `ERR 8`). Falta firmware esclarecer.
3. ✅ Comportamento quando `Freq=Semanal` mas `Mes/Dia` preenchidos — agora normalizados pelo save (Mes=1, Dia=1).

---

## 10. Tela **Sistema** → aba **Feriados** (`sistema.html`)

> **Implementado em 2026-05-19**. Espelha `CtrlFeriadoList.kt` (Kotlin v3, 401 linhas) com extensões: defaults nacionais pré-empacotados pra 8 países sul-americanos + MX, cálculo automático de feriados móveis (Páscoa via Meeus + derivados).

### 10.1 Comandos validados pelo Java

| Comando | Função |
|---|---|
| `FERIADO <idx>` | Lê registro. Resposta com `Stat:OK/LIV/DEL/INV`, `Mes:M`, `Dia:D`, `Desc:"..."` |
| `FERIADO <idx> Stat:OK Mes:M Dia:D Desc:"..."` | Cria/edita |
| `FERIADO <idx> Stat:DEL` | Exclui slot (libera) |

**Limites da central**: 64 slots (idx 1..64). Sem campo `Ano` — feriado se repete anualmente. Descrição máx 40 chars, gravada sem acentos (`deAccent` NFD).

### 10.2 Defaults nacionais empacotados

Diretório `src/main/data/holidays/`. Um JSON por país, schema `vetticonfig-holidays-1`:

```jsonc
{
  "schema": "vetticonfig-holidays-1",
  "country": "BR",
  "countryName": { "pt-BR": "Brasil", "en": "Brazil", "es-LA": "Brasil" },
  "holidays": [
    { "id": "br-newyear", "name": { "pt-BR": "...", "en": "...", "es-LA": "..." },
      "month": 1, "day": 1 },                          // fixo
    { "id": "br-good-friday", "name": { ... },
      "mobile": "easter-2" },                          // móvel
    ...
  ]
}
```

Países do MVP:

| Código | Nome | Fixos | Móveis |
|---|---|---|---|
| `BR` | Brasil | 9 | 4 (Carnaval seg/ter, Sexta Santa, Corpus) |
| `AR` | Argentina | 12 | 4 |
| `CL` | Chile | 13 | 2 |
| `UY` | Uruguai | 9 | 5 |
| `PY` | Paraguai | 10 | 2 |
| `CO` | Colômbia | 15 | 5 |
| `EC` | Equador | 8 | 3 |
| `MX` | México | 4 | 3 (1ª seg fev, 3ª seg mar, 3ª seg nov) |

### 10.3 Cálculo de feriados móveis

Algoritmo de **Meeus/Jones/Butcher** em `holidays_db.js:_easter(year)` — calcula domingo de Páscoa pra qualquer ano gregoriano. Demais móveis derivam por offset:

| Regra | Significado | Exemplo BR 2026 |
|---|---|---|
| `easter` | Domingo de Páscoa | 05/04 |
| `easter-2` | Sexta-feira Santa | 03/04 |
| `easter-3` | Quinta-feira Santa | 02/04 |
| `easter-47` | Terça de Carnaval | 17/02 |
| `easter-48` | Segunda de Carnaval | 16/02 |
| `easter+39` | Ascensão | 14/05 |
| `easter+60` | Corpus Christi | 04/06 |
| `easter+68` | Sagrado Coração | 12/06 |
| `us-thanksgiving` | 4ª quinta de novembro | — |
| `mx-constitution` | 1ª segunda de fevereiro | 02/02 (2026) |
| `mx-juarez` | 3ª segunda de março | 16/03 (2026) |
| `mx-revolution` | 3ª segunda de novembro | 16/11 (2026) |

### 10.4 Arquitetura

| Camada | Arquivo | Símbolo |
|---|---|---|
| Service CRUD remoto | `src/main/services/feriado.js` | `parseFeriadoResponse / buildWriteCommand / buildDeleteCommand` |
| Service defaults + Meeus | `src/main/services/holidays_db.js` | `listCountries / loadCountry / resolveCountryHolidays` |
| IPC | `src/main/ipc/handlers.js` | `holidaysDb:listCountries / loadCountry / resolveCountryHolidays` |
| Preload | `src/main/preload.js` | `vettiAPI.holidaysDb.*` |
| Renderer | `src/renderer/js/vetticonfig.js` | `_vcFeriadoLoad / _vcFerSave / _vcFerDelete / _vcFerNew / _vcFerCadastrarNacionais / _vcFerAtualizarMoveis` |
| HTML | `src/renderer/screens/sistema.html` | `vcSysFeriados` (entre Agendamento e Buffer) |
| Data files | `src/main/data/holidays/<XX>.json` | 8 países empacotados |

### 10.5 Funcionalidades

| Função | Como |
|---|---|
| Carregar da central | `_vcFeriadoLoad` itera `FERIADO 1`..`64`, encerra em `Stat:LIV` ou ERR 27 |
| Novo feriado | `_vcFerNew` escolhe primeiro slot livre |
| Salvar | `_vcFerSave` valida (mês 1-12, dia válido por mês, desc obrig.), monta `FERIADO N Stat:OK Mes:M Dia:D Desc:"X"`, atualiza cache + linha |
| Excluir | `_vcFerDelete` com modal `vcConfirm` + sub-mensagem irreversível |
| Cadastrar feriados | `_vcFerCadastrarNacionais` resolve feriados do país+ano. **Dedup por dia/mês**: se já houver slot na central com a mesma data, sobrescreve só a descrição (não duplica). Caso contrário, ocupa o próximo slot livre. Toast final indica `(N atualizados)` quando houve dedup |
| Atualizar móveis | `_vcFerAtualizarMoveis` recalcula só os feriados com flag `mobile` pro ano corrente; localiza slots existentes por descrição normalizada (`deAccent` + lowercase) e sobrescreve; usa slot livre se não encontrar |
| Limpar central | `_vcFerLimparTudo` itera todos os slots ocupados (`_vcFerCache`) e envia `FERIADO N Stat:DEL` em sequência. Modal de confirmação destrutiva |

### 10.6 Integração com aba Agendamento

Conforme `CtrlAgenda.kt:128, 406`, o agendamento envia só o flag `Feriado:0|1` — a central cruza com a sua tabela interna no runtime. **Não precisamos validar nada no save do agendamento** — só passar o flag.

Duas semânticas no AGENDA:
- `Freq:4` (`AGENDA_FREQ_FERIADOS`) — "executa **somente** em feriado"
- `Feriado:1` em qualquer outra freq — "também executa em feriado"

### 10.7 Fase 2 — Customização local + Novo país (implementado em 2026-05-19)

**Fase 2A — Customização local por usuário** (`vetticonfig.js:_vcFerOpenGerenciar / _vcFerEditLocal / _vcFerGerenciarSave`):

- Modal "Gerenciar feriados — `<país>`" aberto pelo botão `vcFerBtnGerenciarPais` (lápis no header do card "Cadastro em massa").
- Lista todos os feriados do país: defaults (com checkbox "Ativo" pra ignorar) + customs (editáveis e removíveis).
- Form de edição com campos: Nome, Dia, Mês, Tipo (`national | state | municipal`), Escopo livre (ex.: "SP", "Campinas", "DF").
- Persistência em `config.json` chave `holidays.user.<COUNTRY>`:
  ```jsonc
  {
    "deletedIds": ["br-corpus-christi"],
    "custom": [
      { "id": "user-br-1234", "name": {...}, "month": 9, "day": 11,
        "type": "state", "scope": "SP" }
    ]
  }
  ```
- `resolveCountryHolidays` agora aplica o overlay: oculta `deletedIds`, inclui `custom`. "Cadastrar nacionais" e "Atualizar móveis" usam a lista mesclada automaticamente.

**Fase 2B — "Novo país" via Nager.Date** (`vetticonfig.js:_vcFerOpenNovoPais`):

- Botão `vcFerBtnNovoPais` (`bi-cloud-download`) ao lado de "Atualizar móveis". Tooltip avisa que precisa de internet.
- Modal mostra aviso explícito + combo dos países disponíveis + input ano (default ano corrente).
- **Fetch HTTP roda no main process** via `Electron.net.fetch` (`holidays_db.js:nagerListCountries / nagerImport`). O CSP do renderer (`default-src 'self'` em todos os HTMLs) bloqueia conexões externas direto — rodando no main process, contornamos o CSP sem flexibilizar a regra de segurança. IPC:
  - `holidaysDb:nagerListCountries` → `GET https://date.nager.at/api/v3/AvailableCountries`
  - `holidaysDb:nagerImport(code, year, opts)` → `GET .../PublicHolidays/{year}/{code}` + grava
- Ao importar:
  1. Main faz `net.fetch` da Nager.Date.
  2. `importCountryFromNager` filtra **só por `type/types == "Public"`** (aceita ambos shapes da API v3) — **NÃO filtra por `fixed`**, que se mostrou pouco confiável: a API v3 marca como `fixed: false` muitos feriados que repetem na mesma data todo ano, e o filtro deixava o JSON vazio (ex.: AU/AM/DK gravando `"holidays": []`).
  3. Dedup por id (alguns países retornam múltiplas entradas mesmo nome pra counties distintos — pega a primeira).
  4. Grava `vetticonfig-holidays-1` em `<userData>/holidays-user/<XX>.json`.
  5. Combo principal recarrega; país recém-importado fica disponível imediatamente (marcador `★` no nome).
- País importado tem precedência sobre bundled em caso de colisão (usuário pode "atualizar" um país bundled importando uma versão nova).
- **Limitação documentada**: Nager.Date não devolve regra de móvel — só data já calculada pro ano consultado. Móveis ficam "congelados" na data do ano da importação. Pra atualizar:
  1. Re-importar o país pro novo ano (sobrescreve), OU
  2. Editar via "Gerenciar" adicionando `mobile: "easter-2"` etc. ao registro custom.

### 10.8 Bugs encontrados e corrigidos (2026-05-19)

| Bug | Fix |
|---|---|
| "Novo país" mostrava "Offline" mesmo conectado. O `fetch` direto do renderer caía no CSP `default-src 'self'` de `sistema.html` e abortava com TypeError genérico, que tratamos como "offline". | Movido pro main process via `Electron.net.fetch` (`holidays_db.js:nagerListCountries / nagerImport`). |
| Imports de Australia/Armenia/Denmark gravavam JSON com `holidays: []`. O filtro `fixed: true` rejeitava todos os feriados — a API v3 da Nager.Date marca como `fixed: false` mesmo datas que repetem (campo pouco confiável). | Removido o filtro `fixed`. Mantido só o filtro `type: "Public"` (com fallback pra shape antigo `types: ["Public"]`). |
| "Cadastrar feriados" duplicava se rodado 2x (mesma data ocupava 2 slots distintos). | Dedup por `mes/dia` em `_vcFerCadastrarNacionais`: indexa o `_vcFerCache`; quando a data já existe, sobrescreve a descrição no mesmo slot em vez de criar novo. Toast indica quantos foram atualizados. |
| Botão chamava "Cadastrar nacionais" — confuso com customs/locais já incluídos via overlay. | Renomeado pra "Cadastrar feriados" nos 3 idiomas. |

### 10.9 Pendências (Fase 3 — opcional)

1. ⏳ **Visualização calendário** (grid mensal) em vez de lista.
2. ⏳ **Export/import da lista de feriados** local pra arquivo (parcialmente coberto pelo clone completo da central).
3. ⏳ **Alerta de móveis desatualizados** ao trocar de ano (heurística: comparar datas dos slots móveis com cálculo do ano corrente).
4. ⏳ **Detectar móveis em país importado da Nager.Date**: parser que reconhece "Good Friday"/"Easter Monday"/"Carnaval" pelo nome e adiciona flag `mobile` ao gravar.

### 10.10 Diferença Feriado × Calendar (`CE`)

São features distintas no firmware. **Feriado** é lista de datas. **CE (Calendário de Exceções, comando `CE N ...`, até 50 registros)** é exceção pontual de armagem — em uma data específica, arme/desarme em horário diferente do normal. Não implementado neste MVP — pode virar uma aba futura "Exceções de armagem".

---

## 11. Tela **Sistema** → aba **Buffer** (`sistema.html`)

> **Reimplementado em 2026-05-19** espelhando `CtrlLog.kt` (Kotlin v3). Versão anterior usava parser heurístico key=value e nunca conseguiu ler eventos em firmware moderno.

### 11.1 Comandos validados

| Comando | Função | Resposta | Gate |
|---|---|---|---|
| `LOGX STAT` | Status: capacidade / armazenados / pendentes | `LOGX STAT TOT=1024 USO=N PEND=N` | `mod≥7` ou `mod=5&ver≥554` ou `mod=6&ver≥654` |
| `LOGX NEW <n>` | Lê do mais novo pro mais antigo | `LOGX NEW [reg1][reg2]...` (cada reg = 32 chars hex compactado) | idem |
| `LOGX OLD <n>` | Lê do mais antigo pro mais novo | idem | idem |
| `LOGX DEL` | Apaga todo o log | `LOGX DEL OK` | implementado na aba Avançado |

Sentinela de fim do log: timestamp `0x00000000` ou `0xFFFFFFFF` no 1º campo (`CtrlLog.kt:522`).

**LOG legacy (firmware < V5.54) NÃO suportado** — firmware antigo viola o protocolo (resposta sem envelope `[R<seq>]`), e o produto novo é só M4 (ver `docs/backlog.md`). Em centrais antigas, aba mostra toast "Firmware não suporta LOGX…".

### 11.2 Layout dos registros LOGX (32 chars hex compactados)

| Pos | Bytes | Campo | Decodificação |
|---|---|---|---|
| `[0..8)`  | 4 BE | Timestamp evento (epoch UTC) | hex → Date UTC, formato `yyyy/MM/dd - HH:mm:ss` |
| `[8..12)` | 2 | Conta CID | string hex 4 chars uppercase |
| `[12..16)`| 2 | Código do evento | int 16 bits (lookup → `eventDesc`) |
| `[16..20)`| 2 | Zona / usuário | int |
| `[20..22)`| 1 | Partição | int |
| `[22..24)`| 1 | Interface | byte ASCII (`E`/`G`/`W`/`D` ou ` `) |
| `[24..32)`| 4 BE | Timestamp entrega ao server (epoch UTC); `0xFFFFFFFF` = não enviado |

### 11.3 Mapa de eventos — 40 códigos

Implementado em `_VC_BUF_EV` (`vetticonfig.js`) espelhando `eventDesc()` do Kotlin (`CtrlLog.kt:294-353`). Cada entrada tem `key` (chave i18n em `buffer.eventos.*`) e `sev` (severity: `danger`/`warn`/`arme`/`info`/`success`).

Lógica especial:
- Bit `0x2000` setado → restauração (prefixo "Restauração:")
- Bit `0x0F00 == 0x0400` → arme/desarme (sem prefixo "Evento:"/"Restauração:")
- Códigos compostos (`__arme_desarme_usuario`, `__pgm_ligado_desligado`, `__fw_start_stop`) resolvem 2 chaves diferentes conforme o bit `0x2000`.

### 11.4 Funcionalidades implementadas

| Função | Como |
|---|---|
| Status do log | `LOGX STAT` disparado no boot da aba (preenche TOT/USO/PEND) e antes de cada carga |
| Carregar | Radios "Mais novo→antigo / Mais antigo→novo" + "Todos / Apenas N". `_vcBufferFetch` loop `LOGX NEW/OLD <n>` até sentinela ou limite. Registros vão direto pra DOM via `_vcBufferAppendRow` |
| Severidade visual | Classe CSS `vc-buffer-sev-<danger/warn/arme/info/success>` aplicada por linha (cor dinâmica) |
| Exportar PDF | Botão no header, gera PDF A4 via `vettiAPI.report.exportPdf` (payload genérico `{title, central, columns, rows}`) |
| Exportar CSV | Mesmo, mas via `exportCsv`. BOM UTF-8 + cabeçalho de central + linha vazia + tabela |
| Limpar buffer | ✅ `LOGX DEL` na aba Avançado (já existia) |
| Gate de FW | `_vcBufferFwSupported()` checa `mod≥7` ou `mod=5&ver≥554` ou `mod=6&ver≥654` |

### 11.5 Bugs encontrados e corrigidos (2026-05-19)

| Bug | Fix |
|---|---|
| `_vcBufferFetch` chamava só `LOGX STAT` e jogava resposta no parser de eventos — nunca lia registros de fato | Reescrito com loop `LOGX NEW/OLD <n>`, parser posicional 32 chars |
| Parser usava heurística key=value (`Conta=... Evento=...`) — formato totalmente diferente do real | Parser posicional novo (`_vcBufferParseLogxRecord`) |
| Capacidade hardcoded "2048" no HTML (correto: 1024) | Atualizado pra `1024` |
| Nenhuma decodificação de evento — `Evento` mostrava `null`/`undefined` | Map `_VC_BUF_EV` com 40 códigos espelhando Java |
| Sem distinção entre evento e restauração (bit 0x2000) | `_vcBufferEventDesc` aplica prefixo correto |
| Sem decodificação de interface (E/G/W/D) | Byte ASCII na pos [22..24) lido e formatado |
| Sem timestamp formatado | `_vcBufferEpochToStr` formata UTC `yyyy/MM/dd - HH:mm:ss` |
| Sem opção ordem (novo/antigo) | Radios `vcBufferOrdem` adicionados, dispatcham `LOGX NEW` vs `LOGX OLD` |
| Sem export | Botões PDF/CSV no header reusam `vettiAPI.report` com payload genérico (suporte adicionado em `report.js`) |
| **Pós-rollout 2026-05-20**: parser esperava `[reg1] [reg2]` (cada registro entre colchetes), central retorna `LOGX NEW 1 hex1 hex2 ... hex7]` (colchete só no fim) — eventos zerados | Tokenizer relaxado: tokenize por whitespace, aceita 32 chars hex contíguos |
| **Pós-rollout 2026-05-20**: bit 0x2000 invertido em 0x401/0x403/0x407/0x860/0x903 — "Arme" virava "Desarme" e vice-versa | Mapeamento corrigido espelhando `CtrlLog.kt:323-346` literalmente (`isRestoration ? primeira : segunda`) |
| **Pós-rollout 2026-05-20**: tsEvent=0 era tratado como sentinela e parava o loop após 6-12 registros (perdia o restante) | Sentinela só `0xFFFFFFFF`; tsEvent=0 vira "1970/01/01..." (registros válidos com RTC não-ajustado, como Java mostra) |
| **Pós-rollout 2026-05-20**: 2ª chamada de "Carregar" não disparava `LOGX NEW` — race entre `_vcBufferStat()` fire-and-forget e o loop | `_vcBufferStat()` agora é `await`ed antes do loop (UDP serializa, mas evita race em sessões TCP remoto) |
| **Pós-rollout 2026-05-20**: header "Capacidade/Armazenados/Não enviados" sempre zerado | Regex case-insensitive (central retorna `Tot=`/`Uso=`/`Pend=` em Title Case, não UPPERCASE) |

### 11.6 Filtro de eventos (implementado 2026-05-20)

Popover ancorado no botão funil (mesmo padrão do Buffer / Partição → Dispositivos). 4 critérios combinados (AND):

| Critério | Tipo | Casos |
|---|---|---|
| Severidade | combo | Todos / Disparos (danger) / Falhas (warn) / Armagem (arme) / Sistema (info) / Sucesso (success) |
| Partição | combo | Todas / P1..P6 (compara contra `e.part`) |
| Texto livre | input | Substring case-insensitive em `desc + account + eventHex` |
| Intervalo | 2 date pickers | Compara contra `tsEvent` (epoch UTC → yyyy-mm-dd) |

Indicador visual: funil fica azul (`.vc-buffer-filtro-on`) + badge `shown / total` ao lado quando filtro ativo. Export PDF/CSV passa pela lista filtrada (`_vcBufferFilteredRows()`).

### 11.7 Pendências

1. ⏳ **Persistir** ordem/qtde em `localStorage` (Java tem `AppCfg.getLogReadOrder()`).
2. ⏳ **Auto-select 1ª linha** após carga.

---

## 11.5 Tela **Partição** → aba **Dispositivos** (`particao.html`)

> **Fase 1 implementada em 2026-05-19**. Acessada via sidebar (`particao.html?n=1`..`6`). Compartilha estrutura de tabs com Sistema mas tem seus próprios cards de Dispositivos / Alarme / Tempo.

### Funcionalidades implementadas

| Função | Como |
|---|---|
| Lista filtrada por partição | `_vcParDispLoad(_vcParCurrent)` chama `_vcDispCacheLoad()` (refactor 2026-05-20 — não depende de UI da tela Sistema) e renderiza via `_vcParDispRender()` |
| Lista da partição | Colunas: Zona/Nome/Tipo/Versão (sem `:` no header). Label tipo via `_vcDevTypeLabel` |
| Click → seleção | `_vcParDispSelectItem(idx)` preenche nome + status row (eventos `[N6]/[N7]`) + placeholders dos cards M4 |
| Filtro tipo + nome (popover) | `_vcParDispOpenFilterPopover()` ancorado no funil. Tipo = combo dinâmico com tipos únicos presentes na partição corrente (label legível); Nome = substring case-insensitive em `d.nome`. Indicador visual (funil azul + badge `shown / total`) quando ativo. AND entre os 2 critérios |
| Status row (`Bat/Tamper/RSSI/Stat/RX`) | Listener global `_vcDispInstallStatusListener` registra `onAsyncEvent`; quando chega `[N6]` ou `[N7]`, parseia `Bat/LowBat/Tamper/Rssi/Stat/SupRf/Tipo/Ver` e atualiza `_vcDispCache[idx]` + spans da UI ativa. Gate FW `flagCentral_v554_v654` |
| Salvar | `_vcParDispSave()` envia `BD <idx> Nome:"X"`. Só nome — atributos de zona/partição são globais (botão "Editar atributos completos" leva pra Sistema → Dispositivos com pré-seleção via `?disp=N`) |
| Botão "Editar atributos completos" | Deep-link `sistema.html?disp=N#vcSysDispositivos` — `vcSistemaInit` detecta o param, ativa a aba Dispositivos programaticamente (sem `.click()` que tava ficando em Contact ID), carrega BDX se cache vazio e seleciona o item |

### Aviso visual + placeholders (decisão 2026-05-20)

Status row foi **ativado** via `[N6]/[N7]` async (Comm.java:1080-1170, gate `flagCentral_v554_v654`). Os **3 blocos restantes** continuam placeholder porque **não existem no firmware atual** (Kotlin v3 + protocolo Rev 2 não têm comandos equivalentes — confirmado por busca exaustiva). São recursos da central nova **SmartAlarm-M4** (sem documentação ainda).

**Decisão**: deixar a UI dos 3 blocos restantes montada conforme Figma, mas **todos os controles desabilitados** (`disabled` + classe CSS `vc-par-disp-todo` com opacidade 0.55 e `pointer-events: none`). Banner amarelo (`vc-par-disp-todo-banner`) acima dos blocos explica explicitamente que aguardam firmware novo.

**Blocos placeholder:**

| Bloco | Conteúdo | Comando esperado (M4) |
|---|---|---|
| Funções da zona | 7 checkboxes (24h, Stay, Temporizado, Função portão, Silencioso, Seguidora, Inibido) **por partição** | A definir — Java tem `BD <idx> z:` mas global, não por partição |
| Grupo de zonas pareadas | 8 checkboxes (Grupo 1-8) | A definir |
| Configurações específicas | Toggle "Monitoramento do tamper" | A definir |

Quando a doc do firmware M4 chegar:
1. Remover banner + classe `vc-par-disp-todo` dos blocos.
2. Implementar comandos de leitura/gravação correspondentes em `_vcParDispSelectItem` e `_vcParDispSave`.
3. Bind do click handler nos toggles/checkboxes.
4. Atualizar este doc removendo o "placeholder" e descrevendo o protocolo real.

**Status atual** (o que está funcionando):
- Lista filtrada pela bitmask de partição do `BD` global ✅
- Edição de nome (único campo gravável hoje) ✅
- Botão "Editar atributos completos" → leva pra Sistema → Dispositivos com pré-seleção via `?disp=N` ✅

---

## 12. Tela **Sistema** → aba **Avançado** (`sistema.html`)

Aba **escondida** — revela com **Ctrl+Shift+click no header**. Espelha `gridPaneHeaderMiddleClick` do Java (`CtrlMain.java:5161`).

### 11.1 Card "Opções avançadas"

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| Beta teste | `91050000` | bool | ✅ |
| Atualização de firmware automática | `91100000` | bool **invertido** (0=Sim, 1=Não) | ✅ |
| Preservar senha ao apagar memória | `91230000` | bool (v554+) | ✅ |
| Autoriza conexão do APP | `91250000` | bool **invertido** (0=Permitir, 1=Bloquear) (v559+) | ✅ |
| Nome da empresa de monitoramento | `E1100000` | string entre aspas (v554+) | ✅ |

### 11.2 Card "VettiLogger"

| Campo | PAR / comando | Tipo | Status |
|---|---|---|---|
| Modo local (radio) | `CMD 18 0` write; `PAR 911B0000` read | int | ✅ |
| Modo remoto (radio) | `CMD 18 1` | int | ✅ |
| Porta UDP ethernet (debug) | `B1030000` | int | ✅ |
| Porta UDP Wi-Fi (debug) | `B1080000` | int | ✅ |
| URL servidor remoto | `E10E0000` | string entre aspas | ✅ |
| Porta UDP remoto eth | `B1120000` | int | ✅ |
| Porta UDP remoto wifi | `B1130000` | int | ✅ |
| Porta UDP remoto GPRS | `B1140000` | int | ✅ |
| Prazo máximo (dias) | `A1120000` | int | ✅ |
| Timestamp último log (label) | `41040000` readonly | — | ⚠️ lido mas não exibido |

### 11.3 Card "Modo sniffer" — PAR `A1080000`

| Valor | Estado |
|---|---|
| `0`   | Desativado |
| `124` | Sniffer + Contact ID |
| `123` | Somente sniffer |
| `125` | Somente cadastrados |

### 11.4 Card "Comandos especiais"

| Botão | Comando | Status |
|---|---|---|
| Limpar buffer | `LOGX DEL` (v554+) → fallback `LOG DEL` | ✅ com confirmação |

### 11.5 Card "Nome do arquivo para atualização de firmware"

| Botão | Comando | Status |
|---|---|---|
| Atualizar | `CMD 60 "<arquivo>"` | ✅ default `SmartAlarm.txt`; persistido em storage local |

### 11.6 Card "Interface de comunicação com o teclado" (MNS)

| Campo | PAR | Tipo | Status |
|---|---|---|---|
| IP ethernet | `F1060000` | string IPv4 (v553+) | ✅ |
| Porta ethernet | `B1150000` | int | ✅ |
| IP Wi-Fi | `F1070000` | string IPv4 | ✅ |
| Porta Wi-Fi | `B1160000` | int | ✅ |

### 11.7 Card "Sirene sem fio (firmware >= v7.00)"

**Low Duty Cycle:**

| Campo | PAR | Range | Status |
|---|---|---|---|
| Tempo ligado (ms)   | `A12C0000` | 1..255      | ✅ |
| Tempo desligado (ms) | `A12D0000` | 10..2550 (gravado `/10`) | ✅ |

**Tom da sirene** — packed 32 bits em `C1020000`:

```
bits 0-5   freq1  (6 bits)
bits 6-10  time1  (5 bits)
bit  11    ramp1  (0=Borda, 1=Rampa)
bits 12-17 freq2  (6 bits)
bits 18-22 time2  (5 bits)
bit  23    ramp2  (0=Borda, 1=Rampa)
```

Botão **TX** chama `actionButtonAdvSirenToneTx` — escreve LDC + tom de uma vez. ✅

### 11.8 Pendências da aba Avançado

1. ⚠️ Labels dos selects de **frequência** (`Tom 1..64`) e **tempo** (`50..1600ms`) são placeholders — sem tabela real do firmware. Índices corretos (0..63 / 0..31).
2. ⏳ `labelAdvLoggerTimestamp` (`PAR 41040000`) — lemos mas não exibimos.
3. ⏳ Customer Code (`comboBoxAdvCustomerCode` + `CMD 28 <idx>`) e GSM IPv6 (`91220000`, `E10F0000`, `610A0000`) — só em centrais específicas, não incluídos.
4. ⏳ Botão "Buscar IPv6 do modem" (`actionButtonAdvGsmIpv6` → `PAR 610A0000`) — não implementado.

---

## 13. Inconsistências detectadas (não-bloqueantes)

### 12.1 PAR `91130000` com labels diferentes em telas diferentes

Java mapeia `91130000` como `checkBoxAlarmMonitorarSireneComFio` (0=monitora, 1=não monitora). No HTML aparece em **3 contextos**:

| Tela / HTML | Label | Provável correção |
|---|---|---|
| `sistema.html:364` | "Monitorar a presença da sirene com fio…" | ✅ bate com Java; `data-par-bool-invert` aplicado |
| `particao.html:231` | "Acionar a sirene na violação do tamper dos dispositivos." | ⚠️ label não combina — PAR provavelmente **errado** aqui |
| `zona-compartilhada.html:126` | "Acionar a sirene na violação…" | ⚠️ mesmo caso |

**Ação:** quando chegarmos nas abas Partição e Zona, confirmar com firmware o PAR correto pra "acionar sirene em violação tamper".

### 12.2 PARs com `data-par-bool-invert` aplicados

| PAR | Tela | Label | Semântica firmware |
|---|---|---|---|
| `910A0000` | Sistema → Rede | "Ativar DHCP" | 0=DHCP, 1=Static |
| `91100000` | Sistema → Alarme + Avançado | "Atualização automática" | 0=Sim, 1=Não |
| `91250000` | Avançado | "Autoriza conexão APP mobile" | 0=Permitir, 1=Bloquear |
| `91130000` | Sistema → Supervisão | "Monitorar a presença da sirene" | 0=Monitora, 1=Não monitora |
| `912D0000` | Sistema → Supervisão | "Horário variável" | 0=Variável, 1=Fixo |

> O atributo `data-par-bool-invert` no `<input type="checkbox" data-par-bool>` faz o app inverter automaticamente o bit ao ler e ao gravar. Usar sempre que a semântica do bit no firmware for **oposta** ao significado da label da UI.

### 12.3 ERR 24 em comandos estruturados

ERR 24 = "valor fora do range em comando estruturado". Aparece em `AGENDA` quando Mes/Dia/PGM violam validação do firmware (ver §9.4). Pode aparecer em outros comandos estruturados — checar quando aparecer.

---

## 14. Modal de Conexão — aba **Backup de conexões** (`index.html`)

> **Implementado em 2026-05-19** após perda silenciosa do `vc_remote_connections` no LevelDB do localStorage. A aba serve pra prevenção (export/import) — o hardening abaixo previne o cenário se repetir.

### 13.1 UI

| Elemento | ID | Onde |
|---|---|---|
| Aba no modal | `vc-tab` com `data-tab="vcPanelBackup"`, ícone `bi-arrow-down-up` | `index.html:113` |
| Badges contagem | `#vcBackupCntLocais` / `#vcBackupCntRemotas` | `index.html` painel backup |
| Botões | `#vcBtnExportarConns` / `#vcBtnImportarConns` | idem |
| Logger | `#vcLoggerBodyBackup` | idem |
| CSS | `.vc-backup-conn-info / .vc-backup-conn-row` | `vetticonfig.css` |

### 13.2 Schema do JSON exportado (`vetticonfig-connections-1`)

```jsonc
{
  "schema":    "vetticonfig-connections-1",
  "createdAt": "2026-05-19T...",
  "locals":    [ { "mac": "FC-0F-E7-32-3B-D2", "password": "1234" }, ... ],
  "remotes":   [ { "mac": "...", "conta": "...", "url": "...", "porta": 9018, "nome": "...", "senha": "..." }, ... ]
}
```

### 13.3 Pipeline

| Camada | Arquivo | Símbolo |
|---|---|---|
| Backend (Node) | `src/main/services/connections_io.js` | `exportToFile / importFromFile / applyLocals / countLocals` |
| IPC | `src/main/ipc/handlers.js` | `connsIo:exportToFile / importFromFile / applyLocals / countLocals` |
| Preload | `src/main/preload.js` | `vettiAPI.connsIo.*` |
| Renderer | `src/renderer/js/vetticonfig.js` | `vcBackupConn{Export,Import,RefreshCounts,BindButtons}` |

### 13.4 Hardening do storage (mesma data)

Causa raiz da perda original: as remotas viviam só em `localStorage['vc_remote_connections']` (LevelDB do Chromium do renderer), que é frágil — compactação, cache cleared, crash do renderer, etc. podem zerar sem aviso.

**Mudanças aplicadas:**

1. **Migrado pra `config.json`**: nova chave `remote_connections` no storage IPC (mesmo lugar de `credentials.*`). Cache in-memory (`_vcRemoteCache`) preserva a API sync de `vcRemoteListGet/Save`. Migração transparente: no boot, se houver `vc_remote_connections` no localStorage, copia pro IPC e limpa o legacy.
2. **Write atômico** em `storage.js`: `writeAll` grava em `config.json.tmp` + `fsyncSync` + `rename`. Se o app crashar no meio da escrita, `config.json` mantém o estado anterior (rename é atômico em POSIX/NTFS).
3. **Backup rotativo**: antes de cada write, snapshot do `config.json` atual em `<userData>/config.backups/config.<ISO-ts>.json`. Máximo 5 arquivos (rotação FIFO). Recupera manual: copiar um deles em cima do `config.json`.
4. **Auto-recover na leitura**: se `readAll` falhar ao parsear JSON (corrupção), varre `config.backups/` do mais recente pro mais antigo, restaura o primeiro válido e devolve. Silencioso — o resto do app não precisa saber.

**Frequência das gravações**: o `config.json` muda só em eventos esparsos (conectar central nova, vincular controle, adicionar/remover remota). Cada save gera 1 backup → 5 backups cobrem confortavelmente o histórico recente sem encher disco.

### 13.5 Manutenção

- Sempre que adicionar uma nova chave pra "dados persistentes do usuário" (algo que doeria perder), gravar no storage IPC (`vettiAPI.storage.{get,set}`), NÃO em `localStorage`. localStorage é OK pra preferências reversíveis (idioma, altura do logger).
- Se um campo precisar de write síncrono (raríssimo no nosso app — UI sempre tem tempo de aguardar IPC), seguir o padrão `_vcRemoteCache` + `vcRemoteListEnsureLoaded` + fire-and-forget IPC set.

---

## (próximas telas serão adicionadas conforme formos mapeando)

Pendentes:

- **Partição 1-6** (3 abas internas: Dispositivos, Alarme, Tempo) — PARs do Java em "ctrlAlarm" listados em §6.8 vivem aqui
- **Zona compartilhada** — caso especial de `zs:` no BD
- **Configurações** (5 sub-itens locais: Geral, Aparência, Padrão de fábrica, Avançado, Sobre) — não envolve central, lógica é client-side

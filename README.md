# VettiConfig v4.0

Aplicativo desktop (Electron) para configuração e monitoramento das centrais de alarme **Vetti SmartAlarm**. Roda 100% **offline** — toda comunicação acontece diretamente com a central por rede local (UDP) ou via servidor de monitoramento (TCP).

- Tela inicial com descoberta de centrais por broadcast UDP.
- 11 telas internas (Status, Sistema com 9 abas incluindo a **Avançado** secreta, Partição 1-6, Zona compartilhada, Configurações).
- Suporte a três idiomas (pt-BR / en / es-LA) com ~660 strings traduzidas — paridade integral garantida.
- Tema claro e escuro.
- **Logger persistente em cada tela**: auto-scroll opcional + 3 botões (±5 linhas, maximizar) com altura compartilhada entre telas e sessões.
- **Aba Avançado escondida** (espelha o `tabAdvanced` da versão Java — revela com Ctrl+Shift+click no header da central). Mapa completo dos PARs de fábrica em `docs/comandos-que-faltam.md`.
- Simulador de central (`sim/`) para testar sem hardware.

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Rodando o app](#rodando-o-app)
- [Gerando instaladores](#gerando-instaladores)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura (main + renderer)](#arquitetura-main--renderer)
- [Comunicação com a central](#comunicação-com-a-central)
- [Engine de leitura e gravação de parâmetros](#engine-de-leitura-e-gravação-de-parâmetros)
- [Simulador de central](#simulador-de-central)
- [Ferramentas auxiliares](#ferramentas-auxiliares)
- [Logger compartilhado entre telas](#logger-compartilhado-entre-telas)
- [i18n](#i18n)
- [Stack](#stack)

---

## Pré-requisitos

### macOS (Intel ou Apple Silicon)

- **Node.js 18+** — recomendado via [nvm](https://github.com/nvm-sh/nvm) ou [Homebrew](https://brew.sh/) (`brew install node`).
- **Xcode Command Line Tools** — `xcode-select --install` (necessário para compilar dependências nativas).
- Para gerar `.dmg`: nada além do Node + npm já é suficiente.

> A build do instalador Windows (`.exe`) **não é feita a partir do macOS** neste projeto — é feita direto em uma máquina Windows (ver guia [`GUIA-WINDOWS.md`](GUIA-WINDOWS.md)).

### Windows 10/11

- **Node.js 18+** — instalador oficial [nodejs.org](https://nodejs.org/) (LTS).
- Em Windows 11 com Node 18+, normalmente o Visual Studio Build Tools já vem com `npm install`.

Para usuários que estão apenas testando o app no Windows, há um passo a passo dedicado em [`GUIA-WINDOWS.md`](GUIA-WINDOWS.md).

### Linux

- **Node.js 18+** + `build-essential` (Debian/Ubuntu) ou equivalente.

---

## Instalação

```bash
git clone https://github.com/LeoMorais0930/vetticonfig-electron.git
cd vetticonfig-electron
npm install        # ~200 MB do Electron na primeira vez
```

---

## Rodando o app

```bash
npm start          # roda normalmente
npm run dev        # roda com DevTools aberto (NODE_ENV=development)
```

Na primeira execução, o app abre na tela inicial (logo VETTI pulsante). Clique em **Nova Conexão** para descobrir centrais na rede local ou conectar via servidor de monitoramento.

> **Dica**: se você não tem uma central física, rode o [simulador](#simulador-de-central) em outro terminal (`node sim/server.js`) — ele aparece no scan automaticamente.

---

## Gerando instaladores

```bash
npm run dist:mac     # .dmg arm64 + x64 (rodar no macOS)
npm run dist:win     # .exe NSIS         (rodar no Windows)
npm run dist:linux   # .AppImage         (rodar no Linux)
npm run dist         # detecta o SO atual
npm run pack         # só empacota (sem instalador), útil para debug
```

Cada target é gerado **na sua respectiva plataforma** — sem cross-build. Para o instalador Windows, ver [`GUIA-WINDOWS.md`](GUIA-WINDOWS.md) (testadores rodam `npm run dist:win` diretamente no Windows).

Saída em `dist/`. O ícone fica em `build/icon.png` (precisa ser ≥ 512x512 — o repo já contém um 1024x1024).

**Assinatura de código (macOS)** — sem certificado Apple Developer ID válido, o build usa **ad-hoc signature**. Usuários terão de fazer "Abrir mesmo assim" no Gatekeeper na primeira execução. Para distribuição pública, configure `CSC_LINK` e `CSC_KEY_PASSWORD` antes de buildar (ver [electron.build/code-signing](https://www.electron.build/code-signing)).

---

## Estrutura de diretórios

```
vetticonfig/
├── package.json
├── README.md
├── CLAUDE.md                ← convenções e arquitetura para IA
├── build/
│   └── icon.png             ← ícone 1024x1024 para empacotador
├── src/
│   ├── main/                ← MAIN PROCESS (Node.js)
│   │   ├── main.js          ← entry: cria BrowserWindow
│   │   ├── preload.js       ← contextBridge → window.vettiAPI
│   │   ├── ipc/
│   │   │   └── handlers.js  ← registra ipcMain.handle('namespace:method', …)
│   │   ├── services/
│   │   │   ├── network.js   ← discovery, autenticação UDP/TCP, sendCommand
│   │   │   └── storage.js   ← config persistente em JSON (userData)
│   │   └── lib/
│   │       ├── protocol.js  ← CRC-8/ITU + parser/builder de frames binários
│   │       └── datetime.js  ← timestamps formatados
│   └── renderer/            ← RENDERER PROCESS (Chromium)
│       ├── index.html       ← tela inicial (descoberta + modal Nova Conexão)
│       ├── screens/         ← telas internas (um HTML por tela)
│       │   ├── vetticonfig-status.html
│       │   ├── sistema.html         ← 8 abas (Contact ID, Rede, Supervisão, …)
│       │   ├── particao.html        ← ?n=1..6 (3 abas: Disp, Alarme, Tempo)
│       │   ├── zona-compartilhada.html
│       │   └── configuracoes.html   ← 5 sub-itens (Geral, Aparência, …)
│       ├── css/vetticonfig.css      ← design tokens, classes vc-*
│       ├── js/vetticonfig.js        ← lógica de UI, engine PAR, tooltips
│       ├── i18n/
│       │   ├── vetticonfig-i18n.js  ← engine (data-i18n)
│       │   ├── pt-BR.json
│       │   ├── en.json
│       │   └── es-LA.json
│       ├── assets/fonts/    ← Inter (.woff2/.woff offline)
│       └── vendor/bootstrap/← Bootstrap 5 + Bootstrap Icons local
├── sim/                     ← simulador de central (Node standalone)
│   ├── server.js
│   └── README.md
├── tools/
│   ├── test-protocol.js     ← auditoria contra central real → markdown
│   └── figma-export.js      ← dump da estrutura Figma via API
└── dist/                    ← saída de build (gitignored)
```

Itens **não versionados** (no `.gitignore`): `node_modules/`, `dist/`, `docs/` (PDFs proprietários do protocolo), `antigo/` (projeto piloto de referência), `figma-export/` (~21 MB, regerável).

---

## Arquitetura (main + renderer)

Padrão Electron com dois processos isolados:

```
┌──────────────────────────┐                    ┌──────────────────────────┐
│   MAIN (Node.js)         │                    │   RENDERER (Chromium)    │
│   src/main/              │  ← ipc / preload → │   src/renderer/          │
│                          │                    │                          │
│   - net/dgram (UDP/TCP)  │                    │   - HTML/CSS/JS vanilla  │
│   - filesystem           │                    │   - Bootstrap 5          │
│   - protocol parser      │                    │   - i18n custom          │
│   - app lifecycle        │                    │   - vcTip tooltip        │
└──────────────────────────┘                    └──────────────────────────┘
```

O renderer roda em **sandbox**: não tem acesso direto ao Node. Todas as chamadas para o backend passam por `window.vettiAPI.*`, exposto pelo preload via `contextBridge`.

**Para adicionar uma nova capacidade backend:**

1. Implementar a lógica em `src/main/services/<feature>.js`.
2. Registrar o handler em `src/main/ipc/handlers.js`:
   ```js
   ipcMain.handle('feature:method', (_e, ...args) => myService.method(...args));
   ```
3. Expor no preload em `src/main/preload.js`:
   ```js
   feature: { method: (...args) => ipcRenderer.invoke('feature:method', ...args) }
   ```
4. Usar de qualquer tela:
   ```js
   const result = await window.vettiAPI.feature.method(arg);
   ```

---

## Comunicação com a central

Toda comunicação segue o documento **VETTI - Protocolo VettiConfig - Rev 2** (PDF interno, não versionado). Implementação em `src/main/services/network.js` e `src/main/lib/protocol.js`.

### Formato das mensagens

ASCII puro, sempre delimitado por colchetes:

```
[T<NNN> <CORPO>]      ← request (cliente → central). NNN = sequencial 001-999
[R<NNN> <RESPOSTA>]   ← reply correlacionado (central → cliente)
[N<NNN> <EVENTO>]     ← evento assíncrono (central → cliente, sem request)
```

O sequencial é decimal, 3 dígitos zero-padded, contador independente por sessão. Reply é correlacionado pelo mesmo `<NNN>` do request.

### 1) Descoberta (discovery) — broadcast UDP

A descoberta envia `[T001 ID]` por broadcast UDP na porta 5000 em todas as interfaces de rede ativas. Centrais respondem `[R001 <Mac:… IP:… Modelo Versão Nome:"…">]`.

```js
const ifs = await window.vettiAPI.network.listInterfaces();
const broadcasts = ifs.map(i => i.broadcast);
window.vettiAPI.network.onDiscoveryFound(c => /* { ip, raw, name } */);
window.vettiAPI.network.onDiscoveryDone(({ total }) => /* fim */);
await window.vettiAPI.network.discover(broadcasts);
```

Backend: cria socket `dgram`, faz `setBroadcast(true)`, envia 4 frames com 50ms de intervalo em cada broadcast, agrega respostas com dedup por IP de origem, encerra após timeout (2000ms).

### 2) Conexão local — UDP unicast

Após escolher uma central, autenticar com a senha de 4 dígitos:

```js
const r = await window.vettiAPI.network.authenticate(ip, '1234');
// r === { ok: true }                       sessão aberta
// r === { ok: false, errorCode: 7 }        senha inválida
// r === { ok: false, error: 'timeout' }    sem resposta
```

Backend abre socket `dgram`, envia `[T001 PSW 1234]` para `<ip>:5000` ASCII puro. Se a central responde `[R001 PSW OK]`, a sessão fica aberta — o **mesmo socket** é mantido vivo para os comandos seguintes e para eventos assíncronos `[N…]`.

### 3) Conexão remota — TCP via servidor de monitoramento

Para centrais fora da LAN, a Segalla mantém um servidor de relay (porta TCP 9018). O fluxo:

1. Abrir TCP para `<host>:9018`.
2. Enviar frame binário **0xAA** com MAC (6 bytes) + HASH-256(MAC_HEX + CONTA, 32 bytes) — autenticação no relay.
3. Receber `0xAA Status=0x80` (OK).
4. A partir daí, todos os ASCII (`[T… PSW …]`, `[T… STAT 4]`, etc.) são **envolvidos** em frames binários **0xAC** (formato `STX(0x02) + NB + 0xAC + payload + CRC8`).

```js
await window.vettiAPI.network.authenticateRemote({
  mac:      'AA:BB:CC:DD:EE:01',
  conta:    'D707',           // conta CID em hex 4 dígitos
  host:     'monitor.exemplo.com',
  port:     9018,
  password: '1234'
});
```

CRC-8/ITU (poly 0x07, init 0x00, sem reflexões) implementado em `src/main/lib/protocol.js`. **Atenção ao NB**: a maioria dos frames usa `NB = total - 1`, mas o frame de login 0xAA usa `NB = total` (caso especial documentado no §5.1 do protocolo).

### 4) Enviar comandos (genérico, transporte transparente)

Tanto na sessão local (UDP) quanto remota (TCP), o renderer chama:

```js
const r = await window.vettiAPI.network.sendCommand('STAT 4');
// r.ok    = true se central respondeu R<seq>
// r.body  = 'CID=NC GSM=NI Vdc=12054 Vbat=13320 …'
// r.raw   = '[R042 STAT 4 CID=NC …]'
// r.errorCode = 7  (se ERR no payload)
```

`sendCommand` cuida de:

- Incrementar o sequencial.
- Envelopar em frame 0xAC se a sessão for TCP (transparente para o caller).
- Aguardar `[R<mesmo-seq> …]` com timeout de 5s.
- **Re-autenticar automaticamente** se a central retornar `ERR 7` (sessão expirada, ~60s sem tráfego), usando a senha guardada em memória.

### 5) Eventos assíncronos

Quando a central envia `[N<N> …]` (alarme disparou, partição armou, etc.), o main emite no canal `network:asyncEvent`:

```js
window.vettiAPI.network.onAsyncEvent(({ seq, body, raw }) => {
  // ex: body === 'AT P:1'  → partição 1 armou
});
```

### 6) Encerrar sessão

```js
await window.vettiAPI.network.endSession();
```

Destrói o socket (TCP) ou o fecha (UDP), zera o sequencial e a senha em memória.

### Canais IPC disponíveis (referência rápida)

| Canal | Direção | Retorno |
|---|---|---|
| `network:listInterfaces` | invoke | `[{ name, address, broadcast }, …]` |
| `network:discover` | invoke | `{ ok, total }` (eventos via `discoveryFound`/`discoveryDone`) |
| `network:authenticate` | invoke | `{ ok }` ou `{ ok:false, errorCode }` |
| `network:authenticateRemote` | invoke | idem |
| `network:sendCommand` | invoke | `{ ok, raw, body, errorCode? }` |
| `network:endSession` | invoke | `{ ok }` |
| `network:discoveryFound` | event → renderer | `{ ip, raw, name }` |
| `network:discoveryDone` | event → renderer | `{ total }` |
| `network:asyncEvent` | event → renderer | `{ seq, body, raw }` |
| `network:logEvent` | event → renderer | `{ kind, payload, peer, error, ts }` (para o logger) |

---

## Engine de leitura e gravação de parâmetros

Todos os campos de configuração no DOM são marcados com `data-par="<KEY>"`. O loop de leitura/gravação é genérico:

```html
<input type="text"      data-par="B1010000" id="vcSysNome">
<input type="checkbox"  data-par="B1020000" id="vcSysHabilitar">
<select                 data-par="C1010001"><option value="0">Off</option>…</select>
```

**Leitura (Carregar do equipamento)** — para cada campo na aba atual:

1. `vcReadPar(key)` envia `[T<seq> PAR <KEY>]`.
2. Recebe `[R<seq> PAR <KEY> <VALOR>]`.
3. Aplica `_VC_PAR_FORMAT[<KEY>].parse?.(valor)` se houver transformação registrada (ex.: conta CID decimal → hex).
4. Hidrata o input/select pelo tipo do elemento.

**Gravação (Gravar no equipamento)** — para cada campo modificado:

1. Lê valor do input/select.
2. Aplica `_VC_PAR_FORMAT[<KEY>].serialize?.(valor)` se houver (ex.: hex → decimal).
3. Envia `[T<seq> PAR <KEY> <VALOR>]`.
4. Aguarda `[R<seq> PAR <KEY> OK]`.

**Transformações registradas** (`_VC_PAR_FORMAT` em `vetticonfig.js`):

- `B1060000` (conta CID) — central guarda em decimal (`55047`), UI mostra em hex 4 dígitos uppercase (`D707`). `parse` faz `(55047).toString(16).toUpperCase().padStart(4,'0')`; `serialize` faz `parseInt('D707',16)`.

**Campos pendentes** (`data-par-todo="<id>"`) — quando a chave PAR ainda não foi confirmada pelo firmware. Trocar para `data-par="<KEY>"` quando o time de firmware retornar. Lista completa em `docs/protocol-gaps.md` (não versionado).

---

## Simulador de central

`sim/server.js` é um **servidor Node standalone** que se passa por uma SmartAlarm32 real na rede. Responde a discovery, autenticação, leitura/gravação de PARs, comandos de status e eventos básicos. Útil quando:

- Você não tem uma central física à mão.
- Precisa testar campos que sua central de bancada não implementa.
- Quer reproduzir um cenário específico (PARs com valores fixos, partições em estados pré-determinados).

### Rodando o simulador

```bash
node sim/server.js                                    # default: porta 5000, senha 1234
node sim/server.js --port 5000 --password 9876 \
                   --name "Sim Lab" \
                   --state sim/state.json --verbose
```

O app deve achar o simulador no scan automaticamente (broadcast UDP nas interfaces locais).

| Flag | Default | Descrição |
|---|---|---|
| `--port` | `5000` | Porta UDP que o sim escuta |
| `--password` | `1234` | Senha de autenticação (`PSW`) |
| `--mac` | `AA-BB-CC-DD-EE-01` | MAC retornado em `ID` |
| `--name` | `Sim Demo` | Nome retornado em `ID` / `E1020000` |
| `--ip` | (auto) | IP retornado em `ID` (default: 1ª IPv4 ativa) |
| `--state` | (memória) | Caminho JSON para persistir/carregar PARs |
| `--verbose` | off | Loga cada frame recebido/enviado |

### Comandos suportados

- **Discovery**: `[T001 ID]` (broadcast) → ID padrão sem auth
- **Auth**: `PSW <senha>` (validade 60s, renovada por qualquer comando)
- **Identificação**: `ID`, `INFO`
- **Estado**: `STAT 1`–`STAT 5`
- **Relógio**: `CMD 7` (ler), `CMD 7 <data> <hora>` (gravar)
- **Partições**: `CMD 2` (estado das 6 partições), `CMD 2 AT|AP|D|P:<N>` (armar/desarmar/stay/pânico)
- **Dispositivos**: `BDS`, `BDX i`, `BDX +`
- **Parâmetros**: `PAR <key>`, `PAR <key> <valor>`
- **Usuários**: `USER Idx=<N>`

Comandos desconhecidos retornam `ERR 8`. Senha errada retorna `PSW ERR Tent=1 Tmr=0s` (igual à central real).

Encerrar: `Ctrl+C` (salva o `--state` antes). Se a porta 5000 ficar presa: `lsof -nP -iUDP:5000` → `kill <PID>`.

Mais detalhes em [`sim/README.md`](sim/README.md).

---

## Ferramentas auxiliares

### `tools/test-protocol.js`

Audita uma central real, percorre todos os comandos documentados e gera um relatório markdown listando o que funcionou, o que retornou `ERR <n>` e o que deu timeout. Útil para identificar gaps entre o PDF do protocolo e a versão de firmware da central.

```bash
node tools/test-protocol.js --ip 192.168.5.80 --password 1234 --out docs/audit.md
```

### `tools/figma-export.js`

Baixa a estrutura JSON do design no Figma via API. Necessário se você quiser auditar cores, dimensões ou posições contra a fonte de verdade.

```bash
export FIGMA_TOKEN=figd_xxx
export FIGMA_FILE_KEY=abc123
node tools/figma-export.js > figma-export/figma-export.json
```

---

## Logger compartilhado entre telas

Todas as telas (Status, Sistema, Partição 1-6, Zona, Configurações, modal Conexão) têm uma área preta de logger no rodapé. Os controles foram unificados:

- **Auto-scroll** (checkbox) — segue novas mensagens; desligue pra investigar histórico sem perder posição.
- **Botões de altura** no header do logger:
  - `▲` cresce ~5 linhas (90px)
  - `▼` encolhe ~5 linhas
  - `⤢` toggle maximizar/restaurar (até **90vh**)
- **Resize handle nativo** no canto inferior direito (CSS `resize: vertical`) — ajuste fino.
- **Altura persistida** em `localStorage` (`vc_log_height`): a mesma altura é aplicada em todas as telas e sessões.
- **Auto-scroll persistido** em `vc_log_autoscroll` — preferência global.

Tudo injetado dinamicamente pelo JS no `DOMContentLoaded` — não há HTML duplicado nas 5 telas, basta a div `.vc-logger-header` + `.vc-logger-body`.

### Rodapé "Desenvolvido e Produzido no Brasil"

Classe global `.vc-app-footer` — strip de altura fixa no fim de cada `.vc-main`. `flex: 0 0 auto; margin-top: auto` empurra pro fim mesmo se o conteúdo for curto. Aparece em todas as 5 telas + modal Conexão.

---

## i18n

Engine custom em `src/renderer/i18n/vetticonfig-i18n.js`. Três idiomas em paridade (~660 chaves cada): **pt-BR** (default), **en**, **es-LA**.

Em qualquer HTML:

```html
<span data-i18n="nav.particao" data-i18n-n="2">Partição 2</span>
<input data-i18n-placeholder="modal.senha">
<button data-i18n-title="common.theme_toggle">…</button>
```

- `data-i18n` → `textContent`
- `data-i18n-placeholder` → `placeholder`
- `data-i18n-title` → `data-vc-tip` (tooltip custom — ver abaixo) + `aria-label`
- Interpolação: chave `"Partição {{n}}"` + atributos `data-i18n-<var>`

**Tooltips** — o app usa engine própria (`vcTip`) em vez do `title` nativo do navegador. Aparece em 120ms (não em ~500ms como o nativo), tem grace period de 260ms ao sair e permite ao cursor pousar sobre a própria tooltip sem ela sumir. A migração `title=` → `data-vc-tip=` é automática no `DOMContentLoaded` e a cada troca de idioma.

**Adicionar idioma novo**:

1. Criar `src/renderer/i18n/<code>.json` espelhando a estrutura de `pt-BR.json`.
2. Adicionar em `AVAILABLE_LANGS` e o SVG da bandeira em `FLAGS` (em `vetticonfig-i18n.js`).
3. Pronto — o seletor de idioma exibe automaticamente.

---

## Stack

- **Electron** `^42.0.1` (Chromium + Node.js empacotados)
- **electron-builder** `^26.x` (DMG, NSIS, AppImage)
- **Bootstrap 5.3.3** + **Bootstrap Icons** (cópia local em `vendor/`)
- **Inter** font offline (`@fontsource/inter`)
- **netmask** (cálculo de endereço de broadcast por interface)
- **local-devices** (descoberta de dispositivos na rede — uso opcional)

Sem framework de frontend — HTML/CSS/JS vanilla, um arquivo HTML por tela, código compartilhado em `vetticonfig.js` e `vetticonfig.css`.

---

## Autor

Desenvolvido por **Leonardo** para configuração das centrais Vetti SmartAlarm32.

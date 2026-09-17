# VettiConfig

## Overview

Aplicativo desktop para monitoramento e configuração de centrais de alarme da Segalla. Roda como **app Electron**, totalmente offline (zero dependência de internet em runtime). UI desenhada no Figma, ~11 telas no total.

Comunica com as centrais por:
- Rede local (TCP / UDP)
- Centrais remotas via servidor de relay (URL DDNS + porta)

Desenvolvedor: ColdFusion (Lucee), Node.js, ESP8266/ESP32. Este é o primeiro projeto Electron.

## Stack

- **Electron** `^33.0.0`
- **Bootstrap 5.3.3** (cópia local em `src/renderer/vendor/bootstrap/`)
- **Inter** offline via `@fontsource/inter` (weights 400/600/700/800; `.woff2` + `.woff` fallback)
- **Bootstrap Icons** offline em `src/renderer/assets/fonts/`
- Sem framework de frontend — HTML/CSS/JS vanilla, um arquivo HTML por tela

## Arquitetura — dois processos (padrão Electron)

```
MAIN (Node.js, "backend")          ◄── IPC / preload ──►          RENDERER (Chromium, UI)
src/main/                                                          src/renderer/
  main.js              entry                                         index.html        welcome screen
  preload.js           contextBridge → window.vettiAPI               screens/*.html    telas
  ipc/handlers.js      ipcMain.handle(...)                           css/vetticonfig.css
  services/                                                          js/vetticonfig.js
    network.js         TCP/UDP (net, dgram)                          i18n/             engine + locales
    storage.js         JSON em userData                              assets/, vendor/
```

O renderer **não** acessa Node diretamente (sandbox de segurança). Tudo passa por `window.vettiAPI.*` exposto pelo preload via `contextBridge`.

### Adicionando uma nova capacidade de backend

1. Implementar em `src/main/services/<feature>.js`
2. Registrar handler em `src/main/ipc/handlers.js` com `ipcMain.handle('namespace:method', fn)`
3. Expor no `src/main/preload.js` em `vettiAPI.<namespace>.<method>`
4. Chamar de qualquer HTML/JS como `await window.vettiAPI.<namespace>.<method>(...)`

## Design tokens (do Figma)

Definidos em `src/renderer/css/vetticonfig.css` no `:root`. **Não redefinir nem hardcodar cores**; sempre usar a variável.

```css
--vc-blue:        #0076CB;   /* primary, sidebar, botões */
--vc-dark:        #003A63;   /* headers, nav active */
--vc-cyan:        #00B3E4;   /* status armed, accents */
--vc-green:       #339D57;   /* disarmed, OK */
--vc-green-toggle:#34C759;   /* toggle iOS */
--vc-red:         #E05256;   /* alarm, errors, logo line */
--vc-yellow:      #F8CC1C;   /* warnings */
--vc-bg:          #F0F0F0;   /* main bg */
--vc-surface:     #F9F9FA;   /* card bg */
--vc-sensor-bg:   #EEF0F3;   /* device list item */
--vc-absent-bg:   #DBB1B2;   /* device ausente */
--vc-cell:        #DCE3EB;   /* status value bg */
--sidebar-w:      255px;
```

- "Ausente" overlay é renderizado a **72px** (spec do Figma).
- Sidebar é **255px** fixa; conteúdo usa `margin-left: var(--sidebar-w)`.

## Convenções

- **CSS classes**: prefixo `vc-` em tudo que é compartilhado (`.vc-sidebar`, `.vc-card`, `.vc-btn`). Estados via classes adicionais (`.active`, `.selected`, `.absent`, `.armado`, `.desarmado`).
- **JS helpers**: prefixo `vc` camelCase (`vcOpenModal`, `vcLog`, `vcSetPartition`, `vcAddDevice`).
- **IDs renderizáveis**: prefixo `vc` (`vcCentralName`, `vcAlarmDate`, dispositivos `vcDev{NNN}{Field}`). Lista canônica está como comentário no fim de `screens/vetticonfig-status.html`.
- **CSS sempre em arquivo separado** do HTML (regra de projeto).

### Figma → código

O CSS bruto exportado pelo Figma (absolute-positioned, milhares de linhas) é usado **apenas como referência visual**. O CSS real é reescrito à mão com flexbox/grid para responsividade.

Fonte de verdade dos layouts: `figma-export.json` (~8.5MB), obtido via Figma API com Personal Access Token. Estrutura: `data['document']['children'][0]` é a Page 1; telas são filhos. Cores em `fills[].color` (RGB float normalizado), layout em `absoluteBoundingBox`, texto em `characters`.

## i18n — sistema custom

Engine em `src/renderer/i18n/vetticonfig-i18n.js`. **3 idiomas hoje**: `pt-BR` (default), `en`, `es-LA`. **499 chaves**, estrutura idêntica nos 3 JSONs (pré-condição — verificar antes de commitar).

- Caminho dos JSONs auto-detectado a partir de `document.currentScript.src` — funciona de qualquer pasta sem configurar nada.
- Idioma salvo em `localStorage` na chave `vc_lang`.
- Bandeiras como SVG inline (emoji 🇧🇷 não renderiza no Windows).

### Adicionar string traduzível

1. Adicionar a chave + valor nos **3** JSONs simultaneamente (manter alinhados)
2. No HTML: `<span data-i18n="key.subkey">fallback</span>`
3. Variantes: `data-i18n-placeholder`, `data-i18n-title`
4. Interpolação: `data-i18n="nav.particao" data-i18n-n="2"` com `"Partição {{n}}"` no JSON

### Adicionar idioma novo

1. Criar `i18n/<code>.json` com mesma estrutura de chaves
2. Adicionar em `AVAILABLE_LANGS` em `vetticonfig-i18n.js`
3. Adicionar SVG da bandeira em `FLAGS`
4. Pronto — seletor mostra automaticamente

## Telas

### Prontas
- ✅ `index.html` — welcome / desconectado (sidebar com logo + bandeiras, hero com VETTI pulsante, CTA Nova Conexão, empty state)
- ✅ `screens/vetticonfig-status.html` — monitoramento principal (partições, devices, painel de alarme, conexão servidor)
- ✅ Modal de Nova Conexão (abas Local + Remota) — embutido em index e na status

### Pendentes — nesta ordem
1. Conexão Remota (tela cheia)
2. Tela Rede
3. Tela Dispositivo
4. Tela Alarme
5. Tela Supervisão
6. Tela Contact ID
7. Tela Usuário
8. Tela Agendamento

"Tela Base" foi determinada como shell vazio embutido em outras telas, não é deliverable separado.

## Integração com hardware

Estado em `src/main/services/`:
- `network.js` — descoberta UDP **e sessão autenticada UDP** funcionais. `storage.js` ainda stubbed nos handlers.

**Protocolo VettiConfig** (ver `docs/VETTI - Protocolo - VettiConfig - Rev 2.pdf`):
Comandos ASCII `[T<NNN> CORPO]` enviados pelo VettiConfig; respostas `[R<NNN> ...]` com **mesmo `<NNN>` para correlação**. Eventos assíncronos vêm como `[N<NNN> ...]`. Sequencial é decimal, 3 dígitos zero-padded, contador iniciado em `001` a cada nova sessão. Login: `[T001 PSW nnnn]` (senha 4 dígitos, validade 60s). Erros: `7`=senha inválida, `8`=comando desconhecido, `27`=fim do BD, etc. (§8.5).

No nosso caso (conexão local direta), o frame ASCII vai puro via UDP unicast porta 5000 da central — não usamos o frame binário 0xAC do §5.3 (que é para encaminhamento via servidor de monitoramento).

Channels IPC (todos sob namespace `network:`):
- `network:listInterfaces` (invoke) → `[{name, address, broadcast}, ...]`
- `network:discover` (invoke, `broadcasts: string[]`) — broadcast `[T001 ID]` em todas; resolve em `{ok, total}` no fim do timeout. Eventos: `network:discoveryFound {ip, raw, name}`, `network:discoveryDone {total}`.
- `network:authenticate` (invoke, `ip, password`) — **conexão local UDP**. Abre socket dgram, envia `[T001 PSW <senha>]` ASCII puro. Resolve `{ok: true}` se OK ou `{ok: false, errorCode}` (ERR no payload) ou `{ok: false, error}` (timeout/falha de socket). Em sucesso, **mantém o socket aberto** para `sendCommand` e eventos assíncronos.
- `network:authenticateRemote` (invoke, `{mac, conta, host, port, password}`) — **conexão remota TCP** via servidor de monitoramento (porta 9018). Abre `net.Socket`, envia frame binário 0xAA com MAC (6 bytes) + HASH-256(MAC_HEX + CONTA, 32 bytes), aguarda resposta 0xAA Status=0x80, depois envia `[T001 PSW <senha>]` envelopado em frame 0xAC. Mesma interface de retorno do `authenticate`.
- `network:sendCommand` (invoke, `body: string`) — envia `[T<seq> body]` na sessão atual (UDP ou TCP, transparente). Em TCP, envelopa em frame 0xAC. Resolve `{ok, raw, body, errorCode?}` quando `[R<seq> ...]` chega (timeout 5s). Faz **re-auth automático em ERR 7** com a senha guardada em `session.password`.
- `network:endSession` (invoke) — fecha socket (destroy em TCP, close em UDP) e zera estado.

Frames binários (`src/main/lib/protocol.js`):
- CRC-8/ITU (poly 0x07, init 0x00, sem reflexões).
- Builder e parser de stream para frames `STX(0x02) + NB + FR + payload + CRC`.
- **Atenção ao NB**: maioria usa `NB = total - 1`, mas o frame de login 0xAA do request usa `NB = total` (= 0x2A para 42 bytes) — caso especial documentado e testado contra os exemplos do PDF §5.1.

Eventos enviados pelo main:
- `network:logEvent` → `{kind: 'sent'|'received'|'error', payload?, peer?, error?, ts}` para o logger (cobre discovery e sessão).
- `network:asyncEvent` → `{seq, body, raw}` quando `[N<N> ...]` chega.

## Comandos

```bash
npm install        # primeira vez (~200MB do Electron)
npm start          # roda
npm run dev        # roda com DevTools aberto
npm run dist:mac   # gera .dmg arm64 + x64
```

## Gotchas importantes

1. **Botão X do modal** tem `class="vc-tab"` para herdar o estilo das abas. O handler de troca de aba está escopado para `.vc-tab[data-tab]` (não `.vc-tab` puro). Se mudar para `.vc-tab` o modal abre vazio depois do primeiro close — bug que já aconteceu.
2. **Inter font** sempre incluir `.woff` depois do `.woff2` no `@font-face` por compatibilidade com Electron mais antigo.
3. **Bootstrap, fontes, ícones — TUDO local.** Nunca CDN. O app precisa rodar offline.
4. **Não usar emoji para bandeiras** — só SVG inline. Emoji de bandeira não renderiza no Windows.
5. **Cores sempre via `var(--vc-*)`** — nunca hardcodar hex. As cores foram extraídas dos floats RGB normalizados do JSON do Figma.

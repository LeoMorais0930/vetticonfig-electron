# Arquitetura

## Visao geral

O VettiConfig segue a arquitetura padrao do Electron:

```text
MAIN PROCESS (Node.js)                IPC/preload                 RENDERER (Chromium)
src/main/ ---------------------- window.vettiAPI ---------------- src/renderer/

SO, rede, fs, dialogs nativos                                      HTML/CSS/JS vanilla
servicos e protocolo                                               telas e interacao
```

O renderer roda com `contextIsolation: true`, `nodeIntegration: false` e acessa capacidades privilegiadas apenas pelo preload. O `sandbox` esta `false` porque o preload usa `require()`.

## Ciclo de inicializacao

1. `src/main/main.js` chama `app.setName('VettiConfig')`.
2. `app.whenReady()` registra handlers IPC com `registerIpcHandlers()`.
3. O main cria a `BrowserWindow`, carrega `src/renderer/index.html` e abre DevTools quando `NODE_ENV=development`.
4. `src/main/preload.js` publica `window.vettiAPI`.
5. O renderer inicializa tema, idioma, sidebar, logger, listeners de rede e telas especificas via `DOMContentLoaded`.

## Main process

### `src/main/main.js`

Responsavel por:

- criar a janela principal;
- definir tamanho minimo `1024x700`;
- aplicar icone de `build/icon.png`;
- carregar `src/renderer/index.html`;
- abrir DevTools em `npm run dev`;
- respeitar convencao do macOS ao fechar/reabrir janelas.

### `src/main/ipc/handlers.js`

Centraliza os handlers `ipcMain.handle`. Ele nao contem regra de negocio pesada; apenas liga canais IPC aos servicos.

Principais namespaces:

| Namespace | Responsabilidade |
|---|---|
| `app:*` | versao e plataforma |
| `network:*` | interfaces, discovery, auth, comandos, clock, estado/reconnect |
| `storage:*` | get/set persistente em JSON |
| `report:*` | exportacao PDF/CSV/JSON |
| `backups:*` | backups seletivos de PARs |
| `clones:*` | export/import de clone completo |
| `usersIo:*` | export/import do banco de usuarios |
| `holidaysDb:*` | feriados nacionais, overlays e import via Nager.Date |
| `connsIo:*` | export/import de conexoes locais/remotas |

### `src/main/preload.js`

Expose a API publica do app:

```js
window.vettiAPI.network.sendCommand('STAT 4')
window.vettiAPI.storage.set('credentials.<MAC>', { password: '1234' })
window.vettiAPI.report.exportPdf(payload)
```

Ao criar uma capacidade nova:

1. implemente em `src/main/services/<feature>.js`;
2. registre em `src/main/ipc/handlers.js`;
3. exponha em `src/main/preload.js`;
4. consuma no renderer via `window.vettiAPI.<feature>`.

## Renderer

O renderer fica em `src/renderer`:

- `index.html`: tela inicial, logo, selecao de idioma e modal de conexao.
- `screens/vetticonfig-status.html`: tela principal de status.
- `screens/sistema.html`: configuracoes da central, incluindo abas de sistema e avancado.
- `screens/particao.html`: tela parametrizada por query string `?n=1..6`.
- `screens/zona-compartilhada.html`: configuracao de zona compartilhada.
- `screens/configuracoes.html`: preferencias locais do app.
- `js/vetticonfig.js`: logica compartilhada e fluxos de negocio do renderer.
- `css/vetticonfig.css`: tokens, layout, componentes e temas.
- `i18n/*.json`: traducoes.

### Convencoes de UI

- Classes compartilhadas usam prefixo `vc-`.
- Helpers JS usam prefixo `vc` em camelCase.
- IDs renderizaveis usam prefixo `vc`.
- Bootstrap, Bootstrap Icons, Inter e imagens sao locais.
- O tema usa `localStorage['vc_theme']` e atributo `data-theme="dark"` no `documentElement`.
- Tooltips usam engine propria `vcTip`, migrando `title` para `data-vc-tip`.

## Comunicacao com a central

Implementacao principal: `src/main/services/network.js`.

### Formato ASCII

```text
[T<NNN> <CORPO>]      request do app para a central
[R<NNN> <RESPOSTA>]   resposta correlacionada
[N<NNN> <EVENTO>]     evento assincrono da central
```

O sequencial e numerico e normalmente exibido com 3 digitos. O parser aceita `N` com 1 a 4 digitos porque alguns firmwares emitem eventos com menos digitos.

### Discovery local

- Porta UDP: `5000`.
- Payloads enviados em broadcast: `[T001 ID]` e `[T001 IDX]`.
- Quatro tentativas por broadcast.
- Timeout total: `2000ms`.
- Respostas sao deduplicadas por IP e geracao (`legacy` ou `m4`).

### Sessao local UDP

1. `network.authenticate(ip, password)` abre socket UDP.
2. Envia `PSW <senha>`.
3. Se sucesso, guarda a sessao aberta para `sendCommand`.
4. Eventos `[N...]` sao enviados ao renderer via `network:asyncEvent`.
5. `network.endSession()` fecha o socket e limpa estado.

### Sessao remota TCP

1. Conecta ao servidor de monitoramento, porta padrao `9018`.
2. Envia frame binario `0xAA` com MAC + SHA-256 dos bytes `MAC + CONTA`.
3. Aguarda status `0x80` para liberar acesso.
4. Envia `PSW <senha>` encapsulado em frame `0xAC`.
5. Comandos seguintes usam `0xAC`.
6. Keep-alive `0xAB` e agendado a cada `45000ms` de inatividade.

Status conhecidos do login remoto:

| Status | Significado |
|---|---|
| `0x80` | OK |
| `0x8D` | central/conta nao cadastrada |
| `0x8E` | central offline |
| `0x8F` | hash invalido |

### Reconexao

O main process acompanha o estado `idle`, `alive`, `lost` e `reconnecting`.

- TCP marca perda em `close` ou `error`.
- UDP/TCP marcam perda apos 3 timeouts consecutivos.
- Backoff: 5s, 15s, 30s e depois 30s.
- Comandos do usuario ficam bloqueados durante reconexao.
- Credenciais do ultimo login bem-sucedido ficam somente em memoria para reconnect.

## Protocolo binario remoto

Implementacao: `src/main/lib/protocol.js`.

Frame:

```text
STX(0x02) + NB + FR + payload + CRC
```

- CRC: CRC-8/ITU, poly `0x07`, init `0x00`, sem reflexao.
- `FR.LOGIN`: `0xAA`.
- `FR.KEEPALIVE`: `0xAB`.
- `FR.ASCII_CMD`: `0xAC`.
- O parser de stream ressincroniza ao encontrar bytes invalidos antes de `STX` e descarta frames com CRC ruim.

## Persistencia

Implementacao principal: `src/main/services/storage.js`.

- Arquivo: `<app.getPath('userData')>/config.json`.
- Escrita atomica: grava `.tmp`, faz `fsyncSync`, depois `renameSync`.
- Backups rotativos: `<userData>/config.backups/config.<timestamp>.json`.
- Mantem no maximo 5 backups.
- Se `config.json` corromper, tenta restaurar automaticamente do backup mais recente valido.

Outros dados ficam em:

- `<userData>/backups/*.json`: snapshots seletivos de configuracao.
- `<userData>/holidays-user/*.json`: paises de feriados importados pelo usuario.
- `localStorage`: preferencias visuais e caches de UI.

## Parametros da central

A engine generica no renderer usa atributos HTML:

```html
<input data-par="B1060000">
<input type="checkbox" data-par="91130000" data-par-bool>
<input data-par-todo="campo_pendente">
```

Fluxo de leitura:

1. encontrar campos `data-par` da aba/card;
2. enviar `PAR <KEY>`;
3. parsear resposta;
4. aplicar transformacao de `_VC_PAR_FORMAT`, quando existir;
5. hidratar input/select/checkbox/radio.

Fluxo de escrita:

1. ler valor do campo;
2. validar e serializar;
3. enviar `PAR <KEY> <VALOR>`;
4. atualizar a UI com o valor confirmado pela central.

`data-par-todo` marca campos aguardando mapeamento de firmware.

## Internacionalizacao

Engine: `src/renderer/i18n/vetticonfig-i18n.js`.

- Idiomas: `pt-BR`, `en`, `es-LA`.
- Idioma salvo em `localStorage['vc_lang']`.
- Atributos suportados: `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`.
- Interpolacao via `data-i18n-<var>`.

Ao adicionar string, atualize os tres JSONs na mesma mudanca.

## Servicos do main process

| Arquivo | Papel |
|---|---|
| `network.js` | UDP/TCP, discovery, auth, comandos, clock, reconnect |
| `storage.js` | JSON persistente com escrita atomica e recover |
| `report.js` | PDF/CSV/JSON por dialog nativo |
| `backups.js` | backups seletivos de PARs |
| `clones.js` | clone completo de central |
| `users_io.js` | export/import de usuarios |
| `connections_io.js` | export/import de conexoes locais/remotas |
| `holidays_db.js` | base de feriados e overlays |
| `feriado.js` | helpers de parse/build de comandos `FERIADO` |


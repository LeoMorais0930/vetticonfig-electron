# Configuracao, variaveis e persistencia

## Variaveis de ambiente

| Variavel | Onde e usada | Finalidade |
|---|---|---|
| `NODE_ENV=development` | `src/main/main.js` | abre DevTools ao iniciar com `npm run dev` |
| `FIGMA_TOKEN` | `tools/figma-export.js` | token pessoal da API do Figma |
| `FIGMA_FILE_KEY` | `tools/figma-export.js` | identificador do arquivo Figma |
| `CSC_LINK` | electron-builder | certificado para assinatura de codigo |
| `CSC_KEY_PASSWORD` | electron-builder | senha do certificado |

Nao ha `.env` obrigatorio para rodar o app localmente. Arquivos `.env` e `.env.local` sao ignorados pelo Git.

## Scripts npm

Fonte: `package.json`.

| Script | Comando real |
|---|---|
| `start` | `electron .` |
| `dev` | `NODE_ENV=development electron .` |
| `pack` | `electron-builder --dir` |
| `dist` | `electron-builder` |
| `dist:mac` | `electron-builder --mac` |
| `dist:win` | `electron-builder --win` |
| `dist:linux` | `electron-builder --linux` |
| `postinstall` | `node scripts/rename-electron-dev.js` |

## Configuracao do electron-builder

Tambem em `package.json`:

- `appId`: `com.vetti.vetticonfig`.
- `productName`: `VettiConfig`.
- `directories.output`: `dist`.
- `directories.buildResources`: `build`.
- Arquivos empacotados: `src/**/*`, `node_modules/**/*`, `package.json`.
- macOS: DMG para `arm64` e `x64`.
- Windows: NSIS.
- Linux: AppImage.
- Icone: `build/icon.png`.

## Persistencia do main process

### `config.json`

Servico: `src/main/services/storage.js`.

Local fisico: `<app.getPath('userData')>/config.json`.

Exemplos por plataforma:

- Windows: `%APPDATA%\VettiConfig\config.json`.
- macOS: `~/Library/Application Support/VettiConfig/config.json`.
- Linux: normalmente `~/.config/VettiConfig/config.json`.

Garantias:

- escrita atomica com arquivo temporario;
- `fsyncSync` antes do rename;
- backup rotativo antes de sobrescrever;
- ate 5 backups em `<userData>/config.backups`;
- recuperacao automatica se `config.json` estiver corrompido.

### Chaves conhecidas em `config.json`

| Chave | Quem usa | Conteudo |
|---|---|---|
| `credentials.<MAC>` | conexao local | `{ password }` cacheado apos login local |
| `remote_connections` | conexao remota | array de centrais remotas salvas |
| `holidays.user.<COUNTRY>` | feriados | overlay local com `deletedIds` e `custom` |
| `advFirmwareFile` | aba Avancado | ultimo nome de firmware usado em fluxo avancado |

Outras chaves podem aparecer conforme novas preferencias forem persistidas via `window.vettiAPI.storage`.

## Persistencia do renderer (`localStorage`)

Chaves confirmadas em `src/renderer/js/vetticonfig.js` e `src/renderer/i18n/vetticonfig-i18n.js`:

| Chave | Finalidade |
|---|---|
| `vc_lang` | idioma atual |
| `vc_theme` | tema claro/escuro |
| `vc_sidebar_collapsed` | estado da sidebar |
| `vc_log_height` | altura global do logger |
| `vc_log_autoscroll` | auto-scroll do logger |
| `vc_page_logger_visible` | visibilidade do logger flutuante |
| `vc_page_logger_bounds` | posicao/tamanho do logger flutuante |
| `vc_font` | preferencias de fonte da tela Configuracoes |
| `vc_padroes` | padroes locais configuraveis |
| `vc_scan_detail` | modo/detalhe do scan de dispositivos |
| `vc_remote_connections` | legado; migrado para `remote_connections` no storage |

O renderer tambem pode manter caches derivados de central, como dados de scan, para evitar leituras pesadas repetidas.

## Schemas JSON de exportacao/importacao

### Backup seletivo

Servico: `src/main/services/backups.js`.

Local: `<userData>/backups/<nome>.json`.

Schema:

```json
{
  "schema": "vetticonfig-backup-1",
  "createdAt": "2026-05-19T12:34:56.000Z",
  "name": "antes-trocar-rede",
  "source": { "centralName": "", "model": "", "mac": "" },
  "sections": ["identificacao", "contactid", "rede"],
  "pars": { "B1060000": "55047" }
}
```

### Clone completo

Servico: `src/main/services/clones.js`.

Schema:

```json
{
  "schema": "vetticonfig-clone-1",
  "createdAt": "2026-05-19T12:34:56.000Z",
  "source": { "centralName": "", "model": "", "mac": "", "firmware": "" },
  "pars": { "B1060000": "55047" },
  "users": [{ "idx": 1, "raw": "USER ..." }],
  "agenda": [{ "idx": 1, "raw": "AGENDA ..." }],
  "devices": [{ "idx": 1, "raw": "BD ..." }]
}
```

### Usuarios

Servico: `src/main/services/users_io.js`.

Schema:

```json
{
  "schema": "vetticonfig-users-1",
  "createdAt": "2026-05-19T12:34:56.000Z",
  "source": { "centralName": "", "model": "", "mac": "" },
  "users": [{ "idx": 1, "raw": "USER ..." }],
  "ctrlAssoc": { "1": "12" }
}
```

### Conexoes

Servico: `src/main/services/connections_io.js`.

Schema:

```json
{
  "schema": "vetticonfig-connections-1",
  "createdAt": "2026-05-19T12:34:56.000Z",
  "locals": [{ "mac": "AA-BB-CC-DD-EE-01", "password": "1234" }],
  "remotes": [
    { "mac": "", "conta": "", "url": "", "porta": "9018", "nome": "", "senha": "" }
  ]
}
```

### Feriados

Base empacotada: `src/main/data/holidays/<COUNTRY>.json`.

Schema base:

```json
{
  "schema": "vetticonfig-holidays-1",
  "country": "BR",
  "countryName": { "pt-BR": "Brasil", "en": "Brazil", "es-LA": "Brasil" },
  "holidays": [
    { "id": "br-confraternizacao", "name": { "pt-BR": "Confraternizacao Universal" }, "month": 1, "day": 1 }
  ]
}
```

Paises importados pelo usuario ficam em `<userData>/holidays-user/<COUNTRY>.json`.

Overlays por usuario ficam em `config.json`:

```json
{
  "deletedIds": ["br-carnaval"],
  "custom": [
    { "id": "br-sp-aniversario", "name": { "pt-BR": "Aniversario de Sao Paulo" }, "month": 1, "day": 25 }
  ]
}
```

## Canais IPC

Resumo do contrato exposto via `window.vettiAPI`:

| API renderer | Handler IPC |
|---|---|
| `app.getVersion()` | `app:getVersion` |
| `network.listInterfaces()` | `network:listInterfaces` |
| `network.discover(broadcasts)` | `network:discover` |
| `network.authenticate(ip, password)` | `network:authenticate` |
| `network.authenticateRemote(opts)` | `network:authenticateRemote` |
| `network.sendCommand(body)` | `network:sendCommand` |
| `network.endSession()` | `network:endSession` |
| `network.getClock()` | `network:getClock` |
| `network.setClock(dt)` | `network:setClock` |
| `network.getConnState()` | `network:getConnState` |
| `network.forceReconnect()` | `network:forceReconnect` |
| `storage.get(key)` | `storage:get` |
| `storage.set(key, value)` | `storage:set` |
| `report.exportPdf(payload)` | `report:exportPdf` |
| `report.exportCsv(payload)` | `report:exportCsv` |
| `report.exportJson(payload)` | `report:exportJson` |
| `backups.*` | `backups:*` |
| `clones.*` | `clones:*` |
| `usersIo.*` | `usersIo:*` |
| `holidaysDb.*` | `holidaysDb:*` |
| `connsIo.*` | `connsIo:*` |

Eventos main -> renderer:

| Evento | Payload |
|---|---|
| `network:discoveryFound` | `{ ip, raw, generation, name }` |
| `network:discoveryDone` | `{ total }` |
| `network:logEvent` | `{ kind, payload?, peer?, error?, ts }` |
| `network:asyncEvent` | `{ seq, body, raw }` |
| `network:connState` | `{ state, reason?, attempt?, delayMs? }` |

## Dados sensiveis

- Senhas locais podem ser salvas em `config.json` sob `credentials.<MAC>`.
- Conexoes remotas podem conter senha em `remote_connections` e exports de conexoes.
- Esses arquivos sao dados do usuario, nao devem ser commitados nem enviados em issue sem sanitizacao.
- Exports de clone/backup/usuarios podem conter configuracao real de cliente. Trate como dado sensivel.


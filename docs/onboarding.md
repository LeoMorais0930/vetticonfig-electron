# Onboarding de devs

## O que e o VettiConfig

O VettiConfig e um aplicativo desktop Electron para monitorar e configurar centrais de alarme Vetti SmartAlarm. O app roda offline em runtime e fala diretamente com a central por rede local UDP ou por servidor de monitoramento TCP. A UI e feita em HTML/CSS/JS vanilla, com Bootstrap local e assets empacotados no repositorio.

O projeto atual esta em `vetticonfig-main` e a versao do app vem de `package.json`: `4.0.0`.

## Stack confirmada

- Electron `^42.0.1`.
- electron-builder `^26.8.1`.
- Node.js/npm.
- Frontend sem framework: HTML, CSS e JavaScript vanilla.
- Bootstrap `5.3.3` local em `src/renderer/vendor/bootstrap`.
- Bootstrap Icons e fonte Inter locais em `src/renderer/assets/fonts`.
- Servicos Node no main process usando `dgram`, `net`, `fs`, `crypto`, `electron`, `netmask`.

## Primeiros 30 minutos

1. Instale Node.js 18+.
2. Entre na raiz do projeto.
3. Rode `npm install`.
4. Rode o app com `npm start`.
5. Em outro terminal, rode o simulador com `node sim/server.js`.
6. No app, abra "Nova Conexao", selecione a central `Sim Demo`, use senha `1234` e confirme se a tela Status carrega.

Comandos:

```powershell
cd "C:\Users\Leonardo Morais\Desktop\vetticonfig-main"
npm install
npm start
```

Segundo terminal:

```powershell
cd "C:\Users\Leonardo Morais\Desktop\vetticonfig-main"
node sim/server.js
```

## Mapa mental do projeto

```text
src/main/
  main.js               cria BrowserWindow e registra IPC
  preload.js            expoe window.vettiAPI para o renderer
  ipc/handlers.js       liga canais IPC aos services
  services/             rede, storage, backup, clone, usuarios, feriados, relatorios
  lib/protocol.js       frames binarios remotos, CRC-8/ITU

src/renderer/
  index.html            tela inicial e modal de conexao
  screens/              telas internas
  js/vetticonfig.js     logica compartilhada e fluxos principais
  css/vetticonfig.css   design tokens, layout e componentes vc-*
  i18n/                 motor de traducao + pt-BR/en/es-LA

sim/
  server.js             central virtual UDP para desenvolvimento

tools/
  test-protocol.js      auditoria de comandos seguros contra central real
  gerar-protocolo-rev3.py gera DOCX interno do protocolo Rev 3
```

## Arquivos que um dev novo deve ler

- `README.md`: visao geral e comandos principais.
- `CLAUDE.md`: convencoes e historico arquitetural para agentes de codigo.
- `src/main/preload.js`: contrato publico disponivel em `window.vettiAPI`.
- `src/main/ipc/handlers.js`: lista de handlers IPC.
- `src/main/services/network.js`: discovery, autenticacao local/remota, reconexao e comandos.
- `src/renderer/js/vetticonfig.js`: maior parte dos fluxos de tela.
- `sim/README.md`: como testar sem hardware.
- `docs/protocol-gaps.md` e `docs/comandos-que-faltam.md`: lacunas e pendencias do firmware/protocolo.

## Como trabalhar em uma feature

1. Identifique se a mudanca e de UI pura, IPC/service ou protocolo.
2. Para UI pura, altere HTML/CSS/JS em `src/renderer`, mantendo classes compartilhadas com prefixo `vc-`.
3. Para dados do sistema operacional, arquivos, rede ou dialogs nativos, implemente no main process e exponha via IPC.
4. Para comandos da central, use `window.vettiAPI.network.sendCommand(body)` no renderer e mantenha o parsing perto do fluxo que consome os dados.
5. Para parametros simples, prefira o mecanismo `data-par="<KEY>"` e a engine generica de leitura/gravação.
6. Teste primeiro com o simulador, depois com central real quando o fluxo depender de firmware.
7. Atualize a documentacao quando adicionar IPC, comando novo, schema JSON, chave de storage ou fluxo operacional.

## Estado de testes

Nao ha script `npm test` em `package.json`. A verificacao atual e manual:

- `npm start` abre o app.
- `node sim/server.js` valida discovery/autenticacao/status basico.
- `node tools/test-protocol.js --ip <ip> --password <senha> --out docs/audit.md` audita comandos seguros em central real.
- `npm run pack` valida empacotamento sem gerar instalador.

## Cuidados importantes

- O app precisa rodar offline. Nao use CDN para Bootstrap, fontes, icones ou scripts.
- O renderer nao deve acessar Node diretamente. Use `window.vettiAPI`.
- Nao coloque senha, token, URL privada ou PDF proprietario no repositorio.
- `docs/*.pdf`, `docs/*.docx` e `docs/*.doc` sao ignorados pelo Git.
- `node_modules/`, `dist/`, `figma-export/`, `.claude/` e projetos de referencia locais tambem ficam fora do Git.


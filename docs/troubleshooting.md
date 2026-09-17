# Troubleshooting

## App nao instala dependencias

### `node` ou `npm` nao reconhecido

Provavel causa: Node.js nao instalado ou PATH ainda nao atualizado.

Solucoes:

1. fechar e reabrir terminal;
2. reiniciar o computador;
3. reinstalar Node.js LTS;
4. verificar `node --version` e `npm --version`.

### `npm install` falha em dependencias nativas

Solucoes:

- Windows: instalar/reparar Visual Studio Build Tools ou reinstalar Node marcando "Tools for Native Modules".
- macOS: `xcode-select --install`.
- Linux: instalar toolchain (`build-essential`, Python, make/g++).
- Apagar `node_modules` e rodar `npm install` novamente.

## App abre tela branca

1. Rode `npm run dev`.
2. Veja erros no DevTools Console.
3. Confirme que arquivos locais existem: Bootstrap, CSS, i18n, JS e assets.
4. Verifique se a mudanca adicionou caminho absoluto ou path com barra errada.
5. Se acontecer somente em uma tela interna, abra a tela diretamente pelo menu e confira erro JS no Console.

## Simulador nao aparece no discovery

Checklist:

1. O simulador esta rodando? `node sim/server.js`.
2. A porta UDP 5000 esta livre?
3. Firewall liberou Node.js em rede privada?
4. O app selecionou a interface certa no modal?
5. VPN ou adaptador virtual esta capturando broadcast?
6. Tente rodar app e simulador na mesma maquina.

Windows:

- abrir Firewall do Windows Defender;
- permitir Node.js/Electron em redes privadas;
- testar desativar VPN temporariamente.

macOS/Linux:

```bash
lsof -nP -iUDP:5000
```

Se necessario, encerrar processo preso:

```bash
kill <PID>
```

## Central real nao aparece no discovery

Possiveis causas:

- PC e central em redes/VLANs diferentes;
- roteador bloqueia broadcast;
- firewall local bloqueia UDP;
- central nao esta na porta esperada;
- interface errada selecionada;
- firmware responde apenas `ID` ou apenas `IDX`.

Diagnostico:

1. confirmar IP da central no roteador;
2. pingar a central, se ICMP estiver habilitado;
3. selecionar todas as interfaces no modal;
4. observar logger para `[T001 ID]` e `[T001 IDX]`;
5. testar cabo/rede local simples sem VPN.

Workaround:

- se a UI permitir entrada manual de IP, conectar diretamente;
- caso contrario, ajustar temporariamente rede/firewall para permitir broadcast UDP 5000.

## Senha nao autentica

Sinais:

- `PSW ERR Tent=N Tmr=Ns`;
- `ERR 7`;
- timeout apos PSW.

Interpretacao:

- `PSW ERR Tent=N Tmr=Ns`: senha errada ou central em lockout.
- `ERR 7`: senha invalida ou sessao expirada.
- timeout: central nao respondeu, rede/firewall/porta.

Solucoes:

1. confirmar senha de 4 digitos;
2. aguardar `Tmr` se houver lockout;
3. testar com simulador para separar bug de rede de bug de senha;
4. em central real, conferir se outro software esta ocupando/saturando a comunicacao.

## Conexao remota falha

Erros comuns:

| Erro | Causa provavel |
|---|---|
| `invalid-mac` | MAC em formato invalido |
| `timeout` | host/porta inacessivel ou servidor sem resposta |
| `0x8D` | central/conta nao cadastrada no receptor |
| `0x8E` | central offline no servidor |
| `0x8F` | MAC/conta nao batem com hash esperado |
| `bad-hash` | conta ou MAC incorretos |

Checklist:

1. MAC com 12 hexadecimais validos.
2. Conta CID em formato esperado.
3. Host correto e porta, normalmente `9018`.
4. Internet liberada.
5. Central aparece online no monitoramento.
6. Tentar novamente apos 30s para descartar instabilidade.

## Comandos dao timeout

O main marca conexao perdida apos 3 timeouts consecutivos e tenta reconnect.

Possiveis causas:

- central caiu/reiniciou;
- Wi-Fi instavel;
- firmware travou;
- TCP remoto derrubado por servidor;
- comando nao suportado em firmware especifico.

Diagnostico:

1. verificar logger;
2. ver estado `network:connState`;
3. testar comando simples `ID` ou `INFO`;
4. se for remoto, aguardar reconnect automatico;
5. se for UDP local, reconectar manualmente se a rede mudou.

## Parametro retorna erro

| Erro | Significado pratico |
|---|---|
| `ERR 7` | sessao expirada; o app tenta PSW automaticamente |
| `ERR 8` | comando/PAR nao suportado |
| `ERR 22` | parametro fora de alcance ou nao implementado |
| `ERR 27` | fim de banco/lista |
| `ERR 32` | valor invalido para gravacao |

Solucoes:

- conferir firmware/modelo;
- verificar `docs/protocol-gaps.md`;
- verificar `docs/comandos-que-faltam.md`;
- nao gravar campo numerico vazio;
- aplicar defaults declarados com `data-par-default` quando existirem;
- marcar campo como `data-par-todo` se ainda nao houver chave confiavel.

## UI nao traduz ou mostra chave crua

1. Verifique se a chave existe nos tres JSONs: `pt-BR.json`, `en.json`, `es-LA.json`.
2. Confira se o HTML usa `data-i18n`, `data-i18n-placeholder` ou `data-i18n-title`.
3. Confira interpolacao `data-i18n-n`, `data-i18n-name`, etc.
4. Rode troca de idioma na UI.

## Tema ou layout quebra apos reload

Chaves envolvidas:

- `vc_theme`;
- `vc_sidebar_collapsed`;
- `vc_font`;
- `vc_log_height`;
- `vc_page_logger_bounds`.

Diagnostico:

1. limpar localStorage pelo DevTools;
2. reabrir app;
3. verificar CSS com `data-theme="dark"`;
4. conferir se novas regras usam tokens `--vc-*`.

## Logger nao aparece ou fica grande demais

1. Na tela Configuracoes, reativar logger se houver opcao.
2. Limpar `vc_log_height` e `vc_page_logger_bounds` no DevTools.
3. Verificar se a tela contem `.vc-logger-header` e `.vc-logger-body`.
4. Confirmar que `vetticonfig.js` foi carregado na tela.

## Export PDF/CSV/JSON falha

Possiveis causas:

- dialog cancelado pelo usuario;
- permissao negada no destino;
- payload incompleto;
- BrowserWindow offscreen falhou ao renderizar PDF.

Solucoes:

1. tentar salvar em Documentos;
2. conferir se payload tem `central`, `columns/rows` ou campos esperados;
3. rodar em `npm run dev` e ver Console/main logs;
4. testar CSV antes de PDF para isolar renderizacao.

## Backup/clone/import nao aplica corretamente

Checklist:

- schema correto (`vetticonfig-backup-1`, `vetticonfig-clone-1`, `vetticonfig-users-1`);
- central conectada e autenticada;
- firmware compativel com comandos gravados;
- nao misturar clone completo com backup seletivo;
- conferir logger para primeiro comando que falhou.

Recomendacao operacional:

- antes de aplicar clone/backup em central real, exportar um backup/clone do estado atual da central alvo.

## `config.json` corrompido

O storage tenta recuperar sozinho de `<userData>/config.backups`.

Se o app continuar com problema:

1. fechar o VettiConfig;
2. ir ate a pasta `userData`;
3. copiar `config.json` e `config.backups` para backup manual;
4. substituir `config.json` pelo backup mais recente valido;
5. reabrir o app.

## Build falha

Checklist:

1. apagar `dist/`;
2. rodar `npm install`;
3. rodar `npm run pack`;
4. verificar antivirus bloqueando NSIS no Windows;
5. confirmar que `build/icon.png` existe;
6. gerar o target no SO correspondente.

## Artefato abre como "Electron" no macOS em dev

O script `scripts/rename-electron-dev.js` roda no `postinstall` e patcha `Info.plist` do Electron.app local. Rode:

```bash
npm run postinstall
```

Em build de producao, `productName` do `electron-builder` deve cuidar do nome.


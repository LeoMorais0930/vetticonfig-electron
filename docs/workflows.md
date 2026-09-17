# Fluxos da aplicacao

## Discovery local

1. O renderer chama `window.vettiAPI.network.listInterfaces()`.
2. O main lista interfaces IPv4 nao internas e calcula broadcast com `netmask`.
3. O usuario escolhe interfaces no modal.
4. O renderer chama `network.discover(broadcasts)`.
5. O main envia `[T001 ID]` e `[T001 IDX]` para cada broadcast na porta UDP `5000`.
6. A cada resposta `[R001 ...]`, o main emite `network:discoveryFound`.
7. Ao final do timeout, emite `network:discoveryDone`.

Geracao:

- resposta contendo `IDX` ou `SmartAlarm-M4` e tratada como `m4`;
- demais respostas sao `legacy`;
- dedup por `ip:generation`.

## Conexao local

1. Usuario seleciona uma central e informa senha.
2. Renderer chama `network.authenticate(ip, senha)`.
3. Main abre socket UDP e envia `[T001 PSW <senha>]`.
4. Se resposta nao contiver erro, o socket fica aberto.
5. Renderer persiste a senha local em `credentials.<MAC>` quando consegue extrair MAC da resposta.
6. O app navega para Status.

Erros:

- `PSW ERR Tent=N Tmr=Ns`: senha errada ou bloqueio temporario.
- `timeout`: central nao respondeu.
- `ERR 7`: sessao expirada; `sendCommand` tenta reautenticar automaticamente.

## Conexao remota

1. Usuario informa MAC, conta, host, porta e senha.
2. Renderer salva/atualiza entrada em `remote_connections`.
3. Chama `network.authenticateRemote(opts)`.
4. Main conecta no servidor de monitoramento.
5. Envia frame `0xAA` com MAC + SHA-256 dos bytes `MAC + CONTA`.
6. Se status for `0x80`, envia `PSW` encapsulado em `0xAC`.
7. Comandos posteriores usam `0xAC`.
8. Keep-alive `0xAB` e reprogramado a cada comando e enviado apos 45s de inatividade.

Status de login remoto:

- `0x8D`: central/conta nao cadastrada.
- `0x8E`: central offline.
- `0x8F`: hash invalido; conferir MAC e conta.

## Tela Status

Inicializacao: `vcStatusInit()`.

Fluxos principais:

- identifica central com `ID`/`IDX` e `INFO`/`INFOX`;
- detecta geracao legacy ou M4;
- atualiza particoes com `CMD 2` ou `PART`;
- le status de comunicacao com `STAT 4`;
- le relogio com `CMD 7`;
- le status geral com `STAT 5`;
- carrega dispositivos via `BDS`, `BDX`, `BD`, `STAT 6/7` conforme geracao;
- renderiza cards de particao e lista de dispositivos;
- escuta eventos assincronos para atualizar a UI.

Acoes de particao usam comandos como:

```text
CMD 2 AT:<N>    armar total
CMD 2 AP:<N>    armar stay/parcial
CMD 2 D:<N>     desarmar
CMD 2 P:<N>     panico
```

## Logger

O main emite `network:logEvent` para envios, recebimentos e erros. O renderer formata com `vcRenderLogEvent` e adiciona ao logger.

Preferencias:

- `vc_log_height`;
- `vc_log_autoscroll`;
- `vc_page_logger_visible`;
- `vc_page_logger_bounds`.

## Sistema e parametros

Inicializacao: `vcSistemaInit()`.

Padrao de campos:

```html
<input data-par="E1020000">
<input type="checkbox" data-par="91130000" data-par-bool>
<input data-par-todo="senha_master">
```

Leitura:

1. usuario aciona carregar ou abre um painel;
2. renderer coleta campos `data-par`;
3. envia `PAR <KEY>`;
4. parseia e aplica no campo.

Gravacao:

1. renderer le valores do card/painel;
2. valida range e tipo;
3. serializa transformacoes especiais;
4. envia `PAR <KEY> <VALOR>`;
5. se a central ecoar valor diferente, UI deve refletir o valor confirmado.

Transformacao importante:

- `B1060000` conta CID: central guarda decimal, UI mostra hex uppercase de 4 digitos.

Campos `data-par-todo` nao sao lidos/gravados ate que o firmware confirme a chave.

## Aba Avancado

A aba Avancado fica escondida e e liberada por gesto/hotkey documentado no README principal. Ela concentra parametros de diagnostico, firmware, logger, sniffer e configuracoes menos comuns.

Exemplos de comandos envolvidos:

- `LOGX DEL` / `LOG DEL`;
- `CMD 60 "<arquivo>"`;
- `CMD 18 <modo>`;
- `PAR A1080000`;
- `PAR A12C0000`;
- `PAR A12D0000`;
- `PAR C1020000`.

Use com cuidado em central real.

## Dispositivos

Fluxos de leitura:

- `BDS`: resumo do banco de dispositivos;
- `BDX I` e `BDX +`: iteracao legacy;
- `BD <idx>`: leitura por indice;
- `STAT 6 <idx>` / `STAT 7 <idx>`: status de dispositivo em firmwares especificos;
- `CMD 13`/`CMD 15`: leitura/gravação de configuracao avancada de dispositivo;
- `CMD 8`: cadastro/pareamento;
- `CMD 12 <idx>`: comando usado em remocao/desativacao conforme fluxo do renderer.

O renderer aplica regras de exibicao por tipo de dispositivo, geracao da central e particoes.

## Usuarios

Fluxo de listagem:

1. ler bitmap/estado com `PAR 610C0000` quando aplicavel;
2. iterar `USER Idx=<N>`;
3. parsear `Nome`, `Senha`, flags e permissoes;
4. renderizar lista e formulario.

Fluxo de gravacao:

- montar comando `USER ...` com flags e permissoes;
- enviar via `network.sendCommand`;
- reler o usuario apos salvar quando necessario.

Export/import de usuarios:

- o renderer coleta registros;
- `usersIo.exportToFile(payload)` salva JSON;
- `usersIo.importFromFile()` carrega JSON;
- o renderer aplica cada usuario na central.

## Agenda

Fluxos:

- listagem por `AGENDA <idx>`;
- criacao/edicao com `AGENDA <idx> Stat:OK ...`;
- exclusao com `AGENDA <idx> Stat:DEL`.

O renderer traduz campos de frequencia, dias, feriados, particoes e acoes.

## Feriados

Componentes:

- `src/main/services/feriado.js`: helpers para parse/build de comando da central.
- `src/main/services/holidays_db.js`: base local de paises e feriados.
- `src/main/data/holidays/*.json`: defaults empacotados.
- `<userData>/holidays-user/*.json`: paises importados pelo usuario.
- `holidays.user.<COUNTRY>`: overlay local para ocultar defaults e adicionar customizados.

Fluxos:

1. carregar paises disponiveis;
2. resolver feriados fixos e moveis para um ano;
3. cadastrar nacionais na central com comandos `FERIADO`;
4. gerenciar overlay local;
5. importar novos paises via Nager.Date no main process.

## Backups seletivos

Uso: salvar um snapshot parcial antes de alterar uma area de configuracao.

1. Renderer le PARs das secoes marcadas.
2. Monta payload `vetticonfig-backup-1`.
3. `backups.save(payload)` salva em `<userData>/backups`.
4. Restauracao le o JSON e o renderer reaplica PAR por PAR.

Nao inclui banco de usuarios, agenda e dispositivos completos. Para isso use clone.

## Clone completo

Uso: substituir uma central por outra mantendo configuracao.

1. Renderer coleta PARs, usuarios, agenda e dispositivos.
2. `clones.exportToFile(payload)` salva JSON escolhido pelo usuario.
3. Para importar, `clones.importFromFile()` devolve o payload.
4. Renderer reaplica dados na central alvo.

Como os registros usam `raw`, o restore continua possivel mesmo se parsers de UI mudarem depois.

## Conexoes salvas

Conexoes locais:

- ficam em `credentials.<MAC>` no `config.json`;
- armazenam senha para preencher automaticamente.

Conexoes remotas:

- ficam em `remote_connections` no `config.json`;
- historicamente usavam `localStorage['vc_remote_connections']`, migrado automaticamente.

Export/import:

- `connsIo.exportToFile(remotes)`;
- `connsIo.importFromFile()`;
- `connsIo.applyLocals(locals, replace)`;
- renderer decide merge ou replace das remotas.

## Relatorios

Servico: `src/main/services/report.js`.

Fluxo:

1. renderer monta payload da tela;
2. chama `report.exportPdf`, `report.exportCsv` ou `report.exportJson`;
3. main abre dialog nativo;
4. PDF usa uma BrowserWindow offscreen e `printToPDF`;
5. CSV usa BOM UTF-8 para Excel reconhecer caracteres em pt-BR;
6. JSON de scan usa schema `vetticonfig-scan-1`.

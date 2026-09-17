# Setup local

## Prerequisitos

### Todos os sistemas

- Node.js 18+.
- npm.
- Git, se for clonar do repositorio.

### Windows 10/11

- Node.js LTS de `nodejs.org`.
- Git for Windows, se usar Git.
- PowerShell.
- Permitir Node.js no firewall para testar discovery/simulador.

Guia detalhado para nao devs: `GUIA-WINDOWS.md`.

### macOS

- Node.js 18+ via nvm, Homebrew ou instalador oficial.
- Xcode Command Line Tools: `xcode-select --install`.
- Para desenvolvimento, o `postinstall` renomeia o app Electron local para aparecer como VettiConfig no Dock.

### Linux

- Node.js 18+.
- Ferramentas de build do sistema, por exemplo `build-essential` em Debian/Ubuntu.

## Instalacao

```bash
git clone https://github.com/LeoMorais0930/vetticonfig-electron.git
cd vetticonfig-electron
npm install
```

Se recebeu um ZIP, extraia, entre na pasta que contem `package.json` e rode:

```bash
npm install
```

## Rodando o app

```bash
npm start
```

Modo desenvolvimento com DevTools:

```bash
npm run dev
```

No Windows PowerShell, se `NODE_ENV=development` nao for reconhecido em alguma versao de shell, rode com:

```powershell
$env:NODE_ENV="development"; npx electron .
```

## Simulador sem hardware

O simulador fica em `sim/server.js`.

```bash
node sim/server.js
```

Defaults:

| Campo | Valor |
|---|---|
| Porta UDP | `5000` |
| Senha | `1234` |
| MAC | `AA-BB-CC-DD-EE-01` |
| Nome | `Sim Demo` |

Exemplo com estado persistido:

```bash
node sim/server.js --port 5000 --password 9876 --name "Sim Lab" --state sim/state.json --verbose
```

Fluxo esperado:

1. abra o app com `npm start`;
2. em outro terminal rode o simulador;
3. clique em "Nova Conexao";
4. selecione `Sim Demo`;
5. senha `1234`;
6. confirme que a tela Status aparece.

## Central real local

1. Garanta que o computador e a central estejam na mesma rede.
2. Abra "Nova Conexao".
3. Use a aba "Conexao Local".
4. Selecione a interface correta ou todas.
5. Aguarde discovery.
6. Selecione a central, digite a senha de 4 digitos e conecte.

Se discovery falhar, consulte [troubleshooting.md](troubleshooting.md).

## Central remota

Use a aba "Conexao Remota" com:

- MAC da central;
- conta CID;
- host/IP do servidor de monitoramento;
- porta, normalmente `9018`;
- senha da central.

O main process faz o login TCP `0xAA`, encapsula comandos em `0xAC` e mantem keep-alive `0xAB`.

## Comandos npm

| Comando | Uso |
|---|---|
| `npm start` | inicia o app Electron |
| `npm run dev` | inicia com `NODE_ENV=development` e DevTools |
| `npm run pack` | empacota sem instalador |
| `npm run dist` | gera artefato da plataforma atual |
| `npm run dist:win` | gera instalador NSIS no Windows |
| `npm run dist:mac` | gera DMG no macOS |
| `npm run dist:linux` | gera AppImage no Linux |
| `npm run postinstall` | executa ajuste de nome do Electron no macOS |

## Ferramentas auxiliares

Auditar comandos seguros contra central real:

```bash
node tools/test-protocol.js --ip 192.168.5.80 --password 1234 --out docs/audit.md
```

Gerar DOCX interno do protocolo Rev 3:

```bash
python tools/gerar-protocolo-rev3.py
```

Observacao: esse script contem paths absolutos antigos no topo (`OUT` e `LOGO`). Ajuste antes de rodar em outra maquina.

Exportar estrutura do Figma:

```bash
set FIGMA_TOKEN=figd_xxx
set FIGMA_FILE_KEY=abc123
node tools/figma-export.js > figma-export/figma-export.json
```

No PowerShell:

```powershell
$env:FIGMA_TOKEN="figd_xxx"
$env:FIGMA_FILE_KEY="abc123"
node tools/figma-export.js > figma-export/figma-export.json
```

## Validacao manual minima

Antes de entregar uma mudanca:

1. `npm start` abre sem tela branca.
2. Simulador aparece no discovery.
3. Login no simulador com `1234` funciona.
4. Tela Status carrega e logger recebe mensagens.
5. Se mudou UI, verificar tema claro e escuro.
6. Se mudou i18n, conferir `pt-BR`, `en` e `es-LA`.
7. Se mudou build/package, rodar `npm run pack`.

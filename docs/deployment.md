# Deploy e distribuicao

## Estrategia de build

O projeto usa `electron-builder`. Cada plataforma deve gerar seu artefato preferencialmente na propria plataforma:

| Plataforma | Comando | Saida esperada |
|---|---|---|
| Windows | `npm run dist:win` | instalador NSIS `.exe` em `dist/` |
| macOS | `npm run dist:mac` | `.dmg` para `arm64` e `x64` em `dist/` |
| Linux | `npm run dist:linux` | `.AppImage` em `dist/` |
| Plataforma atual | `npm run dist` | artefato conforme SO |
| Debug de empacotamento | `npm run pack` | app desempacotado sem instalador |

O diretorio `dist/` e ignorado pelo Git.

## Checklist antes de buildar

1. Confirmar `npm install` limpo.
2. Rodar `npm start`.
3. Testar login no simulador.
4. Testar fluxo com central real se a release mexeu em protocolo, rede ou parametros.
5. Rodar `npm run pack`.
6. Verificar se `package.json` tem `version` correta.
7. Confirmar `build/icon.png` presente e com resolucao adequada.
8. Conferir que nenhum PDF/DOCX proprietario ou dado de cliente entrou no Git.

## Windows

Comando:

```powershell
npm run dist:win
```

Target configurado: NSIS.

Pontos de atencao:

- Sem assinatura digital, o SmartScreen pode exibir "O Windows protegeu seu PC".
- O usuario precisa clicar em "Mais informacoes" e "Executar assim mesmo".
- Para reduzir alerta, assinar o instalador com certificado de code signing.
- Firewall pode pedir permissao para Node/Electron em cenarios de discovery local.

## macOS

Comando:

```bash
npm run dist:mac
```

Targets configurados:

- `dmg` `arm64`;
- `dmg` `x64`.

Sem certificado Apple Developer ID, o build fica com assinatura ad-hoc ou sem notarizacao adequada, e usuarios podem precisar liberar em "Abrir mesmo assim".

Para distribuicao publica:

1. configurar certificado;
2. definir `CSC_LINK`;
3. definir `CSC_KEY_PASSWORD`;
4. configurar notarizacao conforme guia do `electron-builder`.

## Linux

Comando:

```bash
npm run dist:linux
```

Target configurado: AppImage.

Validar permissao de execucao:

```bash
chmod +x dist/*.AppImage
./dist/*.AppImage
```

## Conteudo empacotado

Configurado em `package.json`:

```json
"files": [
  "src/**/*",
  "node_modules/**/*",
  "package.json"
]
```

Isso significa que assets necessarios em runtime precisam estar dentro de `src/` ou em dependencia empacotada. `build/` entra como `buildResources`, nao como conteudo acessado pelo renderer.

## Assets offline

O app deve rodar sem internet. Antes de release, confirme:

- Bootstrap vem de `src/renderer/vendor/bootstrap`.
- Bootstrap Icons vem de `src/renderer/assets/fonts`.
- Inter vem de `src/renderer/assets/fonts`.
- Imagens e SVGs vem de `src/renderer/assets`.
- Nao ha tags CDN novas em HTML.

Excecao: importacao de feriados via Nager.Date e uma feature online, mas nao deve ser necessaria para o app iniciar ou operar o fluxo principal.

## Dados do usuario em producao

Instalar uma versao nova nao deve apagar:

- `<userData>/config.json`;
- `<userData>/config.backups`;
- `<userData>/backups`;
- `<userData>/holidays-user`;
- preferencias em `localStorage` do app.

Se um bug de persistencia acontecer, oriente o usuario a copiar a pasta `userData` antes de tentar reparo.

## Release notes sugeridas

Para cada release, documente:

- versao;
- plataforma/artefato;
- mudancas visiveis;
- mudancas de protocolo ou compatibilidade de firmware;
- bugs corrigidos;
- riscos conhecidos;
- instrucoes de migracao, se houver.

## Smoke test pos-build

1. Instalar/abrir o artefato gerado.
2. Verificar nome e icone do app.
3. Abrir tela inicial.
4. Rodar simulador.
5. Fazer discovery e login.
6. Entrar em Status.
7. Alternar tema e idioma.
8. Abrir Sistema, Particao e Configuracoes.
9. Exportar um relatorio CSV/PDF se o fluxo mudou.
10. Fechar e reabrir para confirmar persistencia.


# Simulador de central VettiConfig

Roda como uma "central virtual" UDP, respondendo aos comandos do app
como se fosse uma SmartAlarm real. Útil para testar o app sem hardware
ou cobrir campos que a central antiga disponível não implementa.

## Uso rápido

```bash
node sim/server.js
```

Por padrão escuta na porta UDP **5000**, MAC `AA-BB-CC-DD-EE-01`, nome
`Sim Demo`, senha `1234`. O app deve descobrir esta central no Nova
Conexão automaticamente (broadcast UDP).

## Opções

| Flag | Default | Descrição |
|------|---------|-----------|
| `--port`     | `5000`              | Porta UDP que o sim escuta |
| `--password` | `1234`              | Senha de autenticação (`PSW`) |
| `--mac`      | `AA-BB-CC-DD-EE-01` | MAC retornado em `ID` |
| `--name`     | `Sim Demo`          | Nome retornado em `ID`/`E1020000` |
| `--ip`       | (auto)              | IP retornado em `ID` (default: 1ª interface IPv4 ativa) |
| `--state`    | (memória)           | Caminho de arquivo JSON para persistir/carregar PARs |
| `--verbose`  | off                 | Loga cada frame recebido/enviado |

Exemplo:
```bash
node sim/server.js --port 5000 --password 9876 --name "Sim Lab" --state sim/state.json --verbose
```

## Comandos suportados

- **Discovery**: `[T001 ID]` (broadcast) → ID padrão sem auth
- **Auth**: `PSW <senha>` — válido por 60s, renovado por qualquer comando
- **Identificação**: `ID`, `INFO`
- **Estado**: `STAT 1`, `STAT 2`, `STAT 3`, `STAT 4`, `STAT 5`
- **Relógio**: `CMD 7` (ler), `CMD 7 <data hora>` (gravar)
- **Partições**: `CMD 2` (ler estado), `CMD 2 AT|AP|D|P:<N>` (armar/desarmar/stay/pânico)
- **Dispositivos**: `BDS`, `BDX i`, `BDX +`
- **Parâmetros**: `PAR <key>` (ler), `PAR <key> <valor>` (gravar)
- **Usuários**: `USER Idx=<N>` (idx 1 = Admin, demais = LIV)

Comandos desconhecidos retornam `ERR 8`. Senha errada retorna
`PSW ERR Tent=1 Tmr=0s` (sem código numérico, igual à central real).

## Estado persistido

Se você passar `--state sim/state.json`:

- Na inicialização, carrega valores do arquivo (se existir).
- Cada gravação de PAR salva imediatamente.
- Ao receber `Ctrl+C`, salva tudo.

Útil para simular cenários: deixar uma central com config específica
salva e reaproveitar.

## Encerrando

`Ctrl+C` faz cleanup e sai. Em macOS, se a porta 5000 ficar presa por
algum motivo:

```bash
lsof -nP -iUDP:5000
kill <PID>
```

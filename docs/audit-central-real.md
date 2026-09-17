# Auditoria do protocolo VettiConfig

- Central: `192.168.5.80:5000`
- Data: 10/05/2026, 17:48:00
- Comandos enviados: 129

Resumo: **112 OK**, **17 falha** (13 params + 4 cmds).

## Parâmetros (`[T<seq> PAR <key>]`)

| Key | Label | Status | Resposta |
|-----|-------|--------|----------|
| `E1010000` | Senha do painel | OK | `PAR E1010000 "1234"` |
| `E1020000` | Nome do painel | OK | `PAR E1020000 "Receptora - Demo"` |
| `61010000` | Versão do firmware | OK | `PAR 61010000 SmartAlarm32: FC-0F-E7-32-3B-D2 - v 6.68 - Build: 2025/10/15 17:28:34 - Conex` |
| `A10A0000` | CID Protocolo | OK | `PAR A10A0000 2` |
| `A1070000` | CID Prioridade de conexão | OK | `PAR A1070000 1` |
| `E1060000` | CID URL 1 | OK | `PAR E1060000 "receptora.vetti.com.ar"` |
| `B1050000` | CID TCP port 1 | OK | `PAR B1050000 8001` |
| `E10B0000` | CID URL 2 | OK | `PAR E10B0000 ""` |
| `B1090000` | CID TCP Port 2 | OK | `PAR B1090000 9018` |
| `B1060000` | CID número da conta | OK | `PAR B1060000 55047` |
| `B1070000` | CID Teste Periódico (min) | OK | `PAR B1070000 60` |
| `E9020001` | CID DTMF Tel 1 | OK | `PAR E9020001 ""` |
| `E9020002` | CID DTMF Tel 2 | OK | `PAR E9020002 ""` |
| `910A0000` | Ether use static IP | OK | `PAR 910A0000 0` |
| `F1010000` | Ether IP address | OK | `PAR F1010000 255.255.255.255` |
| `F1020000` | Ether default gateway | OK | `PAR F1020000 255.255.255.255` |
| `F1030000` | Ether subnet mask | OK | `PAR F1030000 255.255.255.255` |
| `F1040000` | Ether DNS 1 | OK | `PAR F1040000 255.255.255.255` |
| `F1050000` | Ether DNS 2 | OK | `PAR F1050000 255.255.255.255` |
| `71010000` | VAR Ether IP | OK | `PAR 71010000 192.168.5.80` |
| `71020000` | VAR Ether Gateway | OK | `PAR 71020000 192.168.5.1` |
| `71030000` | VAR Ether Mask | OK | `PAR 71030000 255.255.255.0` |
| `71040000` | VAR Ether DNS 1 | OK | `PAR 71040000 192.168.5.1` |
| `71050000` | VAR Ether DNS 2 | OK | `PAR 71050000 0.0.0.0` |
| `910E0000` | GPRS auto/static | OK | `PAR 910E0000 0` |
| `61020000` | Modem COPS | OK | `PAR 61020000 ""` |
| `61030000` | Modem IMEI | OK | `PAR 61030000 ""` |
| `61040000` | Modem MODELO | OK | `PAR 61040000 ""` |
| `61050000` | GPRS Login | OK | `PAR 61050000 ""` |
| `61060000` | GPRS Password | OK | `PAR 61060000 ""` |
| `61070000` | GPRS APN | OK | `PAR 61070000 ""` |
| `61080000` | Modem ICC-ID | OK | `PAR 61080000 ""` |
| `E1030000` | GPRS Login (alt) | OK | `PAR E1030000 ""` |
| `E1040000` | GPRS APN Senha | OK | `PAR E1040000 ""` |
| `E1050000` | GPRS APN URL | OK | `PAR E1050000 ""` |
| `E1070000` | SSID Rede WiFi | OK | `PAR E1070000 ""` |
| `E1080000` | Senha Rede WiFi | OK | `PAR E1080000 ""` |
| `E1090000` | SSID WiFi do Painel | OK | `PAR E1090000 "Vetti SmartAlarm32"` |
| `E10A0000` | Senha WiFi do Painel | OK | `PAR E10A0000 "12345678"` |
| `91110000` | Mostrar SSID do Painel | OK | `PAR 91110000 0` |
| `A10B0000` | Wi-Fi AP channel | OK | `PAR A10B0000 6` |
| `A10C0000` | Wi-Fi AP encryption | OK | `PAR A10C0000 4` |
| `E9010001` | Linha Fixa Tel 1 | OK | `PAR E9010001 ""` |
| `E9010002` | Linha Fixa Tel 2 | OK | `PAR E9010002 ""` |
| `E9010003` | Linha Fixa Tel 3 | OK | `PAR E9010003 ""` |
| `E9010004` | Linha Fixa Tel 4 | OK | `PAR E9010004 ""` |
| `E9010005` | Linha Fixa Tel 5 | OK | `PAR E9010005 ""` |
| `E9030001` | GSM SMS 1 | OK | `PAR E9030001 ""` |
| `E9030002` | GSM SMS 2 | OK | `PAR E9030002 ""` |
| `E9030003` | GSM SMS 3 | OK | `PAR E9030003 ""` |
| `E9030004` | GSM TEL 1 | OK | `PAR E9030004 ""` |
| `E9030005` | GSM TEL 2 | OK | `PAR E9030005 ""` |
| `E9030006` | GSM TEL 3 | OK | `PAR E9030006 ""` |
| `91010000` | SMS arme/desarme | OK | `PAR 91010000 0` |
| `91020000` | SMS sensor no teste | OK | `PAR 91020000 0` |
| `91040000` | SMS queda-retorno energia | OK | `PAR 91040000 0` |
| `91070000` | SMS sensor aberto | OK | `PAR 91070000 0` |
| `91090000` | SMS armado com falha sensor | OK | `PAR 91090000 0` |
| `91030000` | Teclas Inferiores Automação | OK | `PAR 91030000 0` |
| `91060000` | Armar com Zona Aberta | OK | `PAR 91060000 0` |
| `91080000` | Armar com Sensor sem Comunicação | OK | `PAR 91080000 0` |
| `91120000` | Padrão Sensores Abertura após reset | OK | `PAR 91120000 0` |
| `91130000` | Monitorar Sirene com fio | OK | `PAR 91130000 0` |
| `A1010000` | DTMF número rings | OK | `PAR A1010000 5` |
| `A1020000` | Modo de arme | OK | `PAR A1020000 4` |
| `A1030000` | Modo de pânico | OK | `PAR A1030000 2` |
| `A1040000` | Tempo rearme auto (h) | OK | `PAR A1040000 0` |
| `A1050000` | Tempo arme/disparo (s) | OK | `PAR A1050000 0` |
| `A1060000` | Tempo pareamento (s) | OK | `PAR A1060000 5` |
| `A1090000` | Tempo de disparo | OK | `PAR A1090000 4` |
| `A10E0000` | Tempo portão (min) | OK | `PAR A10E0000 5` |
| `A10F0000` | Número de ciclos sirene | OK | `PAR A10F0000 9` |
| `B1040000` | Tempo avaria (min) | OK | `PAR B1040000 780` |
| `C1010000` | Arme prog Domingo | OK | `PAR C1010000 1431655765` |
| `C1020000` | Arme prog Segunda | OK | `PAR C1020000 4294967295` |
| `C1030000` | Arme prog Terça | ERR 22 | `ERR 22` |
| `C1040000` | Arme prog Quarta | ERR 22 | `ERR 22` |
| `C1050000` | Arme prog Quinta | ERR 22 | `ERR 22` |
| `C1060000` | Arme prog Sexta | ERR 22 | `ERR 22` |
| `C1070000` | Arme prog Sábado | ERR 22 | `ERR 22` |
| `C1080000` | Desarme prog Domingo | ERR 22 | `ERR 22` |
| `C1090000` | Desarme prog Segunda | ERR 22 | `ERR 22` |
| `C10A0000` | Desarme prog Terça | ERR 22 | `ERR 22` |
| `C10B0000` | Desarme prog Quarta | ERR 22 | `ERR 22` |
| `C10C0000` | Desarme prog Quinta | ERR 22 | `ERR 22` |
| `C10D0000` | Desarme prog Sexta | ERR 22 | `ERR 22` |
| `C10E0000` | Desarme prog Sábado | ERR 22 | `ERR 22` |
| `B1010000` | Periférico Ativado no Disparo | OK | `PAR B1010000 0` |
| `B1020000` | Periférico que Pulsa no Arme/Desarme | OK | `PAR B1020000 0` |
| `910F0000` | Atualizar Nuvem | OK | `PAR 910F0000 0` |
| `910D0000` | Monitora Sensores desarmado | OK | `PAR 910D0000 0` |
| `91100000` | Impedir auto-update | OK | `PAR 91100000 0` |
| `91050000` | Beta teste | OK | `PAR 91050000 0` |
| `A1080000` | Modo sniffer | OK | `PAR A1080000 125` |
| `B1030000` | Ether port UDP debug | OK | `PAR B1030000 5000` |
| `B1080000` | Wi-Fi port UDP debug | OK | `PAR B1080000 5002` |
| `B10A0000` | Índice Setor Fio 1 | OK | `PAR B10A0000 255` |
| `B10B0000` | Índice Setor Fio 2 | OK | `PAR B10B0000 256` |
| `91120000` | Padrão Sensores após reset | OK | `PAR 91120000 0` |
| `91130000` | Monitorar Sirene com fio | OK | `PAR 91130000 0` |
| `910B0000` | Não atualizar relógio auto | OK | `PAR 910B0000 0` |
| `910C0000` | Horário de verão | OK | `PAR 910C0000 0` |
| `A10D0000` | Fuso horário | OK | `PAR A10D0000 125` |
| `41010000` | CS bd | OK | `PAR 41010000 2527BAF2` |
| `41020000` | CS cfg | OK | `PAR 41020000 46211A35` |
| `41030000` | CS App | ERR 17 | `ERR 17` |
| `61090000` | Status Atualização Firmware | OK | `PAR 61090000 0x6 - 6 - DateTime: 2026/05/10 17:48:00` |
| `E10C0000` | URL Nuvem | OK | `PAR E10C0000 ""` |
| `E10D0000` | App Token | OK | `PAR E10D0000 ""` |

## Comandos

| Comando | Descrição | Status | Resposta |
|---------|-----------|--------|----------|
| `ID` | Lista MAC, IP, Nome, Interface | OK | `ID Mac:FC-0F-E7-32-3B-D2 IP:192.168.5.80 - SmartAlarm32 V6.68 - Nome:"Receptora - Demo" Interface:"Ethernet" - Empresa:"` |
| `INFO` | Versão do firmware (long) | OK | `INFO SmartAlarm32 V6.68 - Build date:2025/10/15 - Build time:17:28:34` |
| `BDS` | Total de dispositivos | OK | `BDS Tot:6 Max:256 Inib:0` |
| `BDX i` | Listar primeiro dispositivo | OK | `BD 1 Stat:OK Tipo:CR4 End:0C562FC2 V:1.13 Nome:"CR 4 botoes (001)" z:-T---- p:1----- zs:-------- cfg:50 Acao:3` |
| `BDX +` | Listar próximo dispositivo | OK | `BD 2 Stat:OK Tipo:CR8 End:08061B07 V:1.13 Nome:"CR 8 botoes (002)" z:-T---- p:1----- zs:-------- cfg:50 Acao:3` |
| `CMD 2` | Estado das partições | OK | `CMD 2 (p:-NNNNN)` |
| `CMD 7` | Ler data/hora do painel | OK | `CMD 7 "2026/05/10 17:48:00"` |
| `CMD 17` | Listar BD no Debug | OK | `CMD 17` |
| `CMD 19` | Listar Central no Debug | OK | `CMD 19` |
| `CMD 20` | Consulta RF (último resultado) | ERR 17 | `ERR 17` |
| `STAT 1` | Estado dos dispositivos (mapa) | OK | `STAT 1 "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00"` |
| `STAT 2` | Supervisão RF (mapa) | OK | `STAT 2 "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 08"` |
| `STAT 3` | Estado das baterias (mapa) | OK | `STAT 3 "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00"` |
| `STAT 4` | Estado da central (CID, GSM) | OK | `STAT 4 CID=NC GSM=NI Vdc=12384 Vbat=0 Tamper=0 Sir=1 Modem="" Cops=""` |
| `STAT 5` | Estado central + horário + servers | OK | `STAT 5 CID=NC GSM=NI Time="2026/05/10 17:48:00" Serv1="receptora.vetti.com.ar" Serv2=""` |
| `LOG 1` | Log interno: posição 1 | ERR 8 | `ERR 8` |
| `LOG 16` | Log interno: posição 16 | ERR 8 | `ERR 8` |
| `USER Idx=1` | Ler usuário 1 | OK | `USER Idx=1 Stat=OK Flags=1-1-1-11 Nome="segalla" Senha=23 Armar=1-----/DSTQQSS/00:00/23:59 Desarmar=1-----/DSTQQSS/00:00` |
| `USER Idx=2` | Ler usuário 2 | OK | `USER Idx=2 Stat=LIV` |
| `CE 1` | Calendário feriados pos 1 | ERR 8 | `ERR 8` |

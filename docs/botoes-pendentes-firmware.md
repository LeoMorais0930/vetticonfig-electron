# Botões pendentes de spec do firmware — VettiConfig

Inventário de botões na UI do app novo cujo comportamento depende de especificações do firmware. **Atualizado após engenharia reversa da versão Java** (em produção, em `/versaoultima`).

Marcações:

- ✅ **Resolvido pela versão Java** — implementação de referência existe, basta portar.
- ⚠️ **Pendente** — Java também não tem ou tem só parcial.

> Mapeamento detalhado de PARs e comandos: ver `docs/protocol-gaps.md`.

---

## ✅ Resolvido pela versão Java

### 1. Sincronizar hora / RTC

| Tela | Aba | Botão | Comando descoberto |
|---|---|---|---|
| Sistema | Supervisão | Sincronizar hora | **`CMD 7`** read/write. Formato `"YYYY/MM/DD HH:MM:SS"`. PARs auxiliares: `910B0000` (SNTP), `910C0000` (DST), `A10D0000` (timezone offset+128). |

Referência: `CtrlClockSet.kt` + `Comm.java:731-760`.

### 2. Keep-alive TCP remoto

Não é um botão, mas é função de comunicação que faltava. **Cliente TCP deve enviar frame 0xAB a cada 45s de inatividade**, senão a sessão cai. Referência: `TcpCom.java:507-525`.

---

## ⚠️ Pendente — sem spec ainda

### 3. Importar / Exportar JSON

| Tela | Aba | Botão | i18n | Pergunta para firmware |
|---|---|---|---|---|
| Sistema | Alarme | Salvar JSON | `alarme.salvar_json` | Existe comando que retorna dump completo de PARs? Ou o app monta lendo PAR por PAR? Qual o schema? |
| Sistema | Alarme | Importar JSON | `alarme.importar_json` | Validação no app ou na central? Em erro parcial: aborta ou continua? |

**Estado Java:** não implementado. Sem schema, sem comando proto.

### 4. Gerar PDF / Relatório

| Tela | Aba | Botão | i18n |
|---|---|---|---|
| Status, Sistema, Partição, Zona compartilhada | (todas) | PDF/CSV (ícone topbar) | `status.pdf_tooltip` |

**Estado Java:** nenhuma lib PDF (iText, pdfbox) no classpath. Geração é client-side ou tem comando proto que retorna dados estruturados?

### 5. Padrão de fábrica / Restaurar

| Tela | Aba | Botão | i18n | Pergunta para firmware |
|---|---|---|---|---|
| Configurações | Padrão de fábrica | Novo padrão / Gravar / Excluir | `configs.novo_padrao` / `common.save` / `usuario.excluir` | "Padrão de fábrica" é local ao app (snapshots do usuário) ou comando proto na central? |
| Configurações | Avançado | Restaurar padrão de fábrica | `configs.restaurar_fabrica` | Qual o comando? Apaga senhas/usuários/dispositivos? `PAR 91230000` (preservar senha master) já existe — funciona com esse reset? |

**Estado Java:** não tem botão de "restaurar". A flag `91230000` (preservar senha) existe, mas nenhum comando "RESET" foi encontrado.

### 6. Buffer / Histórico

| Tela | Aba | Botão | Pergunta para firmware |
|---|---|---|---|
| Sistema | Buffer | Carregar | `LOG <N>` retorna `ERR 8`. Java marca como legado (`flagLegacyCmdLog`). **Existe comando substituto?** Paginação? Filtros (data, tipo, partição)? |
| Configurações | Avançado | Limpar buffer | Comando para apagar? Apaga tudo ou seletivo? |

**Estado Java:** UI existe em `CtrlLog.kt`, mas o comando não funciona na central real testada (V0.1.0).

### 7. OTA / Firmware da central

| Tela | Aba | Botão | i18n | Pergunta para firmware |
|---|---|---|---|---|
| Configurações | Avançado | Atualizar firmware | `configs.atualizar` | Como o binário é enviado? Streaming via UDP/TCP, ou URL para a central baixar? Tem ack de progresso? Comportamento em queda de energia? |

**Estado Java:** `CtrlFtp.kt` implementa cliente FTP SSL/TLS para **baixar atualização do app VettiConfig** (não da central). Nenhum comando proto para OTA da central foi encontrado.

### 8. Calendário / Feriados

| Tela | Aba | Botão | Pergunta para firmware |
|---|---|---|---|
| Sistema | Agendamento | Cadastrar feriado | `CE <n>` retorna `ERR 8`. UI Java existe (`CtrlFeriadoList.kt`), comando idem. **Comando substituto?** |

### 9. Agendamento semanal

| Tela | Aba | Botão | Pergunta para firmware |
|---|---|---|---|
| Sistema | Agendamento | Gravar | `PAR C103*–C107*` (arme programável Terça-Sábado) e `C108*–C10E*` (desarme Dom-Sáb) retornam `ERR 22`. Só Domingo (`C101*`) e Segunda (`C102*`) funcionam. **Mapeamento PAR foi reorganizado?** |

**Estado Java:** envia os mesmos comandos via `CtrlArmeProg.kt`. Falha igual.

### 10. Cadastros (dispositivos, usuários, agendamento)

| Tela | Aba | Botão | Pergunta para firmware |
|---|---|---|---|
| Sistema | Dispositivos | Gravar / Excluir | Comando para cadastrar/remover sensor/PGM/teclado/sirene? Como passar ID RF? |
| Sistema | Usuário | Gravar / Excluir | Comando para criar/atualizar (senha, permissões 4 boxes, partições)? Master é deletável? |
| Sistema | Agendamento | Gravar | Idem §9 |

**Estado Java:** UI existe (`CtrlUserAdd.kt`, `CtrlUserEdit.kt`, etc.) mas o protocolo de escrita não foi explorado a fundo nesta engenharia reversa — ver código.

### 11. Conexão remota — servidor de monitoramento

| Tela | Aba | Botão | Pergunta para firmware |
|---|---|---|---|
| Sistema | Rede | Configurar conexão remota | Comando para a central registrar/atualizar conta no servidor de monitoramento? Senha do canal remoto é a mesma do PSW local? |

**Estado Java:** implementação completa em `TcpCom.java` (porta 9018, frame 0xAA, hash SHA-256 sobre `MAC_BYTES + CONTA_BYTES`). Falta apenas o lado da config da central (registrar conta).

---

## App-side (não envolve firmware)

Estes têm `data-par-todo` ou aparência de "config" mas a versão Java confirma que são apenas do app, não da central:

| Campo | Tela / Aba | Confirmação Java |
|---|---|---|
| Aceitar atualizações BETA | Configurações → Avançado | `91050000` no Java (`checkBoxAdvBetaTest`) — é da central. Atualizar `data-par-todo="aceitar_beta"` → `data-par="91050000"`. |
| Atualização automática (do app) | Configurações → Geral | `91100000` no Java (`checkBoxAdvAutoUpdate`) — também é da central, da função de auto-update. |
| Verificar atualização / Baixar e atualizar | Configurações → Geral | Local (endpoint do app). |

> Observação: o `91100000` e o `91050000` da Java na verdade **são** PARs da central (controlam autoupdate do firmware da central). Mapear nas tabelas acima.

---

## Resumo executivo

- **2 itens resolvidos** pela Java (RTC + keep-alive TCP).
- **~22 botões/ações ainda pendentes** distribuídos em 9 categorias.
- **Categorias mais críticas para perguntar à equipe de firmware**:
  1. Buffer (`LOG`) — função mais visivelmente quebrada.
  2. Agendamento semanal (`PAR C10x` ERR 22).
  3. Calendário/feriados (`CE` ERR 8).
  4. OTA da central — fluxo inexistente hoje.
  5. JSON import/export — sem schema.
  6. Restaurar padrão de fábrica — sem comando.

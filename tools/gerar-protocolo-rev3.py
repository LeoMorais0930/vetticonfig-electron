#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o documento DOCX "VETTI - Protocolo - VettiConfig - Rev 3" baseado na
Rev 2 (PDF) + complementos descobertos pela engenharia reversa da versão
Java em produção. Itens novidade da Rev 3 são marcados com highlight
amarelo e um glifo "★" no início.

Saída: docs/VETTI - Protocolo - VettiConfig - Rev 3.docx

Uso:
    python3 tools/gerar-protocolo-rev3.py
"""

from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_COLOR_INDEX, WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os, sys

OUT = '/Users/fcsegalla/dvlp/vetticonfig26/docs/VETTI - Protocolo - VettiConfig - Rev 3.docx'
LOGO = '/Users/fcsegalla/dvlp/vetticonfig26/build/icon.png'

# ───────── helpers de estilo ─────────────────────────────────────────────

def add_heading(doc, text, level, *, novo=False):
    h = doc.add_heading(level=level)
    run = h.add_run(('★ ' if novo else '') + text)
    run.bold = True
    if novo:
        run.font.highlight_color = WD_COLOR_INDEX.YELLOW
    return h

def p(doc, text=None, *, novo=False, bold=False, italic=False, size=None):
    para = doc.add_paragraph()
    if text is not None:
        run = para.add_run(text)
        run.bold = bold
        run.italic = italic
        if size: run.font.size = Pt(size)
        if novo: run.font.highlight_color = WD_COLOR_INDEX.YELLOW
    return para

def runp(para, text, *, novo=False, bold=False, italic=False, mono=False):
    run = para.add_run(text)
    run.bold = bold
    run.italic = italic
    if mono:
        run.font.name = 'Consolas'
    if novo:
        run.font.highlight_color = WD_COLOR_INDEX.YELLOW
    return run

def code_block(doc, text):
    para = doc.add_paragraph()
    para.paragraph_format.left_indent = Cm(0.5)
    run = para.add_run(text)
    run.font.name = 'Consolas'
    run.font.size = Pt(9)
    return para

def add_table(doc, headers, rows, *, novo_col=None, col_widths=None):
    """ Cria tabela com cabeçalho em negrito. `rows` é lista de tuplas/listas.
        `novo_col` é uma função (row_idx -> bool) que diz se a linha é novidade. """
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = 'Light Grid Accent 1'
    t.autofit = True
    # cabeçalho
    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = ''
        run = cell.paragraphs[0].add_run(h)
        run.bold = True
        run.font.size = Pt(9)
    # dados
    for ri, row in enumerate(rows):
        is_novo = novo_col(ri) if novo_col else False
        for ci, val in enumerate(row):
            cell = t.rows[ri + 1].cells[ci]
            cell.text = ''
            run = cell.paragraphs[0].add_run(str(val) if val is not None else '')
            run.font.size = Pt(9)
            # campos da primeira coluna em mono
            if ci == 0:
                run.font.name = 'Consolas'
            if is_novo:
                run.font.highlight_color = WD_COLOR_INDEX.YELLOW
    # larguras (opcional)
    if col_widths:
        for col, w in enumerate(col_widths):
            for row in t.rows:
                row.cells[col].width = Cm(w)
    return t


# ═════════════ inicia o documento ════════════════════════════════════════
doc = Document()

# Configura estilo padrão
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)

# Página
section = doc.sections[0]
section.left_margin = Cm(2.0); section.right_margin = Cm(2.0)
section.top_margin = Cm(2.0);  section.bottom_margin = Cm(2.0)


# ═════════════ CAPA ══════════════════════════════════════════════════════
p(doc)
try:
    doc.add_picture(LOGO, width=Cm(4.5))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
except Exception:
    pass

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = title.add_run('VETTI Tecnologia')
r.bold = True; r.font.size = Pt(20)

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run('SmartAlarm-Monitorada')
r.font.size = Pt(14)

p(doc); p(doc); p(doc)

main = doc.add_paragraph()
main.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = main.add_run('Protocolo de comunicação VettiConfig®')
r.bold = True; r.font.size = Pt(22)

rev = doc.add_paragraph()
rev.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = rev.add_run('Rev. 3')
r.bold = True; r.font.size = Pt(18)
r.font.color.rgb = RGBColor(0x00, 0x76, 0xCB)

p(doc); p(doc); p(doc); p(doc); p(doc)

date = doc.add_paragraph()
date.alignment = WD_ALIGN_PARAGRAPH.CENTER
date.add_run('13/05/2026')

# Legenda
p(doc); p(doc); p(doc)
legend = doc.add_paragraph()
legend.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = legend.add_run('Itens destacados em amarelo (★) são novidades da Rev. 3 — descobertos via análise da implementação Java em produção.')
r.font.size = Pt(9); r.italic = True
r.font.highlight_color = WD_COLOR_INDEX.YELLOW

doc.add_page_break()


# ═════════════ 1. HISTÓRICO DAS REVISÕES ═════════════════════════════════
add_heading(doc, '1. Histórico das revisões', 1)

p(doc, 'Revisão 1 (15/05/2020)', bold=True)
p(doc, '   — Documento inicial.')

p(doc, 'Revisão 2 (23/03/2021)', bold=True)
p(doc, '   — Padronização do conjunto de parâmetros e comandos disponíveis.')
p(doc, '   — Adicionado encapsulamento binário 0xAC para comandos VettiConfig.')

para = doc.add_paragraph()
runp(para, 'Revisão 3 (13/05/2026)', bold=True, novo=True)
p(doc, '   ★ Esclarecido o cálculo do HASH-256 do frame de login 0xAA: o input é a concatenação dos 8 bytes binários (MAC 6 + CONTA 2), e não a string ASCII hexadecimal.', novo=True)
p(doc, '   ★ Documentados os status codes da resposta de login 0xAA: 0x80 (OK), 0x8D (não cadastrada), 0x8E (offline), 0x8F (hash inválido).', novo=True)
p(doc, '   ★ Adicionado CMD 7 (RTC — leitura e gravação do relógio da central).', novo=True)
p(doc, '   ★ Adicionado CMD 8 (timer de cadastro remoto de dispositivos RF).', novo=True)
p(doc, '   ★ Adicionado CMD 14/16 (configuração de dispositivos RF — read/write).', novo=True)
p(doc, '   ★ Adicionado CMD 18 (timestamp de validade do VettiLogger remoto).', novo=True)
p(doc, '   ★ Documentado o formato real do STAT 4 (campos adicionais: Vdc, Vbat, Tamper, Sir, Modem, Cops).', novo=True)
p(doc, '   ★ Documentados os comandos USER e AGENDA com payload textual estruturado (cadastro/edição/exclusão de usuários e agendamentos).', novo=True)
p(doc, '   ★ Documentados os comandos BDS e BD para listagem do banco de dispositivos.', novo=True)
p(doc, '   ★ Corrigido o formato real do BDS (Tot/Max/Inib em vez de Tot/Max/Del/Des).', novo=True)
p(doc, '   ★ Formato real do comando ID detalhado (Mac, IP, Modelo, Versão, Nome, Interface, Empresa).', novo=True)
p(doc, '   ★ Formato real do comando INFO detalhado (SmartAlarm32 Vx.y - Build date - Build time).', novo=True)
p(doc, '   ★ Documentado o formato da resposta de senha inválida: "PSW ERR Tent=N Tmr=Ns" (não numérico).', novo=True)
p(doc, '   ★ Documentado o TTL de sessão (≈60s sem tráfego ⇒ ERR 7), com recomendação de re-autenticação automática.', novo=True)
p(doc, '   ★ Documentada a transformação da conta CID (PAR B1060000) entre decimal (central) e hex 4 dígitos uppercase (UI).', novo=True)
p(doc, '   ★ Acrescentado ERR 22 (parâmetro fora de alcance / não implementado).', novo=True)
p(doc, '   ★ Expandida a tabela de parâmetros (PARs) com 65 entradas mapeadas a partir da versão Java em produção.', novo=True)

doc.add_page_break()


# ═════════════ 2. ESCOPO ═════════════════════════════════════════════════
add_heading(doc, '2. Escopo', 1)
p(doc, 'Este documento descreve o protocolo de comunicação entre a aplicação cliente VettiConfig e a central de alarme da família SmartAlarm da VETTI Tecnologia. Cobre:')
p(doc, '   • Estabelecimento de sessão via servidor de monitoramento (TCP) ou rede local (UDP).')
p(doc, '   • Frames binários de envelope (login 0xAA, keep-alive 0xAB, comandos ASCII 0xAC).')
p(doc, '   • Comandos ASCII trocados entre cliente e central no formato [T<NNN> …] / [R<NNN> …] / [N<NNN> …].')
p(doc, '   • Lista completa de parâmetros (PAR) de configuração da central e seus formatos.')
p(doc, '   • Eventos assíncronos e códigos de erro.')


# ═════════════ 3. DEFINIÇÕES GERAIS ═════════════════════════════════════
add_heading(doc, '3. Definições Gerais', 1)
p(doc, 'Central — equipamento SmartAlarm que controla zonas, partições, dispositivos RF e canais de comunicação.')
p(doc, 'API VettiConfig — biblioteca/aplicativo que se comunica com a central para configuração e monitoramento.')
p(doc, 'Servidor de monitoramento — servidor relay (Segalla) que mantém conexão TCP persistente com a central e roteia comandos do VettiConfig.')
p(doc, 'Sequencial — número decimal de três dígitos (001–999) usado para correlacionar request e response. Reinicia a cada nova sessão.')
p(doc, 'Frame — pacote binário no formato STX + NB + FR + payload + CRC.')
p(doc, 'CRC — CRC-8/ITU, polinômio 0x07, init 0x00, sem reflexões, sem XOR final.')


# ═════════════ 4. DIREITOS ═══════════════════════════════════════════════
add_heading(doc, '4. Direitos', 1)
p(doc, 'Nenhuma parte deste documento, bem como anexos, normas ou referências, podem ser reproduzidas através de meios eletrônicos, fotocópia ou qualquer outro meio sem a autorização prévia formal da Vetti Tecnologia.')
p(doc, 'A VETTI Tecnologia reserva-se o direito de realizar alterações neste documento sem prévio aviso.')

doc.add_page_break()


# ═════════════ 5. CONEXÃO COM O SOFTWARE DE MONITORAMENTO ═══════════════
add_heading(doc, '5. Conexão com o software de monitoramento', 1)

# ── 5.1 Solicitação de acesso remoto
add_heading(doc, '5.1. Solicitação de acesso remoto', 2)

p(doc, 'Para que a central SmartAlarm possa receber comandos e solicitações da API VettiConfig remotamente, um pedido de login deverá ser enviado ao software de monitoramento para que este faça a ponte (conexão) entre a API VettiConfig e a central SmartAlarm. Caso o pedido seja recusado, nenhum outro comando será enviado para a central SmartAlarm.')

p(doc, 'A conexão TCP padrão para o servidor de monitoramento é estabelecida na porta 9018.')

p(doc, 'Solicitação de acesso remoto VettiConfig — definição dos campos (bytes):', bold=True)

add_table(doc,
    ['Campo', 'Tamanho', 'Hex', 'Descrição'],
    [
        ('STX',  '1 byte',  '0x02',         'Início da mensagem'),
        ('NB',   '1 byte',  '0x2A',         'Número total de bytes do frame (42 dec). Caso especial: para o frame de login 0xAA, NB = total; para os demais frames, NB = total − 1.'),
        ('FR',   '1 byte',  '0xAA',         'Tipo de frame (LOGIN)'),
        ('MAC',  '6 bytes', '0x00..0xFF',   'MAC da central'),
        ('HASH', '32 bytes','0x00..0xFF',   'SHA-256 do bloco binário (MAC + CONTA)'),
        ('CRC',  '1 byte',  '0x00..0xFF',   'CRC-8/ITU sobre NB..último_byte_antes_do_CRC'),
    ])

p(doc)
para = doc.add_paragraph()
runp(para, '★ Esclarecimento do HASH (Rev. 3): ', bold=True, novo=True)
runp(para, 'o input do SHA-256 é a concatenação ', novo=True)
runp(para, 'BINÁRIA', bold=True, novo=True)
runp(para, ' de 8 bytes — 6 bytes do MAC seguidos por 2 bytes da conta (a conta é interpretada como string hexadecimal de 4 dígitos e decodificada para 2 bytes binários antes de entrar no hash). Não é o SHA-256 da string ASCII hexadecimal concatenada.', novo=True)

p(doc, 'Exemplo (verificável):', bold=True)
code_block(doc,
    'MAC      = D8-80-39-AC-D9-03            (6 bytes binários: D8 80 39 AC D9 03)\n'
    'CONTA    = "5432"   (string hex de 4 chars → 2 bytes binários: 54 32)\n'
    'HASH-IN  = D8 80 39 AC D9 03 54 32      (8 bytes binários)\n'
    'SHA-256  = 32cc1a00aa4129f59b89d43b3ebdaf4c0ab8d499d7534106c75b1606423b097a')

p(doc, 'Frame final completo (42 bytes):', bold=True)
code_block(doc,
    '02 2A AA D8 80 39 AC D9 03 32 CC 1A 00 AA 41 29 F5 9B 89 D4\n'
    '3B 3E BD AF 4C 0A B8 D4 99 D7 53 41 06 C7 5B 16 06 42 3B 09\n'
    '7A 3F')

p(doc)
p(doc, 'Resposta do servidor de monitoramento (5 bytes):', bold=True)
add_table(doc,
    ['Campo', 'Tamanho', 'Hex', 'Descrição'],
    [
        ('STX',     '1 byte', '0x02',       'Início da mensagem'),
        ('NB',      '1 byte', '0x04',       'Número de bytes (NB = total − 1 = 4)'),
        ('FR',      '1 byte', '0xAA',       'Tipo de frame (LOGIN)'),
        ('STATUS',  '1 byte', 'ver tabela', 'Resultado da autenticação'),
        ('CRC',     '1 byte', '0x00..0xFF', 'CRC-8/ITU'),
    ])

p(doc)
para = doc.add_paragraph()
runp(para, '★ Status codes da resposta de login (Rev. 3):', bold=True, novo=True)

add_table(doc,
    ['Status (hex)', 'Significado', 'Ação esperada'],
    [
        ('0x80', 'Acesso liberado. Conexão estabelecida.',           'Prossegue com PSW.'),
        ('0x8D', 'Central não cadastrada no receptor.',              'Verificar cadastro da central/conta no servidor.'),
        ('0x8E', 'Central offline (não conectada ao receptor).',     'Aguardar a central reconectar. Retentar.'),
        ('0x8F', 'HASH inválido (assinatura não confere).',          'Verificar MAC e CONTA.'),
    ],
    novo_col=lambda i: True)

doc.add_page_break()


# ── 5.2 Keep-alive
add_heading(doc, '5.2. Mantendo a conexão aberta (keep-alive)', 2)

p(doc, 'O keep-alive deve ser enviado pela aplicação a cada 45 segundos quando não houver outro comando ou evento trafegando. Sua função é manter o link TCP/IP ativo após a conexão ser estabelecida.')

p(doc, 'Keep-alive — definição dos campos:', bold=True)
add_table(doc,
    ['Campo','Tamanho','Hex','Descrição'],
    [
        ('STX','1 byte','0x02','Início da mensagem'),
        ('NB', '1 byte','0x03','Número de bytes (NB = total − 1 = 3)'),
        ('FR', '1 byte','0xAB','Tipo de frame (KEEPALIVE)'),
        ('CRC','1 byte','0x67','CRC-8/ITU'),
    ])

p(doc, 'Frame completo (4 bytes): 02 03 AB 67')

p(doc)
p(doc, 'Resposta do servidor de monitoramento (5 bytes):', bold=True)
add_table(doc,
    ['Campo','Tamanho','Hex','Descrição'],
    [
        ('STX',    '1 byte','0x02','Início da mensagem'),
        ('NB',     '1 byte','0x04','NB = total − 1 = 4'),
        ('FR',     '1 byte','0xAB','Tipo de frame (KEEPALIVE)'),
        ('STATUS', '1 byte','0x80','Resposta OK'),
        ('CRC',    '1 byte','0xAD','CRC-8/ITU'),
    ])

p(doc, 'Frame completo: 02 04 AB 80 AD')

p(doc)
para = doc.add_paragraph()
runp(para, '★ Implementação recomendada (Rev. 3):', bold=True, novo=True)
runp(para, ' a aplicação deve manter um timer de 45 s que dispara o keep-alive; qualquer envio de comando reinicia o timer. Falha no envio do keep-alive significa que a conexão TCP foi derrubada — abrir nova sessão (frame 0xAA).', novo=True)

doc.add_page_break()


# ── 5.3 Envio de comandos (0xAC)
add_heading(doc, '5.3. Envio de comandos e configurações VettiConfig para a central', 2)

p(doc, 'Todos os comandos e configurações VettiConfig enviados para a central SmartAlarm via servidor de monitoramento devem obedecer à estrutura abaixo. O software de monitoramento encaminha integralmente o frame para a central.')

add_table(doc,
    ['Campo','Tamanho','Hex','Descrição'],
    [
        ('STX','1 byte','0x02','Início da mensagem'),
        ('NB', '1 byte','0x04..0xFF','Número de bytes (NB = total − 1)'),
        ('FR', '1 byte','0xAC','Tipo de frame (ASCII_CMD)'),
        ('CMD','4..252 bytes','ASCII','Comando ASCII, incluindo delimitadores [ ]'),
        ('CRC','1 byte','0x00..0xFF','CRC-8/ITU'),
    ])

p(doc, 'Exemplo — envio do comando [T001 PAR 73 1] (permitir armar com porta/janela aberta):', bold=True)
code_block(doc,
    '02 12 AC  5B 54 30 30 31 20 50 41 52 20 37 33 20 31 5D  48\n'
    '|  |  |  └─────────── ASCII: [T001 PAR 73 1] ────────┘  └─ CRC')

p(doc, 'Resposta da central (envelope 0xAC com Status + payload ASCII):', bold=True)
add_table(doc,
    ['Campo','Tamanho','Descrição'],
    [
        ('STX','1 byte','0x02'),
        ('NB', '1 byte','NB = total − 1'),
        ('FR', '1 byte','0xAC'),
        ('STATUS','1 byte','0x80 = OK'),
        ('RESPOSTA','N bytes','ASCII [R<NNN> …]'),
        ('CRC','1 byte','CRC-8/ITU'),
    ])

p(doc, 'Exemplo de resposta — [R001 PAR 73 1]:', bold=True)
code_block(doc,
    '02 13 AC 80  5B 52 30 30 31 20 50 41 52 20 37 33 20 31 5D  F6\n'
    '|  |  |  |   └─────────── ASCII: [R001 PAR 73 1] ───────┘  └─ CRC')

doc.add_page_break()


# ── 5.4 Conexão local (UDP) — NOVA SEÇÃO Rev 3
add_heading(doc, '5.4. Conexão local via UDP (sem servidor de monitoramento)', 2, novo=True)

p(doc, 'Quando a aplicação está na mesma rede que a central (LAN), a comunicação pode ocorrer diretamente por UDP unicast, sem o envelope binário 0xAA/0xAB/0xAC.', novo=True)

p(doc, 'Características da conexão local:', bold=True, novo=True)
p(doc, '   • Porta UDP da central: 5000.', novo=True)
p(doc, '   • Comandos ASCII enviados diretamente (sem envelope binário).', novo=True)
p(doc, '   • Descoberta automática: broadcast UDP de [T001 ID] em todas as interfaces de rede ativas.', novo=True)
p(doc, '   • Central responde com [R001 …] contendo MAC, IP, modelo, versão e nome.', novo=True)
p(doc, '   • Após autenticação (PSW), o socket UDP é mantido vivo para troca de comandos e recepção de eventos assíncronos.', novo=True)
p(doc, '   • Não há keep-alive periódico (UDP é stateless). A sessão expira ~60 s após o último comando — ver §8.5.', novo=True)

p(doc, 'Exemplo de descoberta:', bold=True, novo=True)
code_block(doc,
    'Cliente → broadcast 255.255.255.255:5000  →  [T001 ID]\n'
    'Central →                            ←  [R001 Mac:D8-80-39-AC-D9-03 IP:192.168.1.100 -\n'
    '                                            SmartAlarm32 V0.1.0 - Nome:"Casa Demo"\n'
    '                                            Interface:"Ethernet" - Empresa:"Segalla"]')

p(doc)
para = doc.add_paragraph()
runp(para, '★ Convenção (Rev. 3):', bold=True, novo=True)
runp(para, ' o sequencial dos comandos locais começa em 001 e é independente do sequencial da sessão remota. Cliente e central correlacionam request/response pelo mesmo <NNN>.', novo=True)

doc.add_page_break()


# ═════════════ 6. PARÂMETROS ═════════════════════════════════════════════
add_heading(doc, '6. Parâmetros de configuração da central', 1)

p(doc, 'Os parâmetros são lidos/escritos via comando ASCII:')
code_block(doc, '[T<NNN> PAR <KEY> [<VALOR>]]')
p(doc, 'Onde <KEY> é a chave hexadecimal de 8 dígitos (uppercase, sem 0x). Sem <VALOR> a central retorna a leitura; com <VALOR> grava.')

p(doc, 'Resposta padrão:')
code_block(doc,
    'Leitura:   [R<NNN> PAR <KEY> <VALOR>]\n'
    'Gravação:  [R<NNN> PAR <KEY> <VALOR>]   (eco do valor gravado)\n'
    'Erro:      [R<NNN> ERR <CODE>]')

p(doc)
para = doc.add_paragraph()
runp(para, '★ Tabela de PARs expandida (Rev. 3):', bold=True, novo=True)
runp(para, ' a versão Java em produção utiliza 65 chaves PAR documentadas a seguir, organizadas por categoria. As entradas marcadas eram desconhecidas na Rev. 2.', novo=True)

# ── 6.1 Identificação
add_heading(doc, '6.1. Identificação', 2)

# (chave, variável/contexto, tipo, transformação, range, novo)
ident = [
    ('61010000', 'CentralId — Mac/IP/Modelo/Versão/Nome',       'string', 'parser "Mac:… IP:… - Modelo Ver - Nome:\"…\""', '—', True),
    ('E1010000', 'Senha da central',                            'string', 'direto',                                            '4–10 dígitos numéricos', True),
    ('E1100000', 'Nome da empresa de monitoramento',            'string', 'parser com aspas',                                  '—', True),
    ('B1060000', 'Conta CID (decimal na central, hex 4d na UI)','int',    '★ central guarda em decimal; UI exibe em hex 4 dígitos uppercase', '0..0xFFFF', True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in ident],
    novo_col=lambda i: ident[i][5])

# ── 6.2 Alarme
add_heading(doc, '6.2. Alarme', 2)

alarme = [
    ('A1010000','Número de toques antes de atender',                                'int','direto','1–15',         False),
    ('A1020000','Modo de arme (1=Silent, 2=Buzzer, 3=Sirene, 4=Ambos)',             'int','switch','1–4',          False),
    ('A1030000','Modo de pânico (1=Sirene, 2=Silencioso, 3=Ambos)',                 'int','switch','1–3',          False),
    ('A1040000','Tempo de rearme automático (h)',                                    'int','direto','0–24',         False),
    ('A1050000','Tempo de entrada/saída (s) — global',                               'int','direto','0–240',        False),
    ('A1060000','Tempo de pareamento (s)',                                           'int','direto','1–60',         False),
    ('A1090000','Tempo de disparo da sirene (min)',                                  'int','direto','1–10',         False),
    ('A10F0000','Número máximo de ciclos da sirene',                                 'int','direto','0–240',        True),
    ('A1110000','Arme forçado (1=Não, 2..10=tentativas)',                            'int','combinado bool+int','1–10', True),
    ('A1130000','Tempo rearme presença LR (1..6 → 0/15/30/60/120/240 s)',           'int','switch','1–6',          True),
    ('A1140000','Modo de arme STAY (1=Silent, 2=Buzzer, 3=Sirene, 4=Ambos)',         'int','switch','1–4',          True),
    ('A1160000','Tempo do botão de pânico (1=Curto, 2=Médio, 3=Longo, 4=Muito Longo)','int','switch','1–4',         True),
    ('A1170000','Bitmask sirene com fio por partição (bits 0..5 = P1..P6)',          'int','bitmask','0..0x3F',     True),
    ('A1180000','Tempo de entrada global (s)',                                       'int','direto','0–240',        True),
    ('A1190000','Tempo de saída global (s)',                                         'int','direto','0–240',        True),
    ('A11B0000','Tempo de entrada — Partição 1 (s)',                                 'int','direto','0–240',        True),
    ('A11C0000','Tempo de entrada — Partição 2 (s)',                                 'int','direto','0–240',        True),
    ('A11D0000','Tempo de entrada — Partição 3 (s)',                                 'int','direto','0–240',        True),
    ('A11E0000','Tempo de entrada — Partição 4 (s)',                                 'int','direto','0–240',        True),
    ('A11F0000','Tempo de entrada — Partição 5 (s)',                                 'int','direto','0–240',        True),
    ('A1200000','Tempo de entrada — Partição 6 (s)',                                 'int','direto','0–240',        True),
    ('A1210000','Tempo de saída — Partição 1 (s)',                                   'int','direto','0–240',        True),
    ('A1220000','Tempo de saída — Partição 2 (s)',                                   'int','direto','0–240',        True),
    ('A1230000','Tempo de saída — Partição 3 (s)',                                   'int','direto','0–240',        True),
    ('A1240000','Tempo de saída — Partição 4 (s)',                                   'int','direto','0–240',        True),
    ('A1250000','Tempo de saída — Partição 5 (s)',                                   'int','direto','0–240',        True),
    ('A1260000','Tempo de saída — Partição 6 (s)',                                   'int','direto','0–240',        True),
    ('A1270000','Teclado arme forçado (1=Não, 2=Permitido, 3=Zona Anulada)',         'int','switch','1–3',          True),
    ('A1280000','Auto-bypass intervalo (min)',                                       'int','direto','1–60',         True),
    ('A1290000','Auto-bypass eventos',                                               'int','direto','2–50',         True),
    ('A12A0000','Teclado tentativas senha inválida',                                  'int','direto','1–10',         True),
    ('B10C0000','Tempo rearme automático — Partição 1 (h)',                          'int','direto','0–24',         True),
    ('B10D0000','Tempo rearme automático — Partição 2 (h)',                          'int','direto','0–24',         True),
    ('B10E0000','Tempo rearme automático — Partição 3 (h)',                          'int','direto','0–24',         True),
    ('B10F0000','Tempo rearme automático — Partição 4 (h)',                          'int','direto','0–24',         True),
    ('B1100000','Tempo rearme automático — Partição 5 (h)',                          'int','direto','0–24',         True),
    ('B1110000','Tempo rearme automático — Partição 6 (h)',                          'int','direto','0–24',         True),
    ('91030000','Teclas inferiores do teclado liberam CR (0/1)',                     'bool','—','0/1',              False),
    ('91120000','Padrão dos sensores após RESET (0=Fechado, 1=Aberto)',              'bool','switch','0/1',         True),
    ('91260000','SmartTeclado: beep no tempo de saída (0=Sim, 1=Não)',               'bool','—','0/1',              True),
    ('91270000','SmartTeclado: PGM exige senha (0/1)',                               'bool','—','0/1',              True),
    ('91280000','SmartTeclado: pânico exige senha (0/1)',                            'bool','—','0/1',              True),
    ('91290000','SmartTeclado: arme exige senha (0/1)',                              'bool','—','0/1',              True),
    ('912E0000','Auto-isolar (auto-bypass) ativado (0/1)',                           'bool','—','0/1',              True),
    ('E1110000','Senha de coação SmartTeclado',                                       'string','direto','4–10 dígitos',True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in alarme],
    novo_col=lambda i: alarme[i][5])

doc.add_page_break()

# ── 6.3 Supervisão
add_heading(doc, '6.3. Supervisão', 2)

superv = [
    ('A1100000','Sinal de vida LR (1..6 → 1/2/4/8/12/24 h)',                          'int','switch','1–6', True),
    ('A1150000','Keep-alive do teclado (min sem comunicação antes de erro)',         'int','direto','—',   True),
    ('A11A0000','Delay AC para gerar evento (10..240 s)',                            'int','direto','10–240', True),
    ('A12E0000','Restaurar tempo de entrada após disparo (min)',                     'int','direto','15–60', True),
    ('91130000','Monitorar sirene com fio (0=monitora, 1=não monitora)',             'bool','inverso','0/1', True),
    ('91140000','Buzzer na violação da sirene com fio (0/1)',                        'bool','—','0/1', True),
    ('91150000','Buzzer na violação do tamper (0/1)',                                'bool','—','0/1', True),
    ('91160000','Buzzer na ausência de AC (0/1)',                                    'bool','—','0/1', True),
    ('91170000','Supervisão RF de dispositivos comuns (0=desativada, 1=ativada)',    'bool','—','0/1', True),
    ('91180000','Tamper sempre 24 h (0/1)',                                          'bool','—','0/1', True),
    ('911C0000','Monitora tamper dos sensores comuns (0=monitora, 1=ignora)',        'bool','inverso','0/1', True),
    ('911D0000','Buzzer durante tempo de entrada (beep repetitivo) (0/1)',           'bool','—','0/1', True),
    ('911E0000','Sirene durante tempo de entrada (beep repetitivo) (0/1)',           'bool','—','0/1', True),
    ('91200000','Teclado RF instalado (0=Não, 1=Sim)',                               'bool','—','0/1', True),
    ('91240000','Buzzer na ausência da bateria (6 bips) (0/1)',                      'bool','—','0/1', True),
    ('912A0000','Retransmite evento de bateria baixa do sensor (24h) (0/1)',         'bool','—','0/1', True),
    ('912B0000','Retransmite evento de sensor ausente (24h) (0/1)',                  'bool','—','0/1', True),
    ('912C0000','Retransmite evento de sensor inibido (24h) (0/1)',                  'bool','—','0/1', True),
    ('912D0000','Horário da retransmissão: 0=variável, 1=fixo',                       'bool','enum','0/1', True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in superv],
    novo_col=lambda i: superv[i][5])


# ── 6.4 Rede / Wi-Fi
add_heading(doc, '6.4. Rede e Wi-Fi', 2)

rede = [
    ('A12B0000','Tecnologia rede celular (1=Auto, 2=2G, 3=3G/4G)',                   'int','switch','1–3', True),
    ('91110000','SSID do Wi-Fi AP visível (0=visível, 1=oculto)',                    'bool','enum','0/1', True),
    ('610A0000','Endereço IPv6 do modem GSM',                                         'string','hex bytes', '—', True),
    ('610B0000','Endereços Wi-Fi (STIP=, STMAC=, APIP=, APMAC=)',                    'string','parser por chave', '—', True),
    ('E10F0000','URL para PING IPv6',                                                 'string','parser com aspas','—', True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in rede],
    novo_col=lambda i: rede[i][5])


# ── 6.5 ContactID
add_heading(doc, '6.5. ContactID', 2)

cid = [
    ('A1070000','Prioridade de conexão CID (1..6)',                                   'int','switch','1–6', True),
    ('911A0000','Envia CID liga/desliga PGM (0=enviar, 1=não enviar)',                'bool','inverso','0/1', True),
    ('911F0000','Força discagem DTMF (0=com linha, 1=sempre disca)',                 'bool','enum','0/1', True),
    ('91210000','Envia CID supervisão para PGM (0/1)',                                'bool','—','0/1', True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in cid],
    novo_col=lambda i: cid[i][5])


# ── 6.6 Avançado / Logger
add_heading(doc, '6.6. Avançado e VettiLogger', 2)

avancado = [
    ('A1080000','Modo Sniffer (0=Off, 123=Sniffer, 124=Sniffer+CID, 125=DB Only)',   'int','switch','0/123/124/125', True),
    ('A1120000','VettiLogger — número máximo de dias',                                'int','direto','—',  True),
    ('A12C0000','Low Duty Cycle — tempo ON (ms)',                                     'int','direto','ms', True),
    ('A12D0000','Low Duty Cycle — tempo OFF (× 10 ms)',                              'int','×10', 'múltiplos de 10ms', True),
    ('41040000','Timestamp de validade do VettiLogger (hex Unix epoch)',              'long','hex→uint→×1000','unix timestamp', True),
    ('91050000','Beta Test ativo (0/1)',                                              'bool','—','0/1', True),
    ('91100000','Auto-update do firmware da central (0=sim, 1=não)',                  'bool','inverso','0/1', True),
    ('91220000','IPv6 GSM habilitado (0/1)',                                          'bool','—','0/1', True),
    ('91230000','Preservar senha master após RESET (0/1)',                            'bool','—','0/1', True),
    ('91250000','Permitir conexão do app móvel (0=permitir, 1=bloquear)',             'bool','inverso','0/1', True),
    ('911B0000','VettiLogger destino (0=local UDP, 1=servidor remoto)',               'bool','enum','0/1', True),
    ('B1120000','VettiLogger porta UDP — Ethernet',                                    'int','direto','porta', True),
    ('B1130000','VettiLogger porta UDP — Wi-Fi',                                       'int','direto','porta', True),
    ('B1140000','VettiLogger porta UDP — GPRS',                                        'int','direto','porta', True),
    ('B1150000','VettiLogger porta UDP — Ethernet (não solicitados)',                  'int','direto','porta', True),
    ('B1160000','VettiLogger porta UDP — Wi-Fi (não solicitados)',                     'int','direto','porta', True),
    ('B1170000','VettiLogger porta UDP — GPRS (não solicitados)',                      'int','direto','porta', True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in avancado],
    novo_col=lambda i: avancado[i][5])


# ── 6.7 Clock / RTC
add_heading(doc, '6.7. Relógio (RTC)', 2, novo=True)

clock = [
    ('910B0000','SNTP automático (0=automático, 1=manual)',                           'bool','inverso','0/1', True),
    ('910C0000','Horário de verão DST (0/1)',                                         'bool','—','0/1', True),
    ('A10D0000','Timezone (encoding: valor = 128 + offset_horas)',                    'int','offset+128','116..140 (GMT-12..+12)', True),
]
add_table(doc,
    ['Chave PAR','Campo','Tipo','Transformação','Range'],
    [(r[0], r[1], r[2], r[3], r[4]) for r in clock],
    novo_col=lambda i: clock[i][5])

p(doc)
para = doc.add_paragraph()
runp(para, '★ Conversão de timezone (Rev. 3):', bold=True, novo=True)
runp(para, ' a UI exibe -12 a +12 horas; o PAR armazena (offset + 128). Exemplos: GMT-3 → 125; GMT-0 → 128; GMT+3 → 131.', novo=True)


doc.add_page_break()


# ═════════════ 7. COMANDOS ═══════════════════════════════════════════════
add_heading(doc, '7. Comandos da central', 1)

p(doc, 'Os comandos VettiConfig são strings ASCII envolvidas em [ ]. Toda requisição tem seqüencial NNN (3 dígitos, 001–999) e a resposta correlacionada tem o mesmo NNN.')

code_block(doc,
    '[T<NNN> <COMANDO>]   ← request  (cliente → central)\n'
    '[R<NNN> <RESPOSTA>]  ← reply correlacionado\n'
    '[N<NNN> <EVENTO>]    ← evento assíncrono (central → cliente, sem request)')

# ── 7.1 Autenticação
add_heading(doc, '7.1. Autenticação (PSW)', 2)

p(doc, 'Após estabelecida a sessão (TCP via 0xAA ou UDP local), o primeiro comando obrigatório é o PSW.')
code_block(doc,
    'Request:   [T001 PSW <senha>]\n'
    'Resposta:  [R001 PSW OK]                  (sucesso)\n'
    '       ou: [R001 PSW ERR Tent=N Tmr=Ns]   (★ Rev. 3: senha errada)')

p(doc)
para = doc.add_paragraph()
runp(para, '★ Formato real da resposta de erro (Rev. 3):', bold=True, novo=True)
runp(para, ' a central retorna "PSW ERR Tent=<N> Tmr=<S>s" — onde Tent é o número de tentativas restantes e Tmr o tempo em segundos de lockout. Não é o formato numérico "ERR <n>" dos demais erros.', novo=True)


# ── 7.2 Identificação e versão
add_heading(doc, '7.2. Identificação (ID) e versão (INFO)', 2, novo=True)

p(doc, 'Comando ID — retorna identificação da central:', bold=True, novo=True)
code_block(doc, '[T<NNN> ID]')
p(doc, 'Resposta:', novo=True)
code_block(doc,
    '[R<NNN> Mac:<MAC> IP:<IP> - <Modelo> <Versão> - Nome:"<Nome>"\n'
    '        Interface:"<Interface>" - Empresa:"<Empresa>"]')
p(doc, 'O comando ID é usado também como payload do discovery UDP em broadcast (porta 5000).', novo=True)

p(doc)
p(doc, 'Comando INFO — retorna versão e datas de build:', bold=True, novo=True)
code_block(doc, '[T<NNN> INFO]')
p(doc, 'Resposta:', novo=True)
code_block(doc, '[R<NNN> SmartAlarm32 V<ver> - Build date:<dd/mm/aaaa> - Build time:<hh:mm:ss>]')


# ── 7.3 Status
add_heading(doc, '7.3. STAT — status da central', 2)

p(doc, 'Conjunto de comandos STAT N. Cada um retorna um aspecto do estado.')

p(doc, 'STAT 1 — status (aberto/fechado) das zonas/sensores:', bold=True)
code_block(doc, '[T<NNN> STAT 1]  →  [R<NNN> STAT 1 "<32 bytes hex separados por espaço>"]')

p(doc, 'STAT 2 — estado (OK/avaria) de dispositivos:', bold=True)
code_block(doc, '[T<NNN> STAT 2]  →  [R<NNN> STAT 2 "<32 bytes hex>"]')

p(doc, 'STAT 3 — status de bateria baixa dos dispositivos:', bold=True)
code_block(doc, '[T<NNN> STAT 3]  →  [R<NNN> STAT 3 "<32 bytes hex>"]')

p(doc)
para = doc.add_paragraph()
runp(para, '★ STAT 4 — status detalhado da central (Rev. 3):', bold=True, novo=True)

p(doc, 'Resposta com múltiplos campos chave=valor:', novo=True)
code_block(doc,
    '[R<NNN> STAT 4 CID=<tipo> GSM=<sinal> Vdc=<mV> Vbat=<mV>\n'
    '        Tamper=<0|1> Sir=<0|1> Modem="<str>" Cops="<str>"]')

add_table(doc,
    ['Campo','Valor','Significado'],
    [
        ('CID',    'NC / GPRS / Wi-Fi / ethernet', 'Canal de comunicação atual'),
        ('GSM',    'NI / 99 / <RSSI>',             'NI=não instalado, 99=sem sinal, número=RSSI'),
        ('Vdc',    '<mV>',                         'Tensão da fonte AC (mV). < 3.3V = ausente'),
        ('Vbat',   '<mV>',                         'Tensão da bateria (mV). < 3.3V = ausente'),
        ('Tamper', '0 / 1',                        '0=OK, 1=violado'),
        ('Sir',    '0 / 1',                        '0=presente, 1=ausente'),
        ('Modem',  'UG96 / BG96 / BG95 / EG912Y / EG915U / GL865 / ""', 'Modelo do modem GSM (vazio se não houver)'),
        ('Cops',   '"<operadora>" + tipo',         'Operadora + tipo (2G/3G/4G) após a 3ª vírgula'),
    ],
    novo_col=lambda i: True)


# ── 7.4 CMD
add_heading(doc, '7.4. CMD — comandos diversos', 2)

p(doc, 'CMD 2 — estado das 6 partições:', bold=True)
code_block(doc,
    '[T<NNN> CMD 2]  →  [R<NNN> CMD 2 (p:XXXXXX)]\n'
    '   onde cada X é um caractere indicando o estado de uma das 6 partições:\n'
    '   "-" = não usada     N = normal       A = armada       S = arme stay\n'
    '   P = pânico          D = disparou     E = entrada      X = anulada')
p(doc, 'CMD 2 + ação — armar/desarmar/stay/pânico:', bold=True)
code_block(doc, '[T<NNN> CMD 2 <AT|AP|D|P>:<N>]   N = 1..6 (número da partição)')

para = doc.add_paragraph()
runp(para, '★ CMD 7 — RTC (Rev. 3):', bold=True, novo=True)
runp(para, ' leitura e gravação do relógio da central.', novo=True)
code_block(doc,
    'Leitura:  [T<NNN> CMD 7]\n'
    'Resposta: [R<NNN> CMD 7 "<YYYY/MM/DD HH:MM:SS>"]\n'
    '\n'
    'Gravação: [T<NNN> CMD 7 "<YYYY/MM/DD HH:MM:SS>"]\n'
    'Resposta: [R<NNN> CMD 7 OK]')

para = doc.add_paragraph()
runp(para, '★ CMD 8 — timer de cadastro remoto de dispositivos (Rev. 3):', bold=True, novo=True)
runp(para, ' aciona o modo "aguardando sinal RF" e devolve o tempo restante até o timeout.', novo=True)
code_block(doc,
    '[T<NNN> CMD 8]  →  [R<NNN> CMD 8 <segundos_restantes>]')

para = doc.add_paragraph()
runp(para, '★ CMD 14 — leitura de configuração de dispositivo RF (Rev. 3):', bold=True, novo=True)
code_block(doc, '[T<NNN> CMD 14 <parâmetros_de_filtro>]')
para = doc.add_paragraph()
runp(para, '★ CMD 16 — gravação de configuração de dispositivo RF (Rev. 3):', bold=True, novo=True)
code_block(doc, '[T<NNN> CMD 16 <payload>]')

para = doc.add_paragraph()
runp(para, '★ CMD 18 — timestamp de validade do VettiLogger (Rev. 3):', bold=True, novo=True)
code_block(doc,
    '[T<NNN> CMD 18]  →  [R<NNN> CMD 18 <ts1_hex> <ts2_hex> <ts3_hex>]\n'
    '   onde cada ts é um Unix timestamp em hex; cliente faz × 1000 para ms.')


# ── 7.5 Banco de dispositivos
add_heading(doc, '7.5. Banco de dispositivos (BDS / BD)', 2, novo=True)

p(doc, 'BDS — sumário do banco:', bold=True, novo=True)
code_block(doc,
    '[T<NNN> BDS]\n'
    '[R<NNN> BDS Tot:<n> Max:<m> Inib:<i>]\n'
    '   Tot = registros cadastrados, Max = capacidade máxima, Inib = inibidos.')

p(doc)
para = doc.add_paragraph()
runp(para, '★ Correção em relação à Rev. 2:', bold=True, novo=True)
runp(para, ' a Rev. 2 documenta os campos "Tot Max Del Des"; o firmware real retorna "Tot Max Inib".', novo=True)

p(doc, 'BD <idx> — lê um registro do BD:', bold=True, novo=True)
code_block(doc,
    '[T<NNN> BD <idx>]\n'
    '[R<NNN> BD Idx:<n> Stat:<s> Type:<t> Addr:<MAC_RF> Ver:<v>\n'
    '         Nome:"<n>" Zona:<bitmask> Part:<bitmask> ...]')

p(doc, 'Campos do registro (RegData):', bold=True, novo=True)
add_table(doc,
    ['Campo','Valores','Significado'],
    [
        ('Stat',  'OK / INVALID / FREE / DELETED / DEACTIVATED', 'Estado do registro'),
        ('Type',  'CENTRAL / CR4 / CR8 / MAG_CURTO / MAG_LONGO / INFRA_CURTO / INFRA_LONGO / SMARTPLUG / VENTILADOR / ABERTURA_SHOX / IR_CLONER / SIRENE_SEM_FIO / INTERRUPTOR / TRANSMISSOR_LR / SMART_TECLADO / ABERTURA_S / BOTAO_PANICO / SENSOR_COM_FIO',
                  'Tipo do dispositivo'),
        ('Addr',  '<MAC>',          'Endereço RF do dispositivo'),
        ('Ver',   '<versão>',       'Versão de firmware do dispositivo'),
        ('Zona',  'bitmap (6 bits)','h24, temporariamente, silencioso, inibido, stay, portão'),
        ('Part',  'bitmap (6 bits)','P1..P6'),
        ('Zs',    'bitmap (8 bits)','Zonas compartilhadas 1..8'),
        ('Cfg',   'bitmap (3 bits)','sup24h, sinalVidaDisabled, reedSwitchDisabled + sensitivity'),
    ],
    novo_col=lambda i: True)

p(doc, 'A escrita de dispositivos é feita predominantemente via CMD 8 (cadastro RF) e CMD 14/16 (configuração).', novo=True)


# ── 7.6 Usuários
add_heading(doc, '7.6. Usuários (USER)', 2, novo=True)

p(doc, 'Listar/ler um usuário:', bold=True, novo=True)
code_block(doc,
    '[T<NNN> USER Idx=<N>]\n'
    '[R<NNN> USER Idx=<N> Nome="..." Senha=<...> Flags=<hex8> ...]')

p(doc, 'Gravar/editar um usuário:', bold=True, novo=True)
code_block(doc,
    '[T<NNN> USER Idx=<N> Stat=OK Flags=<hex8> Nome="..." Senha=<4-10 dígitos>\n'
    '        Armar=<part>/<dow>/<hi>/<hf>  Desarmar=<part>/<dow>/<hi>/<hf>\n'
    '        Pgm=<part>/<dow>/<hi>/<hf>    Panico=<part>]')

p(doc, 'Excluir usuário:', bold=True, novo=True)
code_block(doc, '[T<NNN> USER Idx=<N> Stat=DEL]')

p(doc, 'Convenções dos campos:', bold=True, novo=True)
add_table(doc,
    ['Campo','Formato','Exemplo'],
    [
        ('part',   'sequência de 6 caracteres, cada um é o número da partição (1..6) ou "-" se desabilitada', '"1-3-5-"'),
        ('dow',    'sequência de 7 caracteres (Dom Seg Ter Qua Qui Sex Sab), letra do dia ou espaço',         '"DST Q S"'),
        ('hi/hf',  'hora início / hora fim no formato hh:mm',                                                 '"08:00"'),
        ('Flags',  'bitmask em hex de 8 dígitos. bit 0=armar, 1=armarDataHora, 2=desarmar, 3=desarmarDataHora, 4=pgm, 5=pgmDataHora, 6=panico, 7=enabled', '"000000B5"'),
    ],
    novo_col=lambda i: True)


# ── 7.7 Agendamentos
add_heading(doc, '7.7. Agendamentos (AGENDA)', 2, novo=True)

p(doc, 'Gravar/editar um agendamento:', bold=True, novo=True)
code_block(doc,
    '[T<NNN> AGENDA <idx> Stat:OK Hora:<hh:mm> Freq:<n> Feriado:<0|1>\n'
    '         Mes:<1-12> Dia:<1-31> DDS:<dow_bitmask>\n'
    '         Acao:<n> Part:<part> PGM:<idx> Desc:"..."]')

p(doc, 'Excluir agendamento:', bold=True, novo=True)
code_block(doc, '[T<NNN> AGENDA <idx> Stat:DEL]')

p(doc, 'Tabelas de Freq e Acao:', bold=True, novo=True)
add_table(doc,
    ['Freq (n)','Significado'],
    [('0','Anual'),('1','Mensal'),('2','Semanal'),('3','Feriado')],
    novo_col=lambda i: True)

add_table(doc,
    ['Acao (n)','Significado'],
    [
        ('0','Nenhuma'),
        ('1','Armar'),
        ('2','Desarmar'),
        ('3','PGM On'),
        ('4','PGM Off'),
        ('5','PGM Toggle'),
        ('6','PGM Pulse'),
    ],
    novo_col=lambda i: True)

p(doc)
para = doc.add_paragraph()
runp(para, 'Observação (Rev. 3):', bold=True, novo=True)
runp(para, ' o uso anterior dos PARs C1010000..C10E0000 para arme/desarme programáveis foi substituído pelo comando AGENDA. Os PARs C103.. em diante retornam ERR 22 no firmware atual.', novo=True)


# ── 7.8 Comandos de teclado (heredados Rev 2)
add_heading(doc, '7.8. Comandos do teclado (compatibilidade)', 2)

p(doc, 'Estrutura genérica:', bold=True)
code_block(doc, '[T<NNN> TEC IDX=<idx> CMD=<n> PAR=<valor>]')

p(doc, 'Subcomandos principais (compatibilidade com a Rev. 2): CMD=1 (status), CMD=2 (configuração de zona), CMD=3 (senha de autenticação), CMD=4 (associar partição), etc. Consultar a Rev. 2 para o detalhamento completo.')


doc.add_page_break()


# ═════════════ 8. RESUMO ═════════════════════════════════════════════════
add_heading(doc, '8. Resumo', 1)

# ── 8.1 Frames binários
add_heading(doc, '8.1. Frames binários (envelope)', 2)
add_table(doc,
    ['FR (hex)','Nome','Direção','NB','Payload','Uso'],
    [
        ('0xAA', 'LOGIN',     'Cliente → Servidor', 'total (= 0x2A no request)', '6 bytes MAC + 32 bytes HASH-256', 'Solicitação de acesso remoto'),
        ('0xAA', 'LOGIN ACK', 'Servidor → Cliente', 'total − 1 (= 0x04)',        '1 byte Status (★ 0x80/0x8D/0x8E/0x8F)', 'Resposta de autorização do servidor'),
        ('0xAB', 'KEEPALIVE', 'Cliente → Servidor', 'total − 1 (= 0x03)',        '(vazio)',                              'Mantém a conexão TCP ativa (a cada 45 s)'),
        ('0xAC', 'ASCII_CMD', 'Bidirecional',       'total − 1',                  'ASCII + 1 byte Status na resposta',    'Encapsula comandos VettiConfig'),
    ],
    novo_col=lambda i: i == 1)


# ── 8.2 Comandos ASCII
add_heading(doc, '8.2. Comandos ASCII (resumo)', 2)
cmds = [
    ('PSW <senha>',                 'Autenticar na central (sessão válida por ~60 s)', True),
    ('ID',                          'Identificação da central',  True),
    ('INFO',                        'Versão + build',            True),
    ('STAT 1/2/3',                  '32 bytes hex de status',    False),
    ('STAT 4',                      '★ status detalhado (CID, GSM, Vdc, Vbat, Tamper, Sir, Modem, Cops)', True),
    ('CMD 2',                       'Estado das 6 partições',    False),
    ('CMD 2 AT|AP|D|P:<N>',         'Armar/Desarmar/Stay/Pânico partição N', False),
    ('CMD 7',                       '★ Ler RTC',                  True),
    ('CMD 7 "yyyy/mm/dd hh:mm:ss"', '★ Gravar RTC',               True),
    ('CMD 8',                       '★ Timer cadastro RF',        True),
    ('CMD 14 / CMD 16',             '★ Config RF read/write',     True),
    ('CMD 18',                      '★ Timestamps VettiLogger',   True),
    ('PAR <KEY> [<VALOR>]',         'Ler/gravar parâmetro (ver §6)', False),
    ('BDS',                         '★ Sumário do banco (Tot/Max/Inib)', True),
    ('BD <idx>',                    '★ Ler registro do BD',       True),
    ('USER Idx=<N> ...',            '★ Cadastro/edição/exclusão de usuário', True),
    ('AGENDA <idx> ...',            '★ Cadastro/edição/exclusão de agendamento', True),
    ('DCN',                         'Desconectar',                False),
]
add_table(doc,
    ['Comando','Função'],
    [(c[0], c[1]) for c in cmds],
    novo_col=lambda i: cmds[i][2])


# ── 8.3 Eventos assíncronos
add_heading(doc, '8.3. Eventos assíncronos (N)', 2)
p(doc, 'Mensagens enviadas pela central sem solicitação prévia. Formato:')
code_block(doc, '[N<NNN> <EVENTO>]')

add_table(doc,
    ['Evento','Significado'],
    [
        ('CSTAT', 'Status geral da central mudou'),
        ('TE',    'Tempo de entrada disparou (P:<n>)'),
        ('TS',    'Tempo de saída disparou (P:<n>)'),
        ('PSTAT', 'Status de partição mudou'),
    ])


# ── 8.4 Códigos de erro
add_heading(doc, '8.4. Códigos de erro (ERR)', 2)
add_table(doc,
    ['Código','Significado','Tratamento sugerido'],
    [
        ('7',  'Senha inválida / sessão expirada',     'Re-autenticar com PSW guardado em memória e refazer o comando.'),
        ('8',  'Comando inexistente / não suportado', 'Verificar versão do firmware (ex.: LOG, CE em V0.1.0 retornam ERR 8).'),
        ('17', 'Pré-condição não satisfeita',         'Verificar estado da central / sequência de comandos.'),
        ('22', '★ Parâmetro fora de alcance ou não implementado', 'Verificar versão do firmware (ex.: PAR C103..C10E)'),
        ('27', 'Fim do banco de dados',              'Encerrar iteração de BDX/BD.'),
        ('32', '★ Valor inválido / fora de alcance para o PAR (testado: gravar 0 ou "" em PAR numérico)', 'Validar valor no cliente antes de enviar. Não gravar PARs numéricos com campo vazio.'),
    ],
    novo_col=lambda i: i in (3, 5))

p(doc)
para = doc.add_paragraph()
runp(para, '★ Observação sobre gravação de PARs numéricos vazios (Rev. 3):', bold=True, novo=True)
runp(para, ' a central recusa gravações de PAR de tipo inteiro com valor 0 ou string vazia em campos como porta (B1090000), retornando ERR 32. O cliente deve aplicar o valor default declarado pelo firmware (ver §8.7) ou omitir a gravação quando o usuário deixar o campo numérico vazio — mantendo o valor anterior na central. A versão Java de produção apresenta o mesmo comportamento mas falha em silêncio. Para PARs do tipo string (URL, nome, etc.), gravar "" é aceito e tem efeito de "limpar".', novo=True)

# ── 8.7 Defaults declarados pela engenharia
add_heading(doc, '8.7. Valores default para gravação', 2, novo=True)

p(doc, 'Quando o usuário não preencher um campo numérico, o cliente deve aplicar o valor default declarado pela engenharia Vetti antes de gravar. A central recusa gravações com 0 ou vazio nesses campos (ERR 32).', novo=True)

add_table(doc,
    ['PAR','Campo','Range válido','Default','Observação'],
    [
        ('B1050000','Porta do servidor de monitoramento principal','1024 – 65533','9018','Porta TCP/IP padrão Vetti para receptora.'),
        ('B1090000','Porta do servidor de monitoramento backup',   '1024 – 65533','9018','Porta TCP/IP padrão Vetti para receptora.'),
    ],
    novo_col=lambda i: True)

p(doc)
para = doc.add_paragraph()
runp(para, '★ Regra de aplicação do default (Rev. 3):', bold=True, novo=True)
runp(para, ' o cliente deve aplicar o default declarado pelo firmware antes de gravar quando o valor digitado pelo usuário for: vazio, não-numérico, ou estiver fora do range válido. Para portas TCP especificamente, isso significa substituir por 9018 qualquer entrada < 1024 ou > 65533. Sem essa substituição, a central rejeita a gravação com ERR 32 e o valor anterior é mantido.', novo=True)

p(doc)
para = doc.add_paragraph()
runp(para, '★ Eco de gravação (Rev. 3):', bold=True, novo=True)
runp(para, ' a resposta [R<NNN> PAR <KEY> <VALOR>] de uma gravação contém o valor efetivamente gravado pela central. O cliente deve atualizar o campo da UI e o snapshot interno com esse valor confirmado (não com o valor enviado). Isso captura defaults aplicados pela central, normalizações e truncamentos.', novo=True)

p(doc)
para = doc.add_paragraph()
runp(para, 'Resposta especial para senha errada (PSW):', bold=True)
runp(para, ' ')
runp(para, '★ "PSW ERR Tent=<N> Tmr=<S>s" — não usa o formato numérico ERR <n>.', novo=True)


# ── 8.5 Sessão / TTL
add_heading(doc, '8.5. Sessão e re-autenticação', 2, novo=True)

p(doc, 'Após o PSW válido, a sessão é mantida ativa por aproximadamente 60 segundos sem tráfego. Qualquer comando reinicia esse temporizador.', novo=True)
p(doc, 'Quando a sessão expira, o próximo comando recebe ERR 7. A aplicação cliente deve guardar a senha em memória e, ao receber ERR 7, fazer:', novo=True)
code_block(doc,
    '1. Enviar [T<NNN> PSW <senha>] novamente.\n'
    '2. Receber [R<NNN> PSW OK].\n'
    '3. Reenviar o comando que falhou com novo sequencial.')

p(doc, 'Em conexão TCP remota, o frame 0xAB (keep-alive) também atua como atividade — recomenda-se intervalo ≤ 45 s.', novo=True)


# ── 8.6 Conta CID
add_heading(doc, '8.6. Convenções da conta CID (B1060000)', 2, novo=True)

p(doc, 'A conta CID é armazenada como inteiro decimal na central, mas habitualmente exibida em hexadecimal de 4 dígitos uppercase na interface. A aplicação deve converter ao ler/gravar:', novo=True)
code_block(doc,
    'Central → UI:  decimal 55047    → hex "D707"\n'
    'UI → Central:  hex "D707"       → decimal 55047')

p(doc, 'No hash do frame de login 0xAA, a conta é tratada como string hex de 4 caracteres e decodificada para 2 bytes binários antes de entrar no SHA-256 (ver §5.1).', novo=True)


# ── final
doc.add_page_break()
p(doc, 'Fim do documento — Protocolo de comunicação VettiConfig® Rev. 3', italic=True, size=10)


# ═════════════ Salva ═════════════════════════════════════════════════════
doc.save(OUT)
print(f'OK gerado: {OUT}')
size = os.path.getsize(OUT)
print(f'  tamanho: {size:,} bytes')

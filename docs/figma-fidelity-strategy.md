# Fidelidade ao Figma — diagnóstico e plano de trabalho

> Documento preparatório para reunião de diretoria sobre o redesign visual do VettiConfig (worktree `vetticonfig26-visual`).
>
> **Audiência**: diretoria + design + desenvolvimento.
> **Estado atual**: existem divergências reais entre o que está no Figma e o que está implementado no worktree `visual-redesign`. Este documento responde 6 perguntas estratégicas, faz um diagnóstico honesto do que aconteceu e propõe um plano de trabalho para garantir consistência.

---

## Resumo executivo

| Tópico | Veredito |
|---|---|
| 100% fidelidade ao Figma é factível? | **Sim**, com método. Não é factível com a abordagem atual (uma só pessoa fazendo features + visual em paralelo). |
| Hovers e animações vêm do Figma? | **Não automaticamente**. O Figma exporta visuais, não código de interação. Precisamos do estado *hover* descrito no Figma + replicar à mão. |
| Há coisas do Figma que não podem ser replicadas? | **Poucas, marginais**. Listadas abaixo. ~95% do design é replicável em CSS. |
| Tela a tela com aprovação garante consistência? | **Sim**. É a única forma confiável. Hoje não fazemos isso. |
| Por que se desviou do Figma? | **Priorizei função sobre forma** durante o desenvolvimento das features técnicas. Sem revisão de design intermediária, drift acumulou. |
| Skills/ferramentas ajudariam? | **Sim**, 4 propostas concretas no fim do documento. |

**Recomendação central**: separar o trabalho "tela por tela com aprovação de design antes de merge", instalar comparação visual automatizada (screenshot vs Figma) e usar o Figma como fonte única da verdade visual — não a interpretação do desenvolvedor.

---

## 1. É possível seguir 100% do design do Figma?

**Sim, com ressalvas técnicas pequenas.**

### O que é possível com fidelidade total

- **Cores, tipografia, espaçamentos, raios de canto, sombras, gradientes** — 100% replicáveis em CSS.
- **Layouts** (alinhamentos, grids, ordem de elementos) — 100%.
- **Ícones e ilustrações vetoriais** — 100% via SVG/Bootstrap Icons.
- **Estados visuais** (default/hover/active/disabled/error) — 100% replicáveis desde que estejam no Figma como variantes.

### O que precisa de cuidado

- **"Pixel-perfect"** entre macOS, Windows e Linux tem variações sub-pixel inerentes ao motor de renderização (font hinting, antialiasing). Diferenças de ±1px e variações finas de espessura de fonte são esperadas e fora do nosso controle. **Mensagem honesta**: "visualmente idêntico para um observador casual" é alcançável; "idêntico ao pixel em qualquer SO" não é.
- **Auto-layout do Figma** é diferente do flexbox do CSS em alguns casos extremos (ex.: hug-content com gap negativo). Geralmente equivalente, raramente requer adaptação.
- **Largura base do Figma é 1920×1080**. O app é redimensionável. Precisamos decidir: travar o app em 1920×1080? ou fazer responsivo? O Figma define o comportamento responsivo? Hoje quem decide é o desenvolvedor — isso é fonte de drift.

### Veredito

> **Sim, é factível alcançar fidelidade visual total ao Figma desde que o Figma seja tratado como fonte única da verdade e haja processo de validação a cada tela.** A barreira não é técnica, é de processo.

---

## 2. Hovers e animações: dá pra puxar do Figma?

**Visualmente sim. Como código pronto, não.**

### O que o Figma exporta nativamente

O Figma exporta apenas o **CSS estático** dos elementos. O motor de exportação não gera código de interação — então `:hover`, `:focus`, animações, transições e prototypes não viram código automaticamente.

### O que conseguimos extrair com trabalho manual

| Elemento | Como extraímos |
|---|---|
| Cores/escala/sombra no estado hover | Selecionando a variante "hover" no Figma e copiando os tokens |
| Duração e curva de easing das transições | Lendo a propriedade "Smart Animate" do prototype no Figma |
| Sequência de uma animação (entrada/saída) | Vendo o preview no Figma ou pedindo gravação MP4 ao designer |
| Micro-interações (delays, encadeamentos) | Documentadas no Figma como "interactions" — precisamos ler manualmente |

### O que **não** dá pra extrair

- Animação física (spring, bounce com massa) — Figma não tem isso nativo; usamos `cubic-bezier` aproximado.
- Animação dependente de gesto físico (force touch, pinch) — Electron não suporta.
- Curvas de Bezier muito complexas — Figma exporta "smooth" mas nem sempre dá pra mapear 1:1 no CSS.

### Proposta

1. **Cada componente novo no Figma deve ter as variantes documentadas** (default, hover, active, disabled, focus, error) e o designer descreve no comentário a duração/easing.
2. **Animações complexas** devem vir com gravação em vídeo OU spec textual ("0.2s ease-out, slide-down 8px").
3. **Componentes-padrão** (botões, inputs, cards, tabs) são definidos UMA vez e reusados — não cada tela com sua própria.

---

## 3. O que do Figma **não** pode ser replicado no app?

Lista curta e honesta:

| Item | Por quê | Workaround |
|---|---|---|
| Frosted glass nativo macOS (vibrancy) | Electron não expõe diretamente | Aproximação com `backdrop-filter: blur()` — funciona em macOS, Win 10+, fallback em Win 7/Linux |
| Sombras com profundidade variável (3D) | CSS box-shadow é 2D | Aceitável — Figma também usa 2D |
| Variable fonts com axes não-padrão | Inter ofegão tem `weight` e `slant` apenas | Limitar a esses 2 eixos ou trocar fonte |
| Animações de path SVG complexas | CSS animation não anima `d=""` nativamente | Lottie ou SMIL — adiciona dependência |
| Sons / hápticos | Electron não toca som por padrão sem permissão | Pode ser feito mas precisa configurar |
| Janela com bordas customizadas (sem chrome do SO) | Possível mas adiciona muito código de drag/resize | Decidir caso a caso; hoje usamos chrome padrão |
| Tema do SO (auto dark mode) | Hoje temos toggle manual | Já está implementado, só não é "auto"; pode ser adicionado |

### O que parece complicado mas é fácil

- **Tooltips customizados** — já temos uma engine.
- **Modais com backdrop blur** — CSS puro.
- **Loaders e spinners** — CSS + SVG.
- **Drag-and-drop** — APIs HTML5.

**Conclusão**: ~95% do design do Figma é replicável sem ginástica. Os 5% que não são, são casos onde o Figma exibe algo nativo do SO que não tem equivalente cross-platform.

---

## 4. Tela a tela / aba a aba garante 100% de consistência?

**Sim — e é a única forma confiável de garantir.**

### Por que funciona

- Reduz escopo de revisão para um pedaço pequeno por vez.
- Designer e desenvolvedor olham para o mesmo objeto ao mesmo tempo.
- Pixel diffs ficam óbvios — não escondidos em meio a 30 telas.
- Cria checkpoints de "aprovado" — não reabre depois.

### Por que não estamos fazendo

- O worktree `visual-redesign` foi iniciado com a expectativa de "refazer tudo". Desenvolvedor (eu) implementou várias telas em paralelo, sem revisão intermediária.
- Faltou alguém comparando lado a lado.
- Não existia processo formal de "designer aprova → merge".

### Trade-offs de mudar pra "tela por tela"

| Vantagens | Desvantagens |
|---|---|
| Consistência garantida | Mais lento por tela |
| Erros descobertos cedo | Requer disponibilidade do designer (SLA) |
| Releases parciais possíveis | Coordenação extra |
| Backlog claro de aprovações | Velocidade média menor no curto prazo |

### Proposta concreta (ver §7 — Plano de trabalho)

1. Definir ordem das telas (priorização junto com produto).
2. Por tela: dev implementa em branch dedicado → screenshot side-by-side com Figma → designer revisa → dev ajusta → designer aprova → merge.
3. Designer compromete-se com SLA de revisão (sugiro 24-48h).
4. Tela com 3 rounds de ajuste sem convergência vira reunião — não bola de neve.

---

## 5. Por que se desviou do Figma?

**Análise honesta — sem desculpas, mas com contexto.**

Cinco razões reais, em ordem de impacto:

### 5.1 Função foi priorizada sobre forma durante features técnicas

Quando estávamos implementando a comunicação com a central (protocolo VettiConfig, autenticação UDP/TCP, frames 0xAA/0xAC, polling STAT/CMD/BD, abas Avançado/Buffer/Usuário etc), o foco foi "funcionar contra hardware real" — o tempo do desenvolvedor (eu) foi gasto debugando CRC-8, hash SHA-256 binário, encoding de partições, ERR codes do firmware. Visual ficou para "polir depois".

> **Mensagem**: features técnicas e fidelidade visual competem pelo mesmo tempo. Tentar fazer os dois em paralelo gera o pior dos mundos — features incompletas E visual divergente.

### 5.2 Sem revisão intermediária, drift acumulou

Sem ninguém comparando lado a lado a cada tela, decisões locais foram tomadas pelo desenvolvedor: "esse espaçamento é 16 ou 20px? vai 20 que é múltiplo da nossa escala". Cada decisão dessa é pequena. 200 decisões dessas viram um app que "lembra" o Figma mas não bate.

### 5.3 Figma exportado é absolute-positioned, não responsivo

O `figma-export.json` que eu uso como referência tem **todas as coordenadas absolutas** (X=320, Y=84, W=148, H=42). O Figma assume 1920×1080 fixo. Pra adaptar pra um app que abre em 1280×800 ou redimensiona, eu tive que **reescrever** os layouts em CSS flexbox/grid. Cada reescrita é uma oportunidade de drift.

> **Sub-problema**: o Figma não define explicitamente o comportamento responsivo. Quem decide é o desenvolvedor. Esse poder deve ser explicitado — ou o Figma deve cobrir os breakpoints, ou o produto/design define regras de responsividade em texto.

### 5.4 Eu trabalhei sem screenshot lado a lado

Sem uma ferramenta de comparação automática, eu olhava o PNG do Figma, abria o app, comparava de olho. Esse processo é falho — o olho compensa diferenças pequenas. Pixel diff automático mostra 1px de erro; olho humano não.

### 5.5 Sem mandato explícito de "Figma é a verdade"

Ninguém me disse: "o Figma é a fonte da verdade. Você nunca decide sem consultar o Figma. Se o Figma está errado, abra ticket e espere o designer corrigir, não decida sozinho."

Sem esse mandato, otimizei para outras coisas (consistência interna do código, código mantível, paridade entre telas que o Figma não cobria). O resultado foi um app coerente internamente mas que **diverge do Figma**.

> **Mensagem direta**: o desenvolvedor sozinho **não consegue** ser fiel ao Figma sem método. Não é capacidade técnica — é processo.

---

## 6. Quais ferramentas/skills ajudariam?

Quatro propostas concretas, em ordem de impacto vs custo.

### 6.1 Visual regression / pixel diff automatizado

**Custo: 1 dia. Impacto: gigante.**

Toda vez que mudo um CSS, um script:
1. Renderiza cada tela em headless browser na resolução base (1920×1080).
2. Compara pixel a pixel com o PNG do Figma daquela tela.
3. Reporta % de pixels diferentes + heatmap visual mostrando onde.

Ferramentas: [Playwright](https://playwright.dev/) (já open source, gratuito) ou [Percy](https://percy.io/) (pago, integra com GitHub PRs).

> Resultado prático: nenhum PR é mergeado sem um diff sub-1% contra o Figma.

### 6.2 Figma MCP server — Figma como fonte ao vivo

**Custo: 0.5 dia. Impacto: alto.**

Hoje uso o `figma-export.json` baixado uma vez. Se o designer muda algo no Figma, eu não sei até alguém me avisar e re-rodar o export.

Existe um [MCP server oficial do Figma](https://www.figma.com/developers/api) que permite consultar o estado **atual** do arquivo. Eu posso pedir "qual a cor do botão primary na tela Status?" e obter a resposta sempre atualizada.

> Resultado: zero defasagem entre Figma e implementação.

### 6.3 Sub-agente "design-reviewer" especializado

**Custo: 0.5 dia. Impacto: médio.**

Configurar um sub-agente cujo único papel é **revisar implementação contra Figma**. Ele:
- Roda visual regression
- Compara tokens (cores, espaçamentos, fontes) no CSS vs Figma
- Reporta deviações de classes/IDs/estrutura
- Não escreve código — só audita.

Eu (o agente que escreve código) submeto cada tela para ele revisar antes do merge. Ele me devolve um relatório de divergências. Eu corrijo.

> Isso simula um designer interno fazendo revisão automatizada.

### 6.4 Design tokens em JSON único

**Custo: 2 dias. Impacto: longo prazo.**

Hoje os tokens visuais estão espalhados:
- Cores em CSS variables (`--vc-blue: #0076CB` etc)
- Espaçamentos hardcoded em vários arquivos
- Tamanhos de fonte similares

Proposta: arquivo `design-tokens.json` que é a fonte. Build process gera CSS variables a partir dele. Ferramentas como [Style Dictionary](https://amzn.github.io/style-dictionary/) automatizam isso.

> Vantagem: o designer pode editar o JSON (ou plugin do Figma exporta direto) e o app atualiza no próximo build. Garante consistência forçada.

### Já temos algumas coisas

- [x] Bootstrap Icons offline (consistência de ícones)
- [x] Fonte Inter embedded (consistência tipográfica)
- [x] CSS variables com tokens base (`--vc-blue` etc)
- [x] i18n centralizado (consistência de strings)
- [x] Subagentes (Explore, Plan, general-purpose) já disponíveis

### Falta

- [ ] Visual regression em CI
- [ ] Acesso ao vivo ao Figma (MCP)
- [ ] Subagente design-reviewer
- [ ] Design tokens em JSON único

---

## 7. Plano de trabalho recomendado

### Fase 0 — Setup (1 semana)

1. **Designer + dev definem juntos** o esqueleto visual:
   - Resolução base: 1920×1080? Ou min 1280×800 com regras de responsividade?
   - O Figma cobre os estados de hover/focus/disabled de cada componente? Se não, designer documenta.
   - Componentes-padrão (botão, input, card, modal) com variantes completas no Figma.
2. **Dev instala visual regression** (Playwright + script comparando contra PNGs do Figma).
3. **Dev cria `design-tokens.json`** extraindo do CSS atual + alinhando com Figma.
4. **Definir SLA do designer**: revisão em 24-48h.

### Fase 1 — Refazer tela por tela (4-6 semanas)

Ordem proposta (impacto visual decrescente):

1. **Welcome/Index** (1ª impressão)
2. **Modal Nova Conexão** (Local + Remota) — primeira interação do usuário
3. **Status** (tela mais usada)
4. **Sistema → Avançado** (tela visual mais densa)
5. **Sistema → demais 8 abas**
6. **Partição 1-6** (3 abas internas)
7. **Zona compartilhada**
8. **Configurações**

Por tela, ciclo:
```
dev implementa
  → screenshot side-by-side commitado
    → visual regression rodando em CI
      → designer revisa via PR
        → dev ajusta
          → designer aprova
            → merge
```

Tela com 3 rounds sem convergência: reunião dev+designer+produto pra desempate.

### Fase 2 — Polimento e animações (2 semanas)

Depois das telas todas alinhadas:
- Designer documenta TODAS as animações no Figma (com timing/easing).
- Dev implementa transições e hovers.
- Round único de revisão de animação (não é tela-por-tela porque animações são transversais).

### Fase 3 — Validação cross-platform (1 semana)

- Testar em macOS, Windows, Linux.
- Documentar diferenças aceitáveis (sub-pixel, hinting).
- Designer aprova a versão final em cada SO.

---

## 8. Pedido à diretoria

1. **Validar a mudança de processo**: aceitar que velocidade vai cair no curto prazo em troca de fidelidade garantida. Estimativa: 8-10 semanas pra fidelidade total no app inteiro (vs ritmo atual incremental sem garantia).
2. **Decidir resolução base e regras de responsividade** — designer + produto.
3. **Confirmar SLA do designer** (24-48h) — sem isso, processo trava.
4. **Aprovar ferramentas adicionais**:
   - Playwright pra visual regression (gratuito).
   - Acesso ao arquivo Figma via API (chave de API do plano da empresa — gratuita).
   - Eventualmente Percy ou similar (pago, mas opcional — o gratuito resolve 90%).
5. **Decidir escopo**: começar tudo de novo no `visual-redesign` ou trabalhar tela por tela sobre o branch `main` (mais conservador, releases incrementais)?

---

## 9. Posicionamento honesto do dev (eu)

- Eu **sou capaz** de seguir 100% o Figma. Não é limitação técnica.
- Eu **não consigo** sozinho garantir 100% sem método: feedback loop visual + alguém comparando.
- A causa principal do desvio atual foi **falta de processo de revisão**, não falta de capacidade.
- Com as 4 ferramentas propostas no §6, e o processo do §7, **eu assino embaixo** que entrego fidelidade ao Figma.
- Sem essas mudanças, o ritmo atual vai continuar produzindo um app "parecido com o Figma" — não "fiel ao Figma".

---

## Anexo — comparação rápida de estado atual vs ideal

| Aspecto | Hoje | Proposto |
|---|---|---|
| Fonte da verdade visual | Figma exportado uma vez, dev interpreta | Figma ao vivo (MCP) |
| Revisão de design | Não há (dev se autoavalia) | Designer revisa cada PR |
| Comparação pixel-a-pixel | Olho do dev | Playwright + diff automático |
| Tokens visuais | CSS variables (parcial) | JSON único + build CSS |
| Hover/animation specs | Implícitos / inferidos | Documentados no Figma |
| Velocidade | Rápido | 30% mais lento, 0% retrabalho |
| Drift acumulado | Inevitável | Bloqueado por CI |

---

*Documento preparado por análise da implementação atual em `vetticonfig26-visual` e do `figma-export.json` baixado em 2026-05-14.*

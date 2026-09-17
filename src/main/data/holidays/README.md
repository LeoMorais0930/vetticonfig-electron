# Feriados nacionais — JSONs empacotados

Cada arquivo `<XX>.json` aqui contém os feriados nacionais oficiais de um país,
no formato lido pelo `src/main/services/holidays_db.js`. Os JSONs vão no bundle
de instalação do VettiConfig — não dependem de internet em runtime.

## Schema

```jsonc
{
  "schema": "vetticonfig-holidays-1",
  "country": "BR",                       // ISO 3166-1 alpha-2
  "countryName": {
    "pt-BR": "Brasil",
    "en":    "Brazil",
    "es-LA": "Brasil"
  },
  "holidays": [
    {
      "id": "br-newyear",                 // único, kebab-case, prefixado pelo país
      "name": { "pt-BR": "...", "en": "...", "es-LA": "..." },

      // Datas fixas (ano-independente):
      "month": 1,                         // 1..12
      "day":   1,                          // 1..31

      // OU datas móveis baseadas em Páscoa (calculadas via Meeus pro ano corrente):
      // "mobile": "easter"        — domingo de Páscoa
      // "mobile": "easter-2"      — Sexta-feira Santa
      // "mobile": "easter-3"      — Quinta-feira Santa
      // "mobile": "easter-47"     — Terça de Carnaval
      // "mobile": "easter-48"     — Segunda de Carnaval
      // "mobile": "easter+39"     — Ascensão
      // "mobile": "easter+60"     — Corpus Christi
      // "mobile": "easter+68"     — Sagrado Coração de Jesus
      // (outros offsets seguem o mesmo padrão)

      // OU regras especiais (não-Páscoa):
      // "mobile": "us-thanksgiving"   — 4ª quinta-feira de novembro (EUA)
      // "mobile": "mx-constitution"   — 1ª segunda de fevereiro (México)
      // "mobile": "mx-juarez"         — 3ª segunda de março (México)
      // "mobile": "mx-revolution"     — 3ª segunda de novembro (México)
    }
  ]
}
```

## Limites do firmware

A central Vetti SmartAlarm armazena até **64 registros de feriado** (comando
`FERIADO N`), com **dia/mês/descrição** (sem ano). Descrição máx 40 chars, sem
acentos (gravado via `deAccent`).

Feriados móveis: como o firmware não tem o conceito, são calculados pelo app
toda vez que o usuário clica em "Atualizar móveis ano XXXX" — o cálculo vira
um registro `Mes/Dia` para o ano corrente.

## Países disponíveis no MVP

- `BR` — Brasil
- `AR` — Argentina
- `CL` — Chile
- `UY` — Uruguai
- `PY` — Paraguai
- `CO` — Colômbia
- `EC` — Equador
- `MX` — México

Pra adicionar um país novo, criar `<XX>.json` aqui seguindo o schema. Em uma
próxima fase haverá um botão "Novo país" no UI que baixa da API Nager.Date.

# Exemplos

## Exemplo simples

Arquivo: [examples/generate-from-xml.ts](C:/Users/sguii/OneDrive/Documentos/cte-dacte-pdf-module/examples/generate-from-xml.ts)

Esse exemplo:

- le um XML
- identifica o tipo automaticamente
- define um nome de saida coerente
- gera o PDF

## Exemplo completo

Arquivo: [examples/all-scenarios.ts](C:/Users/sguii/OneDrive/Documentos/cte-dacte-pdf-module/examples/all-scenarios.ts)

Esse exemplo cobre:

- DACTE a partir de XML
- cancelamento a partir de XML de evento
- CC-e a partir de XML de evento
- parse do XML antes da renderizacao
- renderizacao com informacoes extras
- renderizacao a partir de dados normalizados

## Estrutura recomendada de exemplos locais

```text
examples/
  cte.xml
  evento-cancelamento.xml
  evento-cce.xml
  generate-from-xml.ts
  all-scenarios.ts
```

## Comando recomendado

```bash
npx tsx examples/all-scenarios.ts
```

## Observacao

Se os XMLs de evento ainda nao estiverem presentes, o exemplo completo pula apenas os cenarios faltantes e segue com os demais.

# Exemplos

## Exemplos por arquivo

### `01-import-generate-from-xml.ts`

Uso direto com `import`, lendo XML e gerando PDF.

### `02-import-parse-and-render.ts`

Mostra o fluxo em duas etapas:

- parse do XML
- renderizacao a partir do documento normalizado

### `03-import-generate-from-data.ts`

Mostra o fluxo legado e util para DACTE:

- parse de CT-e com `parseCteXml()`
- renderizacao via `generateFromData()`

### `04-import-all-scenarios.ts`

Cobre:

- DACTE por XML
- cancelamento por XML de evento
- CC-e por XML de evento
- DACTE por dados normalizados

### `05-require-compiled-generate-from-xml.cjs`

Exemplo para consumidor CommonJS usando `require`.

Esse exemplo depende de build concluido:

```bash
npm run build
node examples/05-require-compiled-generate-from-xml.cjs
```

### `06-import-compiled-generate-from-xml.mjs`

Exemplo para consumidor ESM usando o artefato compilado.

```bash
npm run build
node examples/06-import-compiled-generate-from-xml.mjs
```

## Estrutura recomendada de exemplos locais

```text
examples/
  cte.xml
  evento-cancelamento.xml
  evento-cce.xml
  01-import-generate-from-xml.ts
  02-import-parse-and-render.ts
  03-import-generate-from-data.ts
  04-import-all-scenarios.ts
  05-require-compiled-generate-from-xml.cjs
  06-import-compiled-generate-from-xml.mjs
```

## Comando recomendado

```bash
npx tsx examples/04-import-all-scenarios.ts
```

## Observacao

Se os XMLs de evento ainda nao estiverem presentes, o exemplo completo pula apenas os cenarios faltantes e segue com os demais.

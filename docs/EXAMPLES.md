# Exemplos

Os exemplos ficam na pasta [examples](C:/Users/sguii/OneDrive/Documentos/cte-dacte-pdf-module/examples).

A ideia e simples: cada arquivo mostra uma funcionalidade.

Antes de rodar:

```bash
npm run build
```

## Arquivos

### `01-generate-from-xml.js`

Gera PDF direto do XML.

```bash
node examples/01-generate-from-xml.js ./cte.xml
```

### `02-parse-document.js`

Parseia o XML e imprime o documento normalizado.

```bash
node examples/02-parse-document.js ./cte.xml
```

### `03-generate-from-data.js`

Mostra o fluxo `parseCteXml()` + `generateFromData()`.

```bash
node examples/03-generate-from-data.js ./cte.xml
```

### `04-custom-options.js`

Mostra `headerNote`, `footerNote`, `watermarkText` e `additionalInfo`.

```bash
node examples/04-custom-options.js ./cte.xml
```

### `05-cli.js`

Mostra o uso do bin `cte-pdf`.

```bash
npm run build
node examples/05-cli.js ./cte.xml
```

### `06-import-compiled.js`

Consome o build compilado com `import`.

```bash
npm run build
node examples/06-import-compiled.js ./cte.xml
```

### `07-require-compiled.cjs`

Consome o build compilado com `require`.

```bash
npm run build
node examples/07-require-compiled.cjs ./cte.xml
```

## Estrutura

```text
examples/
  README.md
  01-generate-from-xml.js
  02-parse-document.js
  03-generate-from-data.js
  04-custom-options.js
  05-cli.js
  06-import-compiled.js
  07-require-compiled.cjs
```

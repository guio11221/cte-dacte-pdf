# cte-dacte-pdf

Modulo Node.js/TypeScript para gerar PDF de documentos relacionados ao CT-e.

Hoje o modulo suporta:

- DACTE a partir de CT-e autorizado
- evento de cancelamento de CT-e
- Carta de Correcao Eletronica (CC-e)

## Instalacao

```bash
npm install
npm run build
```

## Exemplo rapido

```ts
import fs from 'node:fs/promises';
import { CtePdfService } from 'cte-dacte-pdf';

const xml = await fs.readFile('./cte.xml', 'utf8');
const service = new CtePdfService();

try {
  const pdf = await service.generateFromXml(xml, {
    outputPath: './saida.pdf'
  });

  await fs.writeFile('./saida.pdf', pdf);
} finally {
  await service.close();
}
```

## O que a API faz

- detecta automaticamente CT-e, cancelamento e CC-e em `generateFromXml()`
- gera PDF a partir do XML bruto ou de dados normalizados
- aceita complementos visuais e operacionais sem alterar o XML fiscal

## CLI

Depois do build, o pacote expõe o bin `cte-pdf`.

```bash
cte-pdf ./cte.xml
cte-pdf --autorizado ./cte.xml
cte-pdf --cancelado ./evento-cancelamento.xml
cte-pdf --cce ./evento-cce.xml
```

Opcoes principais:

- `--autorizado`
- `--cancelado`
- `--cce`
- `-o, --output`
- `--out-dir`
- `--template`
- `--logo`
- `--json-info`
- `--header-note`
- `--footer-note`
- `--watermark`
- `--validate-only`
- `--quiet`

## Customizacao suportada

- `headerNote`
- `footerNote`
- `watermarkText`
- `additionalInfo`
- `customSections`
- `partyOverrides`

## Documentacao

- [Visao geral](docs/README.md)
- [Guia de uso](docs/USAGE.md)
- [API](docs/API.md)
- [Customizacao](docs/CUSTOMIZATION.md)
- [Exemplos](docs/EXAMPLES.md)

## Exemplos locais

- `01-generate-from-xml.js`: gerar PDF direto do XML
- `02-parse-document.js`: parsear e inspecionar o documento
- `03-generate-from-data.js`: gerar DACTE a partir de dados normalizados
- `04-custom-options.js`: customizar o PDF
- `05-cli.js`: chamar o bin `cte-pdf`
- `06-import-compiled.js`: consumir o build compilado com `import`
- `07-require-compiled.cjs`: consumir o build compilado com `require`

Os exemplos `05`, `06` e `07` dependem de `npm run build`.

## Compliance

O modulo foi desenhado para seguir a estrutura do CT-e e dos eventos da SEFAZ, mas o XML autorizado ou registrado continua sendo a fonte fiscal primaria. O PDF e representacao auxiliar.

## Desenvolvimento

```bash
npm run build
```

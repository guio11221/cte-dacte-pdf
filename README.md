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

- Exemplo simples: [examples/generate-from-xml.ts](C:/Users/sguii/OneDrive/Documentos/cte-dacte-pdf-module/examples/generate-from-xml.ts)
- Exemplo completo: [examples/all-scenarios.ts](C:/Users/sguii/OneDrive/Documentos/cte-dacte-pdf-module/examples/all-scenarios.ts)

## Compliance

O modulo foi desenhado para seguir a estrutura do CT-e e dos eventos da SEFAZ, mas o XML autorizado ou registrado continua sendo a fonte fiscal primaria. O PDF e representacao auxiliar.

## Desenvolvimento

```bash
npm run build
```

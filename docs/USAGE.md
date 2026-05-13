# Guia de Uso

## Instalacao

```bash
npm install
npm run build
```

## Importacao

```ts
import { CtePdfService } from 'cte-dacte-pdf';
```

Se voce estiver usando o repositorio localmente:

```ts
import { CtePdfService } from '../src/index.js';
```

## Caso mais simples: gerar PDF a partir do XML

```ts
import fs from 'node:fs/promises';
import { CtePdfService } from 'cte-dacte-pdf';

const xml = await fs.readFile('./cte.xml', 'utf8');
const service = new CtePdfService();

try {
  const pdf = await service.generateFromXml(xml);
  await fs.writeFile('./saida.pdf', pdf);
} finally {
  await service.close();
}
```

## Uso por linha de comando

O pacote tambem pode expor um bin chamado `cte-pdf`.

```bash
cte-pdf ./cte.xml
```

Forcando o tipo esperado:

```bash
cte-pdf --autorizado ./cte.xml
cte-pdf --cancelado ./evento-cancelamento.xml
cte-pdf --cce ./evento-cce.xml
```

Definindo saida:

```bash
cte-pdf --autorizado ./cte.xml -o ./saida/dacte.pdf
```

Notas visuais:

```bash
cte-pdf ./cte.xml --header-note "Gerado pelo ERP" --watermark "USO INTERNO"
```

Comportamento:

- sem flag, o CLI detecta automaticamente o tipo do XML
- com flag, o CLI valida se o XML bate com o tipo esperado
- se houver divergencia, o comando falha com mensagem clara

## Gerar PDF e salvar automaticamente

```ts
await service.generateFromXml(xml, {
  outputPath: './saida.pdf'
});
```

Mesmo com `outputPath`, o metodo continua retornando `Buffer`.

## Identificacao automatica do tipo de documento

`generateFromXml()` detecta automaticamente:

- CT-e autorizado
- cancelamento de CT-e
- CC-e

Isso permite que um unico endpoint do seu sistema aceite XMLs diferentes:

```ts
const pdf = await service.generateFromXml(xml, {
  outputPath: './documento.pdf'
});
```

## Parse e renderizacao em etapas

Esse fluxo e util quando voce quer:

- inspecionar o tipo do documento
- registrar logs
- aplicar customizacao condicional
- renderizar mais de uma variacao do mesmo XML

```ts
import { CtePdfService, parseCteDocumentXml } from 'cte-dacte-pdf';

const document = parseCteDocumentXml(xml);

if (document.kind === 'cancelamento') {
  console.log(document.justificativa);
}

const pdf = await service.generateDocumentFromData(document, {
  watermarkText: document.kind === 'cce' ? 'USO INTERNO' : ''
});
```

## Fluxo legado: apenas DACTE

Se seu sistema so gera DACTE e ja possui um contrato semelhante ao `DacteData`, ainda e possivel usar:

```ts
await service.generateFromData(dacteData, {
  outputPath: './dacte.pdf'
});
```

## Encerramento do browser

O modulo usa Puppeteer internamente. Em processos longos ou jobs, sempre finalize:

```ts
await service.close();
```

## Uso recomendado em backend

Em servicos HTTP ou filas:

1. receba ou busque o XML
2. gere o PDF
3. persista o `Buffer` onde fizer sentido
4. finalize o service quando a instancia nao for mais reutilizada

Exemplo de handler:

```ts
const service = new CtePdfService();

export async function generatePdfFromXmlString(xml: string): Promise<Buffer> {
  try {
    return await service.generateFromXml(xml);
  } finally {
    await service.close();
  }
}
```

## Regras praticas de integracao

- trate o XML autorizado ou registrado como fonte primaria
- use notas complementares apenas para dados internos do seu sistema
- nao altere semanticamente o conteudo fiscal via `partyOverrides` ou `additionalInfo`
- mantenha XMLs de teste separados por tipo: CT-e, cancelamento e CC-e

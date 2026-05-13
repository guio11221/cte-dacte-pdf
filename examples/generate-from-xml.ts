import fs from 'node:fs/promises';
import path from 'node:path';
import { CtePdfService, parseCteDocumentXml } from '../src/index.js';

function getDefaultOutputPath(xmlPath: string, kind: 'dacte' | 'cce' | 'cancelamento'): string {
  const dir = path.dirname(xmlPath);
  const baseName = kind === 'dacte'
    ? 'dacte'
    : kind === 'cce'
      ? 'cce-cte'
      : 'cancelamento-cte';

  return path.join(dir, `${baseName}.pdf`);
}

async function main() {
  const xmlPath = path.resolve(process.argv[2] ?? 'examples/cte.xml');
  const xml = await fs.readFile(xmlPath, 'utf8');
  const document = parseCteDocumentXml(xml);
  const outputPath = path.resolve(process.argv[3] ?? getDefaultOutputPath(xmlPath, document.kind));
  const service = new CtePdfService();

  try {
    await service.generateDocumentFromData(document, {
      outputPath,
      headerNote: 'Documento auxiliar gerado por exemplo local do modulo.',
      footerNote: 'Use o XML autorizado/registrado na SEFAZ como referencia fiscal primaria.',
      // additionalInfo: {
      //   'Arquivo XML': path.basename(xmlPath),
      //   'Tipo de documento': document.kind
      // }
    });

    console.log(`Tipo identificado: ${document.kind}`);
    console.log(`PDF gerado em: ${outputPath}`);
  } finally {
    await service.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

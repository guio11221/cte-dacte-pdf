import fs from 'node:fs/promises';
import path from 'node:path';
import { CtePdfService, parseCteDocumentXml } from '../index.js';
import type { DocumentKind, GenerateDacteOptions } from '../index.js';

type CliMode = 'auto' | 'dacte' | 'cancelamento' | 'cce';

type CliArgs = {
  mode: CliMode;
  xmlPath?: string;
  outputPath?: string;
  options: GenerateDacteOptions;
  help: boolean;
};

function printHelp(): void {
  console.log(`cte-pdf

Uso:
  cte-pdf <arquivo-xml>
  cte-pdf --autorizado <arquivo-xml>
  cte-pdf --cancelado <arquivo-xml>
  cte-pdf --cce <arquivo-xml>

Opcoes:
  --autorizado         Forca DACTE de CT-e autorizado
  --cancelado          Forca evento de cancelamento
  --cce                Forca Carta de Correcao Eletronica
  -o, --output <pdf>   Caminho de saida do PDF
  --header-note <txt>  Observacao no topo
  --footer-note <txt>  Observacao no final
  --watermark <txt>    Marca d'agua textual
  -h, --help           Exibe esta ajuda

Exemplos:
  cte-pdf ./cte.xml
  cte-pdf --autorizado ./cte.xml
  cte-pdf --cancelado ./evento-cancelamento.xml
  cte-pdf --cce ./evento-cce.xml -o ./saida/cce.pdf
`);
}

function readValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('-')) {
    throw new Error(`Opcao ${option} exige um valor.`);
  }
  return value;
}

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {
    mode: 'auto',
    options: {},
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
      continue;
    }

    if (arg === '--autorizado') {
      result.mode = 'dacte';
      continue;
    }

    if (arg === '--cancelado') {
      result.mode = 'cancelamento';
      continue;
    }

    if (arg === '--cce') {
      result.mode = 'cce';
      continue;
    }

    if (arg === '-o' || arg === '--output') {
      result.outputPath = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--header-note') {
      result.options.headerNote = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--footer-note') {
      result.options.footerNote = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--watermark') {
      result.options.watermarkText = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    }

    if (result.xmlPath) {
      throw new Error(`Caminho XML duplicado: ${arg}`);
    }

    result.xmlPath = arg;
  }

  return result;
}

function kindLabel(kind: DocumentKind): string {
  if (kind === 'dacte') return 'autorizado';
  if (kind === 'cancelamento') return 'cancelado';
  return 'cce';
}

function resolveOutputPath(xmlPath: string, outputPath: string | undefined, kind: DocumentKind): string {
  if (outputPath) return path.resolve(outputPath);

  const parsed = path.parse(xmlPath);
  const suffix = kind === 'dacte' ? 'autorizado' : kind === 'cancelamento' ? 'cancelado' : 'cce';
  return path.join(parsed.dir, `${parsed.name}-${suffix}.pdf`);
}

function validateMode(forcedMode: CliMode, detectedKind: DocumentKind): void {
  if (forcedMode === 'auto') return;
  if (forcedMode === detectedKind) return;

  throw new Error(
    `Modo ${forcedMode} informado, mas o XML foi identificado como ${detectedKind}. ` +
    `Use o XML correto ou remova a flag para deteccao automatica.`
  );
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);

  if (args.help || !args.xmlPath) {
    printHelp();
    if (!args.xmlPath && !args.help) {
      process.exitCode = 1;
    }
    return;
  }

  const xmlPath = path.resolve(args.xmlPath);
  const xml = await fs.readFile(xmlPath, 'utf8');
  const document = parseCteDocumentXml(xml);

  validateMode(args.mode, document.kind);

  const outputPath = resolveOutputPath(xmlPath, args.outputPath, document.kind);
  const service = new CtePdfService();

  try {
    const pdf = await service.generateDocumentFromData(document, {
      ...args.options,
      outputPath
    });

    await fs.writeFile(outputPath, pdf);
    console.log(`Tipo identificado: ${kindLabel(document.kind)}`);
    console.log(`PDF gerado em: ${outputPath}`);
  } finally {
    await service.close();
  }
}

export async function main(): Promise<void> {
  try {
    await runCli();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

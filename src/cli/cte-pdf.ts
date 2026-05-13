import fs from 'node:fs/promises';
import path from 'node:path';
import { CtePdfService, parseCteDocumentXml } from '../index.js';
import type { DocumentKind, GenerateDacteOptions } from '../index.js';

type CliMode = 'auto' | 'dacte' | 'cancelamento' | 'cce';

type CliArgs = {
  mode: CliMode;
  xmlPath?: string;
  outputPath?: string;
  outDir?: string;
  options: GenerateDacteOptions;
  help: boolean;
  validateOnly: boolean;
  quiet: boolean;
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
  --out-dir <dir>      Diretorio de saida
  --template <ejs>     Template EJS customizado
  --logo <img>         Caminho da logo
  --json-info <json>   Arquivo JSON para additionalInfo
  --header-note <txt>  Observacao no topo
  --footer-note <txt>  Observacao no final
  --watermark <txt>    Marca d'agua textual
  --validate-only      Apenas valida o XML e o tipo
  --quiet              Reduz saida no terminal
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
    help: false,
    validateOnly: false,
    quiet: false
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

    if (arg === '--out-dir') {
      result.outDir = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--template') {
      result.options.templatePath = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--logo') {
      result.options.logoPath = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--json-info') {
      result.options.additionalInfo = {
        ...(result.options.additionalInfo ?? {}),
        __jsonFilePath: readValue(argv, index, arg)
      };
      index += 1;
      continue;
    }

    if (arg === '--header-note') {
      result.options.headerNote = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--validate-only') {
      result.validateOnly = true;
      continue;
    }

    if (arg === '--quiet') {
      result.quiet = true;
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

function resolveOutputPathWithDir(xmlPath: string, outputPath: string | undefined, outDir: string | undefined, kind: DocumentKind): string {
  if (outputPath) return path.resolve(outputPath);
  if (!outDir) return resolveOutputPath(xmlPath, outputPath, kind);

  const parsed = path.parse(xmlPath);
  const suffix = kind === 'dacte' ? 'autorizado' : kind === 'cancelamento' ? 'cancelado' : 'cce';
  return path.resolve(outDir, `${parsed.name}-${suffix}.pdf`);
}

function validateMode(forcedMode: CliMode, detectedKind: DocumentKind): void {
  if (forcedMode === 'auto') return;
  if (forcedMode === detectedKind) return;

  throw new Error(
    `Modo ${forcedMode} informado, mas o XML foi identificado como ${detectedKind}. ` +
    `Use o XML correto ou remova a flag para deteccao automatica.`
  );
}

async function resolveAdditionalInfo(options: GenerateDacteOptions): Promise<GenerateDacteOptions> {
  const filePath = options.additionalInfo?.__jsonFilePath;
  if (!filePath) return options;

  const raw = await fs.readFile(path.resolve(filePath), 'utf8');
  const parsed = JSON.parse(raw) as Record<string, string>;
  const { __jsonFilePath, ...rest } = options.additionalInfo ?? {};

  return {
    ...options,
    additionalInfo: {
      ...parsed,
      ...rest
    }
  };
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

  const outputPath = resolveOutputPathWithDir(xmlPath, args.outputPath, args.outDir, document.kind);
  const resolvedOptions = await resolveAdditionalInfo(args.options);

  if (args.validateOnly) {
    if (!args.quiet) {
      console.log(`Tipo identificado: ${kindLabel(document.kind)}`);
      console.log('XML valido.');
    }
    return;
  }

  const service = new CtePdfService();

  try {
    await service.generateDocumentFromData(document, {
      ...resolvedOptions,
      outputPath
    });
    if (!args.quiet) {
      console.log(`Tipo identificado: ${kindLabel(document.kind)}`);
      console.log(`PDF gerado em: ${outputPath}`);
    }
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

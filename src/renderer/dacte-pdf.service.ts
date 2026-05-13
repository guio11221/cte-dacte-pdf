import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import puppeteer, { type Browser } from 'puppeteer';
import { parseCteDocumentXml, parseCteXml } from '../parser/cte-parser.js';
import type { CteDocumentData, CteEventData, DacteData, DacteParty, GenerateDacteOptions } from '../types/dacte.types.js';
import { createCode128DataUrl, createQrCodeDataUrl } from '../utils/assets.js';
import { formatAccessKey } from '../utils/format.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DactePdfService {
  private browserPromise: Promise<Browser> | null = null;

  async generateFromXml(xml: string, options: GenerateDacteOptions = {}): Promise<Buffer> {
    const document = parseCteDocumentXml(xml);
    return this.generateDocumentFromData(document, options);
  }

  async generateFromData(dacte: DacteData, options: GenerateDacteOptions = {}): Promise<Buffer> {
    const normalized = dacte.kind ? dacte : { ...dacte, kind: 'dacte' as const };
    return this.generateDocumentFromData(normalized, options);
  }

  async generateDocumentFromXml(xml: string, options: GenerateDacteOptions = {}): Promise<Buffer> {
    return this.generateFromXml(xml, options);
  }

  async generateDocumentFromData(document: CteDocumentData, options: GenerateDacteOptions = {}): Promise<Buffer> {
    const html = await this.renderDocumentHtml(document, options);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
      });

      const buffer = Buffer.from(pdf);
      if (options.outputPath) {
        await fs.writeFile(options.outputPath, buffer);
      }
      return buffer;
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise;
    await browser.close();
    this.browserPromise = null;
  }

  async renderDocumentHtml(document: CteDocumentData, options: GenerateDacteOptions = {}): Promise<string> {
    const templatePath = options.templatePath ?? this.resolveTemplatePath(document.kind);
    const normalizedDocument = this.applyPartyOverrides(document, options);
    const logoBase64 = options.logoBase64 || await this.readLogoAsDataUrl(options.logoPath);
    const [barcodeDataUrl, qrCodeDataUrl] = await Promise.all([
      createCode128DataUrl(normalizedDocument.chaveAcesso),
      createQrCodeDataUrl(this.resolveQrValue(normalizedDocument))
    ]);

    return ejs.renderFile(templatePath, {
      document: normalizedDocument,
      dacte: normalizedDocument.kind === 'dacte' ? normalizedDocument : undefined,
      barcodeDataUrl,
      qrCodeDataUrl,
      chaveFormatada: formatAccessKey(normalizedDocument.chaveAcesso),
      logoBase64,
      headerNote: options.headerNote ?? '',
      footerNote: options.footerNote ?? '',
      watermarkText: options.watermarkText ?? '',
      additionalInfo: options.additionalInfo ?? {},
      customSections: options.customSections ?? []
    }, { async: true });
  }

  private getBrowser(): Promise<Browser> {
    this.browserPromise ??= puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    return this.browserPromise;
  }

  private resolveTemplatePath(kind: CteDocumentData['kind']): string {
    if (kind === 'dacte') return path.resolve(__dirname, '../templates/dacte.ejs');
    return path.resolve(__dirname, '../templates/cte-event.ejs');
  }

  private resolveQrValue(document: CteDocumentData): string {
    if (document.kind === 'dacte') {
      return document.qrCodeUrl || document.consultaUrl || document.chaveAcesso;
    }
    return document.chaveAcesso;
  }

  private async readLogoAsDataUrl(logoPath?: string): Promise<string> {
    if (!logoPath) return '';

    const filePath = path.resolve(logoPath);
    const bytes = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = extension === '.jpg' || extension === '.jpeg'
      ? 'image/jpeg'
      : extension === '.svg'
        ? 'image/svg+xml'
        : 'image/png';

    return `data:${mimeType};base64,${bytes.toString('base64')}`;
  }

  private applyPartyOverrides(document: CteDocumentData, options: GenerateDacteOptions): CteDocumentData {
    const overrides = options.partyOverrides ?? {};
    if (document.kind === 'dacte') {
      return {
        ...document,
        emitente: this.mergeParty(document.emitente, overrides.emitente),
        remetente: this.mergeOptionalParty(document.remetente, overrides.remetente),
        destinatario: this.mergeOptionalParty(document.destinatario, overrides.destinatario),
        expedidor: this.mergeOptionalParty(document.expedidor, overrides.expedidor),
        recebedor: this.mergeOptionalParty(document.recebedor, overrides.recebedor),
        tomador: this.mergeOptionalParty(document.tomador, overrides.tomador)
      };
    }

    const eventDocument: CteEventData = {
      ...document,
      emitente: {
        ...document.emitente,
        ...overrides.emitente
      }
    };
    return eventDocument;
  }

  private mergeParty(base: DacteParty, override?: Partial<DacteParty>): DacteParty {
    return { ...base, ...override };
  }

  private mergeOptionalParty(base: DacteParty | undefined, override?: Partial<DacteParty>): DacteParty | undefined {
    if (!base && !override) return undefined;
    return {
      nome: '',
      cpfCnpj: '',
      endereco: '',
      municipio: '',
      uf: '',
      ...base,
      ...override
    };
  }
}

export class CtePdfService extends DactePdfService {}

export { parseCteXml };

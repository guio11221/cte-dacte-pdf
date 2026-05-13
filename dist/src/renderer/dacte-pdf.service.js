import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import { parseCteDocumentXml, parseCteXml } from '../parser/cte-parser.js';
import { createCode128DataUrl, createQrCodeDataUrl } from '../utils/assets.js';
import { formatAccessKey } from '../utils/format.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class DactePdfService {
    browserPromise = null;
    async generateFromXml(xml, options = {}) {
        const document = parseCteDocumentXml(xml);
        return this.generateDocumentFromData(document, options);
    }
    async generateFromData(dacte, options = {}) {
        const normalized = dacte.kind ? dacte : { ...dacte, kind: 'dacte' };
        return this.generateDocumentFromData(normalized, options);
    }
    async generateDocumentFromXml(xml, options = {}) {
        return this.generateFromXml(xml, options);
    }
    async generateDocumentFromData(document, options = {}) {
        const templatePath = options.templatePath ?? this.resolveTemplatePath(document.kind);
        const normalizedDocument = this.applyPartyOverrides(document, options);
        const [barcodeDataUrl, qrCodeDataUrl] = await Promise.all([
            createCode128DataUrl(normalizedDocument.chaveAcesso),
            createQrCodeDataUrl(this.resolveQrValue(normalizedDocument))
        ]);
        const html = await ejs.renderFile(templatePath, {
            document: normalizedDocument,
            dacte: normalizedDocument.kind === 'dacte' ? normalizedDocument : undefined,
            barcodeDataUrl,
            qrCodeDataUrl,
            chaveFormatada: formatAccessKey(normalizedDocument.chaveAcesso),
            logoBase64: options.logoBase64 ?? '',
            headerNote: options.headerNote ?? '',
            footerNote: options.footerNote ?? '',
            watermarkText: options.watermarkText ?? '',
            additionalInfo: options.additionalInfo ?? {},
            customSections: options.customSections ?? []
        }, { async: true });
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
        }
        finally {
            await page.close();
        }
    }
    async close() {
        if (!this.browserPromise)
            return;
        const browser = await this.browserPromise;
        await browser.close();
        this.browserPromise = null;
    }
    getBrowser() {
        this.browserPromise ??= puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        return this.browserPromise;
    }
    resolveTemplatePath(kind) {
        if (kind === 'dacte')
            return path.resolve(__dirname, '../templates/dacte.ejs');
        return path.resolve(__dirname, '../templates/cte-event.ejs');
    }
    resolveQrValue(document) {
        if (document.kind === 'dacte') {
            return document.qrCodeUrl || document.consultaUrl || document.chaveAcesso;
        }
        return document.chaveAcesso;
    }
    applyPartyOverrides(document, options) {
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
        const eventDocument = {
            ...document,
            emitente: {
                ...document.emitente,
                ...overrides.emitente
            }
        };
        return eventDocument;
    }
    mergeParty(base, override) {
        return { ...base, ...override };
    }
    mergeOptionalParty(base, override) {
        if (!base && !override)
            return undefined;
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
export class CtePdfService extends DactePdfService {
}
export { parseCteXml };
//# sourceMappingURL=dacte-pdf.service.js.map
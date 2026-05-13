import { parseCteXml } from '../parser/cte-parser.js';
import type { CteDocumentData, DacteData, GenerateDacteOptions } from '../types/dacte.types.js';
export declare class DactePdfService {
    private browserPromise;
    generateFromXml(xml: string, options?: GenerateDacteOptions): Promise<Buffer>;
    generateFromData(dacte: DacteData, options?: GenerateDacteOptions): Promise<Buffer>;
    generateDocumentFromXml(xml: string, options?: GenerateDacteOptions): Promise<Buffer>;
    generateDocumentFromData(document: CteDocumentData, options?: GenerateDacteOptions): Promise<Buffer>;
    close(): Promise<void>;
    private getBrowser;
    private resolveTemplatePath;
    private resolveQrValue;
    private applyPartyOverrides;
    private mergeParty;
    private mergeOptionalParty;
}
export declare class CtePdfService extends DactePdfService {
}
export { parseCteXml };

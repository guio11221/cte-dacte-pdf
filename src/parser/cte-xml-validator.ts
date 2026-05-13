import { XMLValidator } from 'fast-xml-parser';
import { firstText } from '../utils/object.js';

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  documentType?: 'dacte' | 'cce' | 'cancelamento';
  issues: ValidationIssue[];
};

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function hasValue(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

function readPath(obj: any, dottedPath: string): unknown {
  return dottedPath.split('.').reduce((acc, key) => acc?.[key], obj);
}

function pushRequired(issues: ValidationIssue[], obj: any, dottedPath: string, label: string): void {
  if (!hasValue(readPath(obj, dottedPath))) {
    issues.push(issue(dottedPath, `${label} obrigatorio ausente.`));
  }
}

function normalizeCteRoot(raw: any): any {
  const cteProc = raw?.cteProc;
  const cte = cteProc?.CTe ?? raw?.CTe ?? raw?.cte ?? raw;
  const infCte = cte?.infCte ?? cte?.CTe?.infCte;
  const prot = cteProc?.protCTe?.infProt ?? raw?.protCTe?.infProt ?? {};
  return { infCte, prot };
}

function normalizeEventRoot(raw: any): any {
  const proc = raw?.procEventoCTe ?? raw?.procEventoCTeOS ?? raw;
  const evento = proc?.eventoCTe ?? proc?.eventoCTeOS ?? raw?.eventoCTe ?? raw?.eventoCTeOS ?? raw?.evento ?? raw;
  const retEvento = proc?.retEventoCTe ?? proc?.retEvento ?? raw?.retEventoCTe ?? raw?.retEvento ?? {};
  const infEvento = evento?.infEvento ?? {};
  const infRetEvento = retEvento?.infEvento ?? {};
  const detEvento = infEvento?.detEvento ?? {};
  return { infEvento, infRetEvento, detEvento };
}

export function detectXmlDocumentType(raw: any): 'dacte' | 'cce' | 'cancelamento' | undefined {
  if (raw?.cteProc || raw?.CTe || raw?.cte) {
    return 'dacte';
  }

  const { infEvento } = normalizeEventRoot(raw);
  const tipoEvento = firstText(infEvento?.tpEvento);
  if (tipoEvento === '110110') return 'cce';
  if (tipoEvento === '110111') return 'cancelamento';
  if (raw?.procEventoCTe || raw?.eventoCTe || raw?.retEventoCTe || raw?.procEventoCTeOS || raw?.eventoCTeOS) {
    return undefined;
  }

  return undefined;
}

export function validateParsedCte(raw: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { infCte, prot } = normalizeCteRoot(raw);

  if (!infCte) {
    issues.push(issue('infCte', 'Tag infCte nao encontrada.'));
    return { ok: false, documentType: 'dacte', issues };
  }

  pushRequired(issues, infCte, '@_Id', 'Id do CT-e');
  pushRequired(issues, infCte, 'ide.mod', 'Modelo');
  pushRequired(issues, infCte, 'ide.serie', 'Serie');
  pushRequired(issues, infCte, 'ide.nCT', 'Numero do CT-e');
  pushRequired(issues, infCte, 'ide.dhEmi', 'Data de emissao');
  pushRequired(issues, infCte, 'emit.xNome', 'Nome do emitente');
  pushRequired(issues, infCte, 'emit.CNPJ', 'CNPJ do emitente');
  pushRequired(issues, infCte, 'ide.modal', 'Modal');
  pushRequired(issues, infCte, 'ide.tpServ', 'Tipo de servico');
  pushRequired(issues, infCte, 'vPrest.vTPrest', 'Valor total da prestacao');
  pushRequired(issues, prot, 'nProt', 'Protocolo de autorizacao');

  return {
    ok: issues.length === 0,
    documentType: 'dacte',
    issues
  };
}

export function validateParsedCteEvent(raw: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { infEvento, infRetEvento, detEvento } = normalizeEventRoot(raw);
  const tipoEvento = firstText(infEvento?.tpEvento);
  const documentType = tipoEvento === '110110' ? 'cce' : tipoEvento === '110111' ? 'cancelamento' : undefined;

  if (!infEvento || !detEvento || !documentType) {
    issues.push(issue('infEvento.tpEvento', 'Evento CT-e nao suportado ou nao encontrado.'));
    return { ok: false, issues };
  }

  pushRequired(issues, infEvento, 'chCTe', 'Chave do CT-e');
  pushRequired(issues, infEvento, 'tpEvento', 'Tipo do evento');
  pushRequired(issues, infEvento, 'nSeqEvento', 'Sequencia do evento');
  pushRequired(issues, infEvento, 'dhEvento', 'Data do evento');
  pushRequired(issues, infRetEvento, 'nProt', 'Protocolo do evento');

  if (documentType === 'cancelamento') {
    pushRequired(issues, detEvento, 'nProt', 'Protocolo de autorizacao do CT-e');
    pushRequired(issues, detEvento, 'xJust', 'Justificativa do cancelamento');
  }

  if (documentType === 'cce') {
    pushRequired(issues, detEvento, 'xCorrecao', 'Texto da correcao');
    pushRequired(issues, detEvento, 'xCondUso', 'Condicoes de uso');
  }

  return {
    ok: issues.length === 0,
    documentType,
    issues
  };
}

export function validateParsedCteDocument(raw: any): ValidationResult {
  const type = detectXmlDocumentType(raw);
  if (type === 'dacte') return validateParsedCte(raw);
  if (type === 'cce' || type === 'cancelamento') return validateParsedCteEvent(raw);
  return {
    ok: false,
    issues: [issue('root', 'XML nao suportado: esperado CT-e autorizado ou evento CT-e suportado.')]
  };
}

export function validateXmlString(xml: string): ValidationIssue[] {
  const result = XMLValidator.validate(xml);
  if (result === true) return [];
  return [issue(`xml.${result.err?.code ?? 'invalid'}`, result.err?.msg ?? 'XML invalido.')];
}

export function assertValidation(result: ValidationResult): void {
  if (result.ok) return;
  const message = result.issues.map((item) => `${item.path}: ${item.message}`).join(' | ');
  throw new Error(message);
}

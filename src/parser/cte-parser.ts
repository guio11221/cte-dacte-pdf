import { XMLParser } from 'fast-xml-parser';
import type { CteDocumentData, CteEventData, DacteData, DacteDocument, DacteItem, DacteParty } from '../types/dacte.types.js';
import { assertValidation, validateParsedCte, validateParsedCteDocument, validateParsedCteEvent, validateXmlString } from './cte-xml-validator.js';
import { arr, firstText, onlyDigits } from '../utils/object.js';
import { formatCep, formatCpfCnpj, formatDateTime, formatMoney } from '../utils/format.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true
});

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

function readParty(node: any): DacteParty | undefined {
  if (!node) return undefined;
  const ender = node.enderEmit ?? node.enderReme ?? node.enderDest ?? node.enderExped ?? node.enderReceb ?? node.enderToma ?? node.enderTomador ?? {};
  const logradouro = firstText(ender.xLgr);
  const numero = firstText(ender.nro);
  const complemento = firstText(ender.xCpl);
  const bairro = firstText(ender.xBairro);
  const endereco = [logradouro, numero, complemento, bairro].filter(Boolean).join(', ');

  return {
    nome: firstText(node.xNome, node.xFant),
    fantasia: firstText(node.xFant),
    cpfCnpj: formatCpfCnpj(firstText(node.CNPJ, node.CPF)),
    ie: firstText(node.IE),
    fone: firstText(ender.fone, node.fone),
    endereco,
    municipio: firstText(ender.xMun),
    uf: firstText(ender.UF),
    cep: formatCep(firstText(ender.CEP))
  };
}

function getTomador(infCte: any): DacteParty | undefined {
  const toma3 = infCte?.ide?.toma3;
  const toma4 = infCte?.ide?.toma4;
  if (toma4) return readParty(toma4);

  const code = firstText(toma3?.toma);
  if (code === '0') return readParty(infCte?.rem);
  if (code === '1') return readParty(infCte?.exped);
  if (code === '2') return readParty(infCte?.receb);
  if (code === '3') return readParty(infCte?.dest);
  return undefined;
}

function getTipoCte(value: string): string {
  const map: Record<string, string> = {
    '0': 'Normal',
    '1': 'Complementar',
    '2': 'Anulacao',
    '3': 'Substituicao'
  };
  return map[value] ?? value;
}

function getModal(value: string): string {
  const map: Record<string, string> = {
    '01': 'Rodoviario',
    '02': 'Aereo',
    '03': 'Aquaviario',
    '04': 'Ferroviario',
    '05': 'Dutoviario',
    '06': 'Multimodal'
  };
  return map[value] ?? value;
}

function getTipoServico(value: string): string {
  const map: Record<string, string> = {
    '0': 'Normal',
    '1': 'Subcontratacao',
    '2': 'Redespacho',
    '3': 'Redespacho Intermediario',
    '4': 'Servico Vinculado a Multimodal'
  };
  return map[value] ?? value;
}

function getAmbiente(value: string): string {
  if (value === '1') return 'Producao';
  if (value === '2') return 'Homologacao';
  return value;
}

function getFormaEmissao(value: string): string {
  const map: Record<string, string> = {
    '1': 'Normal',
    '4': 'EPEC',
    '5': 'FS-DA',
    '7': 'SVC-RS',
    '8': 'SVC-SP'
  };
  return map[value] ?? value;
}

function parseComponentes(vPrest: any): DacteItem[] {
  return arr(vPrest?.Comp).map((item: any) => ({
    label: firstText(item.xNome),
    value: formatMoney(item.vComp)
  }));
}

function parseImpostos(imp: any): DacteItem[] {
  const icms = imp?.ICMS ?? {};
  const firstIcms = icms.ICMS00 ?? icms.ICMS20 ?? icms.ICMS45 ?? icms.ICMS60 ?? icms.ICMS90 ?? icms.ICMSOutraUF ?? icms.ICMSSN ?? {};
  return [
    { label: 'CST', value: firstText(firstIcms.CST, firstIcms.CSOSN) },
    { label: 'BASE ICMS', value: formatMoney(firstText(firstIcms.vBC)) },
    { label: 'ALIQUOTA ICMS', value: firstText(firstIcms.pICMS) ? `${firstText(firstIcms.pICMS).replace('.', ',')}%` : '' },
    { label: 'VALOR ICMS', value: formatMoney(firstText(firstIcms.vICMS)) },
    { label: 'VALOR TOTAL TRIBUTOS', value: formatMoney(firstText(imp?.vTotTrib)) }
  ].filter((item) => item.value !== '' && item.value !== '0,00');
}

function parseQuantidades(infCarga: any): DacteItem[] {
  return arr(infCarga?.infQ).map((item: any) => ({
    label: [firstText(item.cUnid), firstText(item.tpMed)].filter(Boolean).join(' - '),
    value: firstText(item.qCarga)?.replace('.', ',')
  }));
}

function parseCargaInfo(infCarga: any): Pick<DacteData, 'produtoPredominante' | 'outrasCaracteristicas' | 'valorCarga'> {
  return {
    produtoPredominante: firstText(infCarga?.proPred, '-'),
    outrasCaracteristicas: firstText(infCarga?.xOutCat, '-'),
    valorCarga: firstText(infCarga?.vCarga) ? formatMoney(infCarga?.vCarga) : '-'
  };
}

function parseDocuments(infCteNorm: any): DacteDocument[] {
  const infDoc = infCteNorm?.infDoc ?? {};
  const docs: DacteDocument[] = [];

  for (const nfe of arr(infDoc.infNFe)) {
    docs.push({ tipo: 'NF-e', chave: firstText(nfe.chave) });
  }

  for (const nf of arr(infDoc.infNF)) {
    docs.push({
      tipo: 'NF',
      numero: firstText(nf.nDoc),
      serie: firstText(nf.serie),
      data: firstText(nf.dEmi),
      valor: formatMoney(nf.vNF)
    });
  }

  for (const outros of arr(infDoc.infOutros)) {
    docs.push({
      tipo: firstText(outros.tpDoc, 'OUTROS'),
      numero: firstText(outros.nDoc),
      data: firstText(outros.dEmi),
      valor: formatMoney(outros.vDocFisc)
    });
  }

  return docs;
}

function parseRodoviario(infCteNorm: any): DacteItem[] {
  const rodo = infCteNorm?.infModal?.rodo ?? {};
  return [
    { label: 'RNTRC', value: firstText(rodo.RNTRC) },
    { label: 'Data prevista entrega', value: firstText(rodo.dPrev) },
    { label: 'Lotacao', value: firstText(rodo.lota) }
  ].filter((item) => item.value);
}

function parseObservacoes(infCte: any): string[] {
  const compl = infCte?.compl ?? {};
  const obs: string[] = [];

  if (compl.xCaracAd) obs.push(`Caracteristica adicional: ${compl.xCaracAd}`);
  if (compl.xCaracSer) obs.push(`Caracteristica servico: ${compl.xCaracSer}`);
  if (compl.xEmi) obs.push(`Emissor: ${compl.xEmi}`);
  if (compl.xObs) obs.push(String(compl.xObs));

  for (const item of arr(compl.ObsCont)) {
    const campo = firstText(item['@_xCampo']);
    const texto = firstText(item.xTexto);
    if (campo || texto) obs.push(`${campo ? `${campo}: ` : ''}${texto}`);
  }

  for (const item of arr(compl.ObsFisco)) {
    const campo = firstText(item['@_xCampo']);
    const texto = firstText(item.xTexto);
    if (campo || texto) obs.push(`${campo ? `${campo}: ` : ''}${texto}`);
  }

  return obs;
}

function parseEventEmitente(infEvento: any): Partial<DacteParty> {
  return {
    cpfCnpj: formatCpfCnpj(firstText(infEvento.CNPJ, infEvento.CPF))
  };
}

export function parseCteXml(xml: string): DacteData {
  const xmlIssues = validateXmlString(xml);
  if (xmlIssues.length) {
    throw new Error(xmlIssues.map((item) => `${item.path}: ${item.message}`).join(' | '));
  }

  const raw = parser.parse(xml);
  assertValidation(validateParsedCte(raw));
  const { infCte, prot } = normalizeCteRoot(raw);

  if (!infCte) {
    throw new Error('XML invalido: tag infCte nao encontrada.');
  }

  const ide = infCte.ide ?? {};
  const infCteNorm = infCte.infCTeNorm ?? {};
  const infCarga = infCteNorm.infCarga ?? {};
  const cargaInfo = parseCargaInfo(infCarga);
  const chaveAcesso = onlyDigits(firstText(infCte['@_Id'])).replace(/^57|^CTe/i, '') || onlyDigits(firstText(prot.chCTe));
  const emitente = readParty(infCte.emit);

  if (!emitente) {
    throw new Error('XML invalido: emitente nao encontrado.');
  }

  return {
    kind: 'dacte',
    modelo: firstText(ide.mod, '57'),
    serie: firstText(ide.serie),
    numero: firstText(ide.nCT),
    emissao: formatDateTime(firstText(ide.dhEmi)),
    cfop: firstText(ide.CFOP),
    naturezaOperacao: firstText(ide.natOp),
    tipoCte: getTipoCte(firstText(ide.tpCTe)),
    tipoServico: getTipoServico(firstText(ide.tpServ)),
    modal: getModal(firstText(ide.modal)),
    chaveAcesso,
    protocolo: firstText(prot.nProt),
    protocoloData: formatDateTime(firstText(prot.dhRecbto)),
    ambiente: getAmbiente(firstText(ide.tpAmb)),
    tpAmb: firstText(ide.tpAmb),
    formaEmissao: getFormaEmissao(firstText(ide.tpEmis)),
    status: firstText(prot.cStat) === '100' ? 'AUTORIZADO' : firstText(prot.xMotivo, 'SEM PROTOCOLO'),
    qrCodeUrl: firstText(infCte.infCTeSupl?.qrCodCTe),
    consultaUrl: firstText(infCte.infCTeSupl?.urlChave),
    emitente,
    remetente: readParty(infCte.rem),
    destinatario: readParty(infCte.dest),
    expedidor: readParty(infCte.exped),
    recebedor: readParty(infCte.receb),
    tomador: getTomador(infCte),
    origem: [firstText(ide.xMunIni), firstText(ide.UFIni)].filter(Boolean).join(' / '),
    destino: [firstText(ide.xMunFim), firstText(ide.UFFim)].filter(Boolean).join(' / '),
    produtoPredominante: cargaInfo.produtoPredominante,
    outrasCaracteristicas: cargaInfo.outrasCaracteristicas,
    valorCarga: cargaInfo.valorCarga,
    valorTotalServico: formatMoney(infCte.vPrest?.vTPrest),
    valorReceber: formatMoney(infCte.vPrest?.vRec),
    componentesPrestacao: parseComponentes(infCte.vPrest),
    impostos: parseImpostos(infCte.imp),
    quantidadesCarga: parseQuantidades(infCarga),
    documentosOriginarios: parseDocuments(infCteNorm),
    modalRodoviario: parseRodoviario(infCteNorm),
    observacoes: parseObservacoes(infCte)
  };
}

export function parseCteEventXml(xml: string): CteEventData {
  const xmlIssues = validateXmlString(xml);
  if (xmlIssues.length) {
    throw new Error(xmlIssues.map((item) => `${item.path}: ${item.message}`).join(' | '));
  }

  const raw = parser.parse(xml);
  assertValidation(validateParsedCteEvent(raw));
  const { infEvento, infRetEvento, detEvento } = normalizeEventRoot(raw);

  if (!infEvento || !detEvento) {
    throw new Error('XML invalido: evento CT-e nao encontrado.');
  }

  const tipoEvento = firstText(infEvento.tpEvento);
  const kind = tipoEvento === '110110' ? 'cce' : tipoEvento === '110111' ? 'cancelamento' : '';
  if (!kind) {
    throw new Error(`Evento CT-e nao suportado: ${tipoEvento || 'desconhecido'}.`);
  }

  const descricaoEvento = firstText(detEvento.descEvento, infRetEvento.xEvento, kind === 'cce' ? 'Carta de Correcao Eletronica' : 'Cancelamento');

  return {
    kind,
    modelo: firstText(infEvento.mod, '57'),
    chaveAcesso: onlyDigits(firstText(infEvento.chCTe)),
    ambiente: getAmbiente(firstText(infEvento.tpAmb)),
    tpAmb: firstText(infEvento.tpAmb),
    tipoEvento,
    descricaoEvento,
    sequenciaEvento: firstText(infEvento.nSeqEvento, '1'),
    dataEvento: formatDateTime(firstText(infEvento.dhEvento)),
    dataRegistro: formatDateTime(firstText(infRetEvento.dhRegEvento)),
    protocoloEvento: firstText(infRetEvento.nProt),
    statusEvento: firstText(infRetEvento.cStat),
    motivo: firstText(infRetEvento.xMotivo),
    emitente: parseEventEmitente(infEvento),
    justificativa: firstText(detEvento.xJust),
    correcaoTexto: firstText(detEvento.xCorrecao),
    condicoesUso: firstText(detEvento.xCondUso),
    protocoloAutorizacao: firstText(detEvento.nProt),
    observacoes: [
      firstText(detEvento.xCorrecao),
      firstText(detEvento.xJust),
      firstText(infRetEvento.xMotivo)
    ].filter(Boolean)
  };
}

export function parseCteDocumentXml(xml: string): CteDocumentData {
  const xmlIssues = validateXmlString(xml);
  if (xmlIssues.length) {
    throw new Error(xmlIssues.map((item) => `${item.path}: ${item.message}`).join(' | '));
  }

  const raw = parser.parse(xml);
  assertValidation(validateParsedCteDocument(raw));
  if (raw?.cteProc || raw?.CTe || raw?.cte) {
    return parseCteXml(xml);
  }
  if (raw?.procEventoCTe || raw?.eventoCTe || raw?.retEventoCTe || raw?.procEventoCTeOS || raw?.eventoCTeOS) {
    return parseCteEventXml(xml);
  }
  throw new Error('XML nao suportado: esperado CT-e autorizado ou evento de CT-e.');
}

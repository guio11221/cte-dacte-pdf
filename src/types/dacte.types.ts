export type DacteParty = {
  nome: string;
  fantasia?: string;
  cpfCnpj: string;
  ie?: string;
  fone?: string;
  endereco: string;
  municipio: string;
  uf: string;
  cep?: string;
};

export type DacteItem = {
  label: string;
  value: string;
};

export type DacteDocument = {
  tipo: string;
  chave?: string;
  numero?: string;
  serie?: string;
  data?: string;
  valor?: string;
};

export type DocumentKind = 'dacte' | 'cce' | 'cancelamento';

export type DocumentPartyRole =
  | 'emitente'
  | 'remetente'
  | 'destinatario'
  | 'expedidor'
  | 'recebedor'
  | 'tomador';

export type RenderSectionField = {
  label: string;
  value: string;
};

export type RenderSection = {
  title: string;
  text?: string;
  fields?: RenderSectionField[];
};

export type DocumentPartyOverrides = Partial<Record<DocumentPartyRole, Partial<DacteParty>>>;

export type RenderCustomization = {
  headerNote?: string;
  footerNote?: string;
  watermarkText?: string;
  additionalInfo?: Record<string, string>;
  customSections?: RenderSection[];
  partyOverrides?: DocumentPartyOverrides;
};

export type DacteData = {
  kind: 'dacte';
  modelo: string;
  serie: string;
  numero: string;
  emissao: string;
  cfop: string;
  naturezaOperacao: string;
  tipoCte: string;
  tipoServico: string;
  modal: string;
  chaveAcesso: string;
  protocolo: string;
  protocoloData: string;
  ambiente: string;
  tpAmb: string;
  formaEmissao: string;
  status: string;
  qrCodeUrl: string;
  consultaUrl: string;
  emitente: DacteParty;
  remetente?: DacteParty;
  destinatario?: DacteParty;
  expedidor?: DacteParty;
  recebedor?: DacteParty;
  tomador?: DacteParty;
  origem: string;
  destino: string;
  produtoPredominante: string;
  outrasCaracteristicas: string;
  valorCarga: string;
  valorTotalServico: string;
  valorReceber: string;
  componentesPrestacao: DacteItem[];
  impostos: DacteItem[];
  quantidadesCarga: DacteItem[];
  documentosOriginarios: DacteDocument[];
  modalRodoviario: DacteItem[];
  observacoes: string[];
};

export type CteEventData = {
  kind: 'cce' | 'cancelamento';
  modelo: string;
  chaveAcesso: string;
  ambiente: string;
  tpAmb: string;
  tipoEvento: string;
  descricaoEvento: string;
  sequenciaEvento: string;
  dataEvento: string;
  dataRegistro: string;
  protocoloEvento: string;
  statusEvento: string;
  motivo: string;
  emitente: Partial<DacteParty>;
  justificativa?: string;
  correcaoTexto?: string;
  condicoesUso?: string;
  protocoloAutorizacao?: string;
  observacoes: string[];
};

export type CteDocumentData = DacteData | CteEventData;

export type GenerateDacteOptions = RenderCustomization & {
  outputPath?: string;
  templatePath?: string;
  logoBase64?: string;
  logoPath?: string;
};

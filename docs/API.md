# API

## Classes

### `CtePdfService`

Classe principal do modulo.

#### `generateFromXml(xml, options?)`

Recebe o XML bruto, detecta o tipo do documento e retorna um `Buffer` com o PDF.

```ts
const pdf = await service.generateFromXml(xml, options);
```

#### `generateDocumentFromXml(xml, options?)`

Alias semantico de `generateFromXml()`. Pode ser util quando voce quer explicitar que o XML pode ser de CT-e ou de evento.

#### `generateFromData(dacte, options?)`

Mantem compatibilidade com o fluxo de DACTE normalizado.

```ts
const pdf = await service.generateFromData(dacteData, options);
```

#### `generateDocumentFromData(document, options?)`

Recebe o documento ja normalizado, seja `dacte`, `cancelamento` ou `cce`.

```ts
const document = parseCteDocumentXml(xml);
const pdf = await service.generateDocumentFromData(document, options);
```

#### `renderDocumentHtml(document, options?)`

Renderiza o HTML final sem gerar PDF.

```ts
const html = await service.renderDocumentHtml(document, options);
```

#### `close()`

Fecha a instancia interna do browser.

```ts
await service.close();
```

### `DactePdfService`

Alias da implementacao principal. Continua exportado para preservar compatibilidade com integracoes antigas.

## Funcoes

### `parseCteXml(xml)`

Faz parse de um XML de CT-e autorizado e retorna `DacteData`.

### `parseCteEventXml(xml)`

Faz parse de um XML de evento de CT-e suportado e retorna `CteEventData`.

### `parseCteDocumentXml(xml)`

Detecta o tipo do XML e retorna `CteDocumentData`.

### `validateXmlString(xml)`

Valida se o XML e bem formado.

### `validateParsedCte(raw)`

Valida estruturalmente um CT-e parseado.

### `validateParsedCteEvent(raw)`

Valida estruturalmente um evento parseado.

### `validateParsedCteDocument(raw)`

Valida estruturalmente um documento parseado com selecao automatica.

## Tipos principais

### `DocumentKind`

```ts
type DocumentKind = 'dacte' | 'cce' | 'cancelamento';
```

### `GenerateDacteOptions`

```ts
type GenerateDacteOptions = {
  outputPath?: string;
  templatePath?: string;
  logoBase64?: string;
  logoPath?: string;
  headerNote?: string;
  footerNote?: string;
  watermarkText?: string;
  additionalInfo?: Record<string, string>;
  customSections?: RenderSection[];
  partyOverrides?: DocumentPartyOverrides;
};
```

### `RenderSection`

```ts
type RenderSection = {
  title: string;
  text?: string;
  fields?: { label: string; value: string }[];
};
```

### `DocumentPartyOverrides`

Permite complementar dados de participantes no PDF.

```ts
type DocumentPartyOverrides = Partial<Record<
  'emitente' | 'remetente' | 'destinatario' | 'expedidor' | 'recebedor' | 'tomador',
  Partial<DacteParty>
>>;
```

## Contrato resumido de `DacteData`

Campos relevantes:

- `kind`
- `modelo`
- `serie`
- `numero`
- `emissao`
- `chaveAcesso`
- `protocolo`
- `protocoloData`
- `tipoServico`
- `emitente`
- `remetente`
- `destinatario`
- `tomador`
- `produtoPredominante`
- `outrasCaracteristicas`
- `valorCarga`
- `valorTotalServico`
- `valorReceber`
- `componentesPrestacao`
- `impostos`
- `quantidadesCarga`
- `documentosOriginarios`
- `modalRodoviario`
- `observacoes`

## Contrato resumido de `CteEventData`

Campos relevantes:

- `kind`
- `modelo`
- `chaveAcesso`
- `tipoEvento`
- `descricaoEvento`
- `sequenciaEvento`
- `dataEvento`
- `dataRegistro`
- `protocoloEvento`
- `statusEvento`
- `motivo`
- `emitente`
- `justificativa`
- `correcaoTexto`
- `condicoesUso`
- `protocoloAutorizacao`
- `observacoes`

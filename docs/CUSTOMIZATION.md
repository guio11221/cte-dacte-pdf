# Customizacao

O modulo aceita customizacao visual e operacional sem alterar o XML fiscal.

## `headerNote`

Texto adicional no topo do documento.

Uso recomendado:

- observacao operacional
- contexto interno do ERP
- identificacao de processo

```ts
headerNote: 'Gerado automaticamente pelo modulo fiscal do ERP.'
```

## `footerNote`

Texto adicional no rodape ou no bloco final do documento.

Uso recomendado:

- observacoes internas
- instrucoes de auditoria
- notas de conciliacao

## `watermarkText`

Marca d'agua textual.

Uso recomendado:

- `USO INTERNO`
- `RASCUNHO`
- `HOMOLOGACAO`

## `additionalInfo`

Mapa simples de chave/valor para exibir campos extras.

```ts
additionalInfo: {
  'Pedido interno': 'PED-004512',
  'Centro de custo': 'FROTA-02'
}
```

## `customSections`

Secoes extras com texto livre e/ou tabela de campos.

```ts
customSections: [
  {
    title: 'Integracao',
    text: 'Dados complementares para conciliacao interna.',
    fields: [
      { label: 'Conta contabil', value: '3.1.02.004' },
      { label: 'Filial', value: 'Cuiaba' }
    ]
  }
]
```

## `partyOverrides`

Permite completar ou sobrescrever dados de participantes no PDF.

```ts
partyOverrides: {
  emitente: {
    nome: 'Transportadora Exemplo LTDA'
  },
  tomador: {
    endereco: 'Endereco operacional complementar'
  }
}
```

## Limites recomendados

Use customizacao para complementar apresentacao, nao para reescrever o conteudo fiscal.

Bom uso:

- nomes internos
- referencias operacionais
- observacoes de auditoria
- marcacoes visuais de ambiente

Mau uso:

- alterar justificativa de cancelamento
- trocar chave de acesso
- substituir dados fiscais do XML como se fossem a fonte oficial

## Estrategia recomendada

1. renderize o XML como base
2. adicione apenas dados internos em secoes extras
3. se faltar dado visual importante em evento, use `partyOverrides`
4. mantenha o XML original armazenado junto com o PDF gerado

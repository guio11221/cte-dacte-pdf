# Documentacao

Esta pasta concentra a documentacao detalhada do modulo.

## Conteudo

- [Guia de uso](./USAGE.md)
- [API](./API.md)
- [Customizacao](./CUSTOMIZATION.md)
- [Exemplos](./EXAMPLES.md)

## Objetivo do modulo

O modulo foi organizado para resolver tres problemas:

1. Ler XML de CT-e ou de evento de CT-e.
2. Normalizar os dados para um contrato TypeScript consistente.
3. Renderizar PDF com layout adequado ao tipo de documento.

## Tipos de documento suportados

- `dacte`: CT-e autorizado
- `cancelamento`: evento `110111`
- `cce`: evento `110110`

## Fluxo de alto nivel

1. Seu sistema obtem o XML autorizado ou registrado.
2. O modulo identifica o tipo do documento.
3. Os dados sao normalizados internamente.
4. O renderer escolhe o template adequado.
5. O PDF final e retornado em `Buffer` e, opcionalmente, salvo em disco.

## Quando usar cada entrada

- Use `generateFromXml()` quando seu sistema trabalha com XML bruto.
- Use `generateDocumentFromData()` quando voce quer parsear uma vez e depois renderizar com variacoes.
- Use `generateFromData()` quando o fluxo ainda for apenas DACTE e voce quiser manter compatibilidade.

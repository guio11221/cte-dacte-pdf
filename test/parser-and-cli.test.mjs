import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  CtePdfService,
  parseCteDocumentXml,
  parseCteEventXml,
  parseCteXml,
  validateXmlString
} from '../dist/esm/src/index.js';
import { runCli } from '../dist/esm/src/cli/cte-pdf.js';

const fixturesDir = path.resolve('test/fixtures');

async function readFixture(fileName) {
  return fs.readFile(path.join(fixturesDir, fileName), 'utf8');
}

test('parseCteXml preenche campos principais do DACTE', async () => {
  const xml = await readFixture('cte-autorizado.xml');
  const document = parseCteXml(xml);

  assert.equal(document.kind, 'dacte');
  assert.equal(document.tipoServico, 'Normal');
  assert.equal(document.produtoPredominante, 'ALIMENTOS');
  assert.equal(document.outrasCaracteristicas, 'REFRIGERADO');
  assert.equal(document.valorCarga, '35.000,90');
  assert.equal(document.componentesPrestacao.length, 2);
});

test('parseCteEventXml identifica cancelamento e cce', async () => {
  const cancelXml = await readFixture('evento-cancelamento.xml');
  const cceXml = await readFixture('evento-cce.xml');

  const cancelamento = parseCteEventXml(cancelXml);
  const cce = parseCteEventXml(cceXml);

  assert.equal(cancelamento.kind, 'cancelamento');
  assert.match(cancelamento.justificativa ?? '', /EMISSAO INDEVIDA/);
  assert.equal(cce.kind, 'cce');
  assert.match(cce.correcaoTexto ?? '', /CORRIGIR/);
});

test('parseCteDocumentXml detecta o tipo automaticamente', async () => {
  const xml = await readFixture('evento-cancelamento.xml');
  const document = parseCteDocumentXml(xml);

  assert.equal(document.kind, 'cancelamento');
});

test('validacao estrutural rejeita XML incompleto', async () => {
  const xml = await readFixture('cte-invalido.xml');

  await assert.rejects(
    async () => parseCteXml(xml),
    /obrigatorio ausente|nao encontrada/
  );
});

test('validateXmlString detecta XML malformado', () => {
  const issues = validateXmlString('<xml>');
  assert.equal(issues.length, 1);
});

test('renderDocumentHtml gera html do DACTE com dados enrichidos', async () => {
  const xml = await readFixture('cte-autorizado.xml');
  const document = parseCteXml(xml);
  const service = new CtePdfService();

  try {
    const html = await service.renderDocumentHtml(document, {
      headerNote: 'TESTE',
      additionalInfo: { Origem: 'suite' }
    });

    assert.match(html, /ALIMENTOS/);
    assert.match(html, /REFRIGERADO/);
    assert.match(html, /TESTE/);
    assert.match(html, /Origem/);
  } finally {
    await service.close();
  }
});

test('runCli --validate-only valida sem gerar pdf', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cte-pdf-cli-'));
  const xmlPath = path.join(fixturesDir, 'cte-autorizado.xml');
  const outputPath = path.join(tempDir, 'saida.pdf');

  await runCli(['--validate-only', '--autorizado', xmlPath, '-o', outputPath, '--quiet']);

  await assert.rejects(() => fs.access(outputPath));
});

test('runCli gera pdf no caminho informado', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cte-pdf-cli-'));
  const xmlPath = path.join(fixturesDir, 'cte-autorizado.xml');
  const outputPath = path.join(tempDir, 'saida.pdf');

  await runCli(['--autorizado', xmlPath, '-o', outputPath, '--quiet']);

  const stat = await fs.stat(outputPath);
  assert.ok(stat.size > 0);
});

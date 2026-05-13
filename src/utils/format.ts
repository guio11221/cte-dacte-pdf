import { onlyDigits } from './object.js';

export function formatCpfCnpj(value: unknown): string {
  const digits = onlyDigits(value);
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return String(value ?? '');
}

export function formatCep(value: unknown): string {
  const digits = onlyDigits(value);
  if (digits.length !== 8) return String(value ?? '');
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

export function formatMoney(value: unknown): string {
  const n = Number(String(value ?? '0').replace(',', '.'));
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateTime(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date);
}

export function formatAccessKey(value: unknown): string {
  return onlyDigits(value).replace(/(.{4})/g, '$1 ').trim();
}

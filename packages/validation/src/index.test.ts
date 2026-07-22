import { describe, expect, it } from 'vitest';
import { loginSchema, emailSchema, passwordSchema } from '../src/index';

describe('loginSchema', () => {
  it('acepta email y contraseña válidos', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const result = loginSchema.safeParse({
      email: 'no-es-email',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('normaliza espacios', () => {
    const result = emailSchema.safeParse('  user@test.cl  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('user@test.cl');
  });
});

describe('passwordSchema', () => {
  it('exige mínimo 8 caracteres', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('longenough').success).toBe(true);
  });
});

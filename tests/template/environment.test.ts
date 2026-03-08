/**
 * Tests for BiscuitCutter environment module.
 */
import { describe, it, expect } from 'vitest';
import { createStrictEnvironment } from '../../src/template/environment';

describe('Environment', () => {
  it('should create a strict nunjucks environment', () => {
    const env = createStrictEnvironment();
    expect(env).toBeDefined();
  });

  it('should throw on undefined variables', () => {
    const env = createStrictEnvironment();
    expect(() => env.renderString('{{ undefined_var }}', {})).toThrow();
  });

  it('should render defined variables', () => {
    const env = createStrictEnvironment();
    const result = env.renderString('Hello {{ name }}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('should have default extensions loaded', () => {
    const env = createStrictEnvironment();
    // jsonify filter should work
    const result = env.renderString('{{ data | jsonify }}', {
      data: { key: 'value' },
    });
    expect(result).toContain('key');
    expect(result).toContain('value');
  });

  it('should support custom jinja2 env vars from context', () => {
    const env = createStrictEnvironment({
      context: {
        cookiecutter: {
          _jinja2_env_vars: {
            trimBlocks: true,
            lstripBlocks: true,
          },
        },
      },
    });
    expect(env).toBeDefined();
  });

  it('should warn about Python extensions but not crash', () => {
    const env = createStrictEnvironment({
      context: {
        cookiecutter: {
          _extensions: ['jinja2_time.TimeExtension'],
        },
      },
    });
    expect(env).toBeDefined();
  });
});

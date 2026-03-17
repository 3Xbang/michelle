import { describe, it, expect } from 'vitest';
import app from '../../src/app.js';
import config from '../../src/config/index.js';

describe('Config', () => {
  it('should have default port 3000', () => {
    expect(config.port).toBe(3000);
  });

  it('should have db config with defaults', () => {
    expect(config.db.host).toBe('localhost');
    expect(config.db.port).toBe(5432);
    expect(config.db.name).toBe('villa_pms');
  });

  it('should have jwt config with defaults', () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBe('24h');
  });

  it('should have corsOrigin defined', () => {
    expect(config.corsOrigin).toBeDefined();
  });
});

describe('Express App', () => {
  it('should be an express application', () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
    expect(typeof app.listen).toBe('function');
  });
});

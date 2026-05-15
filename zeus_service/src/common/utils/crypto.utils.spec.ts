import { sha256Hex } from './crypto.utils';

describe('crypto.utils', () => {
  it('computes sha256 hex correctly', () => {
    const h = sha256Hex('hello');
    expect(h).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});

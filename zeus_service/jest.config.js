module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?!(?!@stellar/stellar-sdk|@noble/ed25519|@noble/hashes|bitcoinjs-lib|bech32|bip174|bs58check|bs58|base-x|uint8array-extras)/))',
  ],
  moduleNameMapper: {
    // Map @stellar/stellar-sdk to CommonJS version
    '^@stellar/stellar-sdk$': '<rootDir>/node_modules/@stellar/stellar-sdk/lib/cjs/index.js',
    '^@stellar/stellar-sdk/(.*)$': '<rootDir>/node_modules/@stellar/stellar-sdk/lib/cjs/$1',
    // Map bindings to compiled dist output (after running npm run build)
    '^../../bindings/escrow-factory$': '<rootDir>/src/bindings/escrow-factory/dist/index.js',
    '^../../bindings/zk-verifier$': '<rootDir>/src/bindings/zk-verifier/dist/index.js',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
};
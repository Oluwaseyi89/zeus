import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { SwapOrder } from '../../src/modules/swap/models/swap-order.model';

describe('Stellar E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let stellarAddress = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUV';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [SwapOrder],
          synchronize: true,
          logging: false,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Get a nonce and login to get JWT
    const nonceResponse = await request(app.getHttpServer())
      .post('/auth/nonce')
      .send({ address: stellarAddress, blockchain: 'stellar' });

    // Mock signature (in real test, you'd sign with actual wallet)
    const mockSignature = 'sig_mock_signature';

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/wallet-login')
      .send({
        address: stellarAddress,
        signature: mockSignature,
        message: nonceResponse.body.message,
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints', () => {
    it('GET /auth/nonce should return a nonce', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/nonce')
        .query({ address: stellarAddress, blockchain: 'stellar' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nonce');
      expect(response.body).toHaveProperty('blockchain', 'stellar');
      expect(response.body).toHaveProperty('message');
    });

    it('POST /auth/wallet-login should return JWT with valid signature', async () => {
      const nonceResponse = await request(app.getHttpServer())
        .post('/auth/nonce')
        .send({ address: stellarAddress, blockchain: 'stellar' });

      const response = await request(app.getHttpServer())
        .post('/auth/wallet-login')
        .send({
          address: stellarAddress,
          signature: 'sig_mock_signature',
          message: nonceResponse.body.message,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
    });

    it('POST /auth/wallet-login should fail with invalid signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/wallet-login')
        .send({
          address: stellarAddress,
          signature: 'invalid_signature',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Stellar Endpoints', () => {
    it('POST /swap should require JWT auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/swap')
        .send({
          initiator: stellarAddress,
          counterparty: 'GCOUNTERPARTY1234567890123456789012345678901234567890',
          tokenA: 'BTC',
          tokenB: 'XLM',
          amountA: '1000000',
          amountB: '5000000',
          blockchain: 'stellar',
        });

      expect(response.status).toBe(401);
    });

    it('POST /swap should create swap with valid JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/swap')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          initiator: stellarAddress,
          counterparty: 'GCOUNTERPARTY1234567890123456789012345678901234567890',
          tokenA: 'BTC',
          tokenB: 'XLM',
          amountA: '1000000',
          amountB: '5000000',
          blockchain: 'stellar',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('swapId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('blockchain', 'stellar');
    });

    it('GET /swap/:id should be public', async () => {
      // First create a swap
      const createResponse = await request(app.getHttpServer())
        .post('/swap')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          initiator: stellarAddress,
          counterparty: 'GCOUNTERPARTY1234567890123456789012345678901234567890',
          tokenA: 'BTC',
          tokenB: 'XLM',
          amountA: '1000000',
          amountB: '5000000',
          blockchain: 'stellar',
        });

      const swapId = createResponse.body.swapId;

      // Then get it without auth
      const response = await request(app.getHttpServer())
        .get(`/swap/${swapId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('swapId', swapId);
    });
  });

  describe('ZK Verification Endpoints', () => {
    it('POST /zk/verify should require JWT auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/zk/verify')
        .send({
          journalBytes: Buffer.from('mock_journal').toString('hex'),
          seal: Buffer.from('mock_seal').toString('hex'),
          imageId: Buffer.from('mock_image').toString('hex'),
        });

      expect(response.status).toBe(401);
    });

    it('POST /zk/verify should verify proof with valid JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/zk/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          journalBytes: Buffer.from('mock_journal').toString('hex'),
          seal: Buffer.from('mock_seal').toString('hex'),
          imageId: Buffer.from('mock_image').toString('hex'),
        });

      // Even with mock data, should return a response
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('valid');
    });
  });
});
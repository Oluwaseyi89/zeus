import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwapModule } from '../../src/modules/swap/swap.module';

describe('Swap e2e (dev)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [__dirname + '/../../src/**/*.model.{ts,js}'],
          synchronize: true,
          logging: false,
        }),
        SwapModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/swap (POST) creates a swap', async () => {
    const payload = {
      initiator: '0xinitiator',
      counterparty: '0xcounter',
      tokenA: 'ZKBTC',
      tokenB: 'STRK',
      amountA: '100000',
      amountB: '5000',
      timelock: 3600,
    };

    const res = await request(app.getHttpServer())
      .post('/swap')
      .send(payload)
      .expect(201);
    expect(res.body).toHaveProperty('swapId');
    expect(res.body).toHaveProperty('status');
  });
});

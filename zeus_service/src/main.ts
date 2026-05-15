import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BitcoinWatchtowerService } from './modules/relayer/watchtower/bitcoin-watchtower.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Start Bitcoin watchtower in development for devnet polling
  if ((process.env.NODE_ENV ?? 'development') === 'development') {
    try {
      const watchtower = app.get(BitcoinWatchtowerService);
      // start in background (non-blocking)
      watchtower
        .startPolling(5000)
        .catch((e) => console.warn('watchtower error', e));
    } catch (err) {
      // service may not be available in some contexts; ignore

      console.warn(
        'BitcoinWatchtowerService not available:',
        err?.message ?? err,
      );
    }
  }

  // Allow cross-origin requests during development so Expo Go can reach the API
  if ((process.env.NODE_ENV ?? 'development') === 'development') {
    app.enableCors({ origin: true, credentials: true });
  } else {
    app.enableCors();
  }

  const port = parseInt(process.env.PORT ?? '3000', 10);
  // Bind to 0.0.0.0 so devices on the LAN can reach the server
  await app.listen(port, '0.0.0.0');
}

bootstrap();

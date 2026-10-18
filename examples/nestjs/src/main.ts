import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
const { trustProxy, integerEnv } = require("../../shared/network.cjs");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set("trust proxy", trustProxy(process.env.TRUSTED_PROXIES));
  app.enableShutdownHooks();
  await app.listen(
    integerEnv("PORT", 3000, 1, 65535),
    process.env.HOST ?? "127.0.0.1",
  );
}
bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

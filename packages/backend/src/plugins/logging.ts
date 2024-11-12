import {
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import {
  WinstonLogger,
  createConfigSecretEnumerator,
} from '@backstage/backend-app-api';
import { transports, format } from 'winston';

export default createServiceFactory({
  service: coreServices.rootLogger,
  deps: {
    config: coreServices.rootConfig,
  },
  async factory({ config }) {
    const logger = WinstonLogger.create({
      meta: {
        service: 'backstage',
      },
      level: process.env.LOG_LEVEL || 'info',
      format: !process.env.env || process.env.env === 'local' ? WinstonLogger.colorFormat() : format.simple(),
      transports: [new transports.Console()],
    });

    const secretEnumerator = await createConfigSecretEnumerator({
      logger,
    });
    logger.addRedactions(secretEnumerator(config));
    config.subscribe?.(() => logger.addRedactions(secretEnumerator(config)));

    return logger;
  },
});
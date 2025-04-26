import pino from 'pino';
export const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      messageFormat: '{msg} {args}',
    },
  },
});

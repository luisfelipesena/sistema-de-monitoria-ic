import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  browser: {
    asObject: true,
  },
});

const enhancedLogger = {
  debug: (msg: string, obj?: object) =>
    logger.debug(obj || {}, `🐞 Debug: ${msg}`),
  info: (msg: string, obj?: object) =>
    logger.info(obj || {}, `ℹ️ Info: ${msg}`),
  warn: (msg: string, obj?: object) =>
    logger.warn(obj || {}, `⚠️ Aviso: ${msg}`),
  error: (msg: string, obj?: object) =>
    logger.error(obj || {}, `❌ Erro: ${msg}`),
  auth: {
    debug: (msg: string, obj?: object) =>
      logger.debug(obj || {}, `🔐 Autenticação - Debug: ${msg}`),
    info: (msg: string, obj?: object) =>
      logger.info(obj || {}, `🔐 Autenticação - Info: ${msg}`),
    warn: (msg: string, obj?: object) =>
      logger.warn(obj || {}, `🔐 Autenticação - Aviso: ${msg}`),
    error: (msg: string, obj?: object) =>
      logger.error(obj || {}, `🔐 Autenticação - Erro: ${msg}`),
  },
};

export default enhancedLogger;

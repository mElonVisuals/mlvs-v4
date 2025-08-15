let pinoLib;
try {
  pinoLib = (await import('pino')).default;
} catch (e) {
  // fallback dummy logger
  pinoLib = function(){ return { info: console.log, error: console.error, warn: console.warn, debug: console.debug }; };
  console.warn('[logger] pino not installed, using console fallback');
}

export function createLogger() {
  const level = process.env.LOG_LEVEL || 'info';
  if (pinoLib.name === 'pino') {
    return pinoLib({ level, base: undefined, timestamp: pinoLib.stdTimeFunctions?.isoTime });
  }
  return pinoLib();
}

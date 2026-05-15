const DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  info: (...args) => { if (DEV) console.log(...args); },
  debug: (...args) => { if (DEV) console.log(...args); },
  warn: (...args) => { if (DEV) console.warn(...args); },
  error: (...args) => console.error(...args),
};

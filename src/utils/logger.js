// Simple scoped logger with colors, timestamps, and banners
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

const LEVELS = {
  debug: { label: 'DBG', color: COLORS.cyan, symbol: '🐛' },
  info: { label: 'INF', color: COLORS.blue, symbol: 'ℹ' },
  warn: { label: 'WRN', color: COLORS.yellow, symbol: '⚠' },
  error: { label: 'ERR', color: COLORS.red, symbol: '✖' },
  success: { label: 'OK', color: COLORS.green, symbol: '✔' },
  start: { label: 'RUN', color: COLORS.magenta, symbol: '▶' },
};

const ORDER = ['debug','info','warn','error'];
const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const minIndex = Math.max(0, ORDER.indexOf(envLevel));

function ts() {
  const d = new Date();
  const pad = (n, z=2) => String(n).padStart(z,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(),3)}`;
}

function fmt(level, scope, msg) {
  const L = LEVELS[level] || LEVELS.info;
  const tag = `${L.color}${L.symbol} ${L.label}${COLORS.reset}`;
  const sc = scope ? `${COLORS.dim}[${scope}]${COLORS.reset}` : '';
  return `${COLORS.gray}${ts()}${COLORS.reset} ${tag} ${sc} ${msg}`;
}

function shouldPrint(level) {
  const idx = ORDER.indexOf(level);
  return idx === -1 || idx >= minIndex; // success/start not in ORDER -> always show
}

export const logger = {
  debug: (scope, msg) => { if (shouldPrint('debug')) console.log(fmt('debug', scope, msg)); },
  info: (scope, msg) => { if (shouldPrint('info')) console.log(fmt('info', scope, msg)); },
  warn: (scope, msg) => { if (shouldPrint('warn')) console.warn(fmt('warn', scope, msg)); },
  error: (scope, msg) => { if (shouldPrint('error')) console.error(fmt('error', scope, msg)); },
  success: (scope, msg) => console.log(fmt('success', scope, msg)),
  start: (scope, msg) => console.log(fmt('start', scope, msg)),
  banner: (title, lines = []) => {
    const t = ` ${title} `;
    const width = Math.max(44, t.length + 4, ...lines.map(l => l.length + 4));
    const top = `${COLORS.bold}${COLORS.blue}${'┌' + '─'.repeat(width-2) + '┐'}${COLORS.reset}`;
    const bottom = `${COLORS.bold}${COLORS.blue}${'└' + '─'.repeat(width-2) + '┘'}${COLORS.reset}`;
    const center = (s) => {
      const space = width - 2 - s.length;
      const left = Math.floor(space/2);
      const right = space - left;
      return `│${' '.repeat(left)}${s}${' '.repeat(right)}│`;
    };
    console.log(top);
    console.log(center(`${COLORS.bold}${title}${COLORS.reset}`));
    if (lines.length) {
      console.log(`${'│'}${' '.repeat(width-2)}│`);
      for (const l of lines) console.log(center(l));
    }
    console.log(bottom);
  }
};

const fs = require('fs');

const path = '.env.local';
if (!fs.existsSync(path)) {
  console.log('MISSING_ENV_LOCAL');
  process.exit(1);
}

const raw = fs.readFileSync(path, 'utf8');
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i <= 0) continue;
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[t.slice(0, i).trim()] = v;
}

function mask(v) {
  if (!v) return '(vacío)';
  if (v.length <= 8) return '***';
  return `${v.slice(0, 6)}…${v.slice(-4)} (len=${v.length})`;
}

let fails = 0;
function check(key, pred, hint) {
  const v = env[key];
  const ok = !!v && pred(v);
  console.log(`${ok ? 'OK' : 'FAIL'} | ${key} | ${mask(v)}${ok ? '' : ' | ' + hint}`);
  if (!ok) fails += 1;
  return ok;
}

check(
  'NEXT_PUBLIC_SUPABASE_URL',
  (v) => v.startsWith('https://') && v.includes('supabase'),
  'debe ser https://xxx.supabase.co',
);
check('NEXT_PUBLIC_SUPABASE_ANON_KEY', (v) => v.length > 20, 'anon key corta o vacía');
check(
  'SUPABASE_SERVICE_ROLE_KEY',
  (v) => v.length > 20 && v !== env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'service_role distinta de anon',
);
check('NEXT_PUBLIC_MAPBOX_TOKEN', (v) => v.startsWith('pk.'), 'debe ser pk.');

const sk = env.MAPBOX_SECRET_TOKEN;
if (!sk) console.log('WARN | MAPBOX_SECRET_TOKEN | vacío (opcional)');
else if (sk.startsWith('pk.')) {
  console.log('FAIL | MAPBOX_SECRET_TOKEN | es pk. (debe ser sk.)');
  fails += 1;
} else if (sk.startsWith('sk.')) console.log(`OK | MAPBOX_SECRET_TOKEN | ${mask(sk)}`);
else console.log(`WARN | MAPBOX_SECRET_TOKEN | formato raro | ${mask(sk)}`);

const urls = [
  'NEXT_PUBLIC_ADMIN_URL',
  'NEXT_PUBLIC_MERCHANT_URL',
  'NEXT_PUBLIC_DRIVER_URL',
  'NEXT_PUBLIC_CUSTOMER_TRACKING_URL',
];
for (const k of urls) {
  const v = env[k];
  if (!v) console.log(`WARN | ${k} | no definido`);
  else
    console.log(
      `${v.includes('vercel.app') || v.includes('localhost') ? 'OK' : 'WARN'} | ${k} | ${v}`,
    );
}

console.log(`SUMMARY_FAILS=${fails}`);
process.exit(fails > 0 ? 1 : 0);

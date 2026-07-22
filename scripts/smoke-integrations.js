const fs = require('fs');

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
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
  return env;
}

async function main() {
  const env = loadEnv();
  const results = [];

  // Supabase Auth health
  try {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`;
    const res = await fetch(url, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    });
    const text = await res.text();
    results.push({
      name: 'Supabase Auth /health',
      ok: res.ok,
      detail: `${res.status} ${text.slice(0, 120)}`,
    });
  } catch (e) {
    results.push({ name: 'Supabase Auth /health', ok: false, detail: String(e.message || e) });
  }

  // Supabase REST (feature_flags) with anon
  try {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/feature_flags?select=key,enabled&limit=5`;
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    results.push({
      name: 'Supabase REST feature_flags',
      ok: res.ok && Array.isArray(parsed),
      detail: res.ok
        ? `OK ${Array.isArray(parsed) ? parsed.length + ' filas' : text.slice(0, 80)}`
        : `${res.status} ${text.slice(0, 160)}`,
    });
  } catch (e) {
    results.push({
      name: 'Supabase REST feature_flags',
      ok: false,
      detail: String(e.message || e),
    });
  }

  // RPC get_public_tracking (anon) smoke
  try {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_public_tracking`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_token: 'token_inexistente_fase12_test_xx' }),
    });
    const json = await res.json();
    const row = Array.isArray(json) ? json[0] : json;
    const ok =
      res.ok &&
      row &&
      row.valid === false &&
      (row.error_code === 'not_found' || row.error_code === 'invalid');
    results.push({
      name: 'RPC get_public_tracking (anon)',
      ok,
      detail: res.ok
        ? `valid=${row?.valid} error_code=${row?.error_code}`
        : `${res.status} ${JSON.stringify(json).slice(0, 160)}`,
    });
  } catch (e) {
    results.push({
      name: 'RPC get_public_tracking (anon)',
      ok: false,
      detail: String(e.message || e),
    });
  }

  // RPC get_platform_health existence via OpenAPI or call expecting auth error
  try {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/register_delivery_evidence`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_delivery_request_id: '00000000-0000-4000-8000-000000000001',
        p_storage_path: 'x/y.jpg',
      }),
    });
    const text = await res.text();
    // Expect function exists: not 404; likely 401/400/PGRST
    const exists = res.status !== 404;
    results.push({
      name: 'RPC register_delivery_evidence existe (Fase 17)',
      ok: exists,
      detail: `${res.status} ${text.slice(0, 140)}`,
    });
  } catch (e) {
    results.push({
      name: 'RPC register_delivery_evidence existe (Fase 17)',
      ok: false,
      detail: String(e.message || e),
    });
  }

  // Mapbox token
  try {
    const token = env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/Santiago.json?access_token=${token}&limit=1`;
    const res = await fetch(url);
    const json = await res.json();
    const ok = res.ok && Array.isArray(json.features);
    results.push({
      name: 'Mapbox Geocoding (pk.)',
      ok,
      detail: ok
        ? `features=${json.features.length} place=${json.features[0]?.place_name?.slice(0, 60) || ''}`
        : `${res.status} ${JSON.stringify(json).slice(0, 160)}`,
    });
  } catch (e) {
    results.push({ name: 'Mapbox Geocoding (pk.)', ok: false, detail: String(e.message || e) });
  }

  // Vercel health URLs
  const vercelKeys = [
    'NEXT_PUBLIC_ADMIN_URL',
    'NEXT_PUBLIC_MERCHANT_URL',
    'NEXT_PUBLIC_DRIVER_URL',
    'NEXT_PUBLIC_CUSTOMER_TRACKING_URL',
  ];
  for (const key of vercelKeys) {
    const base = (env[key] || '').replace(/\/$/, '');
    if (!base || base.includes('localhost')) {
      results.push({
        name: `Health ${key}`,
        ok: false,
        detail: base ? `localhost (${base}) — no es Vercel prod` : 'URL no definida en .env.local',
      });
      continue;
    }
    try {
      const res = await fetch(`${base}/api/health`, { redirect: 'follow' });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      const ok = res.ok && json && json.ok === true;
      results.push({
        name: `Health ${key}`,
        ok,
        detail: ok
          ? `app=${json.app} at=${json.at}`
          : `${res.status} ${text.slice(0, 120)}`,
      });
    } catch (e) {
      results.push({ name: `Health ${key}`, ok: false, detail: String(e.message || e) });
    }
  }

  let fails = 0;
  for (const r of results) {
    console.log(`${r.ok ? 'OK' : 'FAIL'} | ${r.name} | ${r.detail}`);
    if (!r.ok) fails += 1;
  }
  console.log(`SUMMARY_FAILS=${fails}`);
  process.exit(fails > 0 ? 1 : 0);
}

main();

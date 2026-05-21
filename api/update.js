const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY || 'workzap2026';

async function kv(cmd) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  return r.json();
}

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const j = await r.json();
  return j.result;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { id, status, notes } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });

    const raw = await kvGet(`lead:${id}`);
    if (!raw) return res.status(404).json({ error: 'Lead not found' });

    const lead = JSON.parse(raw);
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    if (notes !== undefined) lead.adminNotes = notes;

    await kv(['SET', `lead:${id}`, JSON.stringify(lead)]);
    return res.status(200).json({ success: true, lead });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

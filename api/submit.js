const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(cmd) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  return r.json();
}

async function kvPipe(cmds) {
  const r = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  return r.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const b = req.body;
    if (!b.name || !b.company || !b.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const lead = {
      id,
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name:         b.name        || '',
      company:      b.company     || '',
      email:        b.email       || '',
      phone:        b.phone       || '',
      city:         b.city        || '',
      industry:     b.industry    || '',
      depts:        b.depts       || '',
      departments:  b.departments || [],
      currentSetup: b.currentSetup|| '',
      timeline:     b.timeline    || '',
      product:      b.product     || 'Workzap Core',
      notes:        b.notes       || ''
    };

    await kvPipe([
      ['SET', `lead:${id}`, JSON.stringify(lead)],
      ['LPUSH', 'leads:index', id]
    ]);

    return res.status(200).json({ success: true, id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

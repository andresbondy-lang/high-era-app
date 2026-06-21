// /api/storage.js
// Función serverless de Vercel que actúa de intermediario seguro entre la app y Upstash Redis.
// Usa las variables de entorno KV_REST_API_URL y KV_REST_API_TOKEN que Vercel inyecta
// automáticamente cuando conectás la integración de Upstash desde el dashboard.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const baseUrl = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!baseUrl || !token) {
    return res.status(500).json({
      error: "Base de datos no configurada. Falta conectar la integración de Upstash en Vercel.",
    });
  }

  const upstashFetch = async (path, options = {}) => {
    const r = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    return r.json();
  };

  try {
    if (req.method === "GET") {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: "Falta 'key'" });
      const data = await upstashFetch(`/get/${encodeURIComponent(key)}`);
      return res.status(200).json({ key, value: data.result ?? null });
    }

    if (req.method === "POST") {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: "Falta 'key'" });
      await upstashFetch(`/set/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      return res.status(200).json({ key, value });
    }

    if (req.method === "DELETE") {
      const { key } = req.body || {};
      if (!key) return res.status(400).json({ error: "Falta 'key'" });
      await upstashFetch(`/del/${encodeURIComponent(key)}`, { method: "POST" });
      return res.status(200).json({ key, deleted: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

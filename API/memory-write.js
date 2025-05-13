import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { topic, data } = req.body;

  if (!topic || !data) {
    return res.status(400).json({ error: 'Missing topic or data' });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: `${topic} ${JSON.stringify(data)}`
    })
  });

  const openaiJson = await openaiRes.json();
  const embedding = openaiJson.data?.[0]?.embedding;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { error } = await supabase.from("memory_log").insert({
    topic,
    data,
    embedding,
    version: 1,
    is_active: true
  });

  if (error) {
    return res.status(500).json({ success: false, error });
  }

  res.json({ success: true });
}

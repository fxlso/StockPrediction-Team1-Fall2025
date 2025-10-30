const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getArticles(symbol) {
  const r = await fetch(`${API}/articles/findSentiments/${encodeURIComponent(symbol)}`);
  if (!r.ok) throw new Error('articles ' + r.status);
  return r.json();
}

export async function getSummary(symbol) {
  const r = await fetch(`${API}/sentiments/summary?symbol=${encodeURIComponent(symbol)}`);
  if (!r.ok) throw new Error('summary ' + r.status);
  return r.json();
}
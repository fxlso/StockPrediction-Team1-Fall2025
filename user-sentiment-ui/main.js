// Point this to your backend (when you’re ready)
const API = "http://localhost:3000";

// --- UI wiring ---
const btn = document.getElementById("loadButton");  // matches your HTML
btn.addEventListener("click", () => {
  const sym = document.getElementById("tickerInput").value.trim().toUpperCase();
  if (!sym) return setStatus("Enter a symbol, e.g., AAPL");
  loadAll(sym);
});

function setStatus(msg) { document.getElementById("status").textContent = msg; }
function fmt(n) { return (n == null) ? "-" : Number(n).toFixed(2); }

// --- Renderers ---
function renderSummary(s) {
  document.getElementById("latestScore").textContent = fmt(s.latest);
  document.getElementById("avg7").textContent = fmt(s.avg7d);
  document.getElementById("avg30").textContent = fmt(s.avg30d);
  document.getElementById("label").textContent = s.label ?? "-";
}

function renderArticles(list) {
  const c = document.getElementById("articles");
  c.innerHTML = "";
  list.forEach(a => {
    const el = document.createElement("div");
    el.className = "article";
    const lbl = a.ticker_sentiment_label || a.overall_sentiment_label || "";
    const score = a.ticker_sentiment_score ?? a.overall_sentiment_score ?? null;
    el.innerHTML = `
      <a href="${a.url}" target="_blank" rel="noopener">${a.title}</a>
      <div class="meta">${a.source_domain ?? ""} · ${a.published_at ? new Date(a.published_at).toLocaleString() : ""}</div>
      <div>Sentiment: <strong>${lbl || "n/a"}</strong>${score != null ? ` (${score.toFixed(2)})` : ""}</div>
    `;
    c.appendChild(el);
  });
}

// simple canvas line chart
function renderChart(points) {
  const ctx = document.getElementById("chart").getContext("2d");
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0,0,w,h);
  if (!points || !points.length) { ctx.fillStyle="#666"; ctx.fillText("No data",10,20); return; }

  const xs = points.map(p => new Date(p.date).getTime());
  const ys = points.map(p => Number(p.score));
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const pad = 24;

  // axes
  ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, h-pad); ctx.lineTo(w-pad, h-pad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad, pad);   ctx.lineTo(pad,   h-pad); ctx.stroke();

  // line
  ctx.strokeStyle = "#1f77b4"; ctx.lineWidth = 2; ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad + ((new Date(p.date).getTime() - xmin) / (xmax - xmin || 1)) * (w - 2*pad);
    const y = h - pad - ((Number(p.score) - ymin) / (ymax - ymin || 1)) * (h - 2*pad);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Mock data for now
async function loadAll(symbol) {
  renderSummary({ symbol, latest: 0.25, avg7d: 0.20, avg30d: 0.10, label: "Positive" });
  renderChart([
    { date: "2025-10-01", score: 0.10 },
    { date: "2025-10-02", score: 0.25 },
    { date: "2025-10-03", score: 0.18 }
  ]);
  renderArticles([
    { title: `${symbol} stock rises on strong earnings`, url: "#",
      source_domain: "example.com", overall_sentiment_label: "Positive",
      overall_sentiment_score: 0.80, published_at: new Date().toISOString() }
  ]);
  setStatus(`Loaded mock data for ${symbol}`);
}

// Auto-demo
loadAll("AAPL").catch(() => {});
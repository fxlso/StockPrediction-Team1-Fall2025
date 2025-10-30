import React, { useState } from "react";
import { getArticles, getSummary } from "./api";

function App() {
  const [symbol, setSymbol] = useState("");
  const [articles, setArticles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");

  async function loadData() {
    setStatus("Loading...");
    try {
      const [sum, art] = await Promise.all([
        getSummary(symbol),
        getArticles(symbol)
      ]);
      setSummary(sum);
      setArticles(art);
      setStatus("Loaded successfully!");
    } catch {
      setStatus("Error loading data.");
    }
  }

  return (
    <div className="App">
      <h1>Stock Sentiment Dashboard</h1>
      <input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="AAPL"
      />
      <button onClick={loadData}>Load</button>
      <p>{status}</p>

      {summary && (
        <div>
          <p>Latest: {summary.latest}</p>
          <p>7-day avg: {summary.avg7d}</p>
          <p>30-day avg: {summary.avg30d}</p>
          <p>Label: {summary.label}</p>
        </div>
      )}

      <ul>
        {articles.map((a) => (
          <li key={a.article_id}>
            <a href={a.url} target="_blank" rel="noreferrer">
              {a.title}
            </a>{" "}
            ({a.overall_sentiment_label})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

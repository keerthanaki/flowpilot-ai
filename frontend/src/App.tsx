import { useEffect, useState } from "react";

const API = "http://localhost:8000";

type RequestItem = {
  id: string;
  raw_text: string;
  status: string;
  created_at: string;
};

function App() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<RequestItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadRequests() {
    try {
      const res = await fetch(`${API}/requests`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setError("Could not load requests. Is the backend running?");
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text }),
      });
      if (!res.ok) {
        setError("Request must be between 10 and 5000 characters.");
        return;
      }
      setText("");
      await loadRequests();
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>FlowPilot AI</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          rows={5}
          style={{ width: "100%", padding: 8 }}
          placeholder="Describe a business request..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Submitting..." : "Submit request"}
        </button>
      </form>

      {error && <p style={{ color: "tomato" }}>{error}</p>}

      <h2>Submitted requests</h2>
      {items.length === 0 && <p>No requests yet.</p>}
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {items.map((r) => (
          <li key={r.id} style={{ border: "1px solid #444", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div>{r.raw_text}</div>
            <small>
              {r.status} · {new Date(r.created_at).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

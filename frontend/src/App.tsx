import { useEffect, useState } from "react";
import ExtractionPanel from "./ExtractionPanel";

const API = "http://localhost:8000";

type RequestItem = {
  id: string;
  raw_text: string;
  status: string;
  created_at: string;
  extracted: Record<string, string | number | null> | null;
  missing_fields: string[] | null;
};

type TaskItem = {
  id: string;
  request_id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done";
};

function TaskSection({ requestId }: { requestId: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      const res = await fetch(`${API}/requests/${requestId}/tasks`);
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      setError("Could not load tasks.");
    }
  }

  useEffect(() => {
    loadTasks();
  }, [requestId]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API}/requests/${requestId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        setError("Task title must be 3 to 200 characters.");
        return;
      }
      setTitle("");
      await loadTasks();
    } catch {
      setError("Could not reach the backend.");
    }
  }

  async function setStatus(taskId: string, status: string) {
    try {
      const res = await fetch(`${API}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await loadTasks();
    } catch {
      setError("Could not update the task.");
    }
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #333" }}>
      <strong>Tasks</strong>
      {tasks.length === 0 && <p style={{ margin: "4px 0" }}>No tasks yet.</p>}
      {tasks.map((t) => (
        <div key={t.id} style={{ margin: "6px 0" }}>
          <span style={{ textDecoration: t.status === "done" ? "line-through" : "none" }}>
            {t.title}
          </span>{" "}
          <small>({t.status})</small>{" "}
          {t.status !== "in_progress" && t.status !== "done" && (
            <button onClick={() => setStatus(t.id, "in_progress")}>Start</button>
          )}{" "}
          {t.status !== "done" && (
            <button onClick={() => setStatus(t.id, "done")}>Mark done</button>
          )}
        </div>
      ))}
      <form onSubmit={addTask} style={{ marginTop: 8 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
          style={{ padding: 4, width: "60%" }}
        />{" "}
        <button type="submit">Add task</button>
      </form>
      {error && <p style={{ color: "tomato", margin: "4px 0" }}>{error}</p>}
    </div>
  );
}

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
            <ExtractionPanel
              requestId={r.id}
              extracted={r.extracted}
              missingFields={r.missing_fields}
              onDone={loadRequests}
            />
            <TaskSection requestId={r.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;


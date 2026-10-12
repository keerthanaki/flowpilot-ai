import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("backend unreachable"));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>FlowPilot AI</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;
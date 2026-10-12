import { useState } from "react";

const API = "http://localhost:8000";

const FIELDS = [
  { key: "request_type", label: "Request type" },
  { key: "customer_name", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "quantity", label: "Quantity" },
  { key: "delivery_date", label: "Delivery date" },
  { key: "customer_contact", label: "Contact" },
];

type Props = {
  requestId: string;
  extracted: Record<string, string | number | null> | null;
  missingFields: string[] | null;
  onDone: () => void | Promise<void>;
};

export default function ExtractionPanel({ requestId, extracted, missingFields, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/requests/${requestId}/extract`, { method: "POST" });
      if (!res.ok) {
        setError("Extraction failed. Please try again.");
        return;
      }
      await onDone();
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  const found = extracted ? FIELDS.filter((f) => extracted[f.key] != null) : [];
  const missing = (missingFields ?? []).map(
    (key) => FIELDS.find((f) => f.key === key)?.label ?? key
  );

  return (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #333" }}>
      <button onClick={run} disabled={loading}>
        {loading ? "Extracting..." : extracted ? "Re-run extraction" : "Run extraction"}
      </button>
      {error && <p style={{ color: "tomato", margin: "4px 0" }}>{error}</p>}

      {extracted && (
        <div style={{ marginTop: 8 }}>
          <strong>Found in the request</strong>
          {found.length === 0 && <p style={{ margin: "4px 0" }}>Nothing found.</p>}
          <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
            {found.map((f) => (
              <li key={f.key}>
                {f.label}: {String(extracted[f.key])}
              </li>
            ))}
          </ul>

          <strong style={{ color: "orange" }}>Missing details</strong>
          {missing.length === 0 ? (
            <p style={{ margin: "4px 0" }}>Nothing missing.</p>
          ) : (
            <ul style={{ margin: "4px 0", paddingLeft: 20, color: "orange" }}>
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

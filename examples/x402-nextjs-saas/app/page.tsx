export default function Home() {
  return (
    <div>
      <h2>Paid API Endpoints</h2>
      <ul style={{ lineHeight: 2.5 }}>
        <li><a href="/api/weather" style={{ color: "#60a5fa" }}>/api/weather</a> — $0.01 per request</li>
        <li><a href="/api/summarize" style={{ color: "#60a5fa" }}>/api/summarize</a> — $0.05 per request</li>
        <li><a href="/api/translate" style={{ color: "#60a5fa" }}>/api/translate</a> — $0.03 per request</li>
      </ul>
      <p style={{ color: "#71717a", marginTop: 40 }}>
        These endpoints accept x402 payments. All transactions
        are tracked by Sentinel with full audit trails.
      </p>
    </div>
  );
}

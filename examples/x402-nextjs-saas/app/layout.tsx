export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: "system-ui",
        background: "#09090b",
        color: "#fafafa",
        maxWidth: 800,
        margin: "0 auto",
        padding: "40px 20px",
      }}>
        <h1>x402 SaaS Demo</h1>
        <p style={{ color: "#71717a", marginBottom: 40 }}>
          Every payment tracked by <a href="https://sentinel.valeocash.com" style={{ color: "#8b5cf6" }}>Sentinel</a>
        </p>
        {children}
      </body>
    </html>
  );
}

import { Link, Outlet } from "react-router-dom";

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="dot" /> Irminsul
        </Link>
        <span className="tagline">"Changing the information in Irminsul changes Teyvat. But Irminsul can't change information that was well hidden in advance."</span>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        "Changing the information in Irminsul changes Teyvat. But Irminsul can't change information that was well hidden in advance."
        <br/>
        Files are AES-256-GCM encrypted in your browser. The server never sees plaintext.
      </footer>
    </div>
  );
}

import { useState } from "react";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("🟢 Enviando login...");

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.error || "Erro desconhecido no login");
      }

      const data = await res.json();
      console.log("✅ Login bem-sucedido:", data);

      // Salva token e redireciona
      localStorage.setItem("token", data.token);
      if (setToken) setToken(data.token);
      window.location.href = "/"; // Redireciona para dashboard

    } catch (err) {
      console.error("❌ Falha no login:", err.message);
      setError("Falha ao fazer login. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Login</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "inline-block",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          textAlign: "left",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "8px", width: "250px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: "8px", width: "250px" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

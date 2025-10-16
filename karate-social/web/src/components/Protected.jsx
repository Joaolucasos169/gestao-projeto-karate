import { getToken } from '../api'

export default function Protected({ children }) {
  if (!getToken()) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Faça login para continuar</h2>
        <a href="#/login">Ir para Login</a>
      </div>
    )
  }
  return children
}

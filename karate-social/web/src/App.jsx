import Protected from './components/Protected'
import Login from './pages/Login'
import Students from './pages/Students'
import { getToken } from './api'

function Router() {
  const route = location.hash.slice(1) || '/'

  // rota de login
  if (route.startsWith('/login')) {
    return <Login />
  }

  // se não tiver token, volta pro login
  if (!getToken()) {
    location.hash = '/login'
    return <div>Redirecionando...</div>
  }

  // rota principal
  return (
    <Protected>
      <div className="container">
        <header className="nav">
          <h1>🏯 Karate Social</h1>
          <nav>
            <a href="#/">Alunos</a>
            <button
              onClick={() => {
                localStorage.removeItem('token')
                location.hash = '/login'
              }}
            >
              Sair
            </button>
          </nav>
        </header>
        <Students />
      </div>
    </Protected>
  )
}

export default function App() {
  return <Router />
}

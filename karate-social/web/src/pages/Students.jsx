import { useEffect, useState } from 'react'
import { api } from '../api'
import StudentForm from '../components/StudentForm'

export default function Students(){
  const [list, setList] = useState([])
  const [error, setError] = useState('')

  async function load(){
    try {
      setList(await api('/students', { auth: true }))
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  async function onCreate(data){
    await api('/students', { method:'POST', body:data, auth:true })
    load()
  }

  return (
    <div className="container">
      <h2>Alunos</h2>
      <StudentForm onSubmit={onCreate} />
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {list.map(s => (
          <li key={s.id} className="card">{s.name} — {s.belt}</li>
        ))}
      </ul>
    </div>
  )
}

import { useState } from 'react'

export default function StudentForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [belt, setBelt] = useState('white')
  return (
    <form onSubmit={e=>{e.preventDefault(); onSubmit({name, belt}); setName('')}} className="card">
      <h3>Novo aluno</h3>
      <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
      <select value={belt} onChange={e=>setBelt(e.target.value)}>
        <option value="white">Branca</option>
        <option value="yellow">Amarela</option>
        <option value="orange">Laranja</option>
        <option value="green">Verde</option>
        <option value="blue">Azul</option>
        <option value="brown">Marrom</option>
      </select>
      <button type="submit">Salvar</button>
    </form>
  )
}

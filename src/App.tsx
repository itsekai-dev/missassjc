import { useEffect, useMemo, useState } from 'react'
import './index.css'
import './App.css'

const diasBR = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const diasMap: Record<string,string> = { Domingo:'Domingo', 'Segunda':'Segunda', 'Terça':'Terca', 'Quarta':'Quarta', 'Quinta':'Quinta', 'Sexta':'Sexta', 'Sábado':'Sabado' }

const API_BASE = import.meta.env.VITE_API_BASE || ''

function nowDefaults(){
  const now = new Date()
  return { dia: diasBR[now.getDay()], hora: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}` }
}

type Resultado = { nome: string; bairro: string; cidade: string; inicio: string; address?: string; mapsUrl?: string }

export default function App() {
  const defaults = useMemo(nowDefaults, [])
  const [dia, setDia] = useState<string>(defaults.dia)
  const [hora, setHora] = useState<string>(defaults.hora)
  const [ctx, setCtx] = useState<string>('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [carregando, setCarregando] = useState<boolean>(false)

  async function buscarJanela() {
    if (!hora) return
    setCarregando(true)
    try {
      const resp = await fetch(`${API_BASE}/api/buscar-janela`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dia: diasMap[dia] || dia, horarioInicio: hora })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha')
      setCtx(`${dia} a partir de ${data.horarioBase}`)
      setResultados(data.resultados)
    } catch (e) {
      console.error(e)
      setResultados([])
      setCtx('')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    // Carrega com base no horário local do usuário, para evitar problemas de fuso no servidor
    buscarJanela()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>Horário de Missas – Diocese SJC</h1>
          <p>Busque missas com janela de +1h e fallback para o próximo horário disponível.</p>
        </div>
      </header>

      <section className="card container">
        <div className="grid">
          <div>
            <label>Dia</label>
            <select value={dia} onChange={(e)=>setDia(e.target.value)}>
              {diasBR.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label>Horário inicial</label>
            <input type="time" step={900} value={hora} onChange={(e)=>setHora(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{marginTop:12}}>
          <button onClick={buscarJanela} disabled={carregando}>Buscar</button>
          {carregando && <span className="muted">Buscando…</span>}
        </div>
      </section>

      <section className="card container">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0}}>Resultados</h2>
          <span className="pill">{ctx}</span>
        </div>
        <div className="table-wrap">
          {resultados.length === 0 ? (
            <p className="muted">Nenhuma missa encontrada no período. Se existir, mostraremos o próximo horário disponível.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome da Unidade</th>
                  <th>Bairro</th>
                  <th>Cidade</th>
                  <th>Início</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((it, i) => (
                  <tr key={`${it.nome}-${it.inicio}-${i}`}>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        <strong>{it.nome}</strong>
                        {it.address && (
                          <a href={it.mapsUrl} target="_blank" rel="noreferrer" className="muted" style={{textDecoration:'underline'}}>
                            {it.address}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>{it.bairro}</td>
                    <td>{it.cidade}</td>
                    <td><strong>{it.inicio}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Horário de Missas – Diocese SJC (não-oficial)</p>
        </div>
      </footer>
    </div>
  )
}

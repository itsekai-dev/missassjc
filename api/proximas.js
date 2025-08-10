import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'

const REMOTE_ENDPOINT = 'https://diocese-sjc.org.br/wp-content/plugins/hmissa/actions.php'

function setCors(res) { res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization') }
function parseHtmlTable(html){ const $=cheerioLoad(html); const items=[]; $('table.resultados tbody tr').each((_,el)=>{ const t=$(el).find('td'); if(t.length>=4){ const nome=$(t[0]).text().trim().replace(/\s+/g,' '); const bairro=$(t[1]).text().trim().replace(/\s+/g,' '); const cidade=$(t[2]).text().trim().replace(/\s+/g,' '); const inicio=$(t[3]).text().trim(); items.push({nome,bairro,cidade,inicio}) } }); return items }
function toMinutes(hhmm){ const [hh,mm]=hhmm.split(':').map(Number); return hh*60+mm }
function fromMinutes(total){ const hh=String(Math.floor(total/60)).padStart(2,'0'); const mm=String(total%60).padStart(2,'0'); return `${hh}:${mm}` }
function generateSlots(hhmmStart,span,step){ const s=toMinutes(hhmmStart); const e=Math.min(s+span,23*60+59); const xs=[]; for(let t=s;t<=e;t+=step) xs.push(fromMinutes(t)); return xs }
function normalizeTimeLabel(label){ return /^\d{2}h\d{2}$/.test(label) ? label.replace('h',':') : label }
async function fetchItemsForDayTime(dia, hhmm){ const p=new URLSearchParams(); p.append('dia[]',dia); if(hhmm) p.append('HorarioInicio',hhmm); const {data:html}=await axios.post(REMOTE_ENDPOINT,p); return parseHtmlTable(html).map(it=>({...it,inicio:normalizeTimeLabel(it.inicio)})) }

export default async function handler(req,res){
  setCors(res); if (req.method==='OPTIONS') return res.status(200).end(); if (req.method!=='GET') return res.status(405).json({error:'Método não permitido'})
  try{
    // Use timezone America/Sao_Paulo para evitar drift de fuso no ambiente da Vercel
    const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false, weekday: 'long', hour: '2-digit', minute: '2-digit' })
    const parts = fmt.formatToParts(new Date())
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
    const weekday = (map.weekday || '').toLowerCase()
    const diasPt=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
    const diasApi=['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado']
    const idx = diasPt.findIndex(d => weekday.startsWith(d))
    const dia = idx >= 0 ? diasApi[idx] : 'Domingo'
    const horarioInicio = `${map.hour || '00'}:${map.minute || '00'}`
    const slots=generateSlots(horarioInicio,60,15); const aggregated=[]; const seen=new Set();
    for(const t of slots){ const list=await fetchItemsForDayTime(dia,t); for(const it of list){ const key=`${it.nome}||${it.bairro}||${it.cidade}||${it.inicio}`; if(!seen.has(key)){ seen.add(key); aggregated.push(it) } } }
    let resultados=aggregated
    if(resultados.length===0){ let found=[]; const start=toMinutes(horarioInicio)+15; const max=Math.min(start+15*16,23*60+45); for(let m=start;m<=max;m+=15){ const t=fromMinutes(m); const next=await fetchItemsForDayTime(dia,t); if(next.length>0){ found=next; break } } resultados=found }
    return res.status(200).json({ ok:true, dia, horarioBase:horarioInicio, resultados })
  }catch(err){ return res.status(500).json({ error:'Falha ao obter próximas missas.', detail:String(err) }) }
}



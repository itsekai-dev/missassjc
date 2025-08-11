# MissasSJC (site não-oficial)

Frontend moderno (React + Vite + TypeScript) e funções serverless (Vercel) para melhorar a busca por horários de missas da Diocese de São José dos Campos.

## Sobre
- Busca Missas em uma Janela de +1h a partir do horário selecionado ao invés de apenas no horário especificado
- Fallback automático: se não houver missas na próxima hora, buscamos o próximo horário disponível do dia (limite de 4h)

## Estrutura
- `src/`: aplicativo React (Vite)
- `api/`: funções serverless Vercel
  - `POST /api/buscar-janela` → body `{ dia: 'Domingo|Segunda|...|Sabado', horarioInicio: 'HH:MM' }`
  - `GET /api/proximas` → próximas missas considerando data/hora atual
- `vercel.json`: rotas e headers CORS para `/api/*`

Origem dos dados: `https://diocese-sjc.org.br/wp-content/plugins/hmissa/actions.php` (HTML parseado via `cheerio`).

## Rodar localmente
1) Instalar deps: `npm i`
2) Dev server: `npm run dev`
3) Abrir: `http://localhost:5173`

Obs.: por padrão o frontend chama a API relativa (`/api/...`). Se precisar, use `VITE_API_BASE` para apontar outra origem.

Para o mapa do Google, crie `.env` com:
```
VITE_GOOGLE_MAPS_API_KEY=SEU_API_KEY
```

## Avisos
- Projeto não-oficial, sem vínculo com a Diocese.
- As funções serverless fazem scraping do HTML público do site da Diocese e retornam JSON para o frontend.

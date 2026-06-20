#3 CausalFunnel Analytics — User Behavior Tracking & Dashboard

A small full-stack app that tracks `page_view` and `click` events on a demo
e-commerce site and visualizes them in a dashboard: a session/journey
explorer and a click heatmap.card/    React dashboard (Sessions view + Heatmap view)
```

#3 Tech stack

Dashboard - React(vite), Plain CSS
Backend - Node.js, Express
Database - MongoDB, Mongoose

Heatmap viz  - Inline SVG, no charting library 

## Setup steps

### Prerequisites
- Node.js 18+ and npm
- A running MongoDB instance — either local (`mongod` on `localhost:27017`)

### 1. Backend

```bash
cd backend
npm install
.env
# edit .env 
npm run dev     
```

The API starts on `http://localhost:4000` by default. Check `http://localhost:4000/health`
for a quick liveness check.

### 2. Demo store (the tracked website)

The demo is static HTML — no build step. Serve it with any static file
server (it can't be opened via `file://` because the relative tracker path
and the API call both expect a real origin):

cd demo
npx serve -p 5500
# now open http://localhost:5500


Click around between Home → Product → Checkout. Every `page_view` and
`click` fires off to the backend (see `demo/index.html`'s `<script src="../tracker/tracker.js" ...>`
tag — that's the entire integration).

### 3. Dashboard

cd dashboard
npm install
npm run dev
# open the printed http://localhost:5173 URL


# Restaurant visits dashboard

CS5200 Practicum I, Part H (Fall 2026) · Dhruv Sinha

A one-page analytics dashboard for the restaurant visits database. It reads live from the
Aiven MySQL database, and every number is calculated with SQL when the page loads.

- Key numbers: visits, revenue, tips, loyalty customers, average bill, average wait
- Revenue by month and totals per year
- Visits, revenue, food vs alcohol, and loyalty customers for each restaurant
- Food vs alcohol totals, meal types, and payment methods
- Filters by restaurant and year
- If the database can't be reached, the page says so and shows no data

Built with Next.js, React, TypeScript, Tailwind CSS, Recharts, and mysql2.

## How it works

`app/api/stats/route.ts` runs the SQL queries on the server and returns JSON.
`components/Dashboard.tsx` fetches that JSON and draws the page. The database password
stays on the server and is never sent to the browser.

## Environment variables

See `.env.example`. Locally, put the values in `.env.local` and place the Aiven
`ca.pem` in this folder. On Vercel, set the same variables in the project settings and
paste the contents of `ca.pem` into `DB_SSL_CA_CERT` instead.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## AI use

Claude (Anthropic) was used to build this dashboard.

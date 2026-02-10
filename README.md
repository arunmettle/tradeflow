## TradeFlow

Next.js (App Router) + TypeScript + Tailwind + Prisma + Supabase.

See full architecture: `ARCHITECTURE.md`

### Env
- Copy the right env before running: `npm run env:use:local` or `npm run env:use:prod` (creates `.env`).
- Required: `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`.
- Auth required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Optional: `NEXT_PUBLIC_APP_URL` (defaults to `http://localhost:3000`)

### Migrations
```bash
npx prisma migrate dev --name remove_templates
npx prisma generate
```

### App
- `/`: app intro (bento style) + CTA
- `/auth/sign-up`: email signup + Google OAuth
- `/auth/sign-in`: email signin + Google OAuth
- `/auth/callback`: auth callback landing
- `/quotes`: list
- `/quotes/new`: create quote manually
- `/quotes/[id]`: view; DRAFT shows edit link
- `/quotes/[id]/edit`: edit draft quote
- `/t/[slug]`: public lead form
- `/leads`: tradie leads dashboard
- `/q/[token]`: public quote view + accept/decline
- `/tradie`: single-tradie admin-lite settings
- `/profile`: account profile page

### Developer Quickstart Flow
1. Set env and install deps:
```bash
npm run env:use:local
npm install
```

2. Run migrations and generate Prisma client:
```bash
npx prisma migrate dev
npx prisma generate
```

3. Start app:
```bash
npm run dev
```

4. Set default tradie:
- Open `http://localhost:3000/tradie`
- Confirm/update slug and business name (for example: `demo`)

5. Submit a lead as customer:
- Open `http://localhost:3000/t/demo`
- Submit the lead form

6. Generate draft quote as tradie:
- Open `http://localhost:3000/leads`
- Click `Generate` on a lead
- You should be redirected to `/quotes/[id]/edit`

7. Edit quote and share:
- Update line items/rates/scope/terms
- Click `Create share link`
- Copy generated `/q/[token]` URL

8. Accept/decline as customer:
- Open the `/q/[token]` link
- Accept or decline
- Return to `/quotes/[id]/edit` to see conversation/state updates

Run locally:
```bash
npm install
npm run dev
```

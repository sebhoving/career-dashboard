# Applied Scientist track

A dashboard for a 2026 to 2028 transition into applied research work. It has
four tabs, one job each:

| Tab          | What it is for                                                                 |
| ------------ | ------------------------------------------------------------------------------ |
| **Plan**     | 28 ordered steps in five phases. Each says why, how, and when it counts as done. |
| **Today**    | Tasks for the day with time logging, and the next open steps from the plan.     |
| **Progress** | Plan steps, NeetCode 150, hours and commits. All of it comes from what you tick. |
| **Roadmap**  | The timeline of milestones, degree modules, and the application pipeline.       |

It starts empty. Nothing is solved, logged or applied for until you tick it.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables the app runs open,
and everything you tick is saved in the browser (localStorage). Use
**Reset saved progress** at the bottom of the Progress tab to start again.

### Connect a backend (optional)

1. Create a Supabase project.
2. Paste `supabase/schema.sql` into the SQL editor and run it. It creates the
   tables, the enums, the row level security policies and the realtime
   publication.
3. Copy `.env.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GITHUB_USERNAME=...     # switches the commit heatmap on
GITHUB_TOKEN=...        # classic PAT, read:user scope
```

4. Restart. Sign in is now enforced by `src/middleware.ts`, and the role in
   your `profiles` row decides what you can edit. Tasks, applications and
   problem solves go to Postgres; plan steps and logged time stay in the
   browser (the schema has no table for them yet).

Your first account is created as `VIEWER`. Promote it once, by hand:

```sql
update profiles set role = 'ADMIN' where name = 'your name';
```

The `dsa_problems` table starts empty. Until you insert the list, the
dashboard shows the built-in NeetCode 150 and refuses to save ticks against it.

## How it fits together

```
src/
  app/
    page.tsx              shell, rendered per request so today is today
    dashboard-view.tsx    the four tabs, owns the hydration hooks
    sign-in/              GitHub OAuth and email sign in
    auth/callback/        OAuth code exchange
    api/
      bootstrap/          one server side snapshot of every table
      github/             commit activity, cached one hour
      dsa-stats/          problem counts, cached one day
  components/
    ui/                   Panel, Button, DataTable, EmptyState and other primitives
    dashboard/            plan-view, tasks-panel, next-up, the charts, the tables
    providers/            toast queue
  lib/
    data/plan.ts          the ordered plan: phases, steps, how-to text
    data/neetcode.ts      the NeetCode 150 in teaching order
    data/seed.ts          the starting state: milestones, modules, nothing done
    data/repository.ts    row mapping, seed snapshot, live snapshot
    store.ts              Zustand state plus every derived selector
    hooks/                bootstrap, local persistence, realtime, task/problem/application writes
    rbac.ts               the permission table
  middleware.ts           session refresh and route gating
supabase/schema.sql       tables, RLS, realtime publication
```

### Decisions worth knowing

**The plan is data.** `src/lib/data/plan.ts` is a list of steps with
`why`, `how[]`, `doneWhen` and `resources`. Edit it like a document. Steps
link to milestones by id, and the roadmap derives milestone progress from
how many of its steps are ticked, so the two views cannot disagree.

**Progress is derived, never stored.** The KPIs and charts read
`dailySeries()` in `store.ts`, which merges the metrics table with what the
browser has logged: task time, problem ticks and GitHub commits. There is no
separate progress table to drift out of date.

**The browser is the database until Supabase is.** `useLocalPersistence`
saves tasks, applications, problem solves, plan ticks and time entries to
localStorage and restores them before the bootstrap fetch lands. With
Supabase configured only plan ticks and time entries stay local.

**Writes are optimistic with rollback.** Every action hook updates the store
first, then writes. A rejected write restores the previous row and raises a
toast rather than leaving the screen quietly wrong.

**Permissions are enforced twice.** `src/lib/rbac.ts` hides controls a
viewer cannot use. Postgres RLS rejects the write regardless.

**Charts downsample before they draw.** `downsample()` in `src/lib/utils.ts`
buckets a series to a point ceiling, so the ALL range draws weekly averages
rather than a thousand-segment path. Charts are hidden below 768px; the
roadmap falls back to a list there.

## What is not done

- **Plan steps and time entries have no table.** They live in localStorage
  in both modes. Adding `plan_progress` and `time_entries` to the schema and
  wiring them through the action hooks is the next backend step.
- **The `daily_metrics` table is never written to.** Everything the UI needs
  is derived on the client, so it only matters for a future nightly job.
- **No tests.** The plan and the problem list are deterministic, so snapshot
  tests over the selectors in `store.ts` are cheap to add.
- **No ESLint config.** `next lint` was removed in Next 16 and the repo has no
  `eslint.config.mjs`, so `npm run lint` does nothing useful yet.
- **LeetCode has no supported public API.** Problems are ticked by hand.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the build
npm run typecheck  # tsc --noEmit
```

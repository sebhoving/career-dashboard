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

Five steps. All but step 2 happen in the Supabase dashboard.

**1. Create the project.** At supabase.com, create a project and copy its URL
and publishable key (`sb_publishable_...`, or the legacy `anon` key) from
Project Settings, API Keys.

**2. Fill in `.env.local`:**

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable or anon key>
```

`SUPABASE_SERVICE_ROLE_KEY` is not used by any code path; leave it blank.
The GitHub variables are independent of Supabase and keep working either way.

**3. Run `supabase/schema.sql`** in the SQL editor. It creates the tables, the
enums, the RLS policies and the realtime publication. It is safe to run
again: anything that already exists is skipped. The one change it makes to an
existing table is on `modules`, where `credits` widens to hold ECTS halves and
`academic_year` is added.

It also creates a `profiles` row for any account that signed in before the
schema existed, and makes the oldest one `ADMIN`. So it does not matter
whether you sign in before or after this step.

**4. Allow the sign in redirect.** In Authentication, URL Configuration, set
the Site URL to `http://localhost:3000` and add
`http://localhost:3000/auth/callback` to Redirect URLs. Add your deployed
origin the same way when you deploy. Without it, GitHub sign in lands on the
Site URL instead of the callback and no session is created. Email accounts
have no sign up form; add them in Authentication, Users.

**5. Sign in, then run `supabase/seed.sql`.** The first account to sign
in is created `ADMIN` by the `handle_new_user` trigger, so it owns the
dashboard; everyone after it is a `VIEWER`. Nothing to promote by hand.

`seed.sql` loads the reference data: the 11 roadmap milestones, the 8 degree
modules confirmed for 2026-27 and the NeetCode 150, all unsolved. It seeds
`ADMIN` profiles only, raises a clear error if it finds none, and is
idempotent, so re-running it never disturbs work you have already ticked.
Modules carry no progress, so a re-run refreshes them to match the file.

Sign in is enforced by `src/middleware.ts`, and the role in your `profiles`
row decides what you can edit.

#### What moves to Postgres

Tasks, applications, plan step ticks, logged time and problem solves all get
tables and are written through on every change, optimistically with rollback.
Realtime is subscribed for tasks and applications; the other tables are in the
publication but the client does not listen to them yet.

Until `seed.sql` has run, the milestone, module and problem tables are empty
and the app falls back to the built-in lists so the page still renders. Ticking
a problem in that state is refused with an explanation rather than silently
failing, because there is no row to update.

Milestones carry a `key` column (`m1`...`m11`). The plan in
`src/lib/data/plan.ts` links to that key rather than the row's uuid, so
roadmap progress keeps working whatever id Postgres assigns.

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
    hooks/                bootstrap, local persistence, realtime, and the
                          task / plan / problem / application write paths
    rbac.ts               the permission table
  middleware.ts           session refresh and route gating
supabase/schema.sql       tables, RLS, realtime publication
supabase/seed.sql         reference data: milestones, modules, the 150
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
localStorage and restores them before the bootstrap fetch lands. With Supabase
configured it stands down completely: every one of those has a table, and the
bootstrap snapshot is the only source.

**Writes are optimistic with rollback.** Every action hook updates the store
first, then writes. A rejected write restores the previous row and raises a
toast rather than leaving the screen quietly wrong.

**Permissions are enforced twice.** `src/lib/rbac.ts` hides controls a
viewer cannot use. Postgres RLS rejects the write regardless. The client can
update only the `name` column of its own profile, so a viewer cannot promote
itself; roles are changed in the Supabase dashboard.

**Charts downsample before they draw.** `downsample()` in `src/lib/utils.ts`
buckets a series to a point ceiling, so the ALL range draws weekly averages
rather than a thousand-segment path. Charts are hidden below 768px; the
roadmap falls back to a list there.

## What is not done

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

# Putting Questly online

Questly runs on **Vercel** (the app) and **Supabase** (the database and email sign-in). Both have free tiers
that comfortably fit a personal Questly. Allow about 15 minutes.

You will collect four values along the way. Keep them in a note until Step 3:

| Value                    | Where it comes from |
| ------------------------ | ------------------- |
| `DATABASE_URL`           | Supabase → Connect  |
| `SUPABASE_URL`           | Supabase → API Keys |
| `SUPABASE_ANON_KEY`      | Supabase → API Keys |
| `QUESTLY_ALLOWED_EMAILS` | Your email address  |

---

## Step 1 — Create the Supabase project

1. Go to <https://supabase.com>, sign in (GitHub sign-in is easiest), and click **New project**.
2. Name it `questly`, pick the region closest to you, and click **Generate a password**. **Copy the database
   password now** — you need it in a moment and Supabase won't show it again.
3. Click **Create new project** and wait about a minute for it to finish.

### Get `DATABASE_URL`

4. Click the **Connect** button at the top of the project dashboard.
5. Under **Connection string**, choose **Transaction pooler** (port `6543`). Copy the URI. It looks like
   `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`.
6. Replace `[YOUR-PASSWORD]` (including the brackets) with the password from step 2. This is your
   `DATABASE_URL`.

### Get `SUPABASE_URL` and `SUPABASE_ANON_KEY`

7. Go to **Project Settings → API Keys** (and **Data API** for the URL, depending on your dashboard version).
8. Copy the **Project URL** (`https://abcdefgh.supabase.co`) → `SUPABASE_URL`.
9. Copy the **publishable** key (`sb_publishable_…`) or, on older dashboards, the **anon public** key →
   `SUPABASE_ANON_KEY`. Do **not** use the `service_role` / secret key.

> Questly enables Row Level Security on every table, so the publishable key cannot read or change your data
> through Supabase's API. Only Questly's own server connection can.

## Step 2 — Put it on Vercel

1. Go to <https://vercel.com>, sign in with GitHub, and click **Add New… → Project**.
2. Find `joshuamayo/questly` and click **Import**. (If it's not listed, click **Adjust GitHub App
   Permissions** and give Vercel access to the repository.)
3. Leave the framework (Next.js) and build settings as they are.
4. Open **Environment Variables** and add these four, one per row:

   | Name                     | Value                                   |
   | ------------------------ | --------------------------------------- |
   | `DATABASE_URL`           | from Step 1.6                           |
   | `SUPABASE_URL`           | from Step 1.8                           |
   | `SUPABASE_ANON_KEY`      | from Step 1.9                           |
   | `QUESTLY_ALLOWED_EMAILS` | your email, e.g. `joshua@example.com`   |

5. Click **Deploy**. The build creates all the database tables and seed content in Supabase automatically,
   then publishes the site. When it finishes, Vercel shows your address, e.g.
   `https://questly-abc123.vercel.app`. Copy it.

## Step 3 — Tell Supabase where sign-in links should go

1. In Supabase, open **Authentication → URL Configuration**.
2. Set **Site URL** to your Vercel address, e.g. `https://questly-abc123.vercel.app`.
3. Under **Redirect URLs**, click **Add URL** and add:
   - `https://questly-abc123.vercel.app/auth/callback` (your address + `/auth/callback`)
   - `http://localhost:3000/auth/callback` (only if you want sign-in while developing locally)
4. Click **Save**.

## Step 4 — Sign in

1. Open your Vercel address. You'll see **Return to your adventure**.
2. Enter the email from `QUESTLY_ALLOWED_EMAILS` and click **Send Sign-In Link**.
3. Open the email **on the same device and browser** and click the link. You land in the World with a fresh
   character. Rename it under **Settings → Profile**.

That's it — Questly is live, and only your email can get in.

---

## Good to know

- **Updates deploy themselves.** Every push to the `claude/questly-phase-1-foundation-mi8vm1` branch (the
  repository's default branch) redeploys the site and applies any new database migrations.
- **Sign-in emails are rate-limited** on Supabase's built-in email service (a few per hour). That's plenty for
  one person, and you stay signed in for weeks. For more, add your own SMTP provider under
  **Authentication → Emails → SMTP Settings**.
- **Your own domain:** Vercel → Project → **Settings → Domains**. Afterwards, update the Site URL and Redirect
  URL in Step 3 to the new domain, and optionally set `QUESTLY_SITE_URL` in Vercel to it.
- **Adding someone else:** add their email to `QUESTLY_ALLOWED_EMAILS` (comma-separated) and redeploy. They get
  their own separate character.
- **Backups:** Settings → **Export My Adventure** downloads everything as JSON. Supabase also keeps daily
  backups on paid plans.
- **Safety net:** if the sign-in variables are ever missing, the live site refuses to show any account rather
  than opening it to everyone.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Build fails at "Migrations applied" | Check `DATABASE_URL`: password substituted, brackets removed, port `6543`. |
| Page says "running in production without sign-in" | `SUPABASE_URL` / `SUPABASE_ANON_KEY` are missing in Vercel. Add them and redeploy. |
| No email arrives | Check spam; wait a minute (rate limit); confirm the email exactly matches `QUESTLY_ALLOWED_EMAILS`. |
| "That sign-in link has expired or was already used" | Request a new link and open it in the same browser you requested it from. |
| Link opens Supabase with an error about redirects | The `/auth/callback` URL in Step 3 doesn't match your site address. |

---

## This deployment (as configured)

- **Site:** https://questly-joshuamayo2-4370.vercel.app (Vercel project `questly`, functions in `pdx1`).
- **Database:** Supabase project `Questly` (`us-west-2`). The app connects as a dedicated role, `questly_app`,
  through the **transaction pooler at `aws-0-us-west-2.pooler.supabase.com:6543`**, so the username is
  `questly_app.<project-ref>`. The role owns Questly's tables, is not a superuser, and cannot bypass RLS.
  To rotate its password: `ALTER ROLE questly_app PASSWORD '…'` in the Supabase SQL editor, then update
  `DATABASE_URL` in Vercel and redeploy.
- **Vercel Authentication** is limited to preview deployments; production relies on Questly's own sign-in.
- **Build command:** `npm run vercel-build` (migrations + seed content, then `next build`).

# Backend setup

The backend uses Supabase Postgres for users, attachments, and the application's
other data tables. Uploaded file contents continue to be stored in the backend's
`uploads` directory; Supabase stores their metadata.

## Configure Supabase

1. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql), then [`supabase/ams_integration.sql`](./supabase/ams_integration.sql).
2. Set these server-side environment variables in `backend/.env`:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   JWT_SECRET=your-long-random-secret
   ```

3. Keep the service-role key private and never add it to frontend variables,
   source control, or chat.
4. Start the API with `npm start`.

The backend checks the `users` table during startup. The schema must be applied
before the API can start. MongoDB records are not copied automatically; export
and migrate existing records before switching production traffic if they need
to be retained.

## AMS integration

The AMS uses Supabase as its source of truth. Existing `teacher` accounts are
the school supervisors for AMS authorization; company supervisors are separate,
invite-only Supabase Auth users linked to `company_supervisors` records. Admins
must assign a class to legacy/new students before their attachment application
can become an active placement. Existing students are retained with a null
`class_id` until an administrator assigns one.

The migration adds normalized departments/classes, companies, company
supervisors, attachment applications, placements, school-supervisor
assignments, daily logbook entries, weekly summaries, periodic/final reports,
and recipient-scoped notifications. It preserves the pre-existing `reports`
table; the attachment application form now writes to `attachment_applications`,
and file reports write to `attachment_reports`. Existing rows are not inferred
or copied into these new tables because the old report form does not reliably
identify the company or supervisor records.

### Company supervisor invitations

Set `FRONTEND_URL` on the backend to the frontend origin. Add these public-only
variables to the frontend environment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
VITE_API_URL=http://localhost:4000
```

In Supabase Auth, allow the `${FRONTEND_URL}/set-password` redirect URL. Never
put `SUPABASE_SERVICE_ROLE_KEY` in frontend variables. Admins create the
company supervisor record and send an invitation; an account can access the
API only while at least one linked active placement is within its start/end
dates. The access window is derived per placement, not from a fixed account
expiry.

### AMS API

All endpoints below except authentication are JWT-protected; admin paths require
the admin role. Supervisor data is filtered by the authenticated account on the
server.

- Student: `GET /api/ams/dashboard`, `GET/POST /api/ams/applications`,
  `GET/POST /api/ams/logbook`, `PATCH/DELETE /api/ams/logbook/:id`,
  `GET/POST /api/ams/weekly-summaries`, `GET/POST /api/ams/reports`.
- Company supervisor: `GET /api/ams/supervisor/dashboard`,
  `GET /api/ams/logbook`, `PATCH /api/ams/logbook/:id/review`,
  submitted `GET /api/ams/weekly-summaries`, `GET /api/ams/reports`, `PATCH /api/ams/reports/:id/review`,
  `GET /api/ams/reports/:id/download`.
- School supervisor (`teacher` role): `GET /api/ams/supervisor/dashboard`,
  read-only `GET /api/ams/logbook`, submitted `GET /api/ams/weekly-summaries`,
  and report list/review endpoints.
- Admin: `GET /api/admin/attachments`,
  `GET /api/admin/school-supervisors`, `POST /api/admin/assignments`,
  `GET/PATCH /api/admin/attachment-applications`,
  `GET/POST /api/admin/companies`, `POST /api/admin/companies/:companyId/supervisors`,
  `POST /api/admin/company-supervisors/:id/invite`,
  `GET/POST /api/admin/classes`, `GET /api/admin/departments`,
  `PATCH /api/admin/students/:id/class`.
- Notifications: `GET /api/notifications`,
  `PATCH /api/notifications/:id/read`.

create extension if not exists pgcrypto;

create table if not exists public.departments (
  id text primary key default gen_random_uuid()::text,
  name text not null unique
);

insert into public.departments (name)
values ('IT'), ('ENGINEERING'), ('BUSINESS'), ('SCIENCE'), ('ARTS')
on conflict (name) do nothing;

create table if not exists public.classes (
  id text primary key default gen_random_uuid()::text,
  class_number text not null,
  department_id text not null references public.departments(id),
  intake text not null,
  created_at timestamptz not null default now(),
  unique (class_number, department_id, intake)
);

alter table public.users
  add column if not exists class_id text references public.classes(id) on delete set null,
  add column if not exists department_id text references public.departments(id) on delete set null;

update public.users u
set department_id = d.id
from public.departments d
where u.department_id is null
  and u.department is not null
  and upper(trim(u.department)) = d.name;

create table if not exists public.companies (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  industry_type text not null,
  location text not null,
  created_by text not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists companies_name_location_unique
  on public.companies (lower(name), lower(location));

create table if not exists public.company_supervisors (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public.companies(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_by text not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists company_supervisors_company_email_unique
  on public.company_supervisors (company_id, lower(email));

create table if not exists public.school_supervisor_assignments (
  id text primary key default gen_random_uuid()::text,
  student_id text not null unique references public.users(id) on delete cascade,
  school_supervisor_id text not null references public.users(id) on delete restrict,
  assigned_by text references public.users(id),
  assigned_at timestamptz not null default now(),
  check (student_id <> school_supervisor_id)
);

insert into public.school_supervisor_assignments (student_id, school_supervisor_id)
select student.id, supervisor.id
from public.users student
join public.users supervisor on supervisor.id = student.teacher_id
where student.role = 'student'
  and supervisor.role = 'teacher'
on conflict (student_id) do nothing;

create table if not exists public.attachment_applications (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.users(id) on delete cascade,
  company_name text not null,
  location text not null,
  verified_location text,
  industry_type text not null,
  supervisor_name text not null,
  supervisor_contact text not null,
  supervisor_email text,
  start_date date not null,
  end_date date not null,
  weekly_hours numeric not null check (weekly_hours between 1 and 168),
  company_id text references public.companies(id),
  company_supervisor_id text references public.company_supervisors(id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_comment text,
  reviewed_by text references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (status <> 'approved' or (company_id is not null and company_supervisor_id is not null))
);
create index if not exists attachment_applications_student_idx
  on public.attachment_applications (student_id, created_at desc);
create index if not exists attachment_applications_status_idx
  on public.attachment_applications (status, created_at desc);

create table if not exists public.placements (
  id text primary key default gen_random_uuid()::text,
  application_id text not null unique references public.attachment_applications(id),
  student_id text not null references public.users(id) on delete cascade,
  company_id text not null references public.companies(id),
  company_supervisor_id text not null references public.company_supervisors(id),
  start_date date not null,
  end_date date not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  unique (id, student_id)
);
create unique index if not exists placements_one_active_per_student
  on public.placements (student_id)
  where status = 'active';
create index if not exists placements_company_supervisor_window_idx
  on public.placements (company_supervisor_id, start_date, end_date)
  where status = 'active';
create index if not exists placements_company_idx on public.placements (company_id);

create table if not exists public.logbook_entries (
  id text primary key default gen_random_uuid()::text,
  placement_id text not null,
  student_id text not null,
  entry_date date not null,
  department_section text not null,
  start_time time,
  end_time time,
  objectives text not null,
  tasks text not null,
  technologies text,
  skills text,
  challenge text,
  evidence text,
  supervisor_initials text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_comment text,
  reviewed_by text references public.company_supervisors(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (placement_id, student_id)
    references public.placements(id, student_id) on delete cascade
);
create index if not exists logbook_entries_placement_date_idx
  on public.logbook_entries (placement_id, entry_date desc);
create index if not exists logbook_entries_student_idx
  on public.logbook_entries (student_id, entry_date desc);
create index if not exists logbook_entries_status_idx
  on public.logbook_entries (status, created_at desc);

create table if not exists public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  placement_id text not null,
  student_id text not null references public.users(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  summary_text text not null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (placement_id, student_id)
    references public.placements(id, student_id) on delete cascade,
  unique (placement_id, week_number)
);
create index if not exists weekly_summaries_student_idx
  on public.weekly_summaries (student_id, week_number);

create table if not exists public.attachment_reports (
  id text primary key default gen_random_uuid()::text,
  placement_id text not null,
  student_id text not null,
  title text not null,
  period_start date not null,
  period_end date not null,
  file_attachment_id text references public.attachments(id) on delete set null,
  company_review_comment text,
  company_reviewed_by text references public.company_supervisors(id),
  company_reviewed_at timestamptz,
  school_review_comment text,
  school_reviewed_by text references public.users(id),
  school_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (placement_id, student_id)
    references public.placements(id, student_id) on delete cascade,
  check (period_end >= period_start)
);
create index if not exists attachment_reports_placement_idx
  on public.attachment_reports (placement_id, created_at desc);
create index if not exists attachment_reports_student_idx
  on public.attachment_reports (student_id, created_at desc);

alter table public.attachments
  drop constraint if exists attachments_allowed_roles_check;
alter table public.attachments
  add constraint attachments_allowed_roles_check
  check (allowed_roles <@ array['admin', 'teacher', 'student', 'company_supervisor']::text[]);

alter table public.notifications
  drop constraint if exists notifications_recipient_id_fkey,
  drop constraint if exists notifications_sender_id_fkey,
  drop constraint if exists notifications_type_check,
  drop constraint if exists notifications_on_model_check;

alter table public.notifications
  add column if not exists recipient_role text,
  add column if not exists sender_role text;

alter table public.notifications
  add constraint notifications_type_check
    check (type in (
      'new_report', 'report_feedback', 'form_submission', 'assignment', 'system',
      'new_logbook', 'logbook_reviewed', 'report_reviewed', 'attachment_application'
    )),
  add constraint notifications_on_model_check
    check (on_model is null or on_model in (
      'Report', 'Form', 'Assignment', 'LogbookEntry', 'AttachmentApplication', 'Placement'
    ));

create or replace function public.assign_school_supervisor(
  p_student_ids text[],
  p_school_supervisor_id text,
  p_admin_id text
)
returns table (student_id text, school_supervisor_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  p_student_id text;
  v_student_count integer := 0;
begin
  if not exists (select 1 from public.users where id = p_admin_id and role = 'admin') then
    raise exception 'Administrator not found' using errcode = '42501';
  end if;

  if not exists (select 1 from public.users where id = p_school_supervisor_id and role = 'teacher') then
    raise exception 'School supervisor not found' using errcode = '23503';
  end if;

  if p_student_ids is null or cardinality(p_student_ids) = 0 then
    raise exception 'At least one student is required' using errcode = '22023';
  end if;

  for p_student_id in
    select distinct requested_id
    from unnest(p_student_ids) as requested(requested_id)
  loop
    if not exists (
      select 1
      from public.users student
      where student.id = p_student_id
        and student.role = 'student'
    ) then
      raise exception 'Student % was not found', p_student_id
        using errcode = '23514';
    end if;
    v_student_count := v_student_count + 1;
  end loop;

  if v_student_count <> cardinality(array(select distinct unnest(p_student_ids))) then
    raise exception 'One or more selected students are invalid' using errcode = '23514';
  end if;

  for p_student_id in
    select distinct requested_id
    from unnest(p_student_ids) as requested(requested_id)
  loop
    insert into public.school_supervisor_assignments (
      student_id, school_supervisor_id, assigned_by, assigned_at
    )
    values (p_student_id, p_school_supervisor_id, p_admin_id, now())
    on conflict (student_id) do update
      set school_supervisor_id = excluded.school_supervisor_id,
          assigned_by = excluded.assigned_by,
          assigned_at = excluded.assigned_at;

    insert into public.notifications (
      recipient_id, recipient_role, sender_id, sender_role, type, title, message,
      related_entity, on_model
    )
    values (
      p_student_id, 'student', p_admin_id, 'admin', 'assignment',
      'School supervisor assigned', 'A school supervisor has been assigned to your attachment.',
      p_student_id, 'Assignment'
    );
    student_id := p_student_id;
    school_supervisor_id := p_school_supervisor_id;
    return next;
  end loop;

  insert into public.notifications (
    recipient_id, recipient_role, sender_id, sender_role, type, title, message,
    related_entity, on_model
  )
  values (
    p_school_supervisor_id, 'teacher', p_admin_id, 'admin', 'assignment',
    'Students assigned', format('%s student(s) were assigned to you.', v_student_count),
    p_school_supervisor_id, 'Assignment'
  );
end;
$$;

create or replace function public.review_attachment_application(
  p_application_id text,
  p_decision text,
  p_company_id text,
  p_company_supervisor_id text,
  p_admin_id text,
  p_comment text
)
returns table (application_id text, application_status text, placement_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.attachment_applications%rowtype;
  v_school_supervisor_id text;
  v_company_user_id uuid;
  v_placement_id text;
begin
  if not exists (select 1 from public.users where id = p_admin_id and role = 'admin') then
    raise exception 'Administrator not found' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;

  select * into v_application
  from public.attachment_applications
  where id = p_application_id
  for update;

  if not found or v_application.status <> 'pending' then
    raise exception 'Pending attachment application not found' using errcode = 'P0002';
  end if;

  if p_decision = 'approved' then
    if p_company_id is null or p_company_supervisor_id is null then
      raise exception 'Company and company supervisor are required for approval' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.users
      where id = v_application.student_id
        and role = 'student'
        and class_id is not null
        and department_id is not null
    ) then
      raise exception 'Student must be assigned a class and department before approval' using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.company_supervisors
      where id = p_company_supervisor_id
        and company_id = p_company_id
        and user_id is not null
    ) then
      raise exception 'Company supervisor must belong to the selected company and have an invited account'
        using errcode = '23514';
    end if;

    update public.placements
    set status = 'completed'
    where student_id = v_application.student_id
      and status = 'active'
      and end_date < current_date;

    insert into public.placements (
      application_id, student_id, company_id, company_supervisor_id, start_date, end_date
    )
    values (
      v_application.id, v_application.student_id, p_company_id, p_company_supervisor_id,
      v_application.start_date, v_application.end_date
    )
    returning id into v_placement_id;

    update public.attachment_applications
    set status = 'approved',
        company_id = p_company_id,
        company_supervisor_id = p_company_supervisor_id,
        review_comment = p_comment,
        reviewed_by = p_admin_id,
        reviewed_at = now()
    where id = v_application.id;

    select school_supervisor_id into v_school_supervisor_id
    from public.school_supervisor_assignments
    where student_id = v_application.student_id;

    select user_id into v_company_user_id
    from public.company_supervisors
    where id = p_company_supervisor_id;

    if v_company_user_id is not null then
      insert into public.notifications (
        recipient_id, recipient_role, sender_id, sender_role, type, title, message,
        related_entity, on_model
      )
      values (
        v_company_user_id::text, 'company_supervisor', p_admin_id, 'admin', 'attachment_application',
        'New attachment assigned', 'A student attachment has been assigned to your company.',
        v_placement_id, 'Placement'
      );
    end if;

    if v_school_supervisor_id is not null then
      insert into public.notifications (
        recipient_id, recipient_role, sender_id, sender_role, type, title, message,
        related_entity, on_model
      )
      values (
        v_school_supervisor_id, 'teacher', p_admin_id, 'admin', 'attachment_application',
        'New student attachment', 'An attachment was approved for a student assigned to you.',
        v_placement_id, 'Placement'
      );
    end if;
  else
    update public.attachment_applications
    set status = 'rejected',
        review_comment = p_comment,
        reviewed_by = p_admin_id,
        reviewed_at = now()
    where id = v_application.id;
  end if;

  insert into public.notifications (
    recipient_id, recipient_role, sender_id, sender_role, type, title, message,
    related_entity, on_model
  )
  values (
    v_application.student_id, 'student', p_admin_id, 'admin', 'attachment_application',
    'Attachment application updated',
    case when p_decision = 'approved'
      then 'Your attachment application was approved.'
      else 'Your attachment application was rejected.'
    end,
    v_application.id, 'AttachmentApplication'
  );

  application_id := v_application.id;
  application_status := p_decision;
  placement_id := v_placement_id;
  return next;
end;
$$;

revoke all on function public.assign_school_supervisor(text[], text, text) from public, anon, authenticated;
grant execute on function public.assign_school_supervisor(text[], text, text) to service_role;
revoke all on function public.review_attachment_application(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.review_attachment_application(text, text, text, text, text, text) to service_role;

alter table public.departments enable row level security;
alter table public.classes enable row level security;
alter table public.companies enable row level security;
alter table public.company_supervisors enable row level security;
alter table public.school_supervisor_assignments enable row level security;
alter table public.attachment_applications enable row level security;
alter table public.placements enable row level security;
alter table public.logbook_entries enable row level security;
alter table public.weekly_summaries enable row level security;
alter table public.attachment_reports enable row level security;


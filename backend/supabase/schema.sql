create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text,
  school_id text,
  password_hash text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  department text check (department is null or department in ('IT', 'ENGINEERING', 'BUSINESS', 'SCIENCE', 'ARTS')),
  students text[] not null default '{}',
  teacher_id text references public.users(id) on delete set null,
  profile_picture_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((role = 'student' and school_id is not null and email is null)
      or (role <> 'student' and email is not null and school_id is null)),
  check ((role = 'admin' and department is null) or (role <> 'admin' and department is not null)),
  check (email is null or email ~* '^[[:alnum:]_+.-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}$'),
  check (school_id is null or school_id ~ '^[A-Z0-9]+$')
);

create unique index if not exists users_email_unique on public.users (lower(email)) where email is not null;
create unique index if not exists users_school_id_unique on public.users (school_id) where school_id is not null;
create index if not exists users_role_department_idx on public.users (role, department);

create table if not exists public.attachments (
  id text primary key default gen_random_uuid()::text,
  filename text not null,
  original_name text not null,
  mimetype text not null,
  size bigint not null check (size >= 0),
  path text not null,
  url text not null,
  uploaded_by text not null constraint attachments_uploaded_by_fkey references public.users(id) on delete cascade,
  attachment_type text not null check (attachment_type in ('profile_picture', 'assignment_submission', 'shared_document', 'report_attachment', 'homework_file')),
  related_model text check (related_model is null or related_model in ('User', 'HomeworkSubmission', 'SharedDocument', 'Report', 'Homework')),
  related_id text,
  is_public boolean not null default false,
  allowed_users text[] not null default '{}',
  allowed_roles text[] not null default '{}'
    check (allowed_roles <@ array['admin', 'teacher', 'student']::text[]),
  description text not null default '' check (char_length(description) <= 500),
  tags text[] not null default '{}',
  is_scanned boolean not null default false,
  scan_result text not null default 'pending'
    check (scan_result in ('clean', 'infected', 'suspicious', 'pending')),
  is_processed boolean not null default false,
  thumbnail_path text,
  compressed_path text,
  download_count integer not null default 0 check (download_count >= 0),
  last_downloaded timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((attachment_type = 'profile_picture' and related_model is null and related_id is null)
      or (attachment_type <> 'profile_picture' and related_model is not null and related_id is not null))
);

alter table public.users
  drop constraint if exists users_profile_picture_id_fkey;
alter table public.users
  add constraint users_profile_picture_id_fkey
  foreign key (profile_picture_id) references public.attachments(id) on delete set null;

create index if not exists attachments_uploaded_type_idx on public.attachments (uploaded_by, attachment_type);
create index if not exists attachments_related_idx on public.attachments (related_model, related_id);
create index if not exists attachments_created_idx on public.attachments (created_at desc);
create index if not exists attachments_tags_idx on public.attachments using gin (tags);

create table if not exists public.attendance (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.users(id) on delete cascade,
  teacher_id text not null references public.users(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists attendance_student_date_idx on public.attendance (student_id, attendance_date);
create index if not exists attendance_teacher_date_idx on public.attendance (teacher_id, attendance_date);

create table if not exists public.homework (
  id text primary key default gen_random_uuid()::text,
  title text not null check (char_length(title) <= 200),
  description text not null check (char_length(description) <= 2000),
  instructions text check (instructions is null or char_length(instructions) <= 5000),
  created_by text not null references public.users(id) on delete cascade,
  assigned_to text[] not null default '{}',
  department text not null check (department in ('IT', 'ENGINEERING', 'BUSINESS', 'SCIENCE', 'ARTS')),
  subject text not null check (char_length(subject) <= 100),
  due_date timestamptz not null,
  max_points numeric not null default 100 check (max_points >= 0),
  allowed_file_types text[] not null default '{}',
  max_file_size bigint not null default 10485760 check (max_file_size between 0 and 104857600),
  max_files integer not null default 5 check (max_files between 1 and 20),
  is_active boolean not null default true,
  allow_late_submission boolean not null default false,
  late_submission_penalty numeric not null default 0 check (late_submission_penalty between 0 and 100),
  total_submissions integer not null default 0,
  on_time_submissions integer not null default 0,
  late_submissions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (allowed_file_types <@ array['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar', 'ppt', 'pptx', 'xls', 'xlsx']::text[])
);
create index if not exists homework_creator_active_idx on public.homework (created_by, is_active);
create index if not exists homework_department_subject_idx on public.homework (department, subject);
create index if not exists homework_due_date_idx on public.homework (due_date);

create table if not exists public.homework_submissions (
  id text primary key default gen_random_uuid()::text,
  homework_id text not null references public.homework(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  submission_text text check (submission_text is null or char_length(submission_text) <= 5000),
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  grade numeric check (grade is null or grade between 0 and 100),
  feedback text check (feedback is null or char_length(feedback) <= 2000),
  graded_by text references public.users(id) on delete set null,
  graded_at timestamptz,
  status text not null default 'submitted' check (status in ('submitted', 'graded', 'returned', 'resubmitted')),
  resubmission_count integer not null default 0,
  allow_resubmission boolean not null default false,
  resubmission_deadline timestamptz,
  attachment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (homework_id, student_id)
);
create index if not exists homework_submissions_student_date_idx on public.homework_submissions (student_id, submitted_at desc);
create index if not exists homework_submissions_homework_status_idx on public.homework_submissions (homework_id, status);
create index if not exists homework_submissions_grader_date_idx on public.homework_submissions (graded_by, graded_at desc);

create table if not exists public.assessment_visits (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  teacher_id text not null references public.users(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  scheduled_date timestamptz not null,
  estimated_duration integer not null default 60,
  destination jsonb not null default '{}'::jsonb,
  teacher_location jsonb not null default '{}'::jsonb,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'preparing', 'en_route', 'nearby', 'arrived', 'in_progress', 'completed', 'cancelled', 'postponed')),
  distance_to_destination numeric,
  estimated_arrival_time timestamptz,
  travel_mode text not null default 'driving' check (travel_mode in ('driving', 'walking', 'transit', 'cycling')),
  timeline jsonb not null default '[]'::jsonb,
  assessment_type text not null
    check (assessment_type in ('internship_visit', 'project_review', 'practical_exam', 'site_inspection', 'progress_check')),
  attachments text[] not null default '{}',
  assessment_results jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{"studentNotified":false,"notificationsSent":[]}'::jsonb,
  emergency_contact jsonb not null default '{}'::jsonb,
  department text not null,
  subject text,
  semester text,
  academic_year text,
  is_active boolean not null default true,
  created_by text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assessment_visits_teacher_date_idx on public.assessment_visits (teacher_id, scheduled_date);
create index if not exists assessment_visits_student_date_idx on public.assessment_visits (student_id, scheduled_date);
create index if not exists assessment_visits_status_date_idx on public.assessment_visits (status, scheduled_date);

create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  recipient_id text not null references public.users(id) on delete cascade,
  sender_id text not null references public.users(id) on delete cascade,
  type text not null check (type in ('new_report', 'report_feedback', 'form_submission', 'assignment', 'system')),
  title text not null,
  message text not null,
  related_entity text,
  on_model text check (on_model is null or on_model in ('Report', 'Form', 'Assignment')),
  is_read boolean not null default false,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_read_idx on public.notifications (recipient_id, is_read);
create index if not exists notifications_created_idx on public.notifications (created_at desc);

create table if not exists public.reports (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.users(id) on delete cascade,
  teacher_id text not null references public.users(id) on delete cascade,
  student_name text not null,
  student_school_id text not null,
  company_name text not null,
  location text not null,
  verified_location text,
  industry_type text not null
    check (industry_type in ('Information Technology', 'Engineering', 'Healthcare', 'Business', 'Education', 'Agriculture', 'Other')),
  supervisor_name text not null,
  supervisor_contact text not null,
  supervisor_email text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  weekly_hours numeric not null check (weekly_hours between 1 and 168),
  attachment text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'approved', 'rejected')),
  feedback text,
  grade text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists reports_student_idx on public.reports (student_id);
create index if not exists reports_teacher_idx on public.reports (teacher_id);
create index if not exists reports_status_idx on public.reports (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();
drop trigger if exists attachments_set_updated_at on public.attachments;
create trigger attachments_set_updated_at before update on public.attachments
for each row execute function public.set_updated_at();
drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at before update on public.attendance
for each row execute function public.set_updated_at();
drop trigger if exists homework_set_updated_at on public.homework;
create trigger homework_set_updated_at before update on public.homework
for each row execute function public.set_updated_at();
drop trigger if exists homework_submissions_set_updated_at on public.homework_submissions;
create trigger homework_submissions_set_updated_at before update on public.homework_submissions
for each row execute function public.set_updated_at();
drop trigger if exists assessment_visits_set_updated_at on public.assessment_visits;
create trigger assessment_visits_set_updated_at before update on public.assessment_visits
for each row execute function public.set_updated_at();

create or replace function public.record_attachment_download(p_attachment_id text)
returns void
language sql
as $$
  update public.attachments
  set download_count = download_count + 1,
      last_downloaded = now()
  where id = p_attachment_id;
$$;

create or replace function public.attachment_stats_by_type(p_uploaded_by text default null)
returns table (attachment_type text, count bigint, total_size bigint, avg_size numeric)
language sql
stable
as $$
  select a.attachment_type, count(*), coalesce(sum(a.size), 0), coalesce(avg(a.size), 0)
  from public.attachments a
  where p_uploaded_by is null or a.uploaded_by = p_uploaded_by
  group by a.attachment_type
  order by a.attachment_type;
$$;

create or replace function public.attachment_total_stats(p_uploaded_by text default null)
returns table (total_files bigint, total_size bigint, avg_size numeric)
language sql
stable
as $$
  select count(*), coalesce(sum(a.size), 0), coalesce(avg(a.size), 0)
  from public.attachments a
  where p_uploaded_by is null or a.uploaded_by = p_uploaded_by;
$$;

alter table public.users enable row level security;
alter table public.attachments enable row level security;
alter table public.attendance enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.assessment_visits enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

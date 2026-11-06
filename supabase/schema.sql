-- Jalankan di Supabase SQL Editor. Semua tabel memakai UUID dan RLS.
create extension if not exists pgcrypto;

create type public.app_role as enum ('student','teacher','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Siswa'), 'student');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  arabic text not null,
  latin text not null,
  meaning text not null,
  image_url text,
  audio_url text,
  example_arabic text,
  example_meaning text,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  content text not null,
  grade integer not null default 4 check (grade between 1 and 6),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  description text,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  prompt_arabic text,
  sort_order integer not null default 0
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null,
  is_correct boolean not null default false
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  completed_at timestamptz not null default now()
);

create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  vocabulary_id uuid references public.vocabulary(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  status text not null default 'started' check (status in ('started','completed')),
  updated_at timestamptz not null default now(),
  constraint progress_target_check check (
    (vocabulary_id is not null and lesson_id is null) or
    (vocabulary_id is null and lesson_id is not null)
  )
);

create index vocabulary_category_idx on public.vocabulary(category_id);
create index lessons_published_idx on public.lessons(is_published);
create index quizzes_published_idx on public.quizzes(is_published);
create index attempts_student_idx on public.quiz_attempts(student_id);
create index progress_student_idx on public.learning_progress(student_id);

-- Helper functions avoid recursive RLS policies on profiles.
create function public.current_role()
returns public.app_role language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = (select auth.uid()) $$;

create function public.is_manager()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_role() in ('admin','teacher'), false) $$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.vocabulary enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.learning_progress enable row level security;

-- Profiles: users can read/update only themselves; managers can read all profiles.
create policy "profile read self or manager" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_manager());
create policy "profile update self" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = (select role from public.profiles p where p.id = (select auth.uid())));
create policy "managers update profiles" on public.profiles for update to authenticated
using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Content is readable by authenticated learners; teachers/admins manage it.
create policy "authenticated read categories" on public.categories for select to authenticated using (true);
create policy "manager manage categories" on public.categories for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "authenticated read vocabulary" on public.vocabulary for select to authenticated using (true);
create policy "manager manage vocabulary" on public.vocabulary for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "read published lessons or manager" on public.lessons for select to authenticated using (is_published or public.is_manager());
create policy "manager manage lessons" on public.lessons for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "read published quizzes or manager" on public.quizzes for select to authenticated using (is_published or public.is_manager());
create policy "manager manage quizzes" on public.quizzes for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "read questions for visible quizzes" on public.questions for select to authenticated
using (exists(select 1 from public.quizzes q where q.id=quiz_id and (q.is_published or public.is_manager())));
create policy "manager manage questions" on public.questions for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Kunci jawaban hanya dapat dibaca pengelola. Saat UI kuis siswa dibuat,
-- sajikan opsi tanpa kolom is_correct melalui view/RPC khusus.
create policy "manager read answers" on public.quiz_answers for select to authenticated
using (public.is_manager());
create policy "manager manage answers" on public.quiz_answers for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "student read own attempts or manager" on public.quiz_attempts for select to authenticated
using (student_id=(select auth.uid()) or public.is_manager());
create policy "student insert own attempts" on public.quiz_attempts for insert to authenticated
with check (student_id=(select auth.uid()) and exists(select 1 from public.quizzes q where q.id=quiz_id and q.is_published));
create policy "manager manage attempts" on public.quiz_attempts for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "student manage own progress" on public.learning_progress for all to authenticated
using (student_id=(select auth.uid())) with check (student_id=(select auth.uid()));
create policy "manager read progress" on public.learning_progress for select to authenticated using (public.is_manager());

-- Storage bucket: create bucket named learning-assets in Supabase Storage first.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learning-assets','learning-assets',true,10485760,array['image/png','image/jpeg','image/webp','audio/mpeg','audio/mp3','audio/wav'])
on conflict (id) do nothing;

create policy "public read learning assets" on storage.objects for select
using (bucket_id = 'learning-assets');
create policy "managers upload learning assets" on storage.objects for insert to authenticated
with check (bucket_id = 'learning-assets' and public.is_manager());
create policy "managers update learning assets" on storage.objects for update to authenticated
using (bucket_id = 'learning-assets' and public.is_manager())
with check (bucket_id = 'learning-assets' and public.is_manager());
create policy "managers delete learning assets" on storage.objects for delete to authenticated
using (bucket_id = 'learning-assets' and public.is_manager());

-- Seed kategori awal.
insert into public.categories (name,slug,description,sort_order) values
('Di Sekolah','di-sekolah','فِي الْمَدْرَسَةِ',1),
('Di Rumah','di-rumah','فِي الْبَيْتِ',2),
('Di Pasar','di-pasar','فِي السُّوقِ',3),
('Di Masjid','di-masjid','فِي الْمَسْجِدِ',4),
('Di Kebun','di-kebun','فِي الْحَدِيقَةِ',5)
on conflict (slug) do nothing;

-- Setelah membuat akun pertama, jadikan admin dari SQL Editor:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='email-admin-anda@example.com');

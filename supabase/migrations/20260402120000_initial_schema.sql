-- TECA — schema inicial + RLS + funções auxiliares
-- Executar no projeto Supabase (CLI ou SQL Editor)

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  city text not null default 'Nova Comunidade',
  avatar_url text not null default '',
  graces integer not null default 0,
  total_prayers integer not null default 0,
  streak integer not null default 1,
  level text not null default 'Peregrino',
  favorite_prayer_ids uuid[] not null default '{}',
  role text not null default 'USER' check (role in ('USER', 'EDITOR')),
  schedule jsonb not null default '[]'::jsonb,
  history jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);

-- ---------------------------------------------------------------------------
-- Orações
-- ---------------------------------------------------------------------------
create table public.prayers (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  text text not null default '',
  content jsonb,
  latin_text text,
  category text not null,
  tags text[] not null default '{}',
  image_url text,
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  created_at timestamptz not null default now(),
  prayer_count integer not null default 0,
  parent_prayer_id uuid references public.prayers (id) on delete set null,
  is_devotion boolean not null default false
);

create index idx_prayers_category on public.prayers (category);
create index idx_prayers_created on public.prayers (created_at desc);
create index idx_prayers_parent on public.prayers (parent_prayer_id);

-- ---------------------------------------------------------------------------
-- Sugestões de edição
-- ---------------------------------------------------------------------------
create table public.prayer_edit_suggestions (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  created_at timestamptz not null default now(),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  proposed jsonb not null default '{}'::jsonb,
  reason text,
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  reviewer_note text
);

create index idx_suggestions_prayer on public.prayer_edit_suggestions (prayer_id);
create index idx_suggestions_status on public.prayer_edit_suggestions (status);

-- ---------------------------------------------------------------------------
-- Círculos
-- ---------------------------------------------------------------------------
create table public.circulos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  leader_id uuid not null references public.profiles (id) on delete restrict,
  moderator_ids uuid[] not null default '{}',
  member_count integer not null default 0,
  image_url text not null default '',
  cover_image_url text not null default '',
  external_links jsonb not null default '[]'::jsonb,
  devocionary jsonb
);

-- ---------------------------------------------------------------------------
-- Membros
-- ---------------------------------------------------------------------------
create table public.circulo_members (
  circulo_id uuid not null references public.circulos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (circulo_id, user_id)
);

create index idx_circulo_members_user on public.circulo_members (user_id);

-- ---------------------------------------------------------------------------
-- Posts (raiz e respostas: parent_post_id nulo = raiz)
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  circulo_id uuid not null references public.circulos (id) on delete cascade,
  parent_post_id uuid references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  author_avatar_url text not null default '',
  text text not null default '',
  created_at timestamptz not null default now(),
  is_pinned boolean not null default false,
  mentioned_prayer_ids uuid[] default null
);

create index idx_posts_circulo on public.posts (circulo_id);
create index idx_posts_parent on public.posts (parent_post_id);
create index idx_posts_created on public.posts (created_at desc);

-- ---------------------------------------------------------------------------
-- Reações
-- ---------------------------------------------------------------------------
create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Agenda do círculo
-- ---------------------------------------------------------------------------
create table public.circulo_schedule_items (
  id uuid primary key default gen_random_uuid(),
  circulo_id uuid not null references public.circulos (id) on delete cascade,
  title text not null,
  time text not null,
  prayer_id uuid references public.prayers (id) on delete set null
);

create index idx_circulo_schedule_circulo on public.circulo_schedule_items (circulo_id);

-- ---------------------------------------------------------------------------
-- Trigger: novo usuário → perfil
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || coalesce(new.raw_user_meta_data->>'full_name', 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: manter member_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_circulo_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.circulos
      set member_count = member_count + 1
      where id = new.circulo_id;
  elsif tg_op = 'DELETE' then
    update public.circulos
      set member_count = greatest(0, member_count - 1)
      where id = old.circulo_id;
  end if;
  return null;
end;
$$;

create trigger trg_circulo_members_count_ins
  after insert on public.circulo_members
  for each row execute function public.sync_circulo_member_count();

create trigger trg_circulo_members_count_del
  after delete on public.circulo_members
  for each row execute function public.sync_circulo_member_count();

-- ---------------------------------------------------------------------------
-- RPC: incrementar contador (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.increment_prayer_count(pid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  newc integer;
begin
  update public.prayers
    set prayer_count = prayer_count + 1
    where id = pid
    returning prayer_count into newc;
  return coalesce(newc, 0);
end;
$$;

grant execute on function public.increment_prayer_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.prayers enable row level security;
alter table public.prayer_edit_suggestions enable row level security;
alter table public.circulos enable row level security;
alter table public.circulo_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.circulo_schedule_items enable row level security;

-- Perfis: leitura ampla para membros da comunidade (nome/avatar em posts)
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

create policy profiles_select_anon_min
  on public.profiles for select
  to anon
  using (false);

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Orações: leitura pública (landing + catálogo)
create policy prayers_select_all
  on public.prayers for select
  using (true);

create policy prayers_insert_authenticated
  on public.prayers for insert
  to authenticated
  with check (author_id = auth.uid() or author_id is null);

create policy prayers_update_editor
  on public.prayers for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'EDITOR')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'EDITOR')
  );

-- Autor pode atualizar própria oração (opcional — app usa editor para edição direta)
create policy prayers_update_author
  on public.prayers for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Sugestões
create policy suggestions_select
  on public.prayer_edit_suggestions for select
  to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'EDITOR')
  );

create policy suggestions_insert
  on public.prayer_edit_suggestions for insert
  to authenticated
  with check (author_id = auth.uid());

create policy suggestions_update_editor
  on public.prayer_edit_suggestions for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'EDITOR')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'EDITOR')
  );

-- Círculos: leitura pública para preview na landing; posts seguem política própria
create policy circulos_select_all
  on public.circulos for select
  using (true);

create policy circulos_insert_authenticated
  on public.circulos for insert
  to authenticated
  with check (leader_id = auth.uid());

create policy circulos_update_mods
  on public.circulos for update
  to authenticated
  using (
    leader_id = auth.uid()
    or auth.uid() = any (moderator_ids)
  )
  with check (
    leader_id = auth.uid()
    or auth.uid() = any (moderator_ids)
  );

-- Membros
create policy circulo_members_select
  on public.circulo_members for select
  to authenticated
  using (true);

create policy circulo_members_insert_self
  on public.circulo_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy circulo_members_delete_self_or_mod
  on public.circulo_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

-- Posts
create policy posts_select_member_or_mod
  on public.posts for select
  to authenticated
  using (
    exists (
      select 1 from public.circulo_members m
      where m.circulo_id = posts.circulo_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.circulos c
      where c.id = posts.circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

create policy posts_insert_member
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.circulo_members m
      where m.circulo_id = circulo_id and m.user_id = auth.uid()
    )
  );

-- Só líder/moderador altera post (ex.: fixar). Autor não edita texto após criar.
create policy posts_update_mod
  on public.posts for update
  to authenticated
  using (
    exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  )
  with check (
    exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

create policy posts_delete_mod
  on public.posts for delete
  to authenticated
  using (
    exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

-- Reações
create policy reactions_select_with_post
  on public.post_reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      join public.circulo_members m on m.circulo_id = p.circulo_id and m.user_id = auth.uid()
      where p.id = post_reactions.post_id
    )
    or exists (
      select 1 from public.posts p
      join public.circulos c on c.id = p.circulo_id
      where p.id = post_reactions.post_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

create policy reactions_all_member
  on public.post_reactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.posts p
      join public.circulo_members m on m.circulo_id = p.circulo_id and m.user_id = auth.uid()
      where p.id = post_id
    )
  );

create policy reactions_update_member
  on public.post_reactions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy reactions_delete_own
  on public.post_reactions for delete
  to authenticated
  using (user_id = auth.uid());

-- Agenda círculo
create policy schedule_select_member
  on public.circulo_schedule_items for select
  to authenticated
  using (
    exists (
      select 1 from public.circulo_members m
      where m.circulo_id = circulo_schedule_items.circulo_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

create policy schedule_all_mod
  on public.circulo_schedule_items for all
  to authenticated
  using (
    exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  )
  with check (
    exists (
      select 1 from public.circulos c
      where c.id = circulo_id
        and (c.leader_id = auth.uid() or auth.uid() = any (c.moderator_ids))
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: bucket para imagens (público leitura)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('prayer-images', 'prayer-images', true)
on conflict (id) do nothing;

create policy storage_prayer_images_read
  on storage.objects for select
  using (bucket_id = 'prayer-images');

create policy storage_prayer_images_write
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'prayer-images');

create policy storage_prayer_images_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'prayer-images');

create policy storage_prayer_images_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'prayer-images');

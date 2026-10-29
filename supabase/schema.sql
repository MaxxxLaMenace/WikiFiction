-- Schéma WikiFiction : à exécuter une fois dans Supabase (SQL Editor > New query).

-- Une ligne par joueur et par univers.
create table if not exists public.collections (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  universe_id text not null,
  owned jsonb not null default '{}'::jsonb,
  packs integer not null default 5,
  last_regen_at timestamptz not null default now(),
  opened integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, universe_id)
);

-- Chaque joueur ne voit et ne modifie que ses propres collections.
alter table public.collections enable row level security;

create policy "Lire sa collection" on public.collections
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Créer sa collection" on public.collections
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Modifier sa collection" on public.collections
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Supprimer sa collection" on public.collections
  for delete to authenticated using ((select auth.uid()) = user_id);

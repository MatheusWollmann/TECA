-- Se o trigger handle_new_user não rodou (projeto antigo, erro silencioso, etc.),
-- o cliente autenticado pode criar a própria linha em profiles uma vez.
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

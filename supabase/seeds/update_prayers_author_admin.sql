-- Atualiza author_name para "Admin"
-- Rode no SQL Editor do Supabase (postgres).

-- Opção 1 (recomendada): só orações importadas do scrape CatolicoApp
UPDATE public.prayers
SET author_name = 'Admin'
WHERE author_name = 'CatolicoApp (scraping — revisar direitos e texto)';

-- Opção 2: todas as orações da tabela (descomente se for isso que quiser)
-- UPDATE public.prayers
-- SET author_name = 'Admin';

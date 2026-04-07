-- Seed opcional: orações iniciais (rode após migrations, com role que ignore RLS ou via SQL Editor)
-- IDs fixos para referências parent_prayer_id

INSERT INTO public.prayers (id, title, text, category, tags, image_url, author_id, author_name, created_at, prayer_count, latin_text, parent_prayer_id, is_devotion)
VALUES
(
  '10000000-0000-4000-a000-000000000c0d'::uuid,
  'Credo (Símbolo dos Apóstolos)',
  'Creio em Deus Pai Todo-Poderoso, Criador do céu e da terra. E em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus, está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na santa Igreja Católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.',
  'Diárias',
  ARRAY['#credo', '#fé'],
  NULL,
  NULL,
  'Tradição da Igreja',
  now() - interval '3650 days',
  18000,
  NULL,
  NULL,
  false
),
(
  '10000000-0000-4000-a000-00000000c001'::uuid,
  'Santo Rosário',
  'O Santo Rosário é uma prática religiosa de devoção mariana muito difundida entre os católicos romanos, que o rezam tanto pública quanto individualmente.

<b>Como Rezar:</b>

1. Sinal da Cruz
2. Oferecimento do Terço
3. Segurando o Crucifixo, rezar o [prayer:10000000-0000-4000-a000-000000000c0d].
4. Na primeira conta grande, rezar 1 [prayer:10000000-0000-4000-a000-000000000001].
5. Em cada uma das três contas pequenas seguintes, rezar 1 [prayer:10000000-0000-4000-a000-000000000002].
6. Rezar o Glória.
7. Anunciar o primeiro Mistério do Rosário do dia e rezar 1 [prayer:10000000-0000-4000-a000-000000000001].
8. Nas dez seguintes contas pequenas (uma dezena), rezar 10 [prayer:10000000-0000-4000-a000-000000000002] enquanto se reflete sobre o Mistério.
9. Rezar um Glória e a Oração de Fátima.
10. Repetir para os 4 Mistérios restantes.',
  'Marianas',
  ARRAY['#rosario', '#terço', '#devoção'],
  NULL,
  NULL,
  'Tradição da Igreja',
  now() - interval '3650 days',
  50000,
  NULL,
  NULL,
  true
),
(
  '10000000-0000-4000-a000-000000000001'::uuid,
  'Pai Nosso',
  'Pai Nosso que estais nos Céus, santificado seja o vosso Nome, venha a nós o vosso Reino, seja feita a vossa vontade assim na terra como no Céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do Mal. Amém.',
  'Diárias',
  ARRAY['#fé', '#perdão'],
  'https://picsum.photos/seed/painosso/400/200',
  NULL,
  'Tradição da Igreja',
  now() - interval '3650 days',
  15234,
  NULL,
  NULL,
  false
),
(
  '10000000-0000-4000-a000-000000000002'::uuid,
  'Ave Maria',
  '<b>Ave Maria</b>, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. <i>Santa Maria, Mãe de Deus</i>, rogai por nós pecadores, agora e na hora da nossa morte. Amém.',
  'Marianas',
  ARRAY['#Maria', '#mãe'],
  'https://picsum.photos/seed/avemaria/400/200',
  NULL,
  'Tradição da Igreja',
  now() - interval '3650 days',
  22789,
  'Ave Maria, gratia plena, Dominus tecum, benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis pecatoribus, nunc et in hora mortis nostrae. Amen.',
  '10000000-0000-4000-a000-00000000c001'::uuid,
  false
),
(
  '10000000-0000-4000-a000-000000000003'::uuid,
  'Oração a São Francisco de Assis',
  'Senhor, fazei-me instrumento de vossa paz. Onde houver ódio, que eu leve o amor; Onde houver ofensa, que eu leve o perdão; Onde houver discórdia, que eu leve a união...',
  'Santos',
  ARRAY['#paz', '#amor', '#SãoFrancisco'],
  NULL,
  NULL,
  'Ana Clara',
  now() - interval '2 days',
  8456,
  NULL,
  NULL,
  false
),
(
  '10000000-0000-4000-a000-000000000004'::uuid,
  'Oração pela Família',
  'Ó Deus, Pai de misericórdia, que em vossa infinita bondade nos destes a família, santificai nosso lar. Que ele seja um lugar de paz, amor e união...',
  'Momentos da Vida',
  ARRAY['#familia', '#lar'],
  'https://picsum.photos/seed/familia/400/200',
  NULL,
  'Carlos Eduardo',
  now() - interval '7 days',
  5123,
  NULL,
  NULL,
  false
)
ON CONFLICT (id) DO NOTHING;

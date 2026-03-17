# Ideias futuras para o Teca

## Editor profissional de orações e devoções

- Implementar um editor WYSIWYG de verdade (ex.: TipTap / Lexical / Slate):
  - Usuário nunca vê tags HTML.
  - Toolbar com:
    - Estilos de texto: **Título**, **Subtítulo**, **Corpo**.
    - Negrito, itálico, listas, citações.
    - Atalhos de teclado básicos.
  - Armazenar o conteúdo em um formato estruturado (ex.: JSON de blocos) e apenas renderizar HTML na leitura.

- Estrutura por blocos para devoções complexas:
  - Suporte a seções (ex.: “Introdução”, “Mistério 1”, “Mistério 2”...).
  - Cada seção com:
    - Título.
    - Corpo.
    - Referências a outras orações (linkar orações do acervo como passos).

## Colaboração estilo “wiki de orações”

- Fluxo de sugestão de edição:
  - Usuário comum edita em uma cópia local e envia como **sugestão**.
  - Editores recebem uma fila de sugestões com diff visual (antes/depois) e podem **aceitar** ou **rejeitar**.

- Histórico de versões por oração:
  - Linha do tempo de edições (quem alterou, quando, resumo da mudança).
  - Possibilidade de comparar versões e reverter.

## Experiência do cronograma

- Visualização semanal/mensal do cronograma:
  - Ver em um calendário os dias com horários configurados.
  - Destaque para dias “completos” (100% das orações concluídas).

- Presets de horários:
  - Sugestões rápidas como “Laudes”, “Angelus”, “Vésperas”.
  - Permitir salvar “rotinas” de oração que possam ser reaplicadas em diferentes dias.


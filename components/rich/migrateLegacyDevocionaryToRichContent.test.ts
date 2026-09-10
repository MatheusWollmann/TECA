import { describe, it, expect } from 'vitest';
import { migrateLegacyDevocionaryToRichContent } from './migrateLegacyDevocionaryToRichContent';
import type { CirculoDevocionary, RichContent } from '../../types';

// Exemplo do padrão de teste do TECA: lógica pura primeiro, dado realista, um comportamento por `it`.
// Ver .claude/agents/test-specialist.md

// `RichContent.doc` é `unknown` em types.ts; para o teste tratamos a forma conhecida do TipTap.
type TiptapBlock = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: { type?: string; text?: string }[];
};

function blocksOf(result: RichContent | undefined): TiptapBlock[] {
  return ((result?.doc as { content?: TiptapBlock[] } | undefined)?.content ?? []);
}

function devocionary(sections: CirculoDevocionary['sections']): CirculoDevocionary {
  return {
    title: 'Terço da Misericórdia',
    updatedAt: '2026-09-01T12:00:00Z',
    updatedBy: { id: 'u1', name: 'Matheus' },
    sections,
  };
}

describe('migrateLegacyDevocionaryToRichContent', () => {
  it('retorna undefined quando não há seções legadas', () => {
    expect(migrateLegacyDevocionaryToRichContent(devocionary(undefined))).toBeUndefined();
    expect(migrateLegacyDevocionaryToRichContent(devocionary([]))).toBeUndefined();
  });

  it('converte título e subtítulo da seção em headings de nível 2 e 3', () => {
    const blocks = blocksOf(
      migrateLegacyDevocionaryToRichContent(
        devocionary([{ id: 's1', title: 'Introdução', subtitle: 'Como rezar', items: [] }]),
      ),
    );

    expect(blocks[0]).toMatchObject({ type: 'heading', attrs: { level: 2 } });
    expect(blocks[1]).toMatchObject({ type: 'heading', attrs: { level: 3 } });
  });

  it('transforma item TEXT em parágrafo e item PRAYER em nó de referência', () => {
    const blocks = blocksOf(
      migrateLegacyDevocionaryToRichContent(
        devocionary([
          {
            id: 's1',
            title: 'Mistério 1',
            items: [
              { id: 'i1', kind: 'TEXT', text: 'Pai Nosso que estais no céu' },
              { id: 'i2', kind: 'PRAYER', refPrayerId: 'ave-maria' },
            ],
          },
        ]),
      ),
    );

    const paragraph = blocks.find((b) => b.type === 'paragraph');
    expect(paragraph?.content?.[0]?.text).toBe('Pai Nosso que estais no céu');

    const ref = blocks.find((b) => b.attrs?.prayerId === 'ave-maria');
    expect(ref?.attrs).toMatchObject({ prayerId: 'ave-maria', kind: 'PRAYER' });
  });

  it('ignora item de oração sem refPrayerId', () => {
    const blocks = blocksOf(
      migrateLegacyDevocionaryToRichContent(
        devocionary([{ id: 's1', title: 'X', items: [{ id: 'i1', kind: 'PRAYER' }] }]),
      ),
    );

    expect(blocks.some((b) => b.attrs?.prayerId)).toBe(false);
  });

  it('separa seções consecutivas com uma linha horizontal, sem sobra no fim', () => {
    const blocks = blocksOf(
      migrateLegacyDevocionaryToRichContent(
        devocionary([
          { id: 's1', title: 'A', items: [] },
          { id: 's2', title: 'B', items: [] },
        ]),
      ),
    );

    const rules = blocks.filter((b) => b.type === 'horizontalRule');
    expect(rules).toHaveLength(1);
    expect(blocks.at(-1)?.type).not.toBe('horizontalRule');
  });
});

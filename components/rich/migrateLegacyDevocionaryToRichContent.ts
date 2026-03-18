import { CirculoDevocionary, RichContent } from '../../types';
import { PrayerRefNodeName } from './PrayerRefExtension';

function createParagraph(text: string) {
  return {
    type: 'paragraph',
    content: text ? [{ type: 'text', text }] : [{ type: 'text', text: '' }],
  };
}

function createHeading(level: number, text: string) {
  return {
    type: 'heading',
    attrs: { level },
    content: text ? [{ type: 'text', text }] : [{ type: 'text', text: '' }],
  };
}

export function migrateLegacyDevocionaryToRichContent(devocionary: CirculoDevocionary): RichContent | undefined {
  const sections = devocionary.sections;
  if (!sections || sections.length === 0) return undefined;

  const contentBlocks: any[] = [];

  sections.forEach((sec, idx) => {
    if (sec.title) contentBlocks.push(createHeading(2, sec.title));
    if (sec.subtitle) contentBlocks.push(createHeading(3, sec.subtitle));

    // Se já existir conteúdo rico na seção, reutilizamos os blocos.
    if (sec.content?.type === 'tiptap' && (sec.content.doc as any)?.content) {
      contentBlocks.push(...((sec.content.doc as any).content as any[]));
    }

    // Itens legados viram `PrayerRef` (para PRAYER/DEVOTION) ou parágrafo (TEXT).
    sec.items?.forEach((it) => {
      if (it.kind === 'TEXT') {
        contentBlocks.push(createParagraph(it.text || ''));
        return;
      }

      if (!it.refPrayerId) return;
      contentBlocks.push({
        type: PrayerRefNodeName,
        attrs: { prayerId: it.refPrayerId, kind: it.kind },
      });
    });

    if (idx < sections.length - 1) {
      contentBlocks.push({ type: 'horizontalRule' });
    }
  });

  // fallback se a migração gerar vazio
  const docContent = contentBlocks.length
    ? contentBlocks
    : [createParagraph('')];

  return {
    type: 'tiptap',
    version: 1,
    doc: {
      type: 'doc',
      content: docContent,
    },
  };
}


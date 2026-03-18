import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { Prayer } from '../../types';
import { XIcon } from '../Icons';
import type { DevocionaryTheme, DevocionaryThemeId } from './devocionaryThemes';

export type PrayerRefKind = 'PRAYER' | 'DEVOTION';

export const PrayerRefNodeName = 'prayerRef';

export function createPrayerRefExtension() {
  return Node.create({
    name: PrayerRefNodeName,
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,

    addOptions() {
      return {
        getPrayerById: undefined as undefined | ((id: string) => Prayer | undefined),
        onOpenPrayer: undefined as undefined | ((id: string) => void),
        cardClassName: '',
        headerClassName: '',
        cardTitleClassName: '',
        headerLabelClassName: '',
        tagPillClassName: '',
        themeId: undefined as undefined | DevocionaryThemeId,
      };
    },

    addAttributes() {
      return {
        prayerId: { default: null },
        kind: { default: 'PRAYER' as PrayerRefKind },
      };
    },

    parseHTML() {
      return [{ tag: `div[data-${PrayerRefNodeName}]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { [`data-${PrayerRefNodeName}`]: 'true' }),
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(PrayerRefNodeView);
    },
  });
}

const PrayerRefNodeView: React.FC<any> = (props) => {
  const { node, extension, deleteNode } = props;
  const prayerId = node?.attrs?.prayerId as string | undefined;
  const kind = (node?.attrs?.kind as PrayerRefKind) || 'PRAYER';

  const getPrayerById = extension?.options?.getPrayerById as
    | ((id: string) => Prayer | undefined)
    | undefined;
  const onOpenPrayer = extension?.options?.onOpenPrayer as ((id: string) => void) | undefined;
  const cardClassName = extension?.options?.cardClassName as string | undefined;
  const headerClassName = extension?.options?.headerClassName as string | undefined;
  const cardTitleClassName = extension?.options?.cardTitleClassName as string | undefined;
  const headerLabelTextClassName = extension?.options?.headerLabelClassName as string | undefined;
  const tagPillClassName = extension?.options?.tagPillClassName as string | undefined;

  const p = prayerId && getPrayerById ? getPrayerById(prayerId) : undefined;

  return (
    <NodeViewWrapper className="not-prose">
      <div
        className={[
          'rounded-2xl border shadow-sm overflow-hidden',
          'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
          cardClassName || '',
        ].join(' ')}
      >
        <div
          className={[
            'px-4 py-2 flex items-center justify-between',
            'bg-gray-50 dark:bg-gray-900/60',
            headerClassName || '',
          ].join(' ')}
        >
          <div
            className={`text-[10px] font-black uppercase tracking-[0.18em] ${
              headerLabelTextClassName || 'text-gray-400'
            }`}
          >
            {kind === 'DEVOTION' ? 'Devoção (referência)' : 'Oração (referência)'}
          </div>
          <div className="flex items-center gap-2">
            {prayerId && onOpenPrayer && (
              <button
                type="button"
                onClick={() => onOpenPrayer(prayerId)}
                className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-subtle hover:opacity-80"
              >
                Abrir
              </button>
            )}
            <button
              type="button"
              onClick={() => deleteNode?.()}
              className="p-1 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800/60"
              aria-label="Remover referência"
            >
              <XIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className={cardTitleClassName || 'font-semibold text-gray-900 dark:text-white'}>
            {p?.title || 'Referência não encontrada'}
          </div>
          {p?.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className={
                    tagPillClassName ||
                    'px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-600 dark:text-gray-300'
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
};


import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Prayer, RichContent } from '../../types';
import { createPrayerRefExtension } from './PrayerRefExtension';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import { devocionaryThemes, DevocionaryThemeId } from './devocionaryThemes';

interface RichContentRendererProps {
  content: RichContent;
  prayers: Prayer[];
  onOpenPrayer?: (prayerId: string) => void;
  className?: string;
  themeId?: DevocionaryThemeId;
}

const getPrayerByIdFactory = (prayers: Prayer[]) => (id: string) => prayers.find((p) => p.id === id);

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  prayers,
  onOpenPrayer,
  className,
  themeId,
}) => {
  const theme = themeId ? devocionaryThemes[themeId] : devocionaryThemes.BRANCO_DOURADO;
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'my-4 border-gray-200 dark:border-gray-700',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800',
        },
      }),
      createPrayerRefExtension().configure({
        getPrayerById: getPrayerByIdFactory(prayers),
        onOpenPrayer,
        cardClassName: theme.prayerRefCardClassName,
        headerClassName: theme.prayerRefHeaderClassName,
        cardTitleClassName: theme.prayerRefCardTitleClassName,
        headerLabelClassName: theme.prayerRefHeaderLabelClassName,
        tagPillClassName: theme.prayerRefTagPillClassName,
      }),
    ],
    content: content?.type === 'tiptap' ? (content.doc as any) : undefined,
    editorProps: {
      attributes: {
        class: className
          ? `${className} ${theme.docClassName}`
          : `prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 ${theme.docClassName}`,
      },
    },
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
};


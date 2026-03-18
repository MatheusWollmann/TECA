import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import { Prayer, RichContent } from '../../types';
import { createPrayerRefExtension } from './PrayerRefExtension';
import { devocionaryThemes, DevocionaryThemeId } from './devocionaryThemes';

type InsertKind = 'PRAYER' | 'DEVOTION';

interface RichEditorProps {
  value: RichContent | null | undefined;
  onChange: (next: RichContent) => void;
  prayers: Prayer[];
  placeholder?: string;
  title?: string;
  onOpenPrayer?: (prayerId: string) => void;
  themeId?: DevocionaryThemeId;
  autoFocus?: boolean;
}

function emptyDoc(): any {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
  };
}

function normalizeValue(v: RichContent | null | undefined): RichContent {
  if (v && v.type === 'tiptap' && v.version === 1 && v.doc) return v;
  return { type: 'tiptap', version: 1, doc: emptyDoc() };
}

function kindFromPrayer(p: Prayer): InsertKind {
  return p.isDevotion ? 'DEVOTION' : 'PRAYER';
}

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  prayers,
  placeholder,
  title,
  onOpenPrayer,
  themeId,
  autoFocus,
}) => {
  const normalized = useMemo(() => normalizeValue(value), [value]);
  const [query, setQuery] = useState('');
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isInsertingImage, setIsInsertingImage] = useState(false);

  const theme = themeId ? devocionaryThemes[themeId] : devocionaryThemes.BRANCO_DOURADO;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prayers;
    return prayers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.authorName.toLowerCase().includes(q),
    );
  }, [prayers, query]);

  const getPrayerById = useMemo(() => (id: string) => prayers.find((p) => p.id === id), [prayers]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Escreva aqui…',
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'my-4 border-gray-200 dark:border-gray-700',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true, // permite inserir dataURL persistindo no mock
        HTMLAttributes: {
          class:
            'mx-auto max-w-full w-auto max-h-[420px] object-contain rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800',
        },
      }),
      createPrayerRefExtension().configure({
        getPrayerById,
        onOpenPrayer,
        cardClassName: theme.prayerRefCardClassName,
        headerClassName: theme.prayerRefHeaderClassName,
        cardTitleClassName: theme.prayerRefCardTitleClassName,
        headerLabelClassName: theme.prayerRefHeaderLabelClassName,
        tagPillClassName: theme.prayerRefTagPillClassName,
      }),
    ],
    content: normalized.doc as any,
    editorProps: {
      attributes: {
        class:
          'min-h-[260px] prose prose-base dark:prose-invert max-w-none outline-none ' +
          `prose-p:my-2 prose-p:leading-relaxed prose-ol:my-2 prose-ul:my-2 ${theme.docClassName}`,
      },
    },
    onUpdate({ editor }) {
      const doc = editor.getJSON();
      onChange({ type: 'tiptap', version: 1, doc });
    },
  });

  useEffect(() => {
    if (!editor || !autoFocus) return;
    // garante que o caret fique no editor ao entrar no modo de edição
    requestAnimationFrame(() => {
      editor.chain().focus().run();
      const dom = editor.view?.dom as HTMLElement | undefined;
      dom?.focus?.();
    });
  }, [editor, autoFocus]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    // Evitar loop: só atualiza se realmente mudou.
    if (JSON.stringify(current) !== JSON.stringify(normalized.doc)) {
      editor.commands.setContent(normalized.doc as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, normalized.doc]);

  useEffect(() => {
    if (!editor || !editorHostRef.current) return;
    const el = editorHostRef.current;

    const onDrop = (e: DragEvent) => {
      const raw = e.dataTransfer?.getData('application/x-teca-prayer-ref');
      if (!raw) return;
      e.preventDefault();
      e.stopPropagation();

      let parsed: { prayerId: string; kind: InsertKind } | null = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      if (!parsed?.prayerId) return;

      const coords = { left: e.clientX, top: e.clientY };
      const pos = editor.view.posAtCoords(coords)?.pos;
      const node = { type: 'prayerRef', attrs: { prayerId: parsed.prayerId, kind: parsed.kind } };
      if (typeof pos === 'number') {
        editor.chain().focus().insertContentAt(pos, node).run();
      } else {
        editor.chain().focus().insertContent(node).run();
      }
    };

    const onDragOver = (e: DragEvent) => {
      const raw = e.dataTransfer?.types?.includes('application/x-teca-prayer-ref');
      if (raw) e.preventDefault();
    };

    el.addEventListener('drop', onDrop as any);
    el.addEventListener('dragover', onDragOver as any);
    return () => {
      el.removeEventListener('drop', onDrop as any);
      el.removeEventListener('dragover', onDragOver as any);
    };
  }, [editor]);

  const toolbarBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-[0.18em] transition-colors ${
      active
        ? 'bg-gold-subtle text-white shadow-sm'
        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-gold-subtle/60'
    }`;

  if (!editor) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className={`${theme.docClassName} rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          {title && (
            <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
              {title}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={toolbarBtn(editor.isActive('heading', { level: 1 }))}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              Título
            </button>
            <button
              type="button"
              className={toolbarBtn(editor.isActive('heading', { level: 2 }))}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              Subtítulo
            </button>
            <button
              type="button"
              className={toolbarBtn(editor.isActive('bold'))}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              Negrito
            </button>
            <button
              type="button"
              className={toolbarBtn(editor.isActive('italic'))}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              Itálico
            </button>
            <button
              type="button"
              className={toolbarBtn(editor.isActive('bulletList'))}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              Lista
            </button>
            <button
              type="button"
              className={toolbarBtn(editor.isActive('orderedList'))}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              Lista num.
            </button>
            <button
              type="button"
              className={toolbarBtn(false)}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              Divisão
            </button>
            <button
              type="button"
              className={toolbarBtn(false)}
              onClick={() => fileInputRef.current?.click()}
              disabled={isInsertingImage}
            >
              {isInsertingImage ? 'Inserindo...' : 'Imagem'}
            </button>
          </div>
        </div>

        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              (async () => {
                setIsInsertingImage(true);
                try {
                  if (!file.type.startsWith('image/')) {
                    alert('Arquivo inválido: selecione uma imagem.');
                    return;
                  }

                  const MAX_KB = 200;
                  const MAX_BYTES = MAX_KB * 1024;
                  const MAX_DIM = 1200;

                  const readDataUrl = (blob: Blob) =>
                    new Promise<string>((resolve, reject) => {
                      const r = new FileReader();
                      r.onload = () => resolve(String(r.result));
                      r.onerror = () => reject(new Error('Falha ao ler arquivo.'));
                      r.readAsDataURL(blob);
                    });

                  const initialDataUrl = await readDataUrl(file);

                  const img = new window.Image();
                  img.src = initialDataUrl;
                  await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('Falha ao carregar imagem.'));
                  });

                  const scale = Math.min(
                    1,
                    MAX_DIM / Math.max(1, img.width, img.height),
                  );
                  const width = Math.max(1, Math.round(img.width * scale));
                  const height = Math.max(1, Math.round(img.height * scale));

                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('Canvas não suportado.');

                  ctx.drawImage(img, 0, 0, width, height);

                  let inserted = false;
                  let lastBlob: Blob | null = null;

                  for (let q = 0.9; q >= 0.3; q -= 0.1) {
                    const blob: Blob | null = await new Promise((resolve) => {
                      canvas.toBlob(
                        (b) => resolve(b),
                        'image/jpeg',
                        q,
                      );
                    });
                    if (!blob) continue;
                    lastBlob = blob;

                    if (blob.size <= MAX_BYTES) {
                      const compressedDataUrl = await readDataUrl(blob);
                      editor
                        ?.chain()
                        .focus()
                        .setImage({ src: compressedDataUrl, alt: file.name })
                        .run();
                      inserted = true;
                      break;
                    }
                  }

                  if (!inserted) {
                    alert('Imagem excede 200kb. Tente uma imagem menor.');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Não foi possível inserir a imagem. Tente outra imagem.');
                } finally {
                  setIsInsertingImage(false);
                  // reset para permitir re-upload da mesma imagem
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              })();
            }}
          />

          <div
            ref={editorHostRef}
            className="max-h-[520px] overflow-y-auto rounded-2xl"
            tabIndex={0}
            onMouseDown={() => editor?.commands.focus()}
            onKeyDownCapture={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                // Garante que o cursor se mova de verdade (evita o browser rolar o container)
                e.preventDefault();
                e.stopPropagation();

                editor?.commands.focus();
                const cmd = editor?.commands as any;
                if (e.key === 'ArrowUp') cmd?.goLineUp?.();
                if (e.key === 'ArrowDown') cmd?.goLineDown?.();

                // fallback caso comandos não existam
                if (!cmd?.goLineUp && e.key === 'ArrowUp') cmd?.moveTextBackward?.();
                if (!cmd?.goLineDown && e.key === 'ArrowDown') cmd?.moveTextForward?.();
              }
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <aside className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
            Acervo
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, #tag ou autor…"
            className="mt-3 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm"
          />
          <p className="mt-2 text-[11px] text-gray-400">
            Arraste para o editor ou clique para inserir.
          </p>
        </div>

        <div className="max-h-[520px] overflow-y-auto p-2 space-y-1">
          {filtered.map((p) => {
            const kind = kindFromPrayer(p);
            return (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/x-teca-prayer-ref',
                    JSON.stringify({ prayerId: p.id, kind }),
                  );
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="group rounded-2xl border border-transparent hover:border-gold-subtle/40 hover:bg-gold-subtle/10 transition-colors p-3 cursor-grab active:cursor-grabbing"
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'prayerRef', attrs: { prayerId: p.id, kind } })
                    .run();
                }}
                role="button"
                tabIndex={0}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {kind === 'DEVOTION' ? 'Devoção' : 'Oração'}
                </div>
                <div className="mt-1 font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {p.title}
                </div>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                  {p.authorName}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
              Nenhuma oração encontrada para esse termo.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};


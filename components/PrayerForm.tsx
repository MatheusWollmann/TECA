
import React, { useState } from 'react';
import { Prayer, PrayerCategory, User } from '../types';
import { PRAYER_CATEGORIES } from '../constants';

interface PrayerFormProps {
    user: User;
    prayers: Prayer[];
    initialData?: Prayer;
    onSubmit: (prayerData: Partial<Prayer>) => void;
    onClose: () => void;
    isDevotionForm?: boolean;
}

export const RichTextEditor: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
    rows?: number;
}> = ({ value, onChange, label, rows = 6 }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                rows={rows}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle resize-y p-2 text-sm"
            />
        </div>
    );
};


const PrayerForm: React.FC<PrayerFormProps> = ({ user, prayers, initialData, onSubmit, onClose, isDevotionForm = false }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [text, setText] = useState(initialData?.text || '');
    const [latinText, setLatinText] = useState(initialData?.latinText || '');
    const [category, setCategory] = useState<PrayerCategory>(initialData?.category || PrayerCategory.Diarias);
    const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
    const [parentPrayerId, setParentPrayerId] = useState(initialData?.parentPrayerId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            text,
            latinText: latinText || undefined,
            category,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            parentPrayerId: parentPrayerId || undefined,
            isDevotion: isDevotionForm,
        });
    };
    
    const availableParentPrayers = prayers.filter(p => p.id !== initialData?.id);

    return (
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Título da {isDevotionForm ? 'Devoção' : 'Oração'}
                    </label>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Um nome curto e claro. Ex.: &quot;Pai Nosso&quot;, &quot;Santo Rosário&quot;.
                    </p>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder={isDevotionForm ? 'Ex.: Santo Rosário' : 'Ex.: Oração pela Família'}
                        className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle"
                    />
                </div>
                
                <div className="space-y-2">
                    <RichTextEditor
                        label={isDevotionForm ? "Texto ou roteiro da devoção" : "Texto da oração"}
                        value={text}
                        onChange={setText}
                    />
                </div>

                {!isDevotionForm && (
                    <div className="space-y-1">
                        <RichTextEditor
                            label="Texto em latim (opcional)"
                            value={latinText}
                            onChange={setLatinText}
                            rows={4}
                        />
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Use apenas se fizer sentido para a oração (ex.: &quot;Ave Maria&quot;, &quot;Credo&quot;).
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                            Ajuda a organizar o acervo por temas (diárias, marianas, santos...).
                        </p>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as PrayerCategory)}
                            className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle"
                        >
                            {PRAYER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Oração principal (opcional)
                        </label>
                        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                            Use quando esta oração fizer parte de outra maior (ex.: &quot;Ave Maria&quot; dentro do &quot;Santo Rosário&quot;).
                        </p>
                        <select
                            value={parentPrayerId}
                            onChange={(e) => setParentPrayerId(e.target.value)}
                            className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle"
                        >
                            <option value="">Nenhuma</option>
                            {availableParentPrayers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tags (separadas por vírgula)
                    </label>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Ajuda outras pessoas a encontrarem esta oração. Ex.: <code className="px-1 rounded bg-gray-100 dark:bg-gray-800">#fé, #família, #SãoFrancisco</code>
                    </p>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="#fé, #esperança"
                        className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle"
                    />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-gold-subtle rounded-md hover:opacity-90"
                    >
                        {initialData
                            ? 'Salvar alterações'
                            : isDevotionForm
                                ? 'Adicionar devoção'
                                : 'Adicionar oração'}
                    </button>
                </div>
            </form>
    );
};

export default PrayerForm;

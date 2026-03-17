
import React, { useState, useRef, useCallback } from 'react';
import { Prayer, PrayerCategory, User } from '../types';
import { PRAYER_CATEGORIES } from '../constants';
import { BoldIcon, ItalicIcon, ListIcon, BookOpenIcon } from './Icons';
import Modal from './Modal';

interface PrayerFormProps {
    user: User;
    prayers: Prayer[];
    initialData?: Prayer;
    onSubmit: (prayerData: Partial<Prayer>) => void;
    onClose: () => void;
    isDevotionForm?: boolean;
}

const SelectPrayerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    prayers: Prayer[];
    onSelect: (prayerId: string) => void;
}> = ({ isOpen, onClose, prayers, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredPrayers = prayers.filter(p => !p.isDevotion && p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lincar Oração">
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Buscar oração pelo título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle focus:outline-none"
                />
                <div className="max-h-80 overflow-y-auto pr-2">
                    <ul className="space-y-1">
                    {filteredPrayers.length > 0 ? filteredPrayers.map(prayer => (
                        <li key={prayer.id}>
                        <button 
                            onClick={() => { onSelect(prayer.id); onClose(); }} 
                            className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{prayer.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{prayer.category}</p>
                        </button>
                        </li>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhuma oração encontrada.</p>
                    )}
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export const RichTextEditor: React.FC<{ 
    value: string; 
    onChange: (value: string) => void; 
    label: string; 
    rows?: number;
    showPrayerLink?: boolean;
    onPrayerLink: () => void;
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
    const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
    const textRef = useRef<HTMLTextAreaElement>(null);


    const handleInsertPrayerLink = (prayerId: string) => {
        const link = `[prayer:${prayerId}]`;
        // This is a simplified insertion, a more robust solution would use cursor position
        setText(currentText => `${currentText}\n${link}`);
    };

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
        <>
            <SelectPrayerModal
                isOpen={isPrayerModalOpen}
                onClose={() => setIsPrayerModalOpen(false)}
                prayers={prayers}
                onSelect={handleInsertPrayerLink}
            />
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
                        showPrayerLink={isDevotionForm}
                        onPrayerLink={() => setIsPrayerModalOpen(true)}
                    />
                    {isDevotionForm && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Use o botão com o ícone de livro para inserir partes da devoção, como
                            {' '}
                            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">[prayer:p1]</code>,
                            e elas aparecerão automaticamente na leitura.
                        </p>
                    )}
                </div>

                {!isDevotionForm && (
                    <div className="space-y-1">
                        <RichTextEditor
                            label="Texto em latim (opcional)"
                            value={latinText}
                            onChange={setLatinText}
                            rows={4}
                            onPrayerLink={() => {}}
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
        </>
    );
};

export default PrayerForm;

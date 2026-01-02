
import React, { useState, useRef, useCallback } from 'react';
import { Prayer, PrayerCategory, User } from '../types';
import { PRAYER_CATEGORIES } from '../constants';
import { BoldIcon, ItalicIcon, ListIcon, PilcrowIcon, BookOpenIcon } from './Icons';
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

const RichTextEditor: React.FC<{ 
    value: string; 
    onChange: (value: string) => void; 
    label: string; 
    rows?: number;
    showPrayerLink?: boolean;
    onPrayerLink: () => void;
}> = ({ value, onChange, label, rows = 6, showPrayerLink, onPrayerLink }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyStyle = useCallback((style: 'b' | 'i' | 'p' | 'ul') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        let newText;

        if (style === 'ul') {
            const lines = selectedText.split('\n').map(line => `<li>${line}</li>`);
            const wrappedText = `<ul>\n${lines.join('\n')}\n</ul>`;
            newText = `${value.substring(0, start)}${wrappedText}${value.substring(end)}`;
        } else {
            const wrappedText = `<${style}>${selectedText}</${style}>`;
            newText = `${value.substring(0, start)}${wrappedText}${value.substring(end)}`;
        }

        onChange(newText);
    }, [value, onChange]);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="rounded-md border border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-t-md border-b border-gray-200 dark:border-gray-600">
                    <button type="button" onClick={() => applyStyle('b')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><BoldIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={() => applyStyle('i')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><ItalicIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={() => applyStyle('p')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><PilcrowIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={() => applyStyle('ul')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><ListIcon className="w-4 h-4" /></button>
                    {showPrayerLink && <button type="button" onClick={onPrayerLink} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><BookOpenIcon className="w-4 h-4" /></button>}
                </div>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    rows={rows}
                    className="block w-full rounded-b-md border-0 bg-white dark:bg-gray-800 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle resize-y p-2"
                />
            </div>
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
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" />
                </div>
                
                <RichTextEditor 
                    label="Texto da Oração" 
                    value={text} 
                    onChange={setText} 
                    showPrayerLink={isDevotionForm}
                    onPrayerLink={() => setIsPrayerModalOpen(true)}
                />
                {!isDevotionForm && <RichTextEditor label="Texto em Latim (Opcional)" value={latinText} onChange={setLatinText} rows={4} onPrayerLink={() => {}}/>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as PrayerCategory)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle">
                            {PRAYER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oração Principal (Opcional)</label>
                        <select value={parentPrayerId} onChange={(e) => setParentPrayerId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle">
                            <option value="">Nenhuma</option>
                            {availableParentPrayers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (separadas por vírgula)</label>
                    <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#fé, #esperança" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gold-subtle rounded-md hover:opacity-90">
                        {initialData ? 'Salvar Alterações' : isDevotionForm ? 'Adicionar Devoção' : 'Adicionar Oração'}
                    </button>
                </div>
            </form>
        </>
    );
};

export default PrayerForm;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Circulo,
  User,
  Post,
  Prayer,
  CirculoScheduleItem,
  CirculoDevocionary,
  CirculoDevocionaryItemKind,
  RichContent,
} from '../types';
import { api } from '../api';
import { ArrowLeftIcon, SendIcon, UsersIcon, MessageSquareIcon, SmileIcon, MoreVerticalIcon, PinIcon, Trash2Icon, EditIcon, CrownIcon, CalendarIcon, PlusCircleIcon, LoaderIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { RichEditor } from '../components/rich/RichEditor';
import { RichContentRenderer } from '../components/rich/RichContentRenderer';
import { migrateLegacyDevocionaryToRichContent } from '../components/rich/migrateLegacyDevocionaryToRichContent';
import { devocionaryThemes } from '../components/rich/devocionaryThemes';

interface CirculoDetailScreenProps {
  circulo: Circulo;
  user: User;
  prayers: Prayer[];
  onBack: () => void;
  onSelectPrayer: (prayerId: string) => void;
  onToggleMembership: (circuloId: string) => void;
  onAddPost: (circuloId: string, text: string) => void;
  onAddReply: (circuloId: string, postId: string, text: string) => void;
  onPostReaction: (circuloId: string, postId: string, emoji: string) => void;
  onUpdateCirculo: (circuloId: string, data: Partial<Circulo>) => void;
  onDeletePost: (circuloId: string, postId: string) => void;
  onPinPost: (circuloId: string, postId: string) => void;
  onUpdateMemberRole: (circuloId: string, memberId: string, isModerator: boolean) => void;
  onRemoveMember: (circuloId: string, memberId: string) => void;
  onAddScheduleItem: (circuloId: string, item: Omit<CirculoScheduleItem, 'id'>) => void;
  onUpdateScheduleItem: (circuloId: string, itemId: string, item: Omit<CirculoScheduleItem, 'id'>) => void;
  onDeleteScheduleItem: (circuloId: string, itemId: string) => void;
}

const ReplyForm: React.FC<{ user: User; onSubmit: (text: string) => void; onCancel: () => void; }> = ({ user, onSubmit, onCancel }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim());
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-start space-x-2 mt-2 pl-12">
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
            <div className="flex-1">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    rows={1}
                    className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm border border-transparent focus:ring-1 focus:ring-gold-subtle focus:outline-none focus:border-gold-subtle transition"
                />
                <div className="flex items-center justify-end space-x-2 mt-1">
                    <button type="button" onClick={onCancel} className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancelar</button>
                    <button type="submit" className="px-3 py-1 bg-gold-subtle text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50" disabled={!text.trim()}>
                        Enviar
                    </button>
                </div>
            </div>
        </form>
    );
};


const PostCard: React.FC<{ 
    post: Post; 
    user: User;
    isModerator: boolean;
    onReaction: (postId: string, emoji: string) => void; 
    onAddReply: (postId: string, text: string) => void;
    onDelete: (postId: string) => void;
    onPin: (postId: string) => void;
    replyingTo: string | null;
    setReplyingTo: (postId: string | null) => void;
    isReply?: boolean 
}> = ({ post, user, isModerator, onReaction, onAddReply, onDelete, onPin, replyingTo, setReplyingTo, isReply = false }) => {
    const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false);
    const [moderatorMenuOpen, setModeratorMenuOpen] = useState(false);
    const reactionPopoverRef = useRef<HTMLDivElement>(null);
    const moderatorMenuRef = useRef<HTMLDivElement>(null);
    const reactions = ['❤️', '🙏', '😊', '😢'];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (reactionPopoverRef.current && !reactionPopoverRef.current.contains(event.target as Node)) {
                setReactionPopoverOpen(false);
            }
             if (moderatorMenuRef.current && !moderatorMenuRef.current.contains(event.target as Node)) {
                setModeratorMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const userReaction = post.reactions.find(r => r.userId === user.id);
    const totalReactions = post.reactions.length;

    // FIX: Explicitly type the accumulator of the reduce function to ensure TypeScript correctly infers the type of `reactionSummary`.
    // This allows `countA` and `countB` in the sort function to be correctly typed as numbers.
    const reactionSummary = post.reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // FIX: Explicitly typed parameters in sort to avoid arithmetic error on line 113.
    const sortedReactions = Object.entries(reactionSummary)
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
        .map(([emoji]) => emoji);

    const topReactions = sortedReactions.slice(0, 3);

    const handleReactionClick = (emoji: string) => {
        onReaction(post.id, emoji);
        setReactionPopoverOpen(false);
    };
    
    const handleDeleteClick = () => {
        if (window.confirm('Tem certeza que deseja deletar esta postagem? A ação não pode ser desfeita.')) {
            onDelete(post.id);
        }
        setModeratorMenuOpen(false);
    };

    const handlePinClick = () => {
        onPin(post.id);
        setModeratorMenuOpen(false);
    }

    const isReplying = replyingTo === post.id;

    return (
    <div className={`flex items-start space-x-3 ${isReply ? 'mt-3' : ''}`}>
        <img src={post.authorAvatarUrl} alt={post.authorName} className="w-10 h-10 rounded-full" />
        <div className="flex-1">
            <div className={`bg-white dark:bg-gray-700/50 rounded-lg p-3 pb-4 relative ${post.isPinned ? 'border-2 border-gold-subtle' : ''}`}>
                 {post.isPinned && <div className="absolute -top-3 -left-3 bg-gold-subtle p-1.5 rounded-full shadow"><PinIcon className="w-4 h-4 text-white"/></div>}
                <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{post.authorName}</p>
                    <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500">{post.createdAt}</p>
                        {isModerator && (
                            <div className="relative">
                                <button onClick={() => setModeratorMenuOpen(!moderatorMenuOpen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <MoreVerticalIcon className="w-4 h-4" />
                                </button>
                                {moderatorMenuOpen && (
                                    <div ref={moderatorMenuRef} className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                                        {!isReply && (
                                            <button onClick={handlePinClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <PinIcon className="w-4 h-4 mr-2"/> {post.isPinned ? 'Desafixar' : 'Fixar Post'}
                                            </button>
                                        )}
                                        <button onClick={handleDeleteClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                                            <Trash2Icon className="w-4 h-4 mr-2"/> Deletar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{post.text}</p>
                {totalReactions > 0 && (
                    <div className="absolute bottom-1 right-2 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 shadow-sm">
                        {topReactions.map(emoji => <span key={emoji} className="text-sm">{emoji}</span>)}
                        <span className="text-xs ml-1.5 text-gray-600 dark:text-gray-300 font-semibold">{totalReactions}</span>
                    </div>
                )}
            </div>
            <div className="relative flex items-center space-x-4 mt-1 pl-2">
                {reactionPopoverOpen && (
                    <div ref={reactionPopoverRef} className="absolute -top-10 left-0 bg-white dark:bg-gray-600 rounded-full shadow-lg p-1 flex space-x-1 z-10 border border-gray-200 dark:border-gray-500">
                        {reactions.map(emoji => (
                            <button key={emoji} onClick={() => handleReactionClick(emoji)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-transform transform hover:scale-125">
                                <span className="text-lg">{emoji}</span>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={() => setReactionPopoverOpen(!reactionPopoverOpen)} className="flex items-center text-xs font-medium text-gray-500 hover:text-gold-subtle dark:text-gray-400 dark:hover:text-gold-subtle">
                     {userReaction ? (
                        <span className="text-base mr-1">{userReaction.emoji}</span>
                    ) : (
                        <SmileIcon className="w-4 h-4 mr-1" />
                    )}
                    <span className={userReaction ? 'text-gold-subtle' : ''}>Reagir</span>
                </button>
                 <button onClick={() => setReplyingTo(isReplying ? null : post.id)} className="flex items-center text-xs font-medium text-gray-500 hover:text-gold-subtle dark:text-gray-400 dark:hover:text-gold-subtle">
                    <MessageSquareIcon className="w-4 h-4 mr-1"/> {isReplying ? 'Cancelar' : 'Responder'}
                </button>
            </div>
            {isReplying && <ReplyForm user={user} onSubmit={(text) => onAddReply(post.id, text)} onCancel={() => setReplyingTo(null)}/>}

            {post.replies && post.replies.length > 0 && (
                <div className="mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3 space-y-2">
                    {post.replies.map(reply => <PostCard key={reply.id} post={reply} user={user} onReaction={onReaction} onAddReply={onAddReply} replyingTo={replyingTo} setReplyingTo={setReplyingTo} isModerator={isModerator} onDelete={onDelete} onPin={onPin} isReply />)}
                </div>
            )}
        </div>
    </div>
)};

const CreatePostForm: React.FC<{ user: User; onSubmit: (text: string) => void; }> = ({ user, onSubmit }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim());
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Partilhe uma oração, testemunho ou pedido..."
                    rows={2}
                    className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 border border-transparent focus:ring-2 focus:ring-gold-subtle focus:outline-none focus:border-gold-subtle transition"
                />
            </div>
            <button type="submit" className="self-end p-2.5 bg-gold-subtle text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!text.trim()} aria-label="Postar">
                <SendIcon className="w-5 h-5" />
            </button>
        </form>
    );
};

const CirculoEditModal: React.FC<{circulo: Circulo; onClose: () => void; onSave: (data: Partial<Circulo>) => void;}> = ({ circulo, onClose, onSave }) => {
    const [name, setName] = useState(circulo.name);
    const [description, setDescription] = useState(circulo.description);
    const [imageUrl, setImageUrl] = useState(circulo.imageUrl);
    const [coverImageUrl, setCoverImageUrl] = useState(circulo.coverImageUrl);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, description, imageUrl, coverImageUrl });
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Editar Círculo">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Círculo</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL da Imagem de Perfil</label>
                    <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL da Imagem de Capa</label>
                    <input type="text" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gold-subtle rounded-md hover:opacity-90">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

const ScheduleFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<CirculoScheduleItem, 'id'>) => void;
    prayers: Prayer[];
    initialData?: CirculoScheduleItem | null;
}> = ({ isOpen, onClose, onSave, prayers, initialData }) => {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [prayerId, setPrayerId] = useState('');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setTime(initialData.time);
            setPrayerId(initialData.prayerId);
        } else {
            setTitle('');
            setTime('');
            setPrayerId('');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && time && prayerId) {
            onSave({ title, time, prayerId });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Cronograma' : 'Adicionar ao Cronograma'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" placeholder="Ex: Terço Semanal" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Horário</label>
                    <input type="text" value={time} onChange={e => setTime(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle" placeholder="Ex: Toda Segunda, 21h" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oração</label>
                    <select value={prayerId} onChange={e => setPrayerId(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle">
                        <option value="" disabled>Selecione uma oração</option>
                        {prayers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gold-subtle rounded-md hover:opacity-90">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};


const CirculoDetailScreen: React.FC<CirculoDetailScreenProps> = (props) => {
  const { circulo, user, prayers, onBack, onSelectPrayer, onToggleMembership, onAddPost, onAddReply, onPostReaction, onUpdateCirculo, onDeletePost, onPinPost, onUpdateMemberRole, onRemoveMember, onAddScheduleItem, onUpdateScheduleItem, onDeleteScheduleItem } = props;
  const isMember = user.joinedCirculoIds.includes(circulo.id);
  const isModerator = circulo.moderatorIds.includes(user.id);
  const [activeTab, setActiveTab] = useState<'feed' | 'devocionary' | 'about' | 'members' | 'manage'>('feed');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [members, setMembers] = useState<User[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [openMemberMenu, setOpenMemberMenu] = useState<string | null>(null);
  const memberMenuRef = useRef<HTMLDivElement>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<CirculoScheduleItem | null>(null);

  const defaultDevocionary: CirculoDevocionary = useMemo(
    () => ({
      title: `Devocionário do ${circulo.name}`,
      updatedAt: 'Agora',
      updatedBy: { id: user.id, name: user.name },
      themeId: 'BRANCO_DOURADO',
      content: undefined,
      sections: [],
    }),
    [circulo.name, user.id, user.name],
  );

  const [isEditingDevocionary, setIsEditingDevocionary] = useState(false);
  const [devocionaryDraft, setDevocionaryDraft] = useState<CirculoDevocionary>(
    circulo.devocionary || defaultDevocionary,
  );

  const activeDevocTheme =
    devocionaryThemes[devocionaryDraft.themeId || 'BRANCO_DOURADO'];
  const [openDevocionaryPrayerId, setOpenDevocionaryPrayerId] = useState<string | null>(null);

  useEffect(() => {
    setDevocionaryDraft(circulo.devocionary || defaultDevocionary);
  }, [circulo.devocionary, defaultDevocionary]);

  const openDevocionaryPrayer = useMemo(() => {
    if (!openDevocionaryPrayerId) return null;
    return prayers.find((p) => p.id === openDevocionaryPrayerId) || null;
  }, [openDevocionaryPrayerId, prayers]);

  // Migração suave: se o devocionário antigo não tiver `content`,
  // convertemos `sections` + `items` para o novo documento único.
  const migratedDevocionaryContent = useMemo(() => {
    if (devocionaryDraft.content) return undefined;
    if (!devocionaryDraft.sections?.length) return undefined;
    return migrateLegacyDevocionaryToRichContent(devocionaryDraft);
  }, [devocionaryDraft.content, devocionaryDraft.sections]);

  useEffect(() => {
    if (!devocionaryDraft.content && migratedDevocionaryContent) {
      setDevocionaryDraft((curr) => ({
        ...curr,
        themeId: curr.themeId || 'BRANCO_DOURADO',
        content: migratedDevocionaryContent,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migratedDevocionaryContent]);

  useEffect(() => {
    if (activeTab === 'members' && !members) {
      setMembersLoading(true);
      api.getCirculoMembers(circulo.id).then(fetchedMembers => {
        setMembers(fetchedMembers);
        setMembersLoading(false);
      });
    }
  }, [activeTab, circulo.id, members]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
         if (memberMenuRef.current && !memberMenuRef.current.contains(event.target as Node)) {
            setOpenMemberMenu(null);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddReply = (postId: string, text: string) => {
    onAddReply(circulo.id, postId, text);
    setReplyingTo(null);
  };
  
  const sortedPosts = [...circulo.posts].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const handleSaveSchedule = (item: Omit<CirculoScheduleItem, 'id'>) => {
    if (editingScheduleItem) {
        onUpdateScheduleItem(circulo.id, editingScheduleItem.id, item);
    } else {
        onAddScheduleItem(circulo.id, item);
    }
    setIsScheduleModalOpen(false);
    setEditingScheduleItem(null);
  };

  const openScheduleModal = (item: CirculoScheduleItem | null = null) => {
    setEditingScheduleItem(item);
    setIsScheduleModalOpen(true);
  }

  return (
    <div className="animate-fade-in">
        {openDevocionaryPrayer && (
          <Modal
            isOpen={true}
            onClose={() => setOpenDevocionaryPrayerId(null)}
            title={openDevocionaryPrayer.title}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold-subtle uppercase tracking-widest">
                  {openDevocionaryPrayer.isDevotion ? 'Devoção' : openDevocionaryPrayer.category}
                </span>
              </div>

              <div
                className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: openDevocionaryPrayer.text
                    .replace(/\n/g, '<br/>')
                    .replace(/\[prayer:(p[\w-]+)\]/g, (_m: string, id: string) => {
                      const linked = prayers.find((p) => p.id === id);
                      return linked
                        ? `<span class="text-gold-subtle font-semibold">${linked.title}</span>`
                        : '[Oração não encontrada]';
                    }),
                }}
              />

              {openDevocionaryPrayer.latinText && (
                <details className="group">
                  <summary className="text-xs font-bold text-gold-subtle cursor-pointer hover:underline">
                    Ver em latim
                  </summary>
                  <div
                    className="mt-2 prose dark:prose-invert max-w-none text-sm italic text-gray-600 dark:text-gray-400"
                    dangerouslySetInnerHTML={{
                      __html: openDevocionaryPrayer.latinText.replace(/\n/g, '<br/>'),
                    }}
                  />
                </details>
              )}

              <div className="flex flex-wrap gap-2">
                {openDevocionaryPrayer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                <span>
                  Por <span className="font-semibold text-gray-600 dark:text-gray-300">{openDevocionaryPrayer.authorName}</span>
                </span>
                <span className="mx-2">&middot;</span>
                <span>{openDevocionaryPrayer.createdAt}</span>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setOpenDevocionaryPrayerId(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-100 hover:opacity-90"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const pid = openDevocionaryPrayer.id;
                    setOpenDevocionaryPrayerId(null);
                    onSelectPrayer(pid);
                  }}
                  className="px-4 py-2 rounded-lg bg-gold-subtle text-white text-sm font-bold hover:opacity-90"
                >
                  Abrir página completa
                </button>
              </div>
            </div>
          </Modal>
        )}
        {isEditModalOpen && (
            <CirculoEditModal 
                circulo={circulo} 
                onClose={() => setIsEditModalOpen(false)}
                onSave={(data) => onUpdateCirculo(circulo.id, data)}
            />
        )}
        <ScheduleFormModal 
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            onSave={handleSaveSchedule}
            prayers={prayers}
            initialData={editingScheduleItem}
        />
      <div className="flex items-center mb-4 md:hidden">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Voltar">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
        <div className="relative">
            <img className="h-40 md:h-56 w-full object-cover" src={circulo.coverImageUrl} alt={`${circulo.name} cover`} />
            <div className="absolute -bottom-12 left-6">
                <img className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800" src={circulo.imageUrl} alt={circulo.name}/>
            </div>
        </div>
        <div className="flex justify-between items-start pt-16 px-6 pb-6">
            <div>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{circulo.name}</h1>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mt-2">
                    <UsersIcon className="w-5 h-5 mr-2" />
                    <span>{circulo.memberCount.toLocaleString()} membros</span>
                </div>
            </div>
            <button
                onClick={() => onToggleMembership(circulo.id)}
                className={`font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap ${
                    isMember
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-gold-subtle text-white hover:opacity-90'
                }`}
            >
                {isMember ? 'Sair' : 'Entrar'}
            </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {[
            { key: 'feed', name: 'Feed' },
            { key: 'devocionary', name: 'Devocionário' },
            { key: 'about', name: 'Sobre' },
            { key: 'members', name: 'Membros' },
            { key: 'manage', name: 'Gerenciar', moderatorOnly: true },
          ].map((tab) => {
            if (tab.moderatorOnly && !isModerator) return null;
            return (
                 <button key={tab.name} onClick={() => setActiveTab(tab.key as any)}
                    className={`${
                        activeTab === tab.key
                        ? 'border-gold-subtle text-gold-subtle'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                    {tab.name}
                </button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'feed' && (
        <div>
            {isMember && <CreatePostForm user={user} onSubmit={(text) => onAddPost(circulo.id, text)} />}
            <div className="space-y-4 mt-4">
                {sortedPosts.length > 0 ? (
                    sortedPosts.map(post => 
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            user={user} 
                            isModerator={isModerator}
                            onReaction={(postId, emoji) => onPostReaction(circulo.id, postId, emoji)}
                            onAddReply={handleAddReply}
                            onDelete={(postId) => onDeletePost(circulo.id, postId)}
                            onPin={(postId) => onPinPost(circulo.id, postId)}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                        />
                    )
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg">Ainda não há posts. Seja o primeiro a partilhar!</p>
                )}
            </div>
        </div>
      )}
      {activeTab === 'devocionary' && (
        <div className={`${activeDevocTheme.docClassName} p-6 rounded-lg`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Devocionário do Círculo
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mt-1">
                {devocionaryDraft.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Atualizado por{' '}
                <span className="font-semibold">
                  {(circulo.devocionary?.updatedBy?.name) || user.name}
                </span>{' '}
                • {(circulo.devocionary?.updatedAt) || '—'}
              </p>
            </div>

            {isModerator && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditingDevocionary((v) => !v);
                    setDevocionaryDraft(circulo.devocionary || defaultDevocionary);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-gold-subtle text-white hover:opacity-90"
                >
                  {isEditingDevocionary ? 'Cancelar' : 'Editar devocionário'}
                </button>
                {isEditingDevocionary && (
                  <button
                    onClick={() => {
                      const payload: CirculoDevocionary = {
                        ...devocionaryDraft,
                        updatedAt: 'Agora',
                        updatedBy: { id: user.id, name: user.name },
                      };
                      onUpdateCirculo(circulo.id, { devocionary: payload });
                      setIsEditingDevocionary(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:opacity-90"
                  >
                    Salvar
                  </button>
                )}
              </div>
            )}
          </div>

          {!isEditingDevocionary ? (
            <div className="space-y-4">
              {!devocionaryDraft.content ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Ainda não há conteúdo no devocionário deste círculo.
                </p>
              ) : (
                <RichContentRenderer
                  content={devocionaryDraft.content}
                  prayers={prayers}
                  onOpenPrayer={(id) => setOpenDevocionaryPrayerId(id)}
                  themeId={devocionaryDraft.themeId}
                  className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Título
                </label>
                <input
                  value={devocionaryDraft.title}
                  onChange={(e) =>
                    setDevocionaryDraft((curr) => ({ ...curr, title: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tema
                </label>
                <select
                  value={devocionaryDraft.themeId || 'BRANCO_DOURADO'}
                  onChange={(e) =>
                    setDevocionaryDraft((curr) => ({
                      ...curr,
                      themeId: e.target.value as any,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-gold-subtle focus:ring-gold-subtle"
                >
                  <option value="BRANCO_DOURADO">Branco & Dourado</option>
                  <option value="MISSAL_ANTIGO">Missal Antigo</option>
                  <option value="MONASTICO_ESPERANCA">Monástico</option>
                  <option value="AZUL_CALMO">Azul Calmo</option>
                  <option value="ROXO_NOITE">Roxo & Noite</option>
                </select>
              </div>

              <RichEditor
                value={devocionaryDraft.content}
                onChange={(next) =>
                  setDevocionaryDraft((curr) => ({
                    ...curr,
                    content: next,
                  }))
                }
                prayers={prayers}
                themeId={devocionaryDraft.themeId}
                autoFocus={true}
                placeholder="Escreva o devocionário… arraste orações/devoções do acervo para inserir referências e use “Divisão” para inserir linhas horizontais."
                onOpenPrayer={(id) => setOpenDevocionaryPrayerId(id)}
                title="Editor do Devocionário"
              />
            </div>
          )}
        </div>
      )}
      {activeTab === 'about' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg relative">
            {isModerator && (
                <button onClick={() => setIsEditModalOpen(true)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <EditIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
            )}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{circulo.description}</p>
          </div>
      )}
       {activeTab === 'members' && (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Membros ({circulo.memberCount})</h3>
             {membersLoading ? <div className="flex justify-center p-8"><LoaderIcon className="w-8 h-8 text-gold-subtle" /></div> : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {members?.map(member => {
                        const isCirculoLeader = member.id === circulo.leaderId;
                        const isCirculoModerator = circulo.moderatorIds.includes(member.id);
                        const canManage = isModerator && member.id !== user.id && !isCirculoLeader;
                        
                        return (
                            <li key={member.id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img className="w-12 h-12 rounded-full" src={member.avatarUrl} alt={member.name} />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">{member.name} 
                                            {isCirculoLeader && <CrownIcon className="w-4 h-4 ml-2 text-yellow-500" />}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{isCirculoModerator && !isCirculoLeader ? 'Moderador' : member.level}</p>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="relative">
                                        <button onClick={() => setOpenMemberMenu(openMemberMenu === member.id ? null : member.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <MoreVerticalIcon className="w-5 h-5" />
                                        </button>
                                        {openMemberMenu === member.id && (
                                            <div ref={memberMenuRef} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                                                <button onClick={() => { onUpdateMemberRole(circulo.id, member.id, !isCirculoModerator); setOpenMemberMenu(null); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    {isCirculoModerator ? 'Rebaixar a Membro' : 'Promover a Moderador'}
                                                </button>
                                                <button onClick={() => { if (window.confirm(`Tem certeza que deseja remover ${member.name} do círculo?`)) { onRemoveMember(circulo.id, member.id); } setOpenMemberMenu(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                                                    Remover do Círculo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
             )}
         </div>
      )}
       {activeTab === 'manage' && isModerator && (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gerenciar Cronograma</h3>
                <button onClick={() => openScheduleModal(null)} className="flex items-center gap-2 bg-gold-subtle text-white font-bold py-2 px-3 rounded-lg text-sm hover:opacity-90 transition-opacity">
                    <PlusCircleIcon className="w-5 h-5" /> Adicionar
                </button>
             </div>
             <div className="space-y-3">
                {circulo.schedule.length > 0 ? circulo.schedule.map(item => (
                    <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{item.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                                <CalendarIcon className="w-4 h-4"/> 
                                {item.time} - <span className="font-medium">{prayers.find(p => p.id === item.prayerId)?.title || 'Oração removida'}</span>
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => openScheduleModal(item)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><EditIcon className="w-5 h-5" /></button>
                            <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir "${item.title}" do cronograma?`)) { onDeleteScheduleItem(circulo.id, item.id); }}} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><Trash2Icon className="w-5 h-5 text-red-500" /></button>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhum item no cronograma.</p>}
             </div>
         </div>
      )}
    </div>
  );
};

export default CirculoDetailScreen;

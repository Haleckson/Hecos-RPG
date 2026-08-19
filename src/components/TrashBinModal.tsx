import React, { useState, useEffect } from 'react';
import { TrashedEntity, HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Trash2,
  Undo2,
  AlertTriangle,
  X,
  Search,
  Calendar,
  User,
  Shield,
  Layers,
  Sparkles,
  BookOpen,
  Sword,
  Package,
  Clock,
  RefreshCw,
  Award,
} from 'lucide-react';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreEntity?: (restored: HecosEntity) => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  onRestoreEntity,
}) => {
  const [trashList, setTrashList] = useState<TrashedEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [restoredNotification, setRestoredNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = HecosStorage.subscribeTrash((list) => {
      setTrashList(list);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTrash = trashList.filter((item) => {
    const titleMatch = (item.entity.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch =
      selectedCategory === 'all' || item.entity.category === selectedCategory || item.originalCategory === selectedCategory;
    return titleMatch && categoryMatch;
  });

  const handleRestore = (id: string, name: string) => {
    const restored = HecosStorage.restoreFromTrash(id);
    if (restored) {
      setRestoredNotification(`"${name}" restaurado com sucesso!`);
      setTimeout(() => setRestoredNotification(null), 3000);
      if (onRestoreEntity) {
        onRestoreEntity(restored);
      }
    }
  };

  const handlePermanentDelete = (id: string) => {
    HecosStorage.permanentlyDeleteFromTrash(id);
    setConfirmDeleteId(null);
  };

  const handleEmptyTrash = () => {
    HecosStorage.emptyTrash();
    setConfirmEmptyTrash(false);
  };

  const itemToPermanentlyDelete = trashList.find((t) => t.entity.id === confirmDeleteId);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'feat':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 'spell':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case 'item':
        return <Package className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ancestry':
      case 'class':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const formatDeleteDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0814] border border-zinc-800/90 rounded-2xl w-full max-w-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#171026] via-[#100b1d] to-[#0d0917] border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/60 text-amber-400 shadow-md">
              <Trash2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-zinc-100">Lixeira do Cenário</h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40">
                  {trashList.length} {trashList.length === 1 ? 'artigo' : 'artigos'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Artigos excluídos ficam armazenados aqui. Restaure a qualquer momento ou esvazie.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashList.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Esvaziar Lixeira</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Restored Toast Banner */}
        {restoredNotification && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/50 px-4 py-2 text-xs font-semibold text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <Undo2 className="w-4 h-4 text-emerald-400" />
            <span>{restoredNotification}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-[#0e0a1a] border-b border-zinc-800/80 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artigo na lixeira..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {['all', 'feat', 'spell', 'item', 'ancestry', 'class', 'npc'].map((catKey) => {
              const labelMap: Record<string, string> = {
                all: 'Todos',
                feat: 'Talentos',
                spell: 'Feitiços',
                item: 'Itens',
                ancestry: 'Ancestralidades',
                class: 'Classes',
                npc: 'NPCs',
              };
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-sm font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {labelMap[catKey] || catKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Trashed Items */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-2.5">
          {filteredTrash.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                <Trash2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-zinc-400">A lixeira está vazia</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Nenhum artigo excluído no momento. Quando você excluir artigos, eles aparecerão aqui para recuperação segura.
              </p>
            </div>
          ) : (
            filteredTrash.map((trashed) => (
              <div
                key={trashed.entity.id}
                className="p-3.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                    {getCategoryIcon(trashed.entity.category)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-100 truncate">
                        {trashed.entity.title || 'Sem título'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                        {trashed.entity.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span>Excluído em: {formatDeleteDate(trashed.deletedAt)}</span>
                      </span>
                      {trashed.deletedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-600" />
                          <span>Por: {trashed.deletedBy}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(trashed.entity.id, trashed.entity.title)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Restaurar este artigo de volta ao cenário"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(trashed.entity.id)}
                    className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950 border border-rose-900/60 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                    title="Excluir permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#090710] border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>Total na lixeira: {trashList.length} itens</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Confirmation for single permanent deletion */}
      {confirmDeleteId && itemToPermanentlyDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          itemName={itemToPermanentlyDelete.entity.title}
          itemType={`Artigo (${itemToPermanentlyDelete.entity.category})`}
          isPermanent={true}
          onConfirm={() => handlePermanentDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Confirmation for Empty Trash */}
      {confirmEmptyTrash && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Esvaziar Toda a Lixeira"
          itemName={`Todos os ${trashList.length} artigos da lixeira`}
          itemType="Lixeira Completa"
          isPermanent={true}
          confirmLabel="Esvaziar e Apagar Tudo"
          onConfirm={handleEmptyTrash}
          onCancel={() => setConfirmEmptyTrash(false)}
        />
      )}
    </div>
  );
};

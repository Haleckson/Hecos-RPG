import React, { useState, useRef, useEffect } from 'react';
import { HecosEntity, EntityCategory } from '../types';
import { HecosStorage } from '../services/storage';
import { MutualLinkService } from '../services/mutualLinkService';
import {
  Search,
  X,
  Plus,
  Compass,
  Building2,
  Scroll,
  User,
  Lock,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface IntelligentMultiEntityPickerProps {
  category?: EntityCategory | EntityCategory[];
  selectedIds: string[];
  onChange: (ids: string[], entities: HecosEntity[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  badgeTheme?: 'purple' | 'cyan' | 'amber' | 'emerald' | 'rose';
}

export const IntelligentMultiEntityPicker: React.FC<IntelligentMultiEntityPickerProps> = ({
  category,
  selectedIds = [],
  onChange,
  placeholder = 'Buscar e vincular artigos...',
  label,
  className = '',
  badgeTheme = 'purple',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUser = HecosStorage.getCurrentUser();
  const isGm = currentUser?.role === 'gm';
  const allEntities = HecosStorage.getEntities();

  // Find all currently selected entity objects
  const selectedEntities = allEntities.filter((e) => selectedIds.includes(e.id));

  // Filter entities according to category, search term, and user visibility
  const filteredEntities = allEntities
    .filter((e) => {
      // 1. Category Filter
      if (category) {
        if (Array.isArray(category)) {
          if (!category.includes(e.category)) return false;
        } else if (e.category !== category) {
          return false;
        }
      }
      // 2. Visibility Filter
      if (!MutualLinkService.isVisibleToUser(e, isGm, currentUser?.id)) {
        return false;
      }
      // 3. Search Filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchTitle = (e.title || '').toLowerCase().includes(q);
      const matchSub = (e.subtitle || '').toLowerCase().includes(q);
      const matchTags = (e.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      return matchTitle || matchSub || matchTags;
    })
    .slice(0, 15);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'location':
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      case 'organization':
        return <Building2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'quest':
        return <Scroll className="w-3.5 h-3.5 text-amber-400" />;
      case 'npc':
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getThemeClasses = () => {
    switch (badgeTheme) {
      case 'cyan':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:border-cyan-600';
      case 'amber':
        return 'bg-amber-950/80 text-amber-300 border-amber-800 hover:border-amber-600';
      case 'emerald':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:border-emerald-600';
      case 'rose':
        return 'bg-rose-950/80 text-rose-300 border-rose-800 hover:border-rose-600';
      case 'purple':
      default:
        return 'bg-purple-950/80 text-purple-300 border-purple-800 hover:border-purple-600';
    }
  };

  const handleToggleEntity = (ent: HecosEntity) => {
    let newIds: string[];
    let newEnts: HecosEntity[];

    if (selectedIds.includes(ent.id)) {
      newIds = selectedIds.filter((id) => id !== ent.id);
      newEnts = selectedEntities.filter((e) => e.id !== ent.id);
    } else {
      newIds = [...selectedIds, ent.id];
      newEnts = [...selectedEntities, ent];
    }
    onChange(newIds, newEnts);
  };

  const handleRemove = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIds = selectedIds.filter((id) => id !== idToRemove);
    const newEnts = selectedEntities.filter((ent) => ent.id !== idToRemove);
    onChange(newIds, newEnts);
  };

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-zinc-300">
          {label}
        </label>
      )}

      {/* Selected Chips Container */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#0d0918] border border-purple-900/40">
          {selectedEntities.map((ent) => (
            <span
              key={ent.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-sm transition-all ${getThemeClasses()}`}
            >
              {getCategoryIcon(ent.category)}
              <span>{ent.title}</span>
              {ent.isSecret && (
                <span className="text-[9px] px-1 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> GM
                </span>
              )}
              <button
                type="button"
                onClick={(e) => handleRemove(ent.id, e)}
                className="p-0.5 rounded hover:bg-black/40 text-zinc-400 hover:text-rose-300 transition-colors"
                title="Remover vínculo"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & Trigger Bar */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/60 hover:border-purple-500/80 text-xs text-zinc-200 cursor-pointer transition-all shadow-inner"
        >
          <div className="flex items-center gap-2 min-w-0 text-zinc-400">
            <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{placeholder}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-2 rounded-2xl bg-[#0d0918] border border-purple-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.9)] space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
          {/* Search Input Box */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome para filtrar e clicar..."
              className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-zinc-950/90 border border-purple-900 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 p-0.5 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
            {filteredEntities.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">
                Nenhum artigo encontrado com esse nome.
              </div>
            ) : (
              filteredEntities.map((ent) => {
                const isSelected = selectedIds.includes(ent.id);
                return (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => handleToggleEntity(ent)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 border border-purple-500/70 text-white'
                        : 'bg-zinc-950/40 hover:bg-purple-950/40 border border-transparent hover:border-purple-900/50 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-black/60 border border-purple-900/60 flex items-center justify-center shrink-0">
                        {getCategoryIcon(ent.category)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">{ent.title}</span>
                          {ent.isSecret && (
                            <span className="text-[9px] px-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> GM
                            </span>
                          )}
                        </div>
                        {ent.subtitle && (
                          <p className="text-[10px] text-zinc-400 truncate">{ent.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected ? (
                        <div className="p-1 rounded-full bg-purple-500 text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
                          + Adicionar
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

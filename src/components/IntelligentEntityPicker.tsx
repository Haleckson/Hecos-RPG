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
  ExternalLink,
  Lock,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface IntelligentEntityPickerProps {
  category?: EntityCategory | EntityCategory[];
  valueId?: string;
  valueName?: string;
  onChange: (entityId?: string, entityTitle?: string, entity?: HecosEntity) => void;
  placeholder?: string;
  label?: string;
  allowCustomText?: boolean;
  onNavigate?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

export const IntelligentEntityPicker: React.FC<IntelligentEntityPickerProps> = ({
  category,
  valueId,
  valueName,
  onChange,
  placeholder = 'Buscar artigo...',
  label,
  allowCustomText = true,
  onNavigate,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUser = HecosStorage.getCurrentUser();
  const isGm = currentUser?.role === 'gm';
  const allEntities = HecosStorage.getEntities();

  // Find currently selected entity object if ID or Name matches
  const selectedEntity = allEntities.find((e) => {
    if (valueId && e.id === valueId) return true;
    if (valueName && MutualLinkService.matchTitle(e.title, valueName)) {
      if (!category) return true;
      if (Array.isArray(category)) return category.includes(e.category);
      return e.category === category;
    }
    return false;
  });

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

  // Close dropdown on outside click
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

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'location':
        return 'Local';
      case 'organization':
        return 'Organização';
      case 'quest':
        return 'Missão';
      case 'npc':
        return 'NPC';
      default:
        return cat || 'Artigo';
    }
  };

  const handleSelectEntity = (ent: HecosEntity) => {
    onChange(ent.id, ent.title, ent);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined, undefined);
    setSearchTerm('');
  };

  const handleCustomTextSubmit = () => {
    const trimmed = searchTerm.trim();
    if (trimmed) {
      onChange(undefined, trimmed, undefined);
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const currentDisplayTitle = selectedEntity?.title || valueName;

  return (
    <div className={`relative space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-zinc-300">
          {label}
        </label>
      )}

      {/* Selected Entity Chip or Search Bar */}
      {currentDisplayTitle ? (
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#110d1e] border border-purple-900/60 shadow-sm gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-purple-950/80 border border-purple-800 shrink-0">
              {getCategoryIcon(selectedEntity?.category || (Array.isArray(category) ? category[0] : category))}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-zinc-100 truncate">
                  {currentDisplayTitle}
                </span>
                {selectedEntity && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    {getCategoryLabel(selectedEntity.category)}
                  </span>
                )}
                {selectedEntity?.isSecret && (
                  <span className="text-[9px] px-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> GM
                  </span>
                )}
              </div>
              {selectedEntity?.subtitle && (
                <p className="text-[10px] text-zinc-400 truncate">
                  {selectedEntity.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {selectedEntity && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(selectedEntity.id)}
                className="p-1 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
                title="Abrir artigo em nova tela"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setSearchTerm('');
              }}
              className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-semibold text-purple-300 border border-purple-900/40 transition-colors"
              title="Trocar artigo vinculado"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
              title="Desvincular"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
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
      )}

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredEntities.length > 0) {
                    handleSelectEntity(filteredEntities[0]);
                  } else if (allowCustomText && searchTerm.trim()) {
                    handleCustomTextSubmit();
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder={`Digite para pesquisar ${category ? getCategoryLabel(Array.isArray(category) ? category[0] : category) : 'artigo'}...`}
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
              <div className="p-3 text-center text-xs text-zinc-400 space-y-2">
                <p>Nenhum artigo encontrado com esse nome.</p>
                {allowCustomText && searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={handleCustomTextSubmit}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors border border-purple-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Usar "{searchTerm.trim()}" como texto livre</span>
                  </button>
                )}
              </div>
            ) : (
              filteredEntities.map((ent) => {
                const isSelected = ent.id === valueId || MutualLinkService.matchTitle(ent.title, valueName);
                return (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => handleSelectEntity(ent)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 border border-purple-500/70 text-white'
                        : 'bg-zinc-950/40 hover:bg-purple-950/40 border border-transparent hover:border-purple-900/50 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar / Token / Cover Thumbnail if exists */}
                      {ent.npcData?.portraitImage || ent.npcData?.tokenImage || ent.coverImage || ent.locationData?.mapImage || ent.organizationData?.symbolImage ? (
                        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-purple-900/60 bg-black">
                          <img
                            src={
                              ent.npcData?.portraitImage ||
                              ent.npcData?.tokenImage ||
                              ent.coverImage ||
                              ent.locationData?.mapImage ||
                              ent.organizationData?.symbolImage
                            }
                            alt={ent.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-black/60 border border-purple-900/60 flex items-center justify-center shrink-0">
                          {getCategoryIcon(ent.category)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">{ent.title}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-900 font-mono">
                            {getCategoryLabel(ent.category)}
                          </span>
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

                    {isSelected && (
                      <div className="p-1 rounded-full bg-purple-500 text-white shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick custom text button at bottom if typing */}
          {allowCustomText && searchTerm.trim() && filteredEntities.length > 0 && (
            <div className="pt-1.5 border-t border-purple-950 shrink-0">
              <button
                type="button"
                onClick={handleCustomTextSubmit}
                className="w-full py-1 text-center text-[11px] text-purple-400 hover:text-purple-200 transition-colors"
              >
                Ou salvar como texto livre: <strong>"{searchTerm.trim()}"</strong>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

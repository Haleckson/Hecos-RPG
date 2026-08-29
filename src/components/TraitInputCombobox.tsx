import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HecosStorage } from '../services/storage';
import { TraitBadge } from './TraitBadge';
import { Search, Plus, X, Award, Check, Sparkles } from 'lucide-react';
import { CANONICAL_TRADITIONS, DEFAULT_TRAIT_DESCRIPTIONS, getTraitHierarchyTier, sortTraitsHierarchically } from '../utils/traitUtils';
import { ErrorBoundary } from './ErrorBoundary';

interface TraitInputComboboxProps {
  selectedTraits?: string[];
  value?: string[] | string;
  onChange: (traits: string[]) => void;
  placeholder?: string;
  maxTraits?: number;
  allowCreate?: boolean;
  defaultCategory?: string;
  className?: string;
  badgeTheme?: 'cyan' | 'amber' | 'purple' | 'gold' | 'default';
  quickSuggestions?: string[];
}

const TraitInputComboboxInner: React.FC<TraitInputComboboxProps> = ({
  selectedTraits: rawSelectedTraits,
  value,
  onChange,
  placeholder = 'Buscar ou criar traço (ex: Fogo, Ágil, Oculto)...',
  maxTraits,
  allowCreate = true,
  defaultCategory = 'Mecânica e Regras',
  className = '',
  badgeTheme = 'default',
  quickSuggestions = [],
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize selectedTraits safely whether passed as selectedTraits or value (array or CSV string)
  const selectedTraits = useMemo<string[]>(() => {
    try {
      let source: unknown = rawSelectedTraits;
      if (source === undefined || source === null) {
        source = value;
      }
      if (Array.isArray(source)) {
        return source
          .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
          .map((t) => t.trim());
      }
      if (typeof source === 'string') {
        return source
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch {
      // ignore
    }
    return [];
  }, [rawSelectedTraits, value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all known traits from storage + extracted entities
  const allKnownTraits = useMemo(() => {
    const map = new Map<string, { name: string; category?: string; color?: string; description?: string }>();

    try {
      // 1. Preload Canonical Traditions
      (CANONICAL_TRADITIONS || []).forEach((trad) => {
        if (!trad || typeof trad !== 'string') return;
        const low = trad.toLowerCase();
        const def = DEFAULT_TRAIT_DESCRIPTIONS[low];
        map.set(low, {
          name: trad,
          category: def?.category || 'Tradições de Hecos',
          color: def?.color,
          description: def?.description,
        });
      });

      // 2. Custom traits from HecosStorage
      const custom = HecosStorage.getCustomTraits();
      if (custom && typeof custom === 'object') {
        Object.entries(custom).forEach(([key, val]) => {
          if (!key || typeof key !== 'string') return;
          const cleanKey = key.trim();
          if (!cleanKey) return;
          const isValObj = val && typeof val === 'object';
          const name = isValObj && (val as any).category
            ? cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)
            : cleanKey;
          map.set(cleanKey.toLowerCase(), {
            name,
            category: isValObj ? (val as any).category : 'Personalizado',
            color: isValObj ? (val as any).color : undefined,
            description: isValObj ? (val as any).description : undefined,
          });
        });
      }

      // 3. Extract traits from all entities in storage to guarantee complete list
      const entities = HecosStorage.getEntities() || [];
      if (Array.isArray(entities)) {
        entities.forEach((ent) => {
          if (!ent) return;
          const checkAndAdd = (val: unknown) => {
            if (!val) return;
            if (Array.isArray(val)) {
              val.forEach((item) => {
                if (typeof item === 'string' && item.trim()) {
                  const clean = item.trim();
                  const low = clean.toLowerCase();
                  if (!map.has(low)) {
                    map.set(low, { name: clean, category: 'Artigos Hecos' });
                  }
                }
              });
            } else if (typeof val === 'string') {
              val.split(',').forEach((item) => {
                const clean = item.trim();
                if (clean) {
                  const low = clean.toLowerCase();
                  if (!map.has(low)) {
                    map.set(low, { name: clean, category: 'Artigos Hecos' });
                  }
                }
              });
            }
          };

          checkAndAdd(ent.traits);
          checkAndAdd(ent.statblock?.traits);
          checkAndAdd(ent.spellData?.traits);
          checkAndAdd(ent.spellData?.traditions);
          checkAndAdd(ent.featData?.traits);
          checkAndAdd(ent.itemData?.traits);
          checkAndAdd(ent.ancestryData?.traits);
          checkAndAdd(ent.perilData?.traits);
          checkAndAdd(ent.classData?.traits);
        });
      }
    } catch (e) {
      console.warn("Error gathering known traits in TraitInputCombobox:", e);
    }

    return Array.from(map.values()).sort((a, b) => {
      const tierA = getTraitHierarchyTier(a.name);
      const tierB = getTraitHierarchyTier(b.name);
      if (tierA !== tierB) return tierA - tierB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, []);

  // Filtered traits based on query
  const filteredTraits = useMemo(() => {
    try {
      if (!Array.isArray(allKnownTraits)) return [];
      const q = (query || '').trim().toLowerCase();
      const selectedLower = new Set(
        (Array.isArray(selectedTraits) ? selectedTraits : [])
          .filter((t): t is string => typeof t === 'string')
          .map((t) => t.toLowerCase())
      );

      if (!q) {
        // Show unselected known traits (up to 20)
        return allKnownTraits.filter((t) => t && t.name && !selectedLower.has(t.name.toLowerCase())).slice(0, 20);
      }

      return allKnownTraits
        .filter((t) => t && t.name && !selectedLower.has(t.name.toLowerCase()) && (
          t.name.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q))
        ))
        .slice(0, 20);
    } catch {
      return [];
    }
  }, [allKnownTraits, query, selectedTraits]);

  // Check if current query is already in known traits or already selected
  const exactMatchExists = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return true;
    const selectedLower = new Set(
      (Array.isArray(selectedTraits) ? selectedTraits : [])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase())
    );
    if (selectedLower.has(q)) return true;
    return (allKnownTraits || []).some((t) => t && t.name && t.name.toLowerCase() === q);
  }, [query, selectedTraits, allKnownTraits]);

  const handleSelectTrait = (traitName: string) => {
    if (!traitName || typeof traitName !== 'string') return;
    const clean = traitName.trim();
    if (!clean) return;
    const selectedLower = new Set(
      (Array.isArray(selectedTraits) ? selectedTraits : [])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase())
    );
    if (!selectedLower.has(clean.toLowerCase())) {
      if (maxTraits && (selectedTraits || []).length >= maxTraits) return;
      onChange([...(selectedTraits || []), clean]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleCreateAndSelect = () => {
    const clean = (query || '').trim();
    if (!clean) return;
    const selectedLower = new Set(
      (Array.isArray(selectedTraits) ? selectedTraits : [])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase())
    );
    if (!selectedLower.has(clean.toLowerCase())) {
      if (maxTraits && (selectedTraits || []).length >= maxTraits) return;

      // Save to HecosStorage custom traits
      try {
        HecosStorage.saveCustomTrait(clean, {
          category: defaultCategory,
          description: `Traço customizado cadastrado em Hecos.`,
          color: 'border-cyan-800/80 bg-cyan-950/80 text-cyan-300',
        });
      } catch (e) {
        console.warn("Could not persist custom trait:", e);
      }

      onChange([...(selectedTraits || []), clean]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    if (!traitToRemove) return;
    const target = traitToRemove.toLowerCase();
    onChange(
      (selectedTraits || []).filter(
        (t) => typeof t === 'string' && t.toLowerCase() !== target
      )
    );
  };

  const sortedSelectedTraits = useMemo(() => {
    try {
      return sortTraitsHierarchically(selectedTraits || []);
    } catch {
      return selectedTraits || [];
    }
  }, [selectedTraits]);

  return (
    <div ref={containerRef} className={`space-y-2 ${className}`}>
      {/* Selected Traits Chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-black/50 border border-zinc-800/80 items-center">
        {(!sortedSelectedTraits || sortedSelectedTraits.length === 0) ? (
          <span className="text-xs text-zinc-500 italic px-1">
            Nenhum traço selecionado. Digite ou busque na lista abaixo.
          </span>
        ) : (
          sortedSelectedTraits.map((trait) => (
            <div
              key={trait}
              className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 shadow-sm"
            >
              <TraitBadge trait={trait} />
              <button
                type="button"
                onClick={() => handleRemoveTrait(trait)}
                className="p-0.5 rounded hover:bg-rose-950 hover:text-rose-300 text-zinc-500 transition-colors cursor-pointer"
                title={`Remover traço ${trait}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Combobox Search Input with Dropdown */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredTraits && filteredTraits.length > 0 && query.trim() && filteredTraits[0]) {
                    handleSelectTrait(filteredTraits[0].name);
                  } else if (allowCreate && query.trim() && !exactMatchExists) {
                    handleCreateAndSelect();
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder={placeholder}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {allowCreate && query.trim() && !exactMatchExists && (
            <button
              type="button"
              onClick={handleCreateAndSelect}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Criar Traço</span>
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-[#0e0c18] border border-zinc-700 shadow-2xl divide-y divide-zinc-800/60">
            {(!filteredTraits || filteredTraits.length === 0) && !query.trim() && (
              <div className="p-3 text-center text-xs text-zinc-500">
                Nenhum outro traço disponível.
              </div>
            )}

            {(!filteredTraits || filteredTraits.length === 0) && query.trim() && (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  Nenhum traço existente corresponde a "<strong className="text-cyan-300">{query.trim()}</strong>".
                </p>
                {allowCreate && (
                  <button
                    type="button"
                    onClick={handleCreateAndSelect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar novo traço "{query.trim()}"</span>
                  </button>
                )}
              </div>
            )}

            {(filteredTraits || []).map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => handleSelectTrait(t.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <TraitBadge trait={t.name} interactive={false} />
                  {t.category && (
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                      ({t.category})
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  + Adicionar
                </span>
              </button>
            ))}

            {allowCreate && query.trim() && !exactMatchExists && filteredTraits && filteredTraits.length > 0 && (
              <button
                type="button"
                onClick={handleCreateAndSelect}
                className="w-full flex items-center gap-2 px-3 py-2 text-left bg-cyan-950/40 hover:bg-cyan-950/80 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer border-t border-cyan-800/40"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Criar novo traço personalizado: "<strong>{query.trim()}</strong>"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Suggestions Chips if provided */}
      {Array.isArray(quickSuggestions) && quickSuggestions.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          <span className="text-[10px] text-zinc-500 mr-1">Sugestões rápidas:</span>
          {quickSuggestions.slice(0, 10).map((preset) => {
            if (!preset || typeof preset !== 'string') return null;
            const isSelected = (selectedTraits || []).some(
              (t) => typeof t === 'string' && t.toLowerCase() === preset.toLowerCase()
            );
            if (isSelected) return null;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectTrait(preset)}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-[10px] border border-zinc-800 transition-colors cursor-pointer"
              >
                +{preset}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TraitInputCombobox: React.FC<TraitInputComboboxProps> = (props) => (
  <ErrorBoundary name="TraitInputCombobox">
    <TraitInputComboboxInner {...props} />
  </ErrorBoundary>
);

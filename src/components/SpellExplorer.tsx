import React, { useState, useMemo } from 'react';
import {
  HecosEntity,
  PF2eSpellAttributes,
  SpellCategoryType,
} from '../types';
import { parseSpellFromContent } from '../utils/spellSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { Tooltip } from './Tooltip';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { SpellCreateModal } from './SpellCreateModal';
import { TraitBadge } from './TraitBadge';
import {
  Sparkles,
  Search,
  Plus,
  Filter,
  SlidersHorizontal,
  Folder,
  FolderPlus,
  FolderOpen,
  LayoutGrid,
  List,
  FolderTree,
  Edit,
  Trash2,
  ExternalLink,
  Check,
  X,
  Shield,
  BookOpen,
  Flame,
  Layers,
  ChevronDown,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Zap,
  Tag,
  ArrowRight
} from 'lucide-react';

interface SpellExplorerProps {
  entities: HecosEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity: (id: string) => void;
  onCreateSpell: (presetTradition?: string, presetSubcategory?: string) => void;
  onDeleteEntity: (id: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
}

export const MAIN_SPELL_CATEGORIES: {
  id: SpellCategoryType;
  name: string;
  englishName: string;
  description: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}[] = [
  {
    id: 'all',
    name: 'Todas',
    englishName: 'All Spells',
    description: 'Grimório completo de todas as magias e rituais registrados em Hecos.',
    icon: Sparkles,
    color: '#74b6c2',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'arcane',
    name: 'Arcano',
    englishName: 'Arcane',
    description: 'Magias teóricas, racionais e manipuladoras da estrutura da realidade.',
    icon: BookOpen,
    color: '#74b6c2',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'divine',
    name: 'Divino',
    englishName: 'Divine',
    description: 'Poderes de fé, cura, luz sagrada e julgamento dos deuses de Hecos.',
    icon: Sun,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'occult',
    name: 'Oculto',
    englishName: 'Occult',
    description: 'Mistérios da mente, aberrações do vazio, sombras e ilusões.',
    icon: Moon,
    color: '#b19ecc',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
  {
    id: 'primal',
    name: 'Primal',
    englishName: 'Primal',
    description: 'Forças vivas dos elementos da natureza, metamorfose e feras.',
    icon: Flame,
    color: '#7eb897',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-600/40',
  },
  {
    id: 'focus',
    name: 'Foco',
    englishName: 'Focus Spells',
    description: 'Feitiços de classe especializados recarregados através de descanso e meditação.',
    icon: Zap,
    color: '#cb8394',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
  },
  {
    id: 'ritual',
    name: 'Rituais',
    englishName: 'Rituals',
    description: 'Grandes encantamentos que exigem tempo, múltiplos conjuradores e testes de perícia.',
    icon: Layers,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'extras',
    name: 'Outros',
    englishName: 'Other Spells',
    description: 'Outras magias, rituais únicos, trama da penumbra e feitiços diversos de Hecos.',
    icon: Shield,
    color: '#cb8394',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
];

export function SpellExplorer({
  entities,
  onSelectEntity,
  onEditEntity,
  onCreateSpell,
  onDeleteEntity,
  onTagClick,
  isGmMode = true,
}: SpellExplorerProps) {
  // 1. Storage and categories
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllSpellSubcategoriesConfig()
  );

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm';

  // 2. Active selection states
  const [activeCategory, setActiveCategory] = useState<SpellCategoryType>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'folders'>('grid');

  // 3. Filters
  const [filterRank, setFilterRank] = useState<string>('all'); // 'all', 'cantrip', '1'..'10'
  const [filterTradition, setFilterTradition] = useState<string>('all'); // 'all', 'arcane', 'divine', etc.
  const [filterRarity, setFilterRarity] = useState<string>('all'); // 'all', 'Comum', 'Incomum', 'Raro', 'Único'
  const [filterCastTime, setFilterCastTime] = useState<string>('all'); // 'all', '1', '2', '3', 'reaction', 'free'
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // 4. Modals & folder management
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderOriginalName, setEditingFolderOriginalName] = useState<string | null>(null);
  const [editingFolderNewName, setEditingFolderNewName] = useState('');
  const [showInlineNewFolder, setShowInlineNewFolder] = useState(false);
  const [inlineNewFolderName, setInlineNewFolderName] = useState('');

  // 5. Creation & Delete Modals
  const [isSpellCreateModalOpen, setIsSpellCreateModalOpen] = useState(false);
  const [pendingDeleteSpell, setPendingDeleteSpell] = useState<HecosEntity | null>(null);

  // 6. Manage Folders on a specific spell modal
  const [managingSpellFolders, setManagingSpellFolders] = useState<HecosEntity | null>(null);
  const [selectedSpellSubcats, setSelectedSpellSubcats] = useState<string[]>([]);

  // Refresh subcategories from storage
  const refreshConfig = () => {
    setCategoriesConfig(HecosStorage.getAllSpellSubcategoriesConfig());
  };

  // Extract all Spell Entities with parsed spell data
  const spellEntities = useMemo(() => {
    return entities
      .filter((e) => {
        const isSpell = e.category === 'spell' || e.tags?.includes('spell') || e.tags?.includes('magia') || e.tags?.includes('feitiço');
        if (!isSpell) return false;
        return HecosStorage.canUserAccessItem(e, currentUser);
      })
      .map((e) => {
        const parsed = parseSpellFromContent(e.content, e.spellData);
        const subcats = Array.from(
          new Set([
            ...(e.subcategories || []),
            ...(parsed.subcategories || []),
            ...(e.subcategory ? [e.subcategory] : []),
          ])
        ).filter(Boolean);

        return {
          ...e,
          spellData: {
            ...parsed,
            subcategories: subcats,
          },
        };
      });
  }, [entities, isActualGm, currentUser]);

  // Extract all unique traits for filter dropdown
  const allTraits = useMemo(() => {
    const set = new Set<string>();
    spellEntities.forEach((sp) => {
      sp.spellData?.traits?.forEach((t) => set.add(t));
      sp.tags?.forEach((t) => {
        if (!['spell', 'magia', 'feitiço'].includes(t.toLowerCase())) {
          set.add(t);
        }
      });
    });
    return Array.from(set).sort();
  }, [spellEntities]);

  // Current folder list for active category tab
  const currentSubcategories = useMemo(() => {
    if (activeCategory === 'all') {
      const allSubs = new Set<string>();
      (Object.values(categoriesConfig) as string[][]).forEach((list) => {
        list.forEach((s) => allSubs.add(s));
      });
      return Array.from(allSubs);
    }
    return categoriesConfig[activeCategory] || [];
  }, [activeCategory, categoriesConfig]);

  // Filtered spells
  const filteredSpells = useMemo(() => {
    return spellEntities.filter((sp) => {
      const data = sp.spellData!;
      const traditions = data.traditions?.map((t) => t.toLowerCase()) || [];

      // 1. Category tab match
      if (activeCategory !== 'all') {
        if (activeCategory === 'arcane' && !traditions.includes('arcano') && !traditions.includes('arcane')) return false;
        if (activeCategory === 'divine' && !traditions.includes('divino') && !traditions.includes('divine')) return false;
        if (activeCategory === 'occult' && !traditions.includes('oculto') && !traditions.includes('occult')) return false;
        if (activeCategory === 'primal' && !traditions.includes('primal')) return false;
        if (activeCategory === 'focus' && data.spellType !== 'focus' && !data.traits?.includes('Foco')) return false;
        if (activeCategory === 'ritual' && data.spellType !== 'ritual' && !data.traits?.includes('Ritual')) return false;
      }

      // 2. Subcategory / Folder filter
      if (activeSubcategory) {
        const hasSub =
          data.subcategories?.includes(activeSubcategory) ||
          sp.subcategories?.includes(activeSubcategory) ||
          sp.subcategory === activeSubcategory ||
          sp.tags?.includes(activeSubcategory);
        if (!hasSub) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = sp.title.toLowerCase().includes(q);
        const inDesc = data.description?.toLowerCase().includes(q);
        const inTraits = data.traits?.some((t) => t.toLowerCase().includes(q));
        const inTrad = data.traditions?.some((t) => t.toLowerCase().includes(q));
        const inHecos = data.hecosLore?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTraits && !inTrad && !inHecos) return false;
      }

      // 4. Rank Filter
      if (filterRank !== 'all') {
        if (filterRank === 'cantrip' && data.rank !== 0) return false;
        if (filterRank !== 'cantrip' && data.rank !== parseInt(filterRank, 10)) return false;
      }

      // 5. Tradition Filter
      if (filterTradition !== 'all') {
        if (!traditions.includes(filterTradition.toLowerCase())) return false;
      }

      // 6. Rarity Filter
      if (filterRarity !== 'all') {
        if ((data.rarity || 'Comum').toLowerCase() !== filterRarity.toLowerCase()) return false;
      }

      // 7. Cast Time / Actions Filter
      if (filterCastTime !== 'all') {
        const ct = (data.castTime || '').toLowerCase();
        if (filterCastTime === '1' && !ct.includes('1')) return false;
        if (filterCastTime === '2' && !ct.includes('2')) return false;
        if (filterCastTime === '3' && !ct.includes('3')) return false;
        if (filterCastTime === 'reaction' && !ct.includes('reação') && !ct.includes('reaction')) return false;
        if (filterCastTime === 'free' && !ct.includes('livre') && !ct.includes('free')) return false;
      }

      // 8. Trait Filter
      if (filterTrait !== 'all') {
        const hasTrait = data.traits?.includes(filterTrait) || sp.tags?.includes(filterTrait);
        if (!hasTrait) return false;
      }

      return true;
    });
  }, [
    spellEntities,
    activeCategory,
    activeSubcategory,
    searchQuery,
    filterRank,
    filterTradition,
    filterRarity,
    filterCastTime,
    filterTrait,
  ]);

  // Folder Counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    spellEntities.forEach((sp) => {
      const subs = sp.spellData?.subcategories || sp.subcategories || [];
      subs.forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return counts;
  }, [spellEntities]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: spellEntities.length };
    MAIN_SPELL_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      counts[cat.id] = spellEntities.filter((sp) => {
        const data = sp.spellData!;
        const traditions = data.traditions?.map((t) => t.toLowerCase()) || [];
        if (cat.id === 'arcane') return traditions.includes('arcano') || traditions.includes('arcane');
        if (cat.id === 'divine') return traditions.includes('divino') || traditions.includes('divine');
        if (cat.id === 'occult') return traditions.includes('oculto') || traditions.includes('occult');
        if (cat.id === 'primal') return traditions.includes('primal');
        if (cat.id === 'focus') return data.spellType === 'focus' || data.traits?.includes('Foco');
        if (cat.id === 'ritual') return data.spellType === 'ritual' || data.traits?.includes('Ritual');
        if (cat.id === 'extras') return data.spellType === 'extras' || sp.category === 'spell';
        return false;
      }).length;
    });
    return counts;
  }, [spellEntities]);

  // Active filters count
  const activeFiltersCount = [
    filterRank !== 'all',
    filterTradition !== 'all',
    filterRarity !== 'all',
    filterCastTime !== 'all',
    filterTrait !== 'all',
    Boolean(searchQuery),
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilterRank('all');
    setFilterTradition('all');
    setFilterRarity('all');
    setFilterCastTime('all');
    setFilterTrait('all');
    setSearchQuery('');
  };

  // Add folder
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const cat = activeCategory === 'all' ? 'arcane' : activeCategory;
    HecosStorage.addSpellSubcategory(cat, newFolderName.trim());
    setNewFolderName('');
    refreshConfig();
  };

  // Add inline folder
  const handleAddInlineSubcategory = () => {
    if (!inlineNewFolderName.trim()) return;
    const cat = activeCategory === 'all' ? 'arcane' : activeCategory;
    HecosStorage.addSpellSubcategory(cat, inlineNewFolderName.trim());
    setActiveSubcategory(inlineNewFolderName.trim());
    setInlineNewFolderName('');
    setShowInlineNewFolder(false);
    refreshConfig();
  };

  // Rename folder
  const handleRenameFolder = () => {
    if (!editingFolderOriginalName || !editingFolderNewName.trim()) return;
    const cat = activeCategory === 'all' ? 'arcane' : activeCategory;
    HecosStorage.renameSpellSubcategory(cat, editingFolderOriginalName, editingFolderNewName.trim());
    setEditingFolderOriginalName(null);
    setEditingFolderNewName('');
    refreshConfig();
  };

  // Delete folder
  const handleDeleteFolder = (folderName: string) => {
    if (confirm(`Tem certeza que deseja excluir a pasta "${folderName}"? As magias não serão excluídas.`)) {
      const cat = activeCategory === 'all' ? 'arcane' : activeCategory;
      HecosStorage.deleteSpellSubcategory(cat, folderName);
      if (activeSubcategory === folderName) setActiveSubcategory(null);
      refreshConfig();
    }
  };

  // Save folder assignments on a specific spell
  const handleSaveSpellFolders = () => {
    if (!managingSpellFolders) return;
    HecosStorage.assignSpellSubcategories(managingSpellFolders.id, selectedSpellSubcats);
    setManagingSpellFolders(null);
    setSelectedSpellSubcats([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Actions */}
      <div className="bg-[#09080e] p-6 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  <span>Grimório de Feitiços & Rituais</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-mono">
                    {filteredSpells.length} {filteredSpells.length === 1 ? 'feitiço' : 'feitiços'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Catálogo categorizado por tradições arcanas, divinas, ocultas, primais e pastas personalizadas.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Create & Mode Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Grade (Cards)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Lista / Tabela"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('folders')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'folders' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Árvore de Pastas"
              >
                <FolderTree className="w-4 h-4" />
              </button>
            </div>

            {/* Gerenciar Pastas Modal Button */}
            {isActualGm && (
              <Tooltip title="Gerenciar Pastas" description="Adicionar, renomear ou excluir pastas de feitiços">
                <button
                  type="button"
                  onClick={() => setIsFolderManagerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold transition-all hover:border-cyan-500/40 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Pastas</span>
                </button>
              </Tooltip>
            )}

            {/* Novo Feitiço Button */}
            {isActualGm && (
              <button
                type="button"
                onClick={() => setIsSpellCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Novo Feitiço</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. CATEGORY SEGMENTED TABS (Compact, Horizontal) */}
        <div className="overflow-x-auto no-scrollbar py-0.5 mt-4 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-max p-1 rounded-xl bg-[#090710] border border-zinc-800/80">
            {MAIN_SPELL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <Tooltip
                  key={cat.id}
                  title={cat.name}
                  englishTitle={cat.englishName}
                  description={cat.description}
                  side="bottom"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveSubcategory(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-black text-cyan-300 font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SUBCATEGORY HORIZONTAL STRIP (Single Line Scrollable Chips) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Subpastas {activeCategory !== 'all' ? `de ${MAIN_SPELL_CATEGORIES.find((c) => c.id === activeCategory)?.name}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeSubcategory && (
              <button
                type="button"
                onClick={() => setActiveSubcategory(null)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Todas as Pastas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInlineNewFolder(!showInlineNewFolder)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Nova Pasta</span>
            </button>
          </div>
        </div>

        {/* Inline Subcategory Creator */}
        {showInlineNewFolder && (
          <div className="p-2.5 rounded-xl bg-zinc-950/90 border border-cyan-500/30 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inlineNewFolderName}
                onChange={(e) => setInlineNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInlineSubcategory();
                  }
                }}
                placeholder="Nome da nova pasta (ex: Evocação, Necromancia, Truques, Círculo de Fogo)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                autoFocus
              />
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2" />
            </div>
            <button
              type="button"
              onClick={handleAddInlineSubcategory}
              disabled={!inlineNewFolderName.trim()}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInlineNewFolderName('');
                setShowInlineNewFolder(false);
              }}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Horizontal Chips: Single clean row with horizontal scrolling */}
        <div className="overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveSubcategory(null)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubcategory === null
                  ? 'bg-zinc-200 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              <span>Todas</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubcategory === null ? 'bg-zinc-400/40 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                {filteredSpells.length}
              </span>
            </button>

            {currentSubcategories.map((subcat) => {
              const count = subcategoryCounts[subcat] || 0;
              const isSelected = activeSubcategory === subcat;

              return (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => setActiveSubcategory(isSelected ? null : subcat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-bold shadow-sm'
                      : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  <Folder className={`w-3 h-3 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  <span>{subcat}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Search & Multi-Filter Toolbar */}
      <div className="bg-[#0d0b14] p-4 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, traços (ex: Fogo, Ilusão), círculo, efeito ou descrição..."
              className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Panel Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isFilterPanelOpen || activeFiltersCount > 0
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <span>Filtros PF2e</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                title="Limpar todos os filtros ativos"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {isFilterPanelOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
            {/* Rank Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Círculo / Rank:</label>
              <select
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Círculos</option>
                <option value="cantrip">Truque (Cantrip - 0)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                  <option key={r} value={String(r)}>
                    {r}º Círculo
                  </option>
                ))}
              </select>
            </div>

            {/* Tradition Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Tradição:</label>
              <select
                value={filterTradition}
                onChange={(e) => setFilterTradition(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todas as Tradições</option>
                <option value="arcano">Arcano</option>
                <option value="divino">Divino</option>
                <option value="oculto">Oculto</option>
                <option value="primal">Primal</option>
                <option value="outras">Outras</option>
              </select>
            </div>

            {/* Cast Time Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Tempo de Conjuração:</label>
              <select
                value={filterCastTime}
                onChange={(e) => setFilterCastTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Qualquer Ação</option>
                <option value="1">1 Ação [◆]</option>
                <option value="2">2 Ações [◆◆]</option>
                <option value="3">3 Ações [◆◆◆]</option>
                <option value="reaction">Reação [↺]</option>
                <option value="free">Ação Livre [◇]</option>
              </select>
            </div>

            {/* Rarity Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Raridade:</label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todas as Raridades</option>
                <option value="Comum">Comum</option>
                <option value="Incomum">Incomum</option>
                <option value="Raro">Raro</option>
                <option value="Único">Único</option>
              </select>
            </div>

            {/* Trait Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Escola / Traço:</label>
              <select
                value={filterTrait}
                onChange={(e) => setFilterTrait(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Traços</option>
                {allTraits.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. Main Results View */}
      {filteredSpells.length === 0 ? (
        <div className="bg-[#09080e] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-300">Nenhum feitiço encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Nenhum feitiço corresponde aos filtros selecionados. Tente ajustar os termos de busca ou crie uma nova magia.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() => onCreateSpell(activeCategory !== 'all' ? activeCategory : 'arcane', activeSubcategory || undefined)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold transition-colors"
            >
              + Criar Feitiço
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSpells.map((sp) => {
            const data = sp.spellData!;
            const perm = HecosStorage.getEntityPermission(sp.id);
            const rankLabel = data.rank === 0 ? 'Truque' : `${data.rank}º Círculo`;

            return (
              <div
                key={sp.id}
                className="group/card bg-[#0e0c15] hover:bg-[#13101c] border border-zinc-800/80 hover:border-cyan-500/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-[0_0_24px_rgba(6,182,212,0.15)] flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Bar: Title, Rank, Actions Glyph */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectEntity(sp.id)}
                        className="text-left group/title focus:outline-none cursor-pointer"
                        title={`Abrir feitiço ${sp.title}`}
                      >
                        <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-cyan-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(6,182,212,0.85)]">
                          <span className="group-hover/title:underline decoration-cyan-400/80 decoration-2 underline-offset-2">
                            {sp.title}
                          </span>
                          {data.castTime && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-cyan-300 font-mono">
                              {data.castTime}
                            </span>
                          )}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-cyan-400 group-hover/title:translate-x-0.5 transition-all shrink-0" />
                        </h3>
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                        <span className="text-purple-300 font-bold">{rankLabel}</span>
                        {data.traditions && data.traditions.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400 capitalize">{data.traditions.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Visibility Badge Menu */}
                    {isActualGm && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <VisibilityBadgeMenu
                          visibility={perm.visibility}
                          allowedUserIds={perm.allowedUserIds}
                          onChange={(newVis, newAllowed) => {
                            HecosStorage.setEntityPermission(sp.id, newVis, newAllowed);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Traits & Rarity Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    <TraitBadge
                      trait={data.rarity || 'Comum'}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: data.rarity || 'Comum' } }));
                      }}
                    />

                    {data.traits?.map((t, tIdx) => (
                      <TraitBadge
                        key={`${sp.id}-trait-${t}-${tIdx}`}
                        trait={t}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } }));
                        }}
                      />
                    ))}
                  </div>

                  {/* Range, Area, Targets, Saving Throw Info */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3.5 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                    {data.range && (
                      <div>
                        <strong className="text-zinc-300">Alcance:</strong> {data.range}
                      </div>
                    )}
                    {data.area && (
                      <div>
                        <strong className="text-zinc-300">Área:</strong> {data.area}
                      </div>
                    )}
                    {data.targets && (
                      <div className="col-span-2 break-words">
                        <strong className="text-zinc-300">Alvos:</strong> {data.targets}
                      </div>
                    )}
                    {data.savingThrow && (
                      <div>
                        <strong className="text-zinc-300">Salvamento:</strong> {data.savingThrow}
                      </div>
                    )}
                    {data.duration && (
                      <div>
                        <strong className="text-zinc-300">Duração:</strong> {data.duration}
                      </div>
                    )}
                  </div>

                  {/* Description na íntegra */}
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed break-words whitespace-pre-wrap">
                    {data.description || sp.summary || 'Sem descrição fornecida.'}
                  </p>
                </div>

                {/* Bottom Footer: Folder Tags & Edit/Delete Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                  {/* Folders assigned to this spell */}
                  <div className="flex items-center gap-1 flex-wrap flex-1 max-w-[70%]">
                    {data.subcategories && data.subcategories.length > 0 ? (
                      data.subcategories.map((sub, sIdx) => (
                        <span
                          key={`${sp.id}-sub-${sub}-${sIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubcategory(sub);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/40 hover:border-purple-400 truncate transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Folder className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{sub}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-600 italic">Sem pasta</span>
                    )}

                    {/* Manage Folders Trigger Button */}
                    {isActualGm && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingSpellFolders(sp);
                          setSelectedSpellSubcats(data.subcategories || []);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-zinc-900 transition-colors"
                        title="Organizar nas Pastas"
                      >
                        <FolderPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                      {/* Edit & Delete Buttons */}
                  {isActualGm && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar Feitiço" description="Modificar detalhes, estatísticas e descrição">
                        <button
                          type="button"
                          onClick={() => onEditEntity(sp.id)}
                          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Mover para a Lixeira" description="Mover feitiço com segurança para a lixeira">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteSpell(sp)}
                          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-600/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE / LIST VIEW */
        <div className="bg-[#09080e] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f1c] border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome do Feitiço</th>
                  <th className="py-3 px-3">Círculo</th>
                  <th className="py-3 px-3">Tradições</th>
                  <th className="py-3 px-3">Conjuração</th>
                  <th className="py-3 px-3">Alcance / Área</th>
                  <th className="py-3 px-3">Raridade</th>
                  <th className="py-3 px-3">Pastas</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSpells.map((sp) => {
                  const data = sp.spellData!;
                  const perm = HecosStorage.getEntityPermission(sp.id);
                  const rankLabel = data.rank === 0 ? 'Truque' : `${data.rank}º`;

                  return (
                    <tr
                      key={sp.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectEntity(sp.id)}
                          className="text-left font-bold text-zinc-200 group-hover:text-cyan-300 hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all flex items-center gap-2 cursor-pointer focus:outline-none"
                        >
                          <span className="hover:underline decoration-cyan-400/80 decoration-2 underline-offset-2">
                            {sp.title}
                          </span>
                          {perm.visibility === 'gm' && <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-purple-300 font-bold">{rankLabel}</td>
                      <td className="py-3 px-3 text-cyan-400 capitalize">{data.traditions?.join(', ') || '—'}</td>
                      <td className="py-3 px-3 text-zinc-400">{data.castTime || '—'}</td>
                      <td className="py-3 px-3 text-zinc-400 truncate max-w-[150px]">
                        {data.range || data.area || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <TraitBadge
                          trait={data.rarity || 'Comum'}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: data.rarity || 'Comum' } }));
                          }}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
                          {data.subcategories && data.subcategories.length > 0 ? (
                            data.subcategories.slice(0, 2).map((s, sIdx) => (
                              <span
                                key={`${sp.id}-tblsub-${s}-${sIdx}`}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 truncate max-w-[90px]"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 text-[10px]">—</span>
                          )}
                          {data.subcategories && data.subcategories.length > 2 && (
                            <span className="text-[10px] text-zinc-500">+{data.subcategories.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isActualGm ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <VisibilityBadgeMenu
                              visibility={perm.visibility}
                              allowedUserIds={perm.allowedUserIds}
                              onChange={(newVis, newAllowed) => {
                                HecosStorage.setEntityPermission(sp.id, newVis, newAllowed);
                              }}
                            />
                            <Tooltip title="Editar">
                              <button
                                type="button"
                                onClick={() => onEditEntity(sp.id)}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-300 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <button
                                type="button"
                                onClick={() => setPendingDeleteSpell(sp)}
                                className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">Leitura</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FOLDER TREE VIEW */
        <div className="space-y-4">
          {currentSubcategories.map((folderName) => {
            const spellsInFolder = spellEntities.filter((sp) =>
              sp.spellData?.subcategories?.includes(folderName) || sp.subcategory === folderName
            );

            return (
              <div key={folderName} className="bg-[#09080e] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg">
                <div className="p-4 bg-[#120f1c] flex items-center justify-between gap-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-zinc-200">{folderName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/50">
                      {spellsInFolder.length}
                    </span>
                  </div>

                  {isActualGm && (
                    <button
                      onClick={() => onCreateSpell(activeCategory !== 'all' ? activeCategory : 'arcane', folderName)}
                      className="text-xs px-3 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Feitiço</span>
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {spellsInFolder.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-2">Nenhum feitiço nesta pasta ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {spellsInFolder.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => onSelectEntity(sp.id)}
                          className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/50 flex items-center justify-between gap-2 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="text-xs font-bold text-zinc-200 hover:text-cyan-300">{sp.title}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {sp.spellData?.rank === 0 ? 'Truque' : `${sp.spellData?.rank}º Círculo`} •{' '}
                              {sp.spellData?.traditions?.join(', ')}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEntity(sp.id);
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-cyan-300"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Folder Management Modal */}
      {isFolderManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0d18] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-zinc-100">Gerenciar Pastas de Feitiços</h3>
              </div>
              <button
                onClick={() => setIsFolderManagerOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create new folder in current category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Nova Pasta ({activeCategory.toUpperCase()}):</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nome da nova pasta..."
                  className="flex-1 bg-black/50 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                />
                <button
                  onClick={handleAddFolder}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar</span>
                </button>
              </div>
            </div>

            {/* List existing folders with rename/delete */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <label className="text-xs font-bold text-zinc-400">Pastas Existentes:</label>
              {currentSubcategories.map((folderName) => {
                const count = subcategoryCounts[folderName] || 0;
                const isEditing = editingFolderOriginalName === folderName;

                return (
                  <div
                    key={folderName}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingFolderNewName}
                          onChange={(e) => setEditingFolderNewName(e.target.value)}
                          className="flex-1 bg-black/60 border border-cyan-500 rounded-lg px-2 py-1 text-xs text-zinc-100 outline-none"
                        />
                        <button
                          onClick={handleRenameFolder}
                          className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFolderOriginalName(null)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold text-zinc-200">{folderName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">({count} feitiços)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingFolderOriginalName(folderName);
                              setEditingFolderNewName(folderName);
                            }}
                            className="p-1 text-zinc-400 hover:text-cyan-300"
                            title="Renomear Pasta"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folderName)}
                            className="p-1 text-zinc-500 hover:text-rose-400"
                            title="Excluir Pasta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsFolderManagerOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Assign Folders to Specific Spell Modal */}
      {managingSpellFolders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0d18] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Organizar em Pastas</h3>
                <p className="text-xs text-cyan-400 font-medium truncate">{managingSpellFolders.title}</p>
              </div>
              <button
                onClick={() => setManagingSpellFolders(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Selecione as pastas e círculos onde este feitiço deve aparecer:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {currentSubcategories.map((subcat) => {
                const isChecked = selectedSpellSubcats.includes(subcat);
                return (
                  <label
                    key={subcat}
                    onClick={() => {
                      setSelectedSpellSubcats((prev) =>
                        prev.includes(subcat) ? prev.filter((s) => s !== subcat) : [...prev, subcat]
                      );
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200 font-semibold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{subcat}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-cyan-500 border-cyan-400 text-zinc-950' : 'border-zinc-700 bg-zinc-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setManagingSpellFolders(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSpellFolders}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Creation Modal */}
      <SpellCreateModal
        isOpen={isSpellCreateModalOpen}
        onClose={() => setIsSpellCreateModalOpen(false)}
        presetTradition={activeCategory !== 'all' ? activeCategory : undefined}
        presetSubcategory={activeSubcategory || undefined}
        onSave={(newSpellEntity) => {
          HecosStorage.saveEntity(newSpellEntity);
          setIsSpellCreateModalOpen(false);
          onSelectEntity(newSpellEntity.id);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!pendingDeleteSpell}
        entityTitle={pendingDeleteSpell?.title || ''}
        onConfirm={() => {
          if (pendingDeleteSpell) {
            onDeleteEntity(pendingDeleteSpell.id);
            setPendingDeleteSpell(null);
          }
        }}
        onCancel={() => setPendingDeleteSpell(null)}
      />
    </div>
  );
}

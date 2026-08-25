import React, { useState, useMemo } from 'react';
import {
  HecosEntity,
  PF2eSpellAttributes,
  SpellCategoryType,
} from '../types';
import { parseSpellFromContent } from '../utils/spellSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { Tooltip } from './Tooltip';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { SpellCreateModal } from './SpellCreateModal';
import { TraitBadge } from './TraitBadge';
import { RichContentRenderer } from './RichContentRenderer';
import { FolderManagerModal } from './FolderManagerModal';
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
  ArrowRight,
  Award,
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
    id: 'e_fisica',
    name: 'E. Física',
    englishName: 'Physical Energy',
    description: 'Manipulação de energia térmica, cinética, gravidade, calor, eletricidade e forças físicas materiais.',
    icon: Zap,
    color: '#00f0ff',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'e_meta',
    name: 'E. Meta',
    englishName: 'Metaphysical Energy',
    description: 'Manipulação de tempo, espaço, alma, ilusões, dimensões e forças transcendentais.',
    icon: Moon,
    color: '#b877db',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
  {
    id: 'm_organica',
    name: 'M. Orgânica',
    englishName: 'Organic Matter',
    description: 'Manipulação e transmutação de carne, sangue, biomassa, flora, cura e organismos vivos.',
    icon: Flame,
    color: '#34d399',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-600/40',
  },
  {
    id: 'm_inorganica',
    name: 'M. Inorgânica',
    englishName: 'Inorganic Matter',
    description: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos e matéria inanimada.',
    icon: Shield,
    color: '#fbbf24',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'omni',
    name: 'Omni',
    englishName: 'Omni Tradition',
    description: 'Tradição mágica suprema que unifica todas as vertentes da energia e matéria de Hecos.',
    icon: Sparkles,
    color: '#f43f5e',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
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

// Helper to normalize and match tradition strings flexibly
function matchesTradition(traditionsList: string[], target: string): boolean {
  if (!traditionsList || traditionsList.length === 0) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const targetNorm = norm(target);

  return traditionsList.some((t) => {
    const tNorm = norm(t);
    if (tNorm === targetNorm) return true;
    if (
      (targetNorm === 'efisica' || targetNorm === 'arcano' || targetNorm === 'arcane') &&
      (tNorm.includes('fisica') || tNorm.includes('arcano') || tNorm.includes('arcane'))
    )
      return true;
    if (
      (targetNorm === 'emeta' || targetNorm === 'oculto' || targetNorm === 'occult') &&
      (tNorm.includes('meta') || tNorm.includes('oculto') || tNorm.includes('occult'))
    )
      return true;
    if (
      (targetNorm === 'morganica' || targetNorm === 'primal') &&
      (tNorm.includes('organica') || tNorm.includes('primal'))
    )
      return true;
    if (
      (targetNorm === 'minorganica' || targetNorm === 'divino' || targetNorm === 'divine') &&
      (tNorm.includes('inorganica') || tNorm.includes('divino') || tNorm.includes('divine'))
    )
      return true;
    if (targetNorm === 'omni' && tNorm.includes('omni')) return true;
    return false;
  });
}

// Helper to get action glyph for cards
function getActionGlyphProp(castTime?: string): { type: ActionGlyphType; show: boolean } {
  const ct = (castTime || '').toLowerCase();
  if (ct.includes('1 a 3') || ct.includes('1 ou 2 ou 3')) return { type: '1-to-3-actions', show: true };
  if (ct.includes('1 ou 2') || ct.includes('1 a 2')) return { type: '1-to-2-actions', show: true };
  if (ct.includes('2 a 3') || ct.includes('2 ou 3')) return { type: '2-to-3-actions', show: true };
  if (ct.startsWith('1') || ct.includes('1 ação') || ct.includes('1 acao') || ct === '1') return { type: '1-action', show: true };
  if (ct.startsWith('2') || ct.includes('2 ações') || ct.includes('2 acoes') || ct === '2') return { type: '2-actions', show: true };
  if (ct.startsWith('3') || ct.includes('3 ações') || ct.includes('3 acoes') || ct === '3') return { type: '3-actions', show: true };
  if (ct.includes('reação') || ct.includes('reacao') || ct.includes('reaction')) return { type: 'reaction', show: true };
  if (ct.includes('livre') || ct.includes('free')) return { type: 'free-action', show: true };
  return { type: '1-action', show: false };
}

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
  const [filterTradition, setFilterTradition] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCastTime, setFilterCastTime] = useState<string>('all');
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // 4. Modals & folder management
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderDropdownSearch, setFolderDropdownSearch] = useState('');

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
        const isSpell =
          e.category === 'spell' ||
          e.tags?.includes('spell') ||
          e.tags?.includes('magia') ||
          e.tags?.includes('feitiço');
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
      sp.spellData?.traditions?.forEach((t) => set.add(t));
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
        (list || []).forEach((s) => allSubs.add(s));
      });
      return Array.from(allSubs);
    }
    return categoriesConfig[activeCategory] || [];
  }, [activeCategory, categoriesConfig]);

  // Filtered spells
  const filteredSpells = useMemo(() => {
    return spellEntities.filter((sp) => {
      const data = sp.spellData!;
      const traditions = data.traditions || [];

      // 1. Category tab match
      if (activeCategory !== 'all') {
        if (activeCategory === 'e_fisica' && !matchesTradition(traditions, 'E. Física')) return false;
        if (activeCategory === 'e_meta' && !matchesTradition(traditions, 'E. Meta')) return false;
        if (activeCategory === 'm_organica' && !matchesTradition(traditions, 'M. Orgânica')) return false;
        if (activeCategory === 'm_inorganica' && !matchesTradition(traditions, 'M. Inorgânica')) return false;
        if (activeCategory === 'omni' && !matchesTradition(traditions, 'Omni')) return false;
        if (activeCategory === 'focus' && data.spellType !== 'focus' && !data.traits?.includes('Foco')) return false;
        if (activeCategory === 'ritual' && data.spellType !== 'ritual' && !data.traits?.includes('Ritual')) return false;
        if (activeCategory === 'extras' && data.spellType !== 'extras' && sp.category !== 'spell') return false;
      }

      // 2. Subcategory / Folder filter
      if (activeSubcategory) {
        if (activeSubcategory === '__none__') {
          const subs = data.subcategories || sp.subcategories || (sp.subcategory ? [sp.subcategory] : []);
          if (subs.length > 0) return false;
        } else {
          const hasSub =
            data.subcategories?.includes(activeSubcategory) ||
            sp.subcategories?.includes(activeSubcategory) ||
            sp.subcategory === activeSubcategory ||
            sp.tags?.includes(activeSubcategory);
          if (!hasSub) return false;
        }
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
        if (!matchesTradition(traditions, filterTradition)) return false;
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
        const hasTrait =
          data.traits?.includes(filterTrait) ||
          data.traditions?.includes(filterTrait) ||
          sp.tags?.includes(filterTrait);
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
    const counts: Record<string, number> = { __none__: 0 };
    spellEntities.forEach((sp) => {
      const subs = sp.spellData?.subcategories || sp.subcategories || (sp.subcategory ? [sp.subcategory] : []);
      if (subs.length === 0) {
        counts.__none__ = (counts.__none__ || 0) + 1;
      } else {
        subs.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
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
        const traditions = data.traditions || [];
        if (cat.id === 'e_fisica') return matchesTradition(traditions, 'E. Física');
        if (cat.id === 'e_meta') return matchesTradition(traditions, 'E. Meta');
        if (cat.id === 'm_organica') return matchesTradition(traditions, 'M. Orgânica');
        if (cat.id === 'm_inorganica') return matchesTradition(traditions, 'M. Inorgânica');
        if (cat.id === 'omni') return matchesTradition(traditions, 'Omni');
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
    activeSubcategory !== null,
    filterRank !== 'all',
    filterTradition !== 'all',
    filterRarity !== 'all',
    filterCastTime !== 'all',
    filterTrait !== 'all',
    Boolean(searchQuery),
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setActiveSubcategory(null);
    setFilterRank('all');
    setFilterTradition('all');
    setFilterRarity('all');
    setFilterCastTime('all');
    setFilterTrait('all');
    setSearchQuery('');
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
                  Catálogo estruturado pelas tradições de Hecos (E. Física, E. Meta, M. Orgânica, M. Inorgânica, Omni), Foco e Rituais.
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
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Grade (Cards)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Lista / Tabela"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('folders')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'folders'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
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

      {/* 3. Search & Multi-Filter Toolbar */}
      <div className="bg-[#0d0b14] p-4 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search Input & Folder Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, traço (Fogo, Mental), círculo, efeito..."
                className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Folder / Subcategory Dropdown Filter */}
            <div className="relative min-w-[200px] sm:w-56">
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeSubcategory !== null
                    ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-sm'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${activeSubcategory ? 'text-purple-400' : 'text-zinc-400'}`} />
                  <span className="truncate">
                    {activeSubcategory === null
                      ? 'Todas as Pastas'
                      : activeSubcategory === '__none__'
                      ? 'Sem Pasta Definida'
                      : activeSubcategory}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                    {activeSubcategory === null
                      ? filteredSpells.length
                      : activeSubcategory === '__none__'
                      ? subcategoryCounts.__none__ || 0
                      : subcategoryCounts[activeSubcategory] || 0}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isFolderDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Folder Selector Dropdown Menu */}
              {isFolderDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFolderDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 sm:right-auto sm:w-72 mt-1.5 z-40 bg-[#0d0a17] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-80">
                    {/* Search inside folder dropdown */}
                    <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-zinc-500 ml-1 shrink-0" />
                      <input
                        type="text"
                        value={folderDropdownSearch}
                        onChange={(e) => setFolderDropdownSearch(e.target.value)}
                        placeholder="Filtrar pastas..."
                        className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none"
                        autoFocus
                      />
                      {folderDropdownSearch && (
                        <button
                          type="button"
                          onClick={() => setFolderDropdownSearch('')}
                          className="p-1 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Folders List */}
                    <div className="p-1.5 overflow-y-auto space-y-1 flex-1">
                      {/* Option: All Folders */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubcategory(null);
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          activeSubcategory === null
                            ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                            : 'text-zinc-300 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Todas as Pastas</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {activeCategory === 'all' ? spellEntities.length : categoryCounts[activeCategory] || 0}
                        </span>
                      </button>

                      {/* Option: Without Folder */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubcategory('__none__');
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          activeSubcategory === '__none__'
                            ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                            : 'text-zinc-400 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-zinc-600" />
                          <span className="italic">Sem Pasta Definida</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {subcategoryCounts.__none__ || 0}
                        </span>
                      </button>

                      <div className="my-1 border-t border-zinc-800/80" />

                      {/* Custom subcategories */}
                      {currentSubcategories
                        .filter((s) =>
                          s.toLowerCase().includes(folderDropdownSearch.toLowerCase().trim())
                        )
                        .map((subcat) => {
                          const isSelected = activeSubcategory === subcat;
                          const count = subcategoryCounts[subcat] || 0;

                          return (
                            <button
                              key={subcat}
                              type="button"
                              onClick={() => {
                                setActiveSubcategory(isSelected ? null : subcat);
                                setIsFolderDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                                isSelected
                                  ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                                  : 'text-zinc-300 hover:bg-zinc-900/90'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">{subcat}</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
                                {count}
                              </span>
                            </button>
                          );
                        })}

                      {currentSubcategories.filter((s) =>
                        s.toLowerCase().includes(folderDropdownSearch.toLowerCase().trim())
                      ).length === 0 && (
                        <div className="p-3 text-center text-xs text-zinc-500 italic">
                          Nenhuma pasta encontrada
                        </div>
                      )}
                    </div>

                    {/* Manage Folders footer action */}
                    {isActualGm && (
                      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950/90">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFolderDropdownOpen(false);
                            setIsFolderManagerOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-600/40 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>Gerenciar Pastas</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Rank, Tradition and Filter Panel Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Rank / Circle Quick Filter */}
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className={`bg-zinc-900/90 border rounded-xl px-2.5 py-2 text-xs font-semibold outline-none transition-all cursor-pointer ${
                filterRank !== 'all'
                  ? 'border-cyan-500/80 text-cyan-200 bg-cyan-950/40'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <option value="all">Todos Círculos</option>
              <option value="cantrip">Truque (0)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                <option key={r} value={String(r)}>
                  {r}º Círculo
                </option>
              ))}
            </select>

            {/* Tradition Quick Filter */}
            <select
              value={filterTradition}
              onChange={(e) => setFilterTradition(e.target.value)}
              className={`bg-zinc-900/90 border rounded-xl px-2.5 py-2 text-xs font-semibold outline-none transition-all cursor-pointer ${
                filterTradition !== 'all'
                  ? 'border-cyan-500/80 text-cyan-200 bg-cyan-950/40'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <option value="all">Todas Tradições</option>
              <option value="E. Física">E. Física</option>
              <option value="E. Meta">E. Meta</option>
              <option value="M. Orgânica">M. Orgânica</option>
              <option value="M. Inorgânica">M. Inorgânica</option>
              <option value="Omni">Omni</option>
            </select>

            {/* More Filters Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterPanelOpen || activeFiltersCount > 0
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Mais Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Limpar todos os filtros ativos"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {isFilterPanelOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 text-xs animate-fade-in">
            {/* Cast Time Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Tempo de Conjuração / Ações:</label>
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
              <label className="text-[11px] font-bold text-zinc-400">Descritor / Traço:</label>
              <select
                value={filterTrait}
                onChange={(e) => setFilterTrait(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Traços ({allTraits.length})</option>
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
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() =>
                onCreateSpell(
                  activeCategory !== 'all' ? activeCategory : 'e_fisica',
                  activeSubcategory || undefined
                )
              }
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              + Criar Feitiço
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (ADAPTIVE: MAX 3 COLS <1080P, UP TO 5 COLS >=1080P) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1800px]:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
          {filteredSpells.map((sp) => {
            const data = sp.spellData!;
            const perm = HecosStorage.getEntityPermission(sp.id);
            const rankLabel = data.rank === 0 ? 'Truque' : `${data.rank}º Círculo`;
            const actionGlyph = getActionGlyphProp(data.castTime);

            return (
              <div
                key={sp.id}
                className="group/card bg-[#0e0c15] hover:bg-[#13101c] border border-zinc-800/80 hover:border-cyan-500/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-[0_0_24px_rgba(6,182,212,0.15)] flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Bar: Title, Action Glyph, Cast Time, Visibility */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Tooltip
                        side="right"
                        delay={250}
                        className="w-full"
                        content={
                          <div className="p-3.5 space-y-2.5 max-w-sm sm:max-w-md text-xs text-left bg-[#0e0c18] border border-cyan-500/50 rounded-2xl shadow-2xl">
                            <div className="border-b border-zinc-800 pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-extrabold text-cyan-200 font-serif">{sp.title}</h4>
                                <span className="text-[10px] font-mono font-bold text-purple-300 uppercase px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800">
                                  {rankLabel}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap mt-1">
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold">
                                  {data.rarity || 'Comum'}
                                </span>
                                {data.traditions?.map((tr) => (
                                  <span key={`tt-trad-${tr}`} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300">
                                    {tr}
                                  </span>
                                ))}
                                {data.traits?.map((tr) => (
                                  <span key={`tt-trait-${tr}`} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400">
                                    {tr}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Tooltip Index Info */}
                            <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-300 font-sans">
                              {data.castTime && <div><strong className="text-cyan-400">Conjuração:</strong> {data.castTime}</div>}
                              {data.range && <div><strong className="text-cyan-400">Alcance:</strong> {data.range}</div>}
                              {data.area && <div><strong className="text-emerald-400">Área:</strong> {data.area}</div>}
                              {data.targets && <div className="col-span-2"><strong className="text-purple-400">Alvos:</strong> {data.targets}</div>}
                              {data.trigger && <div className="col-span-2"><strong className="text-amber-400">Gatilho:</strong> {data.trigger}</div>}
                              {data.savingThrow && <div><strong className="text-rose-400">Defesa:</strong> {data.savingThrow}</div>}
                              {data.duration && <div><strong className="text-teal-400">Duração:</strong> {data.duration}</div>}
                            </div>

                            {/* Full Description */}
                            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                              <RichContentRenderer content={data.description || sp.summary || 'Sem descrição.'} />
                            </div>

                            {/* Degrees of success in tooltip if present */}
                            {(data.criticalSuccess || data.success || data.failure || data.criticalFailure) && (
                              <div className="pt-2 border-t border-zinc-800 text-[10px] space-y-1">
                                <div className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Graus de Sucesso:</div>
                                {data.criticalSuccess && <div><span className="text-emerald-400 font-bold">Sucesso Crítico:</span> {data.criticalSuccess}</div>}
                                {data.success && <div><span className="text-cyan-400 font-bold">Sucesso:</span> {data.success}</div>}
                                {data.failure && <div><span className="text-amber-400 font-bold">Falha:</span> {data.failure}</div>}
                                {data.criticalFailure && <div><span className="text-rose-400 font-bold">Falha Crítica:</span> {data.criticalFailure}</div>}
                              </div>
                            )}

                            {/* Heightened in tooltip */}
                            {data.heightened && (
                              <div className="pt-2 border-t border-zinc-800 text-[10px] text-purple-200">
                                <strong className="text-purple-400 uppercase text-[9px]">Intensificado:</strong> {data.heightened}
                              </div>
                            )}
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => onSelectEntity(sp.id)}
                          className="text-left group/title focus:outline-none cursor-pointer block w-full"
                          title={`Abrir feitiço ${sp.title}`}
                        >
                          <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-cyan-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(6,182,212,0.85)]">
                            <span className="group-hover/title:underline decoration-cyan-400/80 decoration-2 underline-offset-2 truncate">
                              {sp.title}
                            </span>
                            {actionGlyph.show && (
                              <PF2eActionGlyph type={actionGlyph.type} size="sm" />
                            )}
                            {data.castTime && !actionGlyph.show && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-cyan-300 font-mono shrink-0">
                                {data.castTime}
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-cyan-400 group-hover/title:translate-x-0.5 transition-all shrink-0 ml-auto" />
                          </h3>
                        </button>
                      </Tooltip>

                      {/* Spell Type below Title in refined font */}
                      <div className="mt-1 text-xs font-serif italic text-purple-300/90 tracking-wide flex items-center gap-1.5 flex-wrap">
                        <span>{rankLabel}</span>
                        {data.spellType && data.spellType !== 'spell' && (
                          <span className="not-italic font-mono uppercase text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-bold">
                            {data.spellType === 'focus' ? 'Foco' : data.spellType === 'ritual' ? 'Ritual' : data.spellType}
                          </span>
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

                  {/* Traits & Traditions Area: Rarity First, then Traditions as TraitBadges, then other Traits */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {/* 1. Rarity at the beginning of traits */}
                    <TraitBadge
                      trait={data.rarity || 'Comum'}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('hecos:open-trait-drawer', {
                            detail: { trait: data.rarity || 'Comum' },
                          })
                        );
                      }}
                    />

                    {/* 2. Traditions as full interactive Traits */}
                    {data.traditions?.map((trad, tradIdx) => (
                      <TraitBadge
                        key={`${sp.id}-trad-${trad}-${tradIdx}`}
                        trait={trad}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('hecos:open-trait-drawer', { detail: { trait: trad } })
                          );
                        }}
                      />
                    ))}

                    {/* 3. General Traits */}
                    {data.traits
                      ?.filter((t) => !data.traditions?.includes(t))
                      .map((t, tIdx) => (
                        <TraitBadge
                          key={`${sp.id}-trait-${t}-${tIdx}`}
                          trait={t}
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } })
                            );
                          }}
                        />
                      ))}
                  </div>

                  {/* Highlighted Index Information: Range, Area, Targets, Trigger, Defense, Duration */}
                  {(data.range || data.area || data.targets || data.trigger || data.savingThrow || data.duration) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3.5 pt-3 border-t border-zinc-800/80 text-[11px]">
                      {data.range && (
                        <div className="p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-900/50 flex items-baseline gap-1.5 overflow-hidden">
                          <strong className="text-cyan-400 font-bold uppercase text-[10px] font-mono tracking-wider shrink-0">Alcance:</strong>
                          <span className="text-zinc-200 break-words">{data.range}</span>
                        </div>
                      )}
                      {data.area && (
                        <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-baseline gap-1.5 overflow-hidden">
                          <strong className="text-emerald-400 font-bold uppercase text-[10px] font-mono tracking-wider shrink-0">Área:</strong>
                          <span className="text-zinc-200 break-words">{data.area}</span>
                        </div>
                      )}
                      {data.targets && (
                        <div className="p-1.5 rounded-lg bg-purple-950/30 border border-purple-900/50 col-span-1 sm:col-span-2 flex items-baseline gap-1.5 overflow-hidden">
                          <strong className="text-purple-400 font-bold uppercase text-[10px] font-mono tracking-wider shrink-0">Alvos:</strong>
                          <span className="text-zinc-200 break-words">{data.targets}</span>
                        </div>
                      )}
                      {data.trigger && (
                        <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-900/50 col-span-1 sm:col-span-2 flex items-baseline gap-1.5 overflow-hidden">
                          <strong className="text-amber-400 font-bold uppercase text-[10px] font-mono tracking-wider shrink-0">Gatilho:</strong>
                          <span className="text-zinc-200 break-words">{data.trigger}</span>
                        </div>
                      )}
                      {data.savingThrow && (
                        <div className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-900/50 flex items-baseline gap-1.5 overflow-hidden">
                          <strong className="text-rose-400 font-bold uppercase text-[10px] font-mono tracking-wider shrink-0">Defesa:</strong>
                          <span className="text-zinc-200 break-words">{data.savingThrow}</span>
                        </div>
                      )}
                      {data.duration && (
                        <div className="p-1.5 rounded-lg bg-teal-950/30 border border-teal-900/50 flex items-baseline gap-1.5 overflow-hidden">
                          <strong className="text-teal-400 font-bold uppercase text-[10px] font-mono tracking-wider shrink-0">Duração:</strong>
                          <span className="text-zinc-200 break-words">{data.duration}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description rendered with RichContentRenderer so bold, colors, and formatting display cleanly */}
                  <div className="text-xs text-zinc-300 mt-3 leading-relaxed break-words">
                    <RichContentRenderer
                      content={data.description || sp.summary || 'Sem descrição fornecida.'}
                      onNavigate={onSelectEntity}
                    />
                  </div>
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
                        className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-zinc-900 transition-colors cursor-pointer"
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
                    <tr key={sp.id} className="hover:bg-zinc-900/50 transition-colors group">
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
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {data.traditions?.map((trad) => (
                            <TraitBadge key={`tbl-trad-${trad}`} trait={trad} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{data.castTime || '—'}</td>
                      <td className="py-3 px-3 text-zinc-400 truncate max-w-[150px]">
                        {data.range || data.area || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <TraitBadge
                          trait={data.rarity || 'Comum'}
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('hecos:open-trait-drawer', {
                                detail: { trait: data.rarity || 'Comum' },
                              })
                            );
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSubcategories.map((folderName) => {
            const spellsInFolder = spellEntities.filter((sp) =>
              sp.spellData?.subcategories?.includes(folderName)
            );

            return (
              <div
                key={folderName}
                className="bg-[#0b0914] border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all shadow-md flex flex-col justify-between"
              >
                <div className="p-4 bg-purple-950/20 border-b border-zinc-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-sm text-zinc-100">{folderName}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                    {spellsInFolder.length}
                  </span>
                </div>

                <div className="p-3 flex-1">
                  {spellsInFolder.length === 0 ? (
                    <div className="text-center py-6 text-zinc-600 text-xs italic">
                      Nenhum feitiço nesta pasta
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {spellsInFolder.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => onSelectEntity(sp.id)}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 hover:bg-cyan-950/30 border border-zinc-800/40 hover:border-cyan-500/40 cursor-pointer transition-all group"
                        >
                          <div>
                            <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300">
                              {sp.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {sp.spellData?.rank === 0 ? 'Truque' : `${sp.spellData?.rank}º Círculo`} •{' '}
                              {sp.spellData?.traditions?.join(', ') || 'Sem tradição'}
                            </div>
                          </div>
                          {isActualGm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEntity(sp.id);
                              }}
                              className="p-1 rounded text-zinc-500 hover:text-cyan-300"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* 6. Folder Management Modal (Standardized 90% Screen Width Modal) */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          scope="spell"
          categoriesConfig={categoriesConfig}
          allEntities={spellEntities}
          onClose={() => {
            setIsFolderManagerOpen(false);
            refreshConfig();
          }}
        />
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
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSpellFolders}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
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

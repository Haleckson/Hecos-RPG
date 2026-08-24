import React, { useState, useMemo, useEffect } from 'react';
import {
  HecosEntity,
  PF2eFeatAttributes,
  FeatCategoryType,
  FeatActionCost,
  FeatRarity,
} from '../types';
import { parseFeatFromContent, getFeatTypeLabel } from '../utils/featSerializer';
import { HecosStorage, DEFAULT_FEAT_CATEGORIES_CONFIG } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { renderContentWithMentions } from './MentionBadge';
import {
  Award,
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
  Sparkles,
  Shield,
  BookOpen,
  Swords,
  Crown,
  Scroll,
  Layers,
  ArrowUpDown,
  MoreVertical,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Clock,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

interface FeatExplorerProps {
  entities: HecosEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity: (id: string) => void;
  onCreateFeat: (presetCategory?: FeatCategoryType, presetSubcategory?: string) => void;
  onDeleteEntity: (id: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
}

export const MAIN_FEAT_CATEGORIES: {
  id: FeatCategoryType | 'all';
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
    name: 'Todos',
    englishName: 'All Feats',
    description: 'Todos os talentos e feats cadastrados no cenário.',
    icon: Layers,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'ancestry',
    name: 'Ancestralidade',
    englishName: 'Ancestry',
    description: 'Talentos biológicos e culturais herdados de seus povos.',
    icon: Crown,
    color: '#7eb897',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-600/40',
  },
  {
    id: 'class',
    name: 'Classe',
    englishName: 'Class',
    description: 'Técnicas exclusivas e especializações de cada classe.',
    icon: Swords,
    color: '#cb8394',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
  },
  {
    id: 'extras',
    name: 'Extra',
    englishName: 'Extra',
    description: 'Talentos extras, bênçãos, rituais e homebrews especiais.',
    icon: Sparkles,
    color: '#e08ba8',
    badgeBg: 'bg-pink-950/40',
    badgeBorder: 'border-pink-600/40',
  },
  {
    id: 'general',
    name: 'Geral',
    englishName: 'General',
    description: 'Talentos universais disponíveis para qualquer personagem.',
    icon: Shield,
    color: '#74b6c2',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'skill',
    name: 'Perícia',
    englishName: 'Skill',
    description: 'Talentos focados na evolução de proficiências e perícias específicas.',
    icon: Scroll,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'archetype',
    name: 'Vocação',
    englishName: 'Vocação / Dedication',
    description: 'Talentos de vocação, dedicação e caminhos multidisciplinares.',
    icon: BookOpen,
    color: '#b19ecc',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
];

type ViewMode = 'grid' | 'table' | 'folders';
type SortOption = 'level-asc' | 'level-desc' | 'name-asc' | 'name-desc' | 'rarity' | 'updated';

export const FeatExplorer: React.FC<FeatExplorerProps> = ({
  entities,
  onSelectEntity,
  onEditEntity,
  onCreateFeat,
  onDeleteEntity,
  onTagClick,
  isGmMode,
}) => {
  const [internalGmMode, setInternalGmMode] = useState<boolean>(() => HecosStorage.getGmMode());
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = HecosStorage.isUserGm(currentUser);
  const effectiveGmMode = isActualGm;

  // Navigation and Filter States
  const [selectedMainCategory, setSelectedMainCategory] = useState<FeatCategoryType | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('level-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Subcategories Configuration State
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllFeatSubcategoriesConfig()
  );

  // Modals and Dropdowns state
  const [isManageSubcategoriesModalOpen, setIsManageSubcategoriesModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFeatForAssign, setSelectedFeatForAssign] = useState<HecosEntity | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [targetSubcategoryForBulk, setTargetSubcategoryForBulk] = useState<string>('');

  // Compact Folders Dropdown & Filters
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderDropdownSearch, setFolderDropdownSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick inline creation
  const [inlineNewSubcategoryName, setInlineNewSubcategoryName] = useState('');
  const [showInlineNewSubcategory, setShowInlineNewSubcategory] = useState(false);

  // Subscribe to category config changes
  useEffect(() => {
    return HecosStorage.subscribeFeatCategories((cfg) => {
      setCategoriesConfig(cfg);
    });
  }, []);

  // Filter all feat entities
  const allFeatEntities = useMemo(() => {
    return entities.filter((e) => e.category === 'feat' || e.featData);
  }, [entities]);

  // Extract all traits available across feats
  const allAvailableTraits = useMemo(() => {
    const traitSet = new Set<string>();
    allFeatEntities.forEach((ent) => {
      const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
      feat.traits?.forEach((t) => traitSet.add(t));
    });
    return Array.from(traitSet).sort();
  }, [allFeatEntities]);

  // Compute subcategories available for current selection
  const currentAvailableSubcategories = useMemo(() => {
    let list: string[] = [];
    if (selectedMainCategory === 'all') {
      const all = new Set<string>();
      (Object.values(categoriesConfig) as string[][]).forEach((subList) => {
        if (Array.isArray(subList)) {
          subList.forEach((sub) => all.add(sub));
        }
      });
      list = Array.from(all).sort();
    } else {
      list = (categoriesConfig[selectedMainCategory] || []).slice().sort();
    }
    if (!effectiveGmMode) {
      list = list.filter((sub) => !HecosStorage.isFolderSecret(sub));
    }
    return list;
  }, [selectedMainCategory, categoriesConfig, effectiveGmMode]);

  // Helper to get all subcategories assigned to an entity
  const getEntitySubcategories = (ent: HecosEntity, featData?: PF2eFeatAttributes): string[] => {
    const list = featData?.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
    return Array.isArray(list) ? list : [];
  };

  // Helper to get normalized feat type
  const getEntityFeatType = (ent: HecosEntity, featData: PF2eFeatAttributes): FeatCategoryType => {
    if (featData.featType) {
      if (featData.featType === 'hecos') return 'extras';
      return featData.featType;
    }
    return 'general';
  };

  // Main Filter & Sort Pipeline
  const filteredFeats = useMemo(() => {
    return allFeatEntities.filter((ent) => {
      const featData = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
      const featType = getEntityFeatType(ent, featData);
      const entitySubcats = getEntitySubcategories(ent, featData);

      // 0. Permission check:
      if (!isActualGm) {
        if (!HecosStorage.canUserAccessItem(ent, currentUser)) return false;
        if (entitySubcats.length > 0 && entitySubcats.every((s) => HecosStorage.isFolderSecret(s))) {
          return false;
        }
      }

      // 1. Filter by Main Category
      if (selectedMainCategory !== 'all') {
        const matchesCategory =
          featType === selectedMainCategory ||
          (selectedMainCategory === 'extras' && featType === 'hecos');
        if (!matchesCategory) return false;
      }

      // 2. Filter by Subcategory (folder)
      if (selectedSubcategory !== 'all') {
        if (selectedSubcategory === '__none__') {
          if (entitySubcats.length > 0) return false;
        } else {
          if (!entitySubcats.includes(selectedSubcategory)) return false;
        }
      }

      // 3. Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ent.title?.toLowerCase().includes(q);
        const matchesSub = ent.subtitle?.toLowerCase().includes(q);
        const matchesDesc = (featData.description || ent.content || '').toLowerCase().includes(q);
        const matchesPrereq = (featData.prerequisites || '').toLowerCase().includes(q);
        const matchesClass = (featData.associatedClassOrAncestry || '').toLowerCase().includes(q);
        const matchesTraits = featData.traits?.some((t) => t.toLowerCase().includes(q));
        const matchesSubcats = entitySubcats.some((s) => s.toLowerCase().includes(q));
        const matchesTags = ent.tags?.some((t) => t.toLowerCase().includes(q));

        if (
          !matchesTitle &&
          !matchesSub &&
          !matchesDesc &&
          !matchesPrereq &&
          !matchesClass &&
          !matchesTraits &&
          !matchesSubcats &&
          !matchesTags
        ) {
          return false;
        }
      }

      // 4. Filter by Level
      if (filterLevel !== 'all') {
        const targetLvl = parseInt(filterLevel, 10);
        if (featData.level !== targetLvl) return false;
      }

      // 5. Filter by Action Cost
      if (filterAction !== 'all') {
        if (filterAction === 'reaction' && featData.actionCost !== 'reaction') return false;
        if (filterAction === 'free' && featData.actionCost !== 'free') return false;
        if (filterAction === 'passive' && featData.actionCost !== 'passive') return false;
        if (['1', '2', '3'].includes(filterAction) && featData.actionCost !== filterAction) return false;
      }

      // 6. Filter by Rarity
      if (filterRarity !== 'all') {
        if (featData.rarity?.toLowerCase() !== filterRarity.toLowerCase()) return false;
      }

      // 7. Filter by Trait
      if (filterTrait !== 'all') {
        if (!featData.traits?.includes(filterTrait)) return false;
      }

      return true;
    }).sort((a, b) => {
      const featA = parseFeatFromContent(a.title, a.content || '', a.featData);
      const featB = parseFeatFromContent(b.title, b.content || '', b.featData);

      switch (sortBy) {
        case 'level-asc':
          if (featA.level !== featB.level) return featA.level - featB.level;
          return a.title.localeCompare(b.title);
        case 'level-desc':
          if (featA.level !== featB.level) return featB.level - featA.level;
          return a.title.localeCompare(b.title);
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'rarity': {
          const rarityOrder: Record<string, number> = { comum: 1, incomum: 2, raro: 3, único: 4, unico: 4 };
          const rA = rarityOrder[featA.rarity?.toLowerCase()] || 0;
          const rB = rarityOrder[featB.rarity?.toLowerCase()] || 0;
          if (rA !== rB) return rA - rB;
          return featA.level - featB.level;
        }
        case 'updated':
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [
    allFeatEntities,
    selectedMainCategory,
    selectedSubcategory,
    searchQuery,
    filterLevel,
    filterAction,
    filterRarity,
    filterTrait,
    sortBy,
  ]);

  // Counts by Main Category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFeatEntities.length };
    MAIN_FEAT_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') counts[cat.id] = 0;
    });

    allFeatEntities.forEach((ent) => {
      const featData = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
      const fType = getEntityFeatType(ent, featData);
      if (counts[fType] !== undefined) {
        counts[fType]++;
      } else {
        counts['extras'] = (counts['extras'] || 0) + 1;
      }
    });

    return counts;
  }, [allFeatEntities]);

  // Counts by Subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFeatEntities.length, __none__: 0 };

    allFeatEntities.forEach((ent) => {
      const featData = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
      const subcats = getEntitySubcategories(ent, featData);
      if (subcats.length === 0) {
        counts.__none__++;
      } else {
        subcats.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });

    return counts;
  }, [allFeatEntities]);

  // Action Glyph helper
  const getActionGlyphProp = (cost: string): { type: ActionGlyphType; show: boolean } => {
    switch (cost) {
      case '1':
        return { type: '1-action', show: true };
      case '2':
        return { type: '2-actions', show: true };
      case '3':
        return { type: '3-actions', show: true };
      case 'free':
        return { type: 'free-action', show: true };
      case 'reaction':
        return { type: 'reaction', show: true };
      case '1-to-2':
        return { type: '1-to-2-actions', show: true };
      case '1-to-3':
        return { type: '1-to-3-actions', show: true };
      default:
        return { type: '1-action', show: false };
    }
  };

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'incomum':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      case 'raro':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
      case 'único':
      case 'unico':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
      case 'comum':
      default:
        return 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60';
    }
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedSubcategory !== 'all' ||
    filterLevel !== 'all' ||
    filterAction !== 'all' ||
    filterRarity !== 'all' ||
    filterTrait !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSubcategory('all');
    setFilterLevel('all');
    setFilterAction('all');
    setFilterRarity('all');
    setFilterTrait('all');
  };

  const handleAddInlineSubcategory = () => {
    const trimmed = inlineNewSubcategoryName.trim();
    if (!trimmed) return;
    const cat = selectedMainCategory === 'all' ? 'general' : selectedMainCategory;
    HecosStorage.addFeatSubcategory(cat, trimmed);
    setSelectedSubcategory(trimmed);
    setInlineNewSubcategoryName('');
    setShowInlineNewSubcategory(false);
  };

  const openAssignModal = (entity: HecosEntity) => {
    setSelectedFeatForAssign(entity);
    setIsAssignModalOpen(true);
  };

  const openBulkAddModal = (subcat: string) => {
    setTargetSubcategoryForBulk(subcat);
    setIsBulkAddModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. COMPACT TOP HEADER */}
      <div className="rounded-2xl bg-[#0e0b17] border border-zinc-800/90 p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-64 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight">
                Talentos de Hecos (PF2e)
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {allFeatEntities.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explore e organize talentos de Pathfinder 2e vinculados a pastas e subcategorias.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {isActualGm && (
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setIsManageSubcategoriesModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Gerenciar estrutura de pastas e subcategorias"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Gerenciar Pastas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const targetCat = selectedMainCategory === 'all' ? 'class' : selectedMainCategory;
                const targetSub = selectedSubcategory === 'all' || selectedSubcategory === '__none__' ? undefined : selectedSubcategory;
                onCreateFeat(targetCat, targetSub);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Talento</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CATEGORY SEGMENTED TABS (Compact, Horizontal) */}
      <div className="overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 min-w-max p-1 rounded-xl bg-[#090710] border border-zinc-800/80">
          {MAIN_FEAT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedMainCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedMainCategory(cat.id);
                  setSelectedSubcategory('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-black text-amber-300 font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SUBCATEGORY HORIZONTAL STRIP (Single Line Scrollable Chips) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Subpastas {selectedMainCategory !== 'all' ? `de ${MAIN_FEAT_CATEGORIES.find((c) => c.id === selectedMainCategory)?.name}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {selectedSubcategory !== 'all' && selectedSubcategory !== '__none__' && (
              <button
                type="button"
                onClick={() => openBulkAddModal(selectedSubcategory)}
                className="text-[11px] text-purple-300 hover:text-purple-200 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Adicionar Talentos à Pasta</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInlineNewSubcategory(!showInlineNewSubcategory)}
              className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Nova Pasta</span>
            </button>
          </div>
        </div>

        {/* Inline Subcategory Creator */}
        {showInlineNewSubcategory && (
          <div className="p-2.5 rounded-xl bg-zinc-950/90 border border-amber-500/30 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inlineNewSubcategoryName}
                onChange={(e) => setInlineNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInlineSubcategory();
                  }
                }}
                placeholder="Nome da nova pasta (ex: Fighter, Umbralis, Atletismo)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                autoFocus
              />
              <FolderPlus className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2" />
            </div>
            <button
              type="button"
              onClick={handleAddInlineSubcategory}
              disabled={!inlineNewSubcategoryName.trim()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInlineNewSubcategoryName('');
                setShowInlineNewSubcategory(false);
              }}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Horizontal Chips: Single clean row with horizontal scrolling */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {/* Todas */}
          <button
            type="button"
            onClick={() => setSelectedSubcategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedSubcategory === 'all'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-[#0f0c18] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <span>Todas as Pastas</span>
            <span
              className={`text-[10px] font-mono px-1 rounded ${
                selectedSubcategory === 'all' ? 'bg-black text-amber-300' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {filteredFeats.length}
            </span>
          </button>

          {/* Subcategorias disponíveis */}
          {currentAvailableSubcategories.map((subcat) => {
            const isSelected = selectedSubcategory === subcat;
            const count = subcategoryCounts[subcat] || 0;
            const isSecret = HecosStorage.isFolderSecret(subcat);

            return (
              <div
                key={subcat}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-950/90 text-amber-200 border border-amber-500 shadow-sm ring-1 ring-amber-500/30'
                    : isSecret
                    ? 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-dashed border-zinc-700 hover:border-zinc-500'
                    : 'bg-[#0f0c18] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
                }`}
                onClick={() => setSelectedSubcategory(subcat)}
              >
                <Folder className={`w-3 h-3 ${isSelected ? 'text-amber-400' : isSecret ? 'text-zinc-500' : 'text-zinc-500'}`} />
                <span>{subcat}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isSelected ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {count}
                </span>

                {/* GM Mode: 3-Level Granular Folder Visibility Menu */}
                {effectiveGmMode && (
                  <div className="ml-0.5" onClick={(e) => e.stopPropagation()}>
                    <VisibilityBadgeMenu
                      visibility={HecosStorage.getFolderPermission(subcat).visibility}
                      allowedUserIds={HecosStorage.getFolderPermission(subcat).allowedUserIds}
                      isSecret={isSecret}
                      onChange={(newVis, newAllowed) => {
                        HecosStorage.setFolderPermission(subcat, newVis, newAllowed);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Sem Pasta */}
          <button
            type="button"
            onClick={() => setSelectedSubcategory('__none__')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedSubcategory === '__none__'
                ? 'bg-rose-950/90 text-rose-200 border border-rose-500 shadow-sm'
                : 'bg-[#0f0c18] hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-dashed border-zinc-800'
            }`}
          >
            <span>Sem Pasta</span>
            <span
              className={`text-[10px] font-mono px-1 rounded ${
                selectedSubcategory === '__none__' ? 'bg-rose-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {subcategoryCounts.__none__ || 0}
            </span>
          </button>
        </div>
      </div>

      {/* 4. SEARCH, FILTERS AND VIEW MODES TOOLBAR */}
      <div className="p-3.5 rounded-xl bg-[#0e0b17] border border-zinc-800/90 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, traços, requisitos, regras..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Select: Folder Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSubcategory !== 'all'
                  ? 'bg-amber-950/80 text-amber-200 border-amber-600/80'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-600'
              }`}
              title="Filtrar por Pasta/Subcategoria"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[130px] truncate">
                {selectedSubcategory === 'all'
                  ? 'Todas as Pastas'
                  : selectedSubcategory === '__none__'
                  ? 'Sem Pasta'
                  : selectedSubcategory}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Folder Dropdown Popover */}
            {isFolderDropdownOpen && (
              <div className="absolute right-0 sm:left-0 top-full mt-1 w-72 rounded-xl bg-[#140f22] border border-amber-500/30 shadow-2xl p-2 z-50 space-y-2 animate-fade-in">
                <div className="relative">
                  <input
                    type="text"
                    value={folderDropdownSearch}
                    onChange={(e) => setFolderDropdownSearch(e.target.value)}
                    placeholder="Pesquisar pasta..."
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubcategory('all');
                      setIsFolderDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 rounded-lg text-xs text-left flex items-center justify-between ${
                      selectedSubcategory === 'all'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>Todas as Pastas</span>
                    <span className="text-[10px] opacity-70 font-mono">{allFeatEntities.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubcategory('__none__');
                      setIsFolderDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 rounded-lg text-xs text-left flex items-center justify-between ${
                      selectedSubcategory === '__none__'
                        ? 'bg-rose-500 text-black font-bold'
                        : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <span>Sem Pasta Definida</span>
                    <span className="text-[10px] opacity-70 font-mono">{subcategoryCounts.__none__ || 0}</span>
                  </button>

                  <div className="pt-1 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase px-1">
                    Pastas ({currentAvailableSubcategories.length})
                  </div>

                  {currentAvailableSubcategories
                    .filter((s) => s.toLowerCase().includes(folderDropdownSearch.toLowerCase()))
                    .map((sub) => {
                      const count = subcategoryCounts[sub] || 0;
                      const isSel = selectedSubcategory === sub;

                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setSelectedSubcategory(sub);
                            setIsFolderDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1 rounded-lg text-xs text-left flex items-center justify-between ${
                            isSel
                              ? 'bg-amber-950 text-amber-200 font-bold border border-amber-600/50'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Folder className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{sub}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">{count}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs outline-none focus:border-amber-400"
          >
            <option value="all">Nível: Todos</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((lvl) => (
              <option key={lvl} value={lvl.toString()}>
                Nível {lvl}
              </option>
            ))}
          </select>

          {/* Action Cost Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs outline-none focus:border-amber-400"
          >
            <option value="all">Ações: Todas</option>
            <option value="1">1 Ação (◆)</option>
            <option value="2">2 Ações (◆◆)</option>
            <option value="3">3 Ações (◆◆◆)</option>
            <option value="reaction">Reação (↺)</option>
            <option value="free">Livre (◇)</option>
            <option value="passive">Passivo</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs outline-none focus:border-amber-400"
          >
            <option value="level-asc">Nível (1 → 20)</option>
            <option value="level-desc">Nível (20 → 1)</option>
            <option value="name-asc">Nome (A → Z)</option>
            <option value="name-desc">Nome (Z → A)</option>
            <option value="rarity">Raridade</option>
            <option value="updated">Recentes</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md text-xs transition-all ${
                viewMode === 'grid' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md text-xs transition-all ${
                viewMode === 'table' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tabela"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('folders')}
              className={`p-1 rounded-md text-xs transition-all ${
                viewMode === 'folders' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Hierarquia"
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Filters & Clear Row */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/60 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-zinc-400">
              <span className="text-[11px] text-zinc-500">Filtros:</span>
              {selectedSubcategory !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] flex items-center gap-1">
                  <span>Pasta: {selectedSubcategory === '__none__' ? 'Sem Pasta' : selectedSubcategory}</span>
                  <button type="button" onClick={() => setSelectedSubcategory('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterLevel !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[11px] flex items-center gap-1">
                  <span>Nível {filterLevel}</span>
                  <button type="button" onClick={() => setFilterLevel('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterAction !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800 text-[11px] flex items-center gap-1">
                  <span>Ação: {filterAction}</span>
                  <button type="button" onClick={() => setFilterAction('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <span className="text-[11px] text-zinc-500 ml-1">
                ({filteredFeats.length} de {allFeatEntities.length})
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-bold"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        )}
      </div>

      {/* 5. MAIN CONTENT AREA: CARDS, TABLE, OR FOLDERS */}
      {filteredFeats.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0c0914] border border-dashed border-zinc-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-200">Nenhum talento encontrado</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Nenhum talento corresponde aos filtros selecionados. Tente ajustar os termos de busca ou crie um novo talento.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all"
              >
                Limpar Filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const cat = selectedMainCategory === 'all' ? 'class' : selectedMainCategory;
                const sub = selectedSubcategory === 'all' || selectedSubcategory === '__none__' ? undefined : selectedSubcategory;
                onCreateFeat(cat, sub);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar Novo Talento</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* --- MODE 1: GRID CARDS --- */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 min-[1080px]:grid-cols-5 gap-3">
          {filteredFeats.map((ent) => {
            const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
            const subcats = getEntitySubcategories(ent, feat);
            const action = getActionGlyphProp(feat.actionCost);

            return (
              <div
                key={ent.id}
                className="rounded-xl bg-[#0e0b17] hover:bg-[#130f20] border border-zinc-800/90 hover:border-amber-500/40 p-3.5 transition-all flex flex-col justify-between group shadow-md space-y-3"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Rarity Trait, Category & GM Actions */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <TraitBadge trait={feat.rarity || 'Comum'} />
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {getFeatTypeLabel(feat.featType)}
                      </span>
                    </div>

                    {isActualGm && (
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* 3-Level Granular Visibility Menu */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <VisibilityBadgeMenu
                            visibility={ent.visibility}
                            allowedUserIds={ent.allowedUserIds}
                            isSecret={ent.isSecret}
                            onChange={(newVis, newAllowed) => {
                              HecosStorage.setEntityVisibility(ent.id, newVis, newAllowed);
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => openAssignModal(ent)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 transition-colors"
                          title="Organizar Pastas / Subcategorias deste talento"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditEntity(ent.id)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 transition-colors"
                          title="Editar Talento"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntity(ent.id)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Excluir Talento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Action Glyph on Left, Feat Level on Opposite Right */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectEntity(ent.id)}
                      className="text-left flex-1 min-w-0 group/title focus:outline-none cursor-pointer"
                      title={`Abrir talento ${ent.title}`}
                    >
                      <h3 className="text-sm font-bold text-amber-200 group-hover/title:text-amber-300 group-hover/title:drop-shadow-[0_0_10px_rgba(245,158,11,0.85)] flex flex-wrap items-center gap-1.5 leading-snug transition-all">
                        <span className="group-hover/title:underline decoration-amber-400/80 decoration-2 underline-offset-2 break-words">
                          {ent.title}
                        </span>
                        {action.show && <PF2eActionGlyph type={action.type} size="sm" />}
                        {feat.actionCost === 'passive' && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                            Passivo
                          </span>
                        )}
                        {feat.actionCost === 'activity' && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60 flex items-center gap-0.5 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Ativ.</span>
                          </span>
                        )}
                      </h3>
                      {ent.subtitle && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 italic break-words">{ent.subtitle}</p>
                      )}
                    </button>

                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 ml-1">
                      Nível {feat.level}
                    </span>
                  </div>

                  {/* Subcategories (Folders) badges */}
                  {subcats.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {subcats.map((subcat) => (
                        <button
                          key={subcat}
                          type="button"
                          onClick={() => setSelectedSubcategory(subcat)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-600/40 transition-colors"
                        >
                          <Folder className="w-2.5 h-2.5 text-amber-400" />
                          <span>{subcat}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Traits badges */}
                  {feat.traits && feat.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {feat.traits.map((trait) => (
                        <TraitBadge
                          key={trait}
                          trait={trait}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait } }));
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Prerequisites */}
                  {feat.prerequisites && (
                    <div className="text-[11px] text-zinc-400 break-words">
                      <strong className="text-zinc-500 font-bold uppercase text-[9px] mr-1">Pré-req:</strong>
                      <span>{renderContentWithMentions(feat.prerequisites, onSelectEntity)}</span>
                    </div>
                  )}

                  {/* Requirements */}
                  {feat.requirements && (
                    <div className="text-[11px] text-zinc-400 break-words">
                      <strong className="text-zinc-500 font-bold uppercase text-[9px] mr-1">Requisitos:</strong>
                      <span>{renderContentWithMentions(feat.requirements, onSelectEntity)}</span>
                    </div>
                  )}

                  {/* Trigger */}
                  {feat.trigger && (
                    <div className="text-[11px] text-rose-300 break-words">
                      <strong className="text-rose-400 font-bold uppercase text-[9px] mr-1">Gatilho:</strong>
                      <span>{renderContentWithMentions(feat.trigger, onSelectEntity)}</span>
                    </div>
                  )}

                  {/* Frequency */}
                  {feat.frequency && (
                    <div className="text-[11px] text-zinc-300 break-words">
                      <strong className="text-zinc-500 font-bold uppercase text-[9px] mr-1">Frequência:</strong>
                      <span>{feat.frequency}</span>
                    </div>
                  )}

                  {/* Description na íntegra (full text) */}
                  <div className="text-xs text-zinc-300/90 leading-relaxed break-words">
                    {renderContentWithMentions(feat.description || ent.summary || ent.content?.replace(/<[^>]+>/g, '') || '', onSelectEntity)}
                  </div>

                  {/* Degrees of Success if present */}
                  {(feat.criticalSuccess || feat.success || feat.failure || feat.criticalFailure) && (
                    <div className="text-[11px] space-y-1 pt-1.5 border-t border-zinc-800/60 text-zinc-300">
                      {feat.criticalSuccess && (
                        <div>
                          <strong className="text-emerald-400 font-bold">Sucesso Crítico: </strong>
                          <span>{renderContentWithMentions(feat.criticalSuccess, onSelectEntity)}</span>
                        </div>
                      )}
                      {feat.success && (
                        <div>
                          <strong className="text-cyan-400 font-bold">Sucesso: </strong>
                          <span>{renderContentWithMentions(feat.success, onSelectEntity)}</span>
                        </div>
                      )}
                      {feat.failure && (
                        <div>
                          <strong className="text-amber-400 font-bold">Falha: </strong>
                          <span>{renderContentWithMentions(feat.failure, onSelectEntity)}</span>
                        </div>
                      )}
                      {feat.criticalFailure && (
                        <div>
                          <strong className="text-rose-400 font-bold">Falha Crítica: </strong>
                          <span>{renderContentWithMentions(feat.criticalFailure, onSelectEntity)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Special if present */}
                  {feat.special && (
                    <div className="text-[11px] pt-1 text-zinc-400 break-words">
                      <strong className="text-zinc-300 font-bold">Especial: </strong>
                      <span>{renderContentWithMentions(feat.special, onSelectEntity)}</span>
                    </div>
                  )}
                </div>

                {/* Footer: View Button */}
                <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
                  <button
                    type="button"
                    onClick={() => openAssignModal(ent)}
                    className="text-[10px] text-zinc-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <FolderPlus className="w-3 h-3 text-amber-400" />
                    <span>Pastas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectEntity(ent.id)}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 group-hover:underline"
                  >
                    <span>Ver Detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* --- MODE 2: TABLE LIST --- */
        <div className="rounded-2xl bg-[#0e0b17] border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#140f21] border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Nível</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Nome do Talento</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Subcategorias / Pastas</th>
                  <th className="py-3 px-4">Raridade</th>
                  <th className="py-3 px-4">Traços</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredFeats.map((ent) => {
                  const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
                  const subcats = getEntitySubcategories(ent, feat);
                  const action = getActionGlyphProp(feat.actionCost);

                  return (
                    <tr
                      key={ent.id}
                      className="hover:bg-[#151024] transition-colors group"
                    >
                      {/* Level */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {feat.level}
                        </span>
                      </td>

                      {/* Action Glyph */}
                      <td className="py-3 px-4">
                        {action.show ? (
                          <PF2eActionGlyph type={action.type} size="sm" />
                        ) : feat.actionCost === 'passive' ? (
                          <span className="text-[10px] font-mono text-zinc-400">Passivo</span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">—</span>
                        )}
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3 px-4 font-medium">
                        <button
                          type="button"
                          onClick={() => onSelectEntity(ent.id)}
                          className="text-left font-bold text-amber-200 group-hover:text-amber-300 hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all cursor-pointer focus:outline-none"
                        >
                          <span className="hover:underline decoration-amber-400/80 decoration-2 underline-offset-2 text-sm">
                            {ent.title}
                          </span>
                          {ent.subtitle && (
                            <div className="text-[11px] text-zinc-400 italic font-normal break-words">{ent.subtitle}</div>
                          )}
                        </button>
                      </td>

                      {/* Feat Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/40">
                          {getFeatTypeLabel(feat.featType)}
                        </span>
                      </td>

                      {/* Subcategories (Folders) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {subcats.map((subcat) => (
                            <button
                              key={subcat}
                              type="button"
                              onClick={() => setSelectedSubcategory(subcat)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-600/40"
                            >
                              <Folder className="w-2.5 h-2.5 text-amber-400" />
                              <span>{subcat}</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => openAssignModal(ent)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-amber-300"
                            title="Editar pastas deste talento"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Rarity Trait */}
                      <td className="py-3 px-4">
                        <TraitBadge trait={feat.rarity || 'Comum'} />
                      </td>

                      {/* Traits */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {feat.traits?.map((trait) => (
                            <TraitBadge
                              key={trait}
                              trait={trait}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {isActualGm ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <VisibilityBadgeMenu
                              visibility={ent.visibility}
                              allowedUserIds={ent.allowedUserIds}
                              isSecret={ent.isSecret}
                              onChange={(newVis, newAllowed) => {
                                HecosStorage.setEntityVisibility(ent.id, newVis, newAllowed);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => openAssignModal(ent)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-300"
                              title="Organizar Pastas"
                            >
                              <Folder className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditEntity(ent.id)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300"
                              title="Editar Talento"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEntity(ent.id)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                              title="Excluir Talento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
        /* --- MODE 3: FOLDER TREE HIERARCHY --- */
        <div className="space-y-4">
          {MAIN_FEAT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const subcatsInCat = categoriesConfig[cat.id] || [];
            const featsInThisCat = allFeatEntities.filter((ent) => {
              const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
              return getEntityFeatType(ent, feat) === cat.id;
            });

            return (
              <div key={cat.id} className="rounded-xl bg-[#0c0914] border border-zinc-800/90 overflow-hidden shadow-md">
                {/* Category Header */}
                <div className="p-4 bg-gradient-to-r from-[#171124] to-[#0f0c18] border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 text-amber-400 border border-zinc-800">
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
                        <span>{cat.name} ({cat.englishName})</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 text-amber-400 border border-zinc-800">
                          {featsInThisCat.length} talentos
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">{cat.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onCreateFeat(cat.id as FeatCategoryType);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo em {cat.name}</span>
                  </button>
                </div>

                {/* Subcategories Folders */}
                <div className="p-4 space-y-3">
                  {subcatsInCat.map((subcat) => {
                    const featsInSubcat = featsInThisCat.filter((ent) => {
                      const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
                      return getEntitySubcategories(ent, feat).includes(subcat);
                    });

                    return (
                      <div
                        key={subcat}
                        className="rounded-lg bg-zinc-950/60 border border-zinc-800/70 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-amber-400" />
                            <span className="font-bold text-xs text-zinc-200">{subcat}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {featsInSubcat.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openBulkAddModal(subcat)}
                              className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-300 text-[11px] font-medium flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Talentos</span>
                            </button>
                          </div>
                        </div>

                        {/* Feats inside this folder */}
                        {featsInSubcat.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                            {featsInSubcat.map((ent) => {
                              const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
                              const action = getActionGlyphProp(feat.actionCost);

                              return (
                                <div
                                  key={ent.id}
                                  onClick={() => onSelectEntity(ent.id)}
                                  className="p-2.5 rounded-lg bg-[#120e1d] hover:bg-[#191428] border border-zinc-800 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 shrink-0">
                                      {feat.level}
                                    </span>
                                    <span className="font-bold text-xs text-amber-200 truncate">{ent.title}</span>
                                  </div>
                                  {action.show && <PF2eActionGlyph type={action.type} size="sm" />}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-500 italic pl-6">
                            Nenhum talento nesta pasta. Clique em "Adicionar Talentos" para associar feats existentes.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL 1: GERENCIAR ESTRUTURA DE PASTAS E SUBCATEGORIAS --- */}
      {isManageSubcategoriesModalOpen && (
        <ManageSubcategoriesModal
          categoriesConfig={categoriesConfig}
          onClose={() => setIsManageSubcategoriesModalOpen(false)}
        />
      )}

      {/* --- MODAL 2: ASSIGN SUBCATEGORIES FOR SINGLE FEAT --- */}
      {isAssignModalOpen && selectedFeatForAssign && (
        <AssignFeatSubcategoriesModal
          featEntity={selectedFeatForAssign}
          categoriesConfig={categoriesConfig}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedFeatForAssign(null);
          }}
        />
      )}

      {/* --- MODAL 3: BULK ADD FEATS TO SUBCATEGORY --- */}
      {isBulkAddModalOpen && targetSubcategoryForBulk && (
        <AddFeatsToSubcategoryModal
          subcategoryName={targetSubcategoryForBulk}
          allFeats={allFeatEntities}
          onClose={() => {
            setIsBulkAddModalOpen(false);
            setTargetSubcategoryForBulk('');
          }}
        />
      )}
    </div>
  );
};

/**
 * MODAL: Gerenciar Pastas & Subcategorias
 */
const ManageSubcategoriesModal: React.FC<{
  categoriesConfig: Record<string, string[]>;
  onClose: () => void;
}> = ({ categoriesConfig, onClose }) => {
  const [selectedCatKey, setSelectedCatKey] = useState<string>('class');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [editingSubcatName, setEditingSubcatName] = useState<{ oldName: string; newName: string } | null>(null);

  const subcats = categoriesConfig[selectedCatKey] || [];

  const handleAdd = () => {
    const trimmed = newSubcatName.trim();
    if (!trimmed) return;
    HecosStorage.addFeatSubcategory(selectedCatKey, trimmed);
    setNewSubcatName('');
  };

  const handleRename = () => {
    if (!editingSubcatName || !editingSubcatName.newName.trim()) return;
    HecosStorage.renameFeatSubcategory(selectedCatKey, editingSubcatName.oldName, editingSubcatName.newName.trim());
    setEditingSubcatName(null);
  };

  const handleDelete = (subcat: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a subcategoria "${subcat}"? Os talentos não serão apagados.`)) {
      HecosStorage.deleteFeatSubcategory(selectedCatKey, subcat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e0b17] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-[#151023] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-zinc-100">Gerenciar Pastas & Subcategorias</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Main Category Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
              Selecione a Categoria Principal:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAIN_FEAT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCatKey(cat.id);
                    setEditingSubcatName(null);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedCatKey === cat.id
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cat.name} ({cat.englishName})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add New Subcategory Input */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/20 space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Criar Nova Subcategoria em "{MAIN_FEAT_CATEGORIES.find((c) => c.id === selectedCatKey)?.name}":</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="Ex: Fighter, Wizard, Ladino, Umbralis, Acrobacia..."
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newSubcatName.trim()}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Subcategories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase">
              <span>Subcategorias Existentes ({subcats.length}):</span>
            </div>

            <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
              {subcats.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 italic">
                  Nenhuma subcategoria cadastrada nesta categoria.
                </div>
              ) : (
                subcats.map((subcat) => (
                  <div
                    key={subcat}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                  >
                    {editingSubcatName?.oldName === subcat ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingSubcatName.newName}
                          onChange={(e) =>
                            setEditingSubcatName({ ...editingSubcatName, newName: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRename();
                            }
                          }}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-amber-400 text-zinc-100 outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleRename}
                          className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubcatName(null)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-zinc-200">{subcat}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Folder Secret / Visibility Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              HecosStorage.toggleFolderSecret(subcat);
                              // Force re-render of modal
                              setEditingSubcatName(null);
                            }}
                            className={`p-1.5 rounded-lg border transition-all ${
                              HecosStorage.isFolderSecret(subcat)
                                ? 'bg-zinc-900 text-zinc-500 hover:text-amber-300 border-zinc-700 hover:border-amber-500/50'
                                : 'bg-amber-950/40 text-amber-400 hover:text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                            }`}
                            title={
                              HecosStorage.isFolderSecret(subcat)
                                ? 'Pasta Secreta: Apenas o GM pode ver (Clique para tornar Pública)'
                                : 'Pasta Pública: Todos podem ver (Clique para tornar Secreta do GM)'
                            }
                          >
                            {HecosStorage.isFolderSecret(subcat) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 fill-amber-400/20" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingSubcatName({ oldName: subcat, newName: subcat })}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300"
                            title="Renomear Subcategoria"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(subcat)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                            title="Excluir Subcategoria"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#110d1d] border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * MODAL: Assign / Toggle Subcategories for a Single Feat
 */
const AssignFeatSubcategoriesModal: React.FC<{
  featEntity: HecosEntity;
  categoriesConfig: Record<string, string[]>;
  onClose: () => void;
}> = ({ featEntity, categoriesConfig, onClose }) => {
  const featData = parseFeatFromContent(featEntity.title, featEntity.content || '', featEntity.featData);
  const initialSubcats = featData.subcategories || featEntity.subcategories || (featEntity.subcategory ? [featEntity.subcategory] : []);

  const [selectedSubcats, setSelectedSubcats] = useState<string[]>(initialSubcats);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(featData.featType || 'class');
  const [customInput, setCustomInput] = useState('');

  const toggle = (subcat: string) => {
    if (selectedSubcats.includes(subcat)) {
      setSelectedSubcats(selectedSubcats.filter((s) => s !== subcat));
    } else {
      setSelectedSubcats([...selectedSubcats, subcat]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    HecosStorage.addFeatSubcategory(activeCategoryTab, trimmed);
    if (!selectedSubcats.includes(trimmed)) {
      setSelectedSubcats([...selectedSubcats, trimmed]);
    }
    setCustomInput('');
  };

  const handleSave = () => {
    HecosStorage.assignFeatSubcategories(featEntity.id, selectedSubcats);
    onClose();
  };

  const subcatsInCurrentCat = categoriesConfig[activeCategoryTab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e0b17] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-[#151023] border-b border-zinc-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-zinc-100">Organizar Pastas do Talento</h3>
            </div>
            <p className="text-xs text-amber-300 font-bold truncate">{featEntity.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Current Selection summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase">
              <span>Pastas Selecionadas ({selectedSubcats.length}):</span>
            </div>
            {selectedSubcats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-950/80 border border-amber-500/20">
                {selectedSubcats.map((subcat) => (
                  <span
                    key={subcat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950/80 text-amber-200 border border-amber-600/50"
                  >
                    <Folder className="w-3 h-3 text-amber-400" />
                    <span>{subcat}</span>
                    <button
                      type="button"
                      onClick={() => toggle(subcat)}
                      className="hover:text-rose-300 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic p-3 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800">
                Nenhuma pasta selecionada. Escolha uma ou mais pastas abaixo.
              </p>
            )}
          </div>

          {/* Main Category Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
              Explorar Pastas por Categoria:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MAIN_FEAT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeCategoryTab === cat.id
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories Checkboxes */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-zinc-950/40 border border-zinc-800">
              {subcatsInCurrentCat.map((subcat) => {
                const isChecked = selectedSubcats.includes(subcat);
                return (
                  <button
                    key={subcat}
                    type="button"
                    onClick={() => toggle(subcat)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
                      isChecked
                        ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-3.5 h-3.5 ${isChecked ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{subcat}</span>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create custom subcategory on the fly */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Criar e marcar nova subcategoria..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#110d1d] border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Pastas</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * MODAL: Bulk Add Feats to a Specific Subcategory Folder
 */
const AddFeatsToSubcategoryModal: React.FC<{
  subcategoryName: string;
  allFeats: HecosEntity[];
  onClose: () => void;
}> = ({ subcategoryName, allFeats, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedFeatIds, setSelectedFeatIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    allFeats.forEach((ent) => {
      const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
      const subcats = feat.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
      if (subcats.includes(subcategoryName)) {
        set.add(ent.id);
      }
    });
    return set;
  });

  const toggle = (id: string) => {
    setSelectedFeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    // For each feat, add or remove subcategoryName based on selectedFeatIds
    allFeats.forEach((ent) => {
      const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);
      let subcats = feat.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
      const shouldHave = selectedFeatIds.has(ent.id);
      const currentlyHas = subcats.includes(subcategoryName);

      if (shouldHave && !currentlyHas) {
        subcats = [...subcats, subcategoryName];
        HecosStorage.assignFeatSubcategories(ent.id, subcats);
      } else if (!shouldHave && currentlyHas) {
        subcats = subcats.filter((s) => s !== subcategoryName);
        HecosStorage.assignFeatSubcategories(ent.id, subcats);
      }
    });

    onClose();
  };

  const filtered = allFeats.filter((ent) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return ent.title?.toLowerCase().includes(q) || ent.subtitle?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e0b17] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-[#151023] border-b border-zinc-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-zinc-100">Adicionar Talentos à Pasta</h3>
            </div>
            <p className="text-xs text-amber-300 font-bold">Pasta: "{subcategoryName}"</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800 bg-[#100c1b]">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar talentos para incluir nesta pasta..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {filtered.map((ent) => {
            const isChecked = selectedFeatIds.has(ent.id);
            const feat = parseFeatFromContent(ent.title, ent.content || '', ent.featData);

            return (
              <button
                key={ent.id}
                type="button"
                onClick={() => toggle(ent.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isChecked
                    ? 'bg-amber-950/60 border-amber-500 text-zinc-100 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    Lvl {feat.level}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-amber-200 truncate">{ent.title}</div>
                    {ent.subtitle && (
                      <div className="text-[10px] text-zinc-500 truncate italic">{ent.subtitle}</div>
                    )}
                  </div>
                </div>

                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#110d1d] border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            <strong>{selectedFeatIds.size}</strong> talentos selecionados
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

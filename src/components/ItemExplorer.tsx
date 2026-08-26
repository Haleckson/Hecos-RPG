import React, { useState, useMemo } from 'react';
import {
  HecosEntity,
  PF2eItemAttributes,
  ItemCategoryType,
} from '../types';
import { parseItemFromContent } from '../utils/itemSerializer';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { Tooltip } from './Tooltip';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ItemCreateModal } from './ItemCreateModal';
import { TraitBadge } from './TraitBadge';
import { FolderManagerModal } from './FolderManagerModal';
import {
  Gem,
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
  Swords,
  Layers,
  ChevronDown,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  FlaskConical,
  Wand2,
  Crown,
  Package,
  Coins,
  Weight,
  ArrowRight
} from 'lucide-react';

interface ItemExplorerProps {
  entities: HecosEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity: (id: string) => void;
  onCreateItem: (presetCategory?: ItemCategoryType, presetSubcategory?: string) => void;
  onDeleteEntity: (id: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
}

export const MAIN_ITEM_CATEGORIES: {
  id: ItemCategoryType;
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
    englishName: 'All Items',
    description: 'Catálogo geral de todos os itens, armas, armaduras e tesouros de Hecos.',
    icon: Gem,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'weapons',
    name: 'Armas',
    englishName: 'Weapons',
    description: 'Armas simples, marciais, rúnicas e armas de fogo de Hecos.',
    icon: Swords,
    color: '#cb8394',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
  },
  {
    id: 'armor',
    name: 'Armaduras',
    englishName: 'Armor & Shields',
    description: 'Armaduras leves, médias, pesadas, escudos reforçados e runas fundamentais.',
    icon: Shield,
    color: '#74b6c2',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'consumables',
    name: 'Consumíveis',
    englishName: 'Consumables',
    description: 'Poções, elixires, pergaminhos mágicos, óleos e talismãs.',
    icon: Sparkles,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'alchemical',
    name: 'Alquimia',
    englishName: 'Alchemical',
    description: 'Bombas alquímicas, venenos, toxinas, reagentes e itens curativos.',
    icon: FlaskConical,
    color: '#7eb897',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-600/40',
  },
  {
    id: 'magical',
    name: 'Mágicos',
    englishName: 'Magical Items',
    description: 'Varinhas, cajados rúnicos, anéis de poder e mantos investidos.',
    icon: Wand2,
    color: '#b19ecc',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
  {
    id: 'artifacts',
    name: 'Artefatos',
    englishName: 'Artifacts',
    description: 'Relíquias cósmicas do eclipse, armas dos deuses e artefatos de obsidiana.',
    icon: Crown,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'gear',
    name: 'Equipamento',
    englishName: 'Adventuring Gear',
    description: 'Kits de sobrevivência, instrumentos, ferramentas de perícia e itens gerais.',
    icon: Package,
    color: '#74b6c2',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'extras',
    name: 'Outros',
    englishName: 'Other Items',
    description: 'Materiais raros, componentes alquímicos, relíquias de cenário e itens diversos de Hecos.',
    icon: Layers,
    color: '#cb8394',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
];

export function ItemExplorer({
  entities,
  onSelectEntity,
  onEditEntity,
  onCreateItem,
  onDeleteEntity,
  onTagClick,
  isGmMode = true,
}: ItemExplorerProps) {
  // 1. Storage and categories config
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllItemSubcategoriesConfig()
  );

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm';

  // 2. Selection states
  const [activeCategory, setActiveCategory] = useState<ItemCategoryType>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'folders'>('grid');

  // 3. Filters
  const [filterLevel, setFilterLevel] = useState<string>('all'); // 'all', '0-4', '5-9', '10-14', '15-20'
  const [filterRarity, setFilterRarity] = useState<string>('all'); // 'all', 'Comum', 'Incomum', 'Raro', 'Único'
  const [filterBulk, setFilterBulk] = useState<string>('all');
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // 4. Modals & folder management
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderDropdownSearch, setFolderDropdownSearch] = useState('');

  // 5. Creation & Delete Modals
  const [isItemCreateModalOpen, setIsItemCreateModalOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<HecosEntity | null>(null);

  // 6. Manage Folders on a specific item modal
  const [managingItemFolders, setManagingItemFolders] = useState<HecosEntity | null>(null);
  const [selectedItemSubcats, setSelectedItemSubcats] = useState<string[]>([]);

  // Refresh config from storage
  const refreshConfig = () => {
    setCategoriesConfig(HecosStorage.getAllItemSubcategoriesConfig());
  };

  // Extract all Item Entities with parsed item data
  const itemEntities = useMemo(() => {
    return entities
      .filter((e) => {
        const isItem = e.category === 'item' || e.tags?.includes('item') || e.tags?.includes('equipamento') || e.tags?.includes('artefato') || e.tags?.includes('arma');
        if (!isItem) return false;
        return HecosStorage.canUserAccessItem(e, currentUser);
      })
      .map((e) => {
        const parsed = parseItemFromContent(e.content, e.itemData);
        const subcats = Array.from(
          new Set([
            ...(e.subcategories || []),
            ...(parsed.subcategories || []),
            ...(e.subcategory ? [e.subcategory] : []),
          ])
        ).filter(Boolean);

        return {
          ...e,
          itemData: {
            ...parsed,
            subcategories: subcats,
          },
        };
      });
  }, [entities, isActualGm, currentUser]);

  // Extract all unique traits
  const allTraits = useMemo(() => {
    const set = new Set<string>();
    itemEntities.forEach((it) => {
      it.itemData?.traits?.forEach((t) => set.add(t));
      it.tags?.forEach((t) => {
        if (!['item', 'equipamento', 'artefato', 'arma'].includes(t.toLowerCase())) {
          set.add(t);
        }
      });
    });
    return Array.from(set).sort();
  }, [itemEntities]);

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

  // Filtered items
  const filteredItems = useMemo(() => {
    return itemEntities.filter((it) => {
      const data = it.itemData!;
      const tags = (it.tags || []).map((t) => t.toLowerCase());

      // 1. Category tab match
      if (activeCategory !== 'all') {
        if (activeCategory === 'weapons' && data.itemType !== 'weapons' && !tags.includes('arma') && !tags.includes('weapon') && !tags.includes('espada') && !tags.includes('arco')) return false;
        if (activeCategory === 'armor' && data.itemType !== 'armor' && !tags.includes('armadura') && !tags.includes('escudo') && !tags.includes('armor') && !tags.includes('shield')) return false;
        if (activeCategory === 'consumables' && data.itemType !== 'consumables' && !tags.includes('poção') && !tags.includes('elixir') && !tags.includes('pergaminho') && !tags.includes('consumable')) return false;
        if (activeCategory === 'alchemical' && data.itemType !== 'alchemical' && !tags.includes('alquimia') && !tags.includes('alchemical') && !tags.includes('veneno')) return false;
        if (activeCategory === 'magical' && data.itemType !== 'magical' && !tags.includes('mágico') && !tags.includes('varinha') && !tags.includes('cajado') && !tags.includes('anel')) return false;
        if (activeCategory === 'artifacts' && data.itemType !== 'artifacts' && !tags.includes('artefato') && !tags.includes('relíquia') && !tags.includes('artifact')) return false;
        if (activeCategory === 'gear' && data.itemType !== 'gear' && !tags.includes('equipamento') && !tags.includes('gear')) return false;
      }

      // 2. Subcategory / Folder filter
      if (activeSubcategory) {
        if (activeSubcategory === '__none__') {
          const subs = data.subcategories || it.subcategories || [];
          if (subs.length > 0 || it.subcategory) return false;
        } else {
          const hasSub =
            data.subcategories?.includes(activeSubcategory) ||
            it.subcategories?.includes(activeSubcategory) ||
            it.subcategory === activeSubcategory ||
            it.tags?.includes(activeSubcategory);
          if (!hasSub) return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = it.title.toLowerCase().includes(q);
        const inDesc = data.description?.toLowerCase().includes(q);
        const inTraits = data.traits?.some((t) => t.toLowerCase().includes(q));
        const inProps = data.specialProperties?.toLowerCase().includes(q);
        const inPrice = data.price?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTraits && !inProps && !inPrice) return false;
      }

      // 4. Level Filter
      if (filterLevel !== 'all') {
        const lvl = data.level || 0;
        if (filterLevel === '0-4' && (lvl < 0 || lvl > 4)) return false;
        if (filterLevel === '5-9' && (lvl < 5 || lvl > 9)) return false;
        if (filterLevel === '10-14' && (lvl < 10 || lvl > 14)) return false;
        if (filterLevel === '15-20' && lvl < 15) return false;
      }

      // 5. Rarity Filter
      if (filterRarity !== 'all') {
        if ((data.rarity || 'Comum').toLowerCase() !== filterRarity.toLowerCase()) return false;
      }

      // 6. Bulk Filter
      if (filterBulk !== 'all') {
        if ((data.bulk || '—').toLowerCase() !== filterBulk.toLowerCase()) return false;
      }

      // 7. Trait Filter
      if (filterTrait !== 'all') {
        const hasTrait = data.traits?.includes(filterTrait) || it.tags?.includes(filterTrait);
        if (!hasTrait) return false;
      }

      return true;
    });
  }, [
    itemEntities,
    activeCategory,
    activeSubcategory,
    searchQuery,
    filterLevel,
    filterRarity,
    filterBulk,
    filterTrait,
  ]);

  // Subcategory counts (including __none__)
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { __none__: 0 };
    itemEntities.forEach((it) => {
      const subs = it.itemData?.subcategories || it.subcategories || [];
      if (subs.length === 0 && !it.subcategory) {
        counts.__none__ = (counts.__none__ || 0) + 1;
      } else {
        subs.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });
    return counts;
  }, [itemEntities]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: itemEntities.length };
    MAIN_ITEM_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      counts[cat.id] = itemEntities.filter((it) => {
        const data = it.itemData!;
        const tags = (it.tags || []).map((t) => t.toLowerCase());
        if (cat.id === 'weapons') return data.itemType === 'weapons' || tags.includes('arma') || tags.includes('weapon') || tags.includes('espada') || tags.includes('arco');
        if (cat.id === 'armor') return data.itemType === 'armor' || tags.includes('armadura') || tags.includes('escudo') || tags.includes('armor') || tags.includes('shield');
        if (cat.id === 'consumables') return data.itemType === 'consumables' || tags.includes('poção') || tags.includes('elixir') || tags.includes('pergaminho') || tags.includes('consumable');
        if (cat.id === 'alchemical') return data.itemType === 'alchemical' || tags.includes('alquimia') || tags.includes('alchemical') || tags.includes('veneno');
        if (cat.id === 'magical') return data.itemType === 'magical' || tags.includes('mágico') || tags.includes('varinha') || tags.includes('cajado') || tags.includes('anel');
        if (cat.id === 'artifacts') return data.itemType === 'artifacts' || tags.includes('artefato') || tags.includes('relíquia') || tags.includes('artifact');
        if (cat.id === 'gear') return data.itemType === 'gear' || tags.includes('equipamento') || tags.includes('gear');
        if (cat.id === 'extras') return data.itemType === 'extras' || tags.includes('outros') || tags.includes('material') || tags.includes('extra');
        return false;
      }).length;
    });
    return counts;
  }, [itemEntities]);

  // Active filters count
  const activeFiltersCount = [
    activeSubcategory !== null,
    filterLevel !== 'all',
    filterRarity !== 'all',
    filterBulk !== 'all',
    filterTrait !== 'all',
    Boolean(searchQuery),
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setActiveSubcategory(null);
    setFilterLevel('all');
    setFilterRarity('all');
    setFilterBulk('all');
    setFilterTrait('all');
    setSearchQuery('');
  };

  // Save folder assignments on a specific item
  const handleSaveItemFolders = () => {
    if (!managingItemFolders) return;
    HecosStorage.assignItemSubcategories(managingItemFolders.id, selectedItemSubcats);
    setManagingItemFolders(null);
    setSelectedItemSubcats([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-[#09080e] p-6 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300">
                <Gem className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  <span>Itens, Armas & Tesouros</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Armamento rúnico, armaduras, consumíveis alquímicos e artefatos lendários de Hecos.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            {isActualGm && (
              <>
                <button
                  type="button"
                  onClick={() => setIsFolderManagerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Gerenciar estrutura de pastas e subcategorias"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gerenciar Pastas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsItemCreateModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 text-xs font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Novo Item</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. CATEGORY SEGMENTED TABS (Compact, Horizontal) */}
        <div className="overflow-x-auto no-scrollbar py-0.5 mt-4 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-max p-1 rounded-xl bg-[#090710] border border-zinc-800/80">
            {MAIN_ITEM_CATEGORIES.map((cat) => {
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
                placeholder="Buscar por nome, traços (ex: Mágica, Marcial, Ágil), propriedades, preço..."
                className="w-full bg-black/40 border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
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
                    ? 'bg-amber-950/70 border-amber-500/80 text-amber-200 shadow-sm'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${activeSubcategory ? 'text-amber-400' : 'text-zinc-400'}`} />
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
                      ? filteredItems.length
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
                            ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50'
                            : 'text-zinc-300 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-amber-400" />
                          <span>Todas as Pastas</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {activeCategory === 'all' ? itemEntities.length : categoryCounts[activeCategory] || 0}
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
                            ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50'
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
                                  ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50'
                                  : 'text-zinc-300 hover:bg-zinc-900/90'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-600/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
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

          {/* Right: Level Filter and More Filters Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Level Quick Filter */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className={`bg-zinc-900/90 border rounded-xl px-2.5 py-2 text-xs font-semibold outline-none transition-all cursor-pointer ${
                filterLevel !== 'all'
                  ? 'border-amber-500/80 text-amber-200 bg-amber-950/40'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <option value="all">Todos Níveis</option>
              <option value="0-4">Nível 0 – 4</option>
              <option value="5-9">Nível 5 – 9</option>
              <option value="10-14">Nível 10 – 14</option>
              <option value="15-20">Nível 15 – 20</option>
            </select>

            {/* Filter Panel Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterPanelOpen || activeFiltersCount > 0
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mais Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
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

            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Grade (Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Lista / Tabela"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('folders')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'folders'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Árvore de Pastas"
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {isFilterPanelOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 text-xs animate-fade-in">
            {/* Rarity Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Raridade:</label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-500"
              >
                <option value="all">Todas as Raridades</option>
                <option value="Comum">Comum</option>
                <option value="Incomum">Incomum</option>
                <option value="Raro">Raro</option>
                <option value="Único">Único</option>
              </select>
            </div>

            {/* Bulk Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Volume (Bulk):</label>
              <select
                value={filterBulk}
                onChange={(e) => setFilterBulk(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-500"
              >
                <option value="all">Qualquer Volume</option>
                <option value="—">Negligenciável (—)</option>
                <option value="L">Leve (L)</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3+</option>
              </select>
            </div>

            {/* Trait Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Traço:</label>
              <select
                value={filterTrait}
                onChange={(e) => setFilterTrait(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-500"
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
      {filteredItems.length === 0 ? (
        <div className="bg-[#09080e] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-4">
          <Gem className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-300">Nenhum item encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Nenhum item corresponde aos filtros selecionados. Tente ajustar os termos de busca ou crie um novo item.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() => onCreateItem(activeCategory !== 'all' ? activeCategory : 'gear', activeSubcategory || undefined)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold transition-colors"
            >
              + Criar Item
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (ADAPTIVE: MAX 3 COLS <1080P, UP TO 5 COLS >=1080P) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1800px]:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
          {filteredItems.map((it) => {
            const data = it.itemData!;
            const perm = HecosStorage.getEntityPermission(it.id);

            return (
              <div
                key={it.id}
                className="group/card bg-[#0e0c15] hover:bg-[#13101c] border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Bar: Title, Level, Visibility */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectEntity(it.id)}
                        className="text-left group/title focus:outline-none cursor-pointer"
                        title={`Abrir item ${it.title}`}
                      >
                        <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-amber-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(245,158,11,0.85)]">
                          <span className="group-hover/title:underline decoration-amber-400/80 decoration-2 underline-offset-2">
                            {it.title}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-amber-400 group-hover/title:translate-x-0.5 transition-all shrink-0" />
                        </h3>
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                        <span className="text-amber-400 font-bold">Item {data.level || 0}</span>
                        {data.price && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-300 flex items-center gap-0.5">
                              <Coins className="w-3 h-3 text-amber-400 inline" /> {data.price}
                            </span>
                          </>
                        )}
                        {data.bulk && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400">Vol: {data.bulk}</span>
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
                            HecosStorage.setEntityPermission(it.id, newVis, newAllowed);
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

                    {data.traits?.map((t) => (
                      <TraitBadge
                        key={t}
                        trait={t}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } }));
                        }}
                      />
                    ))}
                  </div>

                  {/* Usage & Activation Summary */}
                  <div className="grid grid-cols-1 gap-1 mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                    {data.usage && (
                      <div className="break-words">
                        <strong className="text-zinc-300">Uso:</strong> {data.usage}
                      </div>
                    )}
                    {data.activation && (
                      <div className="break-words">
                        <strong className="text-zinc-300">Ativação:</strong> {data.activation}
                      </div>
                    )}
                  </div>

                  {/* Description na íntegra */}
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed break-words whitespace-pre-wrap">
                    {data.description || it.summary || 'Sem descrição fornecida.'}
                  </p>
                </div>

                {/* Bottom Footer: Folder Tags & Edit/Delete Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                  {/* Folders assigned to this item */}
                  <div className="flex items-center gap-1 flex-wrap flex-1 max-w-[70%]">
                    {data.subcategories && data.subcategories.length > 0 ? (
                      data.subcategories.map((sub) => (
                        <span
                          key={sub}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubcategory(sub);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:border-amber-400 truncate transition-colors cursor-pointer flex items-center gap-1"
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
                          setManagingItemFolders(it);
                          setSelectedItemSubcats(data.subcategories || []);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-amber-300 hover:bg-zinc-900 transition-colors"
                        title="Organizar nas Pastas"
                      >
                        <FolderPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Edit & Delete Buttons */}
                  {isActualGm && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar Item" description="Modificar estatísticas, preço, volume e descrição">
                        <button
                          type="button"
                          onClick={() => onEditEntity(it.id)}
                          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Mover para a Lixeira" description="Mover item com segurança para a lixeira">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteItem(it)}
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
                  <th className="py-3 px-4">Nome do Item</th>
                  <th className="py-3 px-3">Nível</th>
                  <th className="py-3 px-3">Preço</th>
                  <th className="py-3 px-3">Volume</th>
                  <th className="py-3 px-3">Raridade</th>
                  <th className="py-3 px-3">Uso / Ativação</th>
                  <th className="py-3 px-3">Pastas</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map((it) => {
                  const data = it.itemData!;
                  const perm = HecosStorage.getEntityPermission(it.id);

                  return (
                    <tr
                      key={it.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectEntity(it.id)}
                          className="text-left font-bold text-zinc-200 group-hover:text-amber-300 hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all flex items-center gap-2 cursor-pointer focus:outline-none"
                        >
                          <span className="hover:underline decoration-amber-400/80 decoration-2 underline-offset-2">
                            {it.title}
                          </span>
                          {perm.visibility === 'gm' && <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-400 font-bold">Nível {data.level || 0}</td>
                      <td className="py-3 px-3 text-zinc-300">{data.price || '—'}</td>
                      <td className="py-3 px-3 text-zinc-400">{data.bulk || '—'}</td>
                      <td className="py-3 px-3">
                        <TraitBadge
                          trait={data.rarity || 'Comum'}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: data.rarity || 'Comum' } }));
                          }}
                        />
                      </td>
                      <td className="py-3 px-3 text-zinc-400 truncate max-w-[150px]">
                        {data.usage || data.activation || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
                          {data.subcategories && data.subcategories.length > 0 ? (
                            data.subcategories.slice(0, 2).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 truncate max-w-[90px]"
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
                                HecosStorage.setEntityPermission(it.id, newVis, newAllowed);
                              }}
                            />
                            <Tooltip title="Editar">
                              <button
                                type="button"
                                onClick={() => onEditEntity(it.id)}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <button
                                type="button"
                                onClick={() => setPendingDeleteItem(it)}
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
            const itemsInFolder = itemEntities.filter((it) =>
              it.itemData?.subcategories?.includes(folderName) || it.subcategory === folderName
            );

            return (
              <div key={folderName} className="bg-[#09080e] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg">
                <div className="p-4 bg-[#120f1c] flex items-center justify-between gap-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-zinc-200">{folderName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono border border-amber-800/50">
                      {itemsInFolder.length}
                    </span>
                  </div>

                  {isActualGm && (
                    <button
                      onClick={() => onCreateItem(activeCategory !== 'all' ? activeCategory : 'gear', folderName)}
                      className="text-xs px-3 py-1 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Item</span>
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {itemsInFolder.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-2">Nenhum item nesta pasta ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {itemsInFolder.map((it) => (
                        <div
                          key={it.id}
                          onClick={() => onSelectEntity(it.id)}
                          className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/50 flex items-center justify-between gap-2 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="text-xs font-bold text-zinc-200 hover:text-amber-300">{it.title}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              Nível {it.itemData?.level || 0} • {it.itemData?.price || 'Sem preço'}
                            </div>
                          </div>
                          {isActualGm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEntity(it.id);
                              }}
                              className="p-1 rounded text-zinc-500 hover:text-amber-300 cursor-pointer"
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
          isOpen={isFolderManagerOpen}
          scope="item"
          categories={MAIN_ITEM_CATEGORIES.map((c) => ({
            id: c.id,
            name: c.name,
            englishName: c.englishName,
            icon: c.icon,
            color: c.color,
          }))}
          entities={itemEntities}
          initialCategoryId={activeCategory}
          themeColor="purple"
          onClose={() => {
            setIsFolderManagerOpen(false);
            refreshConfig();
          }}
          onRefresh={refreshConfig}
        />
      )}

      {/* 7. Assign Folders to Specific Item Modal */}
      {managingItemFolders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0d18] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Organizar em Pastas</h3>
                <p className="text-xs text-amber-400 font-medium truncate">{managingItemFolders.title}</p>
              </div>
              <button
                onClick={() => setManagingItemFolders(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Selecione as pastas e categorias onde este item deve aparecer:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {currentSubcategories.map((subcat) => {
                const isChecked = selectedItemSubcats.includes(subcat);
                return (
                  <label
                    key={subcat}
                    onClick={() => {
                      setSelectedItemSubcats((prev) =>
                        prev.includes(subcat) ? prev.filter((s) => s !== subcat) : [...prev, subcat]
                      );
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 font-semibold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>{subcat}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-amber-500 border-amber-400 text-zinc-950' : 'border-zinc-700 bg-zinc-800'
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
                onClick={() => setManagingItemFolders(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItemFolders}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Creation Modal */}
      <ItemCreateModal
        isOpen={isItemCreateModalOpen}
        onClose={() => setIsItemCreateModalOpen(false)}
        presetCategory={activeCategory !== 'all' ? activeCategory : undefined}
        presetSubcategory={activeSubcategory || undefined}
        onSave={(newItemEntity) => {
          HecosStorage.saveEntity(newItemEntity);
          setIsItemCreateModalOpen(false);
          onSelectEntity(newItemEntity.id);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!pendingDeleteItem}
        entityTitle={pendingDeleteItem?.title || ''}
        onConfirm={() => {
          if (pendingDeleteItem) {
            onDeleteEntity(pendingDeleteItem.id);
            setPendingDeleteItem(null);
          }
        }}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </div>
  );
}

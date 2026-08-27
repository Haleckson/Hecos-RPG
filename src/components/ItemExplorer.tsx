import React, { useState, useMemo, useEffect } from 'react';
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
import { ItemDrawer } from './ItemDrawer';
import { ItemCard, ItemTooltipCard } from './ItemCard';
import { TraitBadge } from './TraitBadge';
import { FolderManagerModal } from './FolderManagerModal';
import { sortTraitsHierarchically } from '../utils/traitUtils';
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
  ArrowRight,
  HelpCircle,
  Hash,
  Maximize2
} from 'lucide-react';

interface ItemExplorerProps {
  entities: HecosEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity?: (id: string) => void;
  onCreateItem?: (presetCategory?: ItemCategoryType, presetSubcategory?: string) => void;
  onDeleteEntity?: (id: string) => void;
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
    name: 'Itens Mágicos',
    englishName: 'Magic Items',
    description: 'Varinhas, cajados, anéis, mantos encantados e pedras de poder.',
    icon: Wand2,
    color: '#b19ecc',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
  {
    id: 'artifacts',
    name: 'Artefatos & Relíquias',
    englishName: 'Artifacts',
    description: 'Relíquias ancestrais e itens de poder divino ou planar incalculável.',
    icon: Crown,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'gear',
    name: 'Equipamento Geral',
    englishName: 'Adventuring Gear',
    description: 'Mochilas, cordas, tochas, ferramentas de ofício e equipamentos diários.',
    icon: Package,
    color: '#a1a1aa',
    badgeBg: 'bg-zinc-900',
    badgeBorder: 'border-zinc-700',
  },
];

const ALPHABET = ['TODOS', '0-9', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const ItemExplorer: React.FC<ItemExplorerProps> = ({
  entities,
  onSelectEntity,
  onEditEntity,
  onCreateItem,
  onDeleteEntity,
  onTagClick,
  isGmMode = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = isGmMode || currentUser?.role === 'gm';

  // 1. Navigation & View State
  const [activeCategory, setActiveCategory] = useState<ItemCategoryType>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'tree'>('grid');

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [letterFilter, setLetterFilter] = useState('TODOS');
  const [levelRangeFilter, setLevelRangeFilter] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedTrait, setSelectedTrait] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'level-asc' | 'level-desc' | 'rarity' | 'price'>('name');

  // 3. Lateral Item Drawer State
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Global event listener for hecos:open-item-drawer
  useEffect(() => {
    const handleOpenItemDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string }>;
      if (customEvent.detail?.itemId) {
        setDrawerItemId(customEvent.detail.itemId);
        setIsDrawerOpen(true);
      }
    };
    window.addEventListener('hecos:open-item-drawer', handleOpenItemDrawer);
    return () => window.removeEventListener('hecos:open-item-drawer', handleOpenItemDrawer);
  }, []);

  // 4. Creation / Editing Modal State (Exclusivity of ItemCreateModal)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemEntityToEdit, setItemEntityToEdit] = useState<HecosEntity | null>(null);
  const [modalPresetCategory, setModalPresetCategory] = useState<ItemCategoryType | undefined>(undefined);
  const [modalPresetSubcategory, setModalPresetSubcategory] = useState<string | undefined>(undefined);

  // 5. Category / Subcategory Folder Management
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllItemSubcategoriesConfig()
  );
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);

  // 6. Delete Confirmation Modal State
  const [pendingDeleteItem, setPendingDeleteItem] = useState<HecosEntity | null>(null);

  // 7. Manage Folders on a specific item modal
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
        const isItem =
          e.category === 'item' ||
          Boolean(e.itemData) ||
          e.tags?.includes('item') ||
          e.tags?.includes('equipamento') ||
          e.tags?.includes('artefato') ||
          e.tags?.includes('arma');
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
  }, [entities, currentUser]);

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

  // Available letters in dataset for smart index
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    itemEntities.forEach((it) => {
      const first = it.title.trim().charAt(0).toUpperCase();
      if (/[0-9]/.test(first)) {
        set.add('0-9');
      } else if (/[A-Z]/.test(first)) {
        set.add(first);
      }
    });
    return set;
  }, [itemEntities]);

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

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return itemEntities
      .filter((it) => {
        const data = it.itemData!;
        const tags = (it.tags || []).map((t) => t.toLowerCase());

        // 1. Category tab match
        if (activeCategory !== 'all') {
          if (
            activeCategory === 'weapons' &&
            data.itemType !== 'weapons' &&
            !tags.includes('arma') &&
            !tags.includes('weapon') &&
            !tags.includes('espada') &&
            !tags.includes('arco')
          )
            return false;
          if (
            activeCategory === 'armor' &&
            data.itemType !== 'armor' &&
            !tags.includes('armadura') &&
            !tags.includes('escudo') &&
            !tags.includes('armor') &&
            !tags.includes('shield')
          )
            return false;
          if (
            activeCategory === 'consumables' &&
            data.itemType !== 'consumables' &&
            !tags.includes('poção') &&
            !tags.includes('elixir') &&
            !tags.includes('pergaminho') &&
            !tags.includes('consumable')
          )
            return false;
          if (
            activeCategory === 'alchemical' &&
            data.itemType !== 'alchemical' &&
            !tags.includes('alquimia') &&
            !tags.includes('alchemical') &&
            !tags.includes('veneno')
          )
            return false;
          if (
            activeCategory === 'magical' &&
            data.itemType !== 'magical' &&
            !tags.includes('mágico') &&
            !tags.includes('varinha') &&
            !tags.includes('cajado') &&
            !tags.includes('anel')
          )
            return false;
          if (
            activeCategory === 'artifacts' &&
            data.itemType !== 'artifacts' &&
            !tags.includes('artefato') &&
            !tags.includes('relíquia') &&
            !tags.includes('artifact')
          )
            return false;
          if (
            activeCategory === 'gear' &&
            data.itemType !== 'gear' &&
            !tags.includes('equipamento') &&
            !tags.includes('gear')
          )
            return false;
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
          const inDesc = (data.description || it.content || '').toLowerCase().includes(q);
          const inTraits = (data.traits || []).some((t) => t.toLowerCase().includes(q));
          const inSubcats = (data.subcategories || []).some((s) => s.toLowerCase().includes(q));
          const inSpecial = (data.specialProperties || '').toLowerCase().includes(q);
          if (!inTitle && !inDesc && !inTraits && !inSubcats && !inSpecial) return false;
        }

        // 4. Alphabetical Index Filter
        if (letterFilter !== 'TODOS') {
          const first = it.title.trim().charAt(0).toUpperCase();
          if (letterFilter === '0-9') {
            if (!/[0-9]/.test(first)) return false;
          } else {
            if (first !== letterFilter) return false;
          }
        }

        // 5. Quick Level Range Filter
        if (levelRangeFilter !== 'all') {
          const lvl = data.level ?? 0;
          if (levelRangeFilter === '0' && lvl !== 0) return false;
          if (levelRangeFilter === '1-4' && (lvl < 1 || lvl > 4)) return false;
          if (levelRangeFilter === '5-8' && (lvl < 5 || lvl > 8)) return false;
          if (levelRangeFilter === '9-12' && (lvl < 9 || lvl > 12)) return false;
          if (levelRangeFilter === '13-16' && (lvl < 13 || lvl > 16)) return false;
          if (levelRangeFilter === '17-20' && lvl < 17) return false;
        }

        // 6. Specific Level Filter
        if (selectedLevel !== 'all') {
          if (data.level !== parseInt(selectedLevel, 10)) return false;
        }

        // 7. Rarity Filter
        if (selectedRarity !== 'all') {
          if ((data.rarity || 'Comum').toLowerCase() !== selectedRarity.toLowerCase()) return false;
        }

        // 8. Trait Filter
        if (selectedTrait !== 'all') {
          if (!data.traits?.includes(selectedTrait) && !it.tags?.includes(selectedTrait)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.title.localeCompare(b.title, 'pt-BR');
        }
        if (sortBy === 'level-asc') {
          return (a.itemData?.level ?? 0) - (b.itemData?.level ?? 0);
        }
        if (sortBy === 'level-desc') {
          return (b.itemData?.level ?? 0) - (a.itemData?.level ?? 0);
        }
        if (sortBy === 'rarity') {
          const order: Record<string, number> = { comum: 0, incomum: 1, raro: 2, único: 3, unico: 3 };
          const rA = order[(a.itemData?.rarity || 'comum').toLowerCase()] ?? 0;
          const rB = order[(b.itemData?.rarity || 'comum').toLowerCase()] ?? 0;
          return rB - rA;
        }
        return 0;
      });
  }, [
    itemEntities,
    activeCategory,
    activeSubcategory,
    searchQuery,
    letterFilter,
    levelRangeFilter,
    selectedLevel,
    selectedRarity,
    selectedTrait,
    sortBy,
  ]);

  // Handlers
  const handleOpenItemDrawer = (itemId: string) => {
    setDrawerItemId(itemId);
    setIsDrawerOpen(true);
  };

  const handleOpenCreateModal = (cat?: ItemCategoryType, subcat?: string) => {
    setItemEntityToEdit(null);
    setModalPresetCategory(cat || (activeCategory !== 'all' ? activeCategory : undefined));
    setModalPresetSubcategory(subcat || (activeSubcategory && activeSubcategory !== '__none__' ? activeSubcategory : undefined));
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (entityOrId: HecosEntity | string) => {
    let targetEntity: HecosEntity | null = null;
    if (typeof entityOrId === 'string') {
      targetEntity = itemEntities.find((e) => e.id === entityOrId) || HecosStorage.getEntityById(entityOrId) || null;
    } else {
      targetEntity = entityOrId;
    }

    if (targetEntity) {
      setItemEntityToEdit(targetEntity);
      setIsCreateModalOpen(true);
    }
  };

  const handleDeleteItem = (id: string) => {
    const target = itemEntities.find((e) => e.id === id) || HecosStorage.getEntityById(id);
    if (target) {
      setPendingDeleteItem(target);
    }
  };

  const confirmDeleteItem = () => {
    if (pendingDeleteItem) {
      if (onDeleteEntity) {
        onDeleteEntity(pendingDeleteItem.id);
      } else {
        HecosStorage.deleteEntity(pendingDeleteItem.id);
      }
      if (drawerItemId === pendingDeleteItem.id) {
        setIsDrawerOpen(false);
      }
      setPendingDeleteItem(null);
    }
  };

  // Group items by subcategory for Tree view
  const treeGroupedItems = useMemo<{ groups: Record<string, (HecosEntity & { itemData?: PF2eItemAttributes })[]>; uncategorized: (HecosEntity & { itemData?: PF2eItemAttributes })[] }>(() => {
    const groups: Record<string, (HecosEntity & { itemData?: PF2eItemAttributes })[]> = {};
    const uncategorized: (HecosEntity & { itemData?: PF2eItemAttributes })[] = [];

    filteredItems.forEach((it) => {
      const subs = it.itemData?.subcategories || [];
      if (subs.length === 0) {
        uncategorized.push(it);
      } else {
        subs.forEach((sub) => {
          if (!groups[sub]) groups[sub] = [];
          groups[sub].push(it);
        });
      }
    });

    return { groups, uncategorized };
  }, [filteredItems]);

  const activeCategoryMeta = MAIN_ITEM_CATEGORIES.find((c) => c.id === activeCategory) || MAIN_ITEM_CATEGORIES[0];
  const CategoryIcon = activeCategoryMeta.icon;

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {MAIN_ITEM_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = itemEntities.filter((it) => {
            if (cat.id === 'all') return true;
            return it.itemData?.itemType === cat.id;
          }).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSubcategory(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/60 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                  : 'bg-[#0e0a1b] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-amber-900/90 text-amber-200' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero Header for Active Category */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#120d24] via-[#0e0a1a] to-[#09080e] border border-zinc-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-300 shadow-md">
            <CategoryIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight">
                {activeCategoryMeta.name}
              </h2>
              <span className="text-xs text-zinc-500 font-mono">({activeCategoryMeta.englishName})</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              {activeCategoryMeta.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {isActualGm && (
            <Tooltip title="Gerenciar Pastas" description="Adicionar, renomear ou reorganizar pastas desta categoria">
              <button
                type="button"
                onClick={() => setIsFolderManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Pastas</span>
              </button>
            </Tooltip>
          )}

          {isActualGm && (
            <button
              type="button"
              onClick={() => handleOpenCreateModal(activeCategory !== 'all' ? activeCategory : 'gear')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Subcategory / Folder Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSubcategory(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeSubcategory === null
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-xs'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todas as Pastas</span>
          <span className="text-[10px] opacity-75">({filteredItems.length})</span>
        </button>

        {currentSubcategories.map((subcat) => {
          const isSubActive = activeSubcategory === subcat;
          const subCount = itemEntities.filter((it) => {
            if (activeCategory !== 'all' && it.itemData?.itemType !== activeCategory) return false;
            return (
              it.itemData?.subcategories?.includes(subcat) ||
              it.subcategories?.includes(subcat) ||
              it.subcategory === subcat
            );
          }).length;

          return (
            <button
              key={subcat}
              type="button"
              onClick={() => setActiveSubcategory(isSubActive ? null : subcat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isSubActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-xs'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-400/80" />
              <span>{subcat}</span>
              <span className="text-[10px] opacity-70">({subCount})</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveSubcategory(activeSubcategory === '__none__' ? null : '__none__')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeSubcategory === '__none__'
              ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
              : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span>Sem Pasta</span>
        </button>
      </div>

      {/* Smart Quick Level Range Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
          <Hash className="w-3 h-3 text-amber-400" /> Nível:
        </span>
        {[
          { id: 'all', label: 'Todos os Níveis' },
          { id: '0', label: 'Nv 0' },
          { id: '1-4', label: 'Nv 1-4' },
          { id: '5-8', label: 'Nv 5-8' },
          { id: '9-12', label: 'Nv 9-12' },
          { id: '13-16', label: 'Nv 13-16' },
          { id: '17-20', label: 'Nv 17-20' },
        ].map((lvl) => {
          const isLvlActive = levelRangeFilter === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setLevelRangeFilter(lvl.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isLvlActive
                  ? 'bg-amber-950/90 text-amber-300 border-amber-600 shadow-xs'
                  : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {lvl.label}
            </button>
          );
        })}
      </div>

      {/* Smart Alphabetical Quick Jump Bar */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-zinc-800 bg-[#0c0a15] p-2 rounded-xl border border-zinc-800/80">
        <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 shrink-0 mr-2">
          Índice:
        </span>
        {ALPHABET.map((char) => {
          const isLetterActive = letterFilter === char;
          const hasItems = char === 'TODOS' || availableLetters.has(char);

          return (
            <button
              key={char}
              type="button"
              disabled={!hasItems}
              onClick={() => setLetterFilter(char)}
              className={`min-w-[26px] h-6 px-1.5 rounded text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                isLetterActive
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-xs scale-105'
                  : hasItems
                  ? 'text-zinc-300 hover:bg-zinc-800 hover:text-amber-300'
                  : 'text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Search & Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0b0816] border border-zinc-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, traço, efeito, preço ou manufatura..."
              className="w-full bg-[#120d22] border border-zinc-700/70 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#120d22] border border-zinc-700/70 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="name">Ordem Alfabética (A-Z)</option>
              <option value="level-asc">Nível (Menor ao Maior)</option>
              <option value="level-desc">Nível (Maior ao Menor)</option>
              <option value="rarity">Raridade (Mais Raro)</option>
            </select>

            {/* Toggle Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showFilters || selectedRarity !== 'all' || selectedTrait !== 'all' || selectedLevel !== 'all'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-600/60'
                  : 'bg-[#120d22] text-zinc-400 border-zinc-700/70 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#120d22] border border-zinc-700/70 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
                title="Visualização em Tabela"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'tree' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
                title="Visualização em Pastas"
              >
                <FolderTree className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showFilters && (
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Rarity */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                Raridade
              </label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="w-full bg-[#120d22] border border-zinc-700/70 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todas as Raridades</option>
                <option value="Comum">Comum</option>
                <option value="Incomum">Incomum</option>
                <option value="Raro">Raro</option>
                <option value="Único">Único</option>
              </select>
            </div>

            {/* Specific Level */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                Nível Específico
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-[#120d22] border border-zinc-700/70 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Qualquer Nível</option>
                {Array.from({ length: 21 }, (_, i) => i).map((lvl) => (
                  <option key={lvl} value={lvl.toString()}>
                    Nível {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Trait */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                Filtrar por Traço
              </label>
              <select
                value={selectedTrait}
                onChange={(e) => setSelectedTrait(e.target.value)}
                className="w-full bg-[#120d22] border border-zinc-700/70 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
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

      {/* Main Content Area */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#0b0816] border border-zinc-800/80 space-y-4">
          <Package className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-300">Nenhum item encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Nenhum item corresponde aos critérios de pesquisa ou filtros selecionados.
          </p>
          {isActualGm && (
            <button
              type="button"
              onClick={() => handleOpenCreateModal(activeCategory !== 'all' ? activeCategory : 'gear')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar Item Nesta Categoria</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Adaptive Cards with Full Tooltip and Drawer On-Click) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              entity={item}
              itemData={item.itemData}
              onSelectEntity={handleOpenItemDrawer}
              onEditEntity={isActualGm ? handleOpenEditModal : undefined}
              onDeleteEntity={isActualGm ? handleDeleteItem : undefined}
              onOpenFolderAssign={
                isActualGm
                  ? (ent) => {
                      setManagingItemFolders(ent);
                      setSelectedItemSubcats(ent.itemData?.subcategories || []);
                    }
                  : undefined
              }
              onSelectSubcategory={(subcat) => setActiveSubcategory(subcat)}
              isGmMode={isActualGm}
            />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE / LIST VIEW */
        <div className="rounded-2xl bg-[#0b0816] border border-zinc-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#120d22] border-b border-zinc-800 text-[10px] font-mono uppercase font-bold text-zinc-400">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-3">Nível</th>
                  <th className="py-3 px-3">Raridade</th>
                  <th className="py-3 px-3">Traços</th>
                  <th className="py-3 px-3">Preço</th>
                  <th className="py-3 px-3">Volume</th>
                  <th className="py-3 px-3">Pastas</th>
                  {isActualGm && <th className="py-3 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map((item) => {
                  const data = item.itemData!;
                  const orderedTraits = sortTraitsHierarchically(data.traits || [], { rarity: data.rarity || 'Comum' });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-950/10 transition-colors group cursor-pointer"
                      onClick={() => handleOpenItemDrawer(item.id)}
                    >
                      <td className="py-3 px-4 font-bold text-zinc-100 group-hover:text-amber-300">
                        <Tooltip
                          content={<ItemTooltipCard item={item} onSelectEntity={handleOpenItemDrawer} />}
                          placement="right"
                        >
                          <span className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item.title}</span>
                          </span>
                        </Tooltip>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        Nv {data.level ?? 0}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-300">
                        {data.rarity || 'Comum'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {orderedTraits.slice(0, 3).map((t) => (
                            <TraitBadge
                              key={t}
                              trait={t}
                              onClick={() => {
                                window.dispatchEvent(
                                  new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } })
                                );
                              }}
                            />
                          ))}
                          {orderedTraits.length > 3 && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              +{orderedTraits.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-200">
                        {data.price || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {data.bulk || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {data.subcategories && data.subcategories.length > 0 ? (
                            data.subcategories.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-600">—</span>
                          )}
                        </div>
                      </td>
                      {isActualGm && (
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TREE / FOLDER GROUPED VIEW */
        <div className="space-y-6">
          {(Object.entries(treeGroupedItems.groups) as [string, (HecosEntity & { itemData?: PF2eItemAttributes })[]][]).map(([folderName, items]) => (
            <div
              key={folderName}
              className="p-5 rounded-2xl bg-[#0b0816] border border-zinc-800/80 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-zinc-100">{folderName}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono">
                    {items.length} itens
                  </span>
                </div>

                {isActualGm && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal(activeCategory !== 'all' ? activeCategory : 'gear', folderName)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item nesta Pasta</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    entity={item}
                    itemData={item.itemData}
                    onSelectEntity={handleOpenItemDrawer}
                    onEditEntity={isActualGm ? handleOpenEditModal : undefined}
                    onDeleteEntity={isActualGm ? handleDeleteItem : undefined}
                    isGmMode={isActualGm}
                  />
                ))}
              </div>
            </div>
          ))}

          {treeGroupedItems.uncategorized.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#0b0816] border border-zinc-800/80 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3">
                <Package className="w-5 h-5 text-zinc-500" />
                <h3 className="text-base font-bold text-zinc-400">Itens sem Pasta</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono">
                  {treeGroupedItems.uncategorized.length} itens
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treeGroupedItems.uncategorized.map((item) => (
                  <ItemCard
                    key={item.id}
                    entity={item}
                    itemData={item.itemData}
                    onSelectEntity={handleOpenItemDrawer}
                    onEditEntity={isActualGm ? handleOpenEditModal : undefined}
                    onDeleteEntity={isActualGm ? handleDeleteItem : undefined}
                    isGmMode={isActualGm}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lateral Slide-Over Item Drawer */}
      <ItemDrawer
        itemId={drawerItemId}
        entities={entities}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerItemId(null);
        }}
        onNavigateFullPage={(targetId) => {
          setIsDrawerOpen(false);
          onSelectEntity(targetId);
        }}
        onEditItem={isActualGm ? handleOpenEditModal : undefined}
        onDeleteItem={isActualGm ? handleDeleteItem : undefined}
        onTagClick={onTagClick}
        isGmMode={isActualGm}
      />

      {/* Centralized Item Creation & Editing Modal */}
      <ItemCreateModal
        isOpen={isCreateModalOpen}
        initialCategory={modalPresetCategory}
        presetCategory={modalPresetCategory}
        initialSubcategory={modalPresetSubcategory}
        presetSubcategory={modalPresetSubcategory}
        entityToEdit={itemEntityToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setItemEntityToEdit(null);
        }}
        onSave={(savedEntity) => {
          // If drawer was viewing this item, keep it updated
          if (drawerItemId === savedEntity.id) {
            setDrawerItemId(savedEntity.id);
          }
        }}
      />

      {/* Category Folder Manager Modal */}
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

      {/* Item Individual Folders Assignment Modal */}
      {managingItemFolders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b0816] border border-zinc-700/80 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>Organizar em Pastas</span>
              </h3>
              <button
                type="button"
                onClick={() => setManagingItemFolders(null)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Selecione as pastas para o item <strong className="text-amber-300">{managingItemFolders.title}</strong>:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {currentSubcategories.map((sub) => {
                const isSelected = selectedItemSubcats.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedItemSubcats(selectedItemSubcats.filter((s) => s !== sub));
                      } else {
                        setSelectedItemSubcats([...selectedItemSubcats, sub]);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/60 text-amber-300 border-amber-600/60'
                        : 'bg-[#120d22] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{sub}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setManagingItemFolders(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedData: PF2eItemAttributes = {
                    ...(managingItemFolders.itemData || parseItemFromContent(managingItemFolders.content || '')),
                    subcategories: selectedItemSubcats || [],
                  };
                  const updatedEntity: HecosEntity = {
                    ...managingItemFolders,
                    subcategory: (selectedItemSubcats && selectedItemSubcats[0]) || 'Geral',
                    subcategories: selectedItemSubcats || [],
                    itemData: updatedData,
                    updatedAt: new Date().toISOString(),
                  };
                  HecosStorage.saveEntity(updatedEntity);
                  setManagingItemFolders(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black"
              >
                Salvar Pastas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteItem)}
        title={`Excluir "${pendingDeleteItem?.title || 'Item'}"`}
        message="Tem certeza que deseja mover este item para a lixeira? Você poderá restaurá-lo depois se necessário."
        confirmLabel="Mover para a Lixeira"
        onConfirm={confirmDeleteItem}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </div>
  );
};

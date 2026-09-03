import React, { useState, useMemo, useEffect } from 'react';
import { HecosEntity, FolderPermission } from '../types';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import {
  Folder,
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  ArrowLeft,
  ListPlus,
  FolderCheck,
  FolderTree,
  LayoutGrid,
  List,
  ArrowUpDown,
  CornerDownRight,
  ExternalLink,
  PlusCircle,
  Tag,
  Shield,
  Layers2,
  FolderGit2,
} from 'lucide-react';

export type FolderScope =
  | 'feat'
  | 'spell'
  | 'item'
  | 'peril'
  | 'class'
  | 'archetype'
  | 'ancestry'
  | 'fauna'
  | 'flora'
  | 'location'
  | 'pc'
  | 'npc'
  | 'organization'
  | 'quest'
  | 'map'
  | 'tag'
  | 'general';

export interface FolderCategoryOption {
  id: string;
  name: string;
  englishName?: string;
  icon?: any;
  color?: string;
}

export type ThemeColorName =
  | 'pink'
  | 'amber'
  | 'yellow'
  | 'purple'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'sky'
  | 'cyan'
  | 'emerald'
  | 'lime'
  | 'teal'
  | 'orange'
  | 'rose'
  | 'red'
  | 'fuchsia'
  | string;

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: FolderScope;
  categories?: FolderCategoryOption[];
  entities?: HecosEntity[];
  initialCategoryId?: string;
  themeColor?: ThemeColorName;
  onRefresh?: () => void;
}

export interface FolderItemInfo {
  name: string;
  categoryKey: string;
  categoryName: string;
  itemCount: number;
  entities: HecosEntity[];
  isSecret: boolean;
  permission: FolderPermission;
  // Hierarchy metadata
  isSubfolder: boolean;
  parentPath: string | null;
  leafName: string;
  depth: number;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  isOpen,
  onClose,
  scope,
  categories = [],
  entities = [],
  initialCategoryId = 'all',
  themeColor,
  onRefresh,
}) => {
  // Theme styling resolver matching sidebar definitions exactly
  const activeTheme = useMemo<string>(() => {
    if (themeColor) return themeColor;
    if (scope === 'spell') return 'pink';
    if (scope === 'item' || scope === 'feat') return 'amber';
    if (scope === 'quest') return 'yellow';
    if (scope === 'peril') return 'red';
    if (scope === 'fauna') return 'emerald';
    if (scope === 'flora') return 'lime';
    if (scope === 'location' || scope === 'map') return 'blue';
    if (scope === 'pc') return 'sky';
    if (scope === 'npc' || scope === 'tag') return 'purple';
    if (scope === 'organization') return 'fuchsia';
    if (scope === 'class') return 'indigo';
    if (scope === 'archetype') return 'violet';
    if (scope === 'ancestry') return 'orange';
    return 'pink';
  }, [themeColor, scope]);

  const colorStyles = useMemo(() => {
    switch (activeTheme) {
      case 'pink':
        return {
          hex: '#ec4899',
          primary: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-zinc-950 font-black shadow-md shadow-pink-500/25',
          primarySoft: 'bg-pink-950/40 text-pink-300 border-pink-500/40',
          accentBorder: 'border-pink-500/50',
          focusRing: 'focus:border-pink-400 focus:ring-1 focus:ring-pink-400/40',
          badge: 'bg-pink-950/80 text-pink-300 border-pink-500/50',
          iconText: 'text-pink-400',
          hoverBg: 'hover:bg-pink-950/20',
          activeTab: 'bg-pink-500 text-zinc-950 font-black shadow-md shadow-pink-500/25',
          selectionHighlight: 'bg-pink-950/40 border-pink-500/70 text-pink-100 ring-1 ring-pink-500/30',
          glow: 'shadow-[0_0_25px_rgba(236,72,153,0.2)]',
        };
      case 'amber':
        return {
          hex: '#f59e0b',
          primary: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black shadow-md shadow-amber-500/25',
          primarySoft: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
          accentBorder: 'border-amber-500/50',
          focusRing: 'focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
          iconText: 'text-amber-400',
          hoverBg: 'hover:bg-amber-950/20',
          activeTab: 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/25',
          selectionHighlight: 'bg-amber-950/40 border-amber-500/70 text-amber-100 ring-1 ring-amber-500/30',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
        };
      case 'yellow':
        return {
          hex: '#eab308',
          primary: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-zinc-950 font-black shadow-md shadow-yellow-500/25',
          primarySoft: 'bg-yellow-950/40 text-yellow-300 border-yellow-500/40',
          accentBorder: 'border-yellow-500/50',
          focusRing: 'focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/40',
          badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50',
          iconText: 'text-yellow-400',
          hoverBg: 'hover:bg-yellow-950/20',
          activeTab: 'bg-yellow-500 text-zinc-950 font-black shadow-md shadow-yellow-500/25',
          selectionHighlight: 'bg-yellow-950/40 border-yellow-500/70 text-yellow-100 ring-1 ring-yellow-500/30',
          glow: 'shadow-[0_0_25px_rgba(234,179,8,0.2)]',
        };
      case 'purple':
        return {
          hex: '#a855f7',
          primary: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-zinc-950 font-black shadow-md shadow-purple-500/25',
          primarySoft: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
          accentBorder: 'border-purple-500/50',
          focusRing: 'focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40',
          badge: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
          iconText: 'text-purple-400',
          hoverBg: 'hover:bg-purple-950/20',
          activeTab: 'bg-purple-500 text-zinc-950 font-black shadow-md shadow-purple-500/25',
          selectionHighlight: 'bg-purple-950/40 border-purple-500/70 text-purple-100 ring-1 ring-purple-500/30',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.2)]',
        };
      case 'violet':
        return {
          hex: '#8b5cf6',
          primary: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-zinc-950 font-black shadow-md shadow-violet-500/25',
          primarySoft: 'bg-violet-950/40 text-violet-300 border-violet-500/40',
          accentBorder: 'border-violet-500/50',
          focusRing: 'focus:border-violet-400 focus:ring-1 focus:ring-violet-400/40',
          badge: 'bg-violet-950/80 text-violet-300 border-violet-500/50',
          iconText: 'text-violet-400',
          hoverBg: 'hover:bg-violet-950/20',
          activeTab: 'bg-violet-500 text-zinc-950 font-black shadow-md shadow-violet-500/25',
          selectionHighlight: 'bg-violet-950/40 border-violet-500/70 text-violet-100 ring-1 ring-violet-500/30',
          glow: 'shadow-[0_0_25px_rgba(139,92,246,0.2)]',
        };
      case 'indigo':
        return {
          hex: '#6366f1',
          primary: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-zinc-950 font-black shadow-md shadow-indigo-500/25',
          primarySoft: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40',
          accentBorder: 'border-indigo-500/50',
          focusRing: 'focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/40',
          badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50',
          iconText: 'text-indigo-400',
          hoverBg: 'hover:bg-indigo-950/20',
          activeTab: 'bg-indigo-500 text-zinc-950 font-black shadow-md shadow-indigo-500/25',
          selectionHighlight: 'bg-indigo-950/40 border-indigo-500/70 text-indigo-100 ring-1 ring-indigo-500/30',
          glow: 'shadow-[0_0_25px_rgba(99,102,241,0.2)]',
        };
      case 'blue':
        return {
          hex: '#3b82f6',
          primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-zinc-950 font-black shadow-md shadow-blue-500/25',
          primarySoft: 'bg-blue-950/40 text-blue-300 border-blue-500/40',
          accentBorder: 'border-blue-500/50',
          focusRing: 'focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40',
          badge: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
          iconText: 'text-blue-400',
          hoverBg: 'hover:bg-blue-950/20',
          activeTab: 'bg-blue-500 text-zinc-950 font-black shadow-md shadow-blue-500/25',
          selectionHighlight: 'bg-blue-950/40 border-blue-500/70 text-blue-100 ring-1 ring-blue-500/30',
          glow: 'shadow-[0_0_25px_rgba(59,130,246,0.2)]',
        };
      case 'sky':
      case 'cyan':
        return {
          hex: '#38bdf8',
          primary: 'bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-zinc-950 font-black shadow-md shadow-sky-500/25',
          primarySoft: 'bg-sky-950/40 text-sky-300 border-sky-500/40',
          accentBorder: 'border-sky-500/50',
          focusRing: 'focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40',
          badge: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
          iconText: 'text-sky-400',
          hoverBg: 'hover:bg-sky-950/20',
          activeTab: 'bg-sky-500 text-zinc-950 font-black shadow-md shadow-sky-500/25',
          selectionHighlight: 'bg-sky-950/40 border-sky-500/70 text-sky-100 ring-1 ring-sky-500/30',
          glow: 'shadow-[0_0_25px_rgba(56,189,248,0.2)]',
        };
      case 'emerald':
        return {
          hex: '#10b981',
          primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black shadow-md shadow-emerald-500/25',
          primarySoft: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
          accentBorder: 'border-emerald-500/50',
          focusRing: 'focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
          iconText: 'text-emerald-400',
          hoverBg: 'hover:bg-emerald-950/20',
          activeTab: 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/25',
          selectionHighlight: 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100 ring-1 ring-emerald-500/30',
          glow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
        };
      case 'lime':
        return {
          hex: '#84cc16',
          primary: 'bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-zinc-950 font-black shadow-md shadow-lime-500/25',
          primarySoft: 'bg-lime-950/40 text-lime-300 border-lime-500/40',
          accentBorder: 'border-lime-500/50',
          focusRing: 'focus:border-lime-400 focus:ring-1 focus:ring-lime-400/40',
          badge: 'bg-lime-950/80 text-lime-300 border-lime-500/50',
          iconText: 'text-lime-400',
          hoverBg: 'hover:bg-lime-950/20',
          activeTab: 'bg-lime-500 text-zinc-950 font-black shadow-md shadow-lime-500/25',
          selectionHighlight: 'bg-lime-950/40 border-lime-500/70 text-lime-100 ring-1 ring-lime-500/30',
          glow: 'shadow-[0_0_25px_rgba(132,204,22,0.2)]',
        };
      case 'fuchsia':
        return {
          hex: '#d946ef',
          primary: 'bg-gradient-to-r from-fuchsia-500 to-rose-600 hover:from-fuchsia-400 hover:to-rose-500 text-zinc-950 font-black shadow-md shadow-fuchsia-500/25',
          primarySoft: 'bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-500/40',
          accentBorder: 'border-fuchsia-500/50',
          focusRing: 'focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/40',
          badge: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50',
          iconText: 'text-fuchsia-400',
          hoverBg: 'hover:bg-fuchsia-950/20',
          activeTab: 'bg-fuchsia-500 text-zinc-950 font-black shadow-md shadow-fuchsia-500/25',
          selectionHighlight: 'bg-fuchsia-950/40 border-fuchsia-500/70 text-fuchsia-100 ring-1 ring-fuchsia-500/30',
          glow: 'shadow-[0_0_25px_rgba(217,70,239,0.2)]',
        };
      case 'orange':
        return {
          hex: '#f97316',
          primary: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-zinc-950 font-black shadow-md shadow-orange-500/25',
          primarySoft: 'bg-orange-950/40 text-orange-300 border-orange-500/40',
          accentBorder: 'border-orange-500/50',
          focusRing: 'focus:border-orange-400 focus:ring-1 focus:ring-orange-400/40',
          badge: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
          iconText: 'text-orange-400',
          hoverBg: 'hover:bg-orange-950/20',
          activeTab: 'bg-orange-500 text-zinc-950 font-black shadow-md shadow-orange-500/25',
          selectionHighlight: 'bg-orange-950/40 border-orange-500/70 text-orange-100 ring-1 ring-orange-500/30',
          glow: 'shadow-[0_0_25px_rgba(249,115,22,0.2)]',
        };
      case 'red':
      case 'rose':
      default:
        return {
          hex: '#ef4444',
          primary: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-zinc-950 font-black shadow-md shadow-rose-500/25',
          primarySoft: 'bg-rose-950/40 text-rose-300 border-rose-500/40',
          accentBorder: 'border-rose-500/50',
          focusRing: 'focus:border-rose-400 focus:ring-1 focus:ring-rose-400/40',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
          iconText: 'text-rose-400',
          hoverBg: 'hover:bg-rose-950/20',
          activeTab: 'bg-rose-500 text-zinc-950 font-black shadow-md shadow-rose-500/25',
          selectionHighlight: 'bg-rose-950/40 border-rose-500/70 text-rose-100 ring-1 ring-rose-500/30',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
        };
    }
  }, [activeTheme]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'manage' | 'create_single' | 'create_bulk'>('manage');

  // Categories config
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>({});

  // Filter & Search states for Folders view
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'secret' | 'empty' | 'populated'>('all');
  const [filterStructure, setFilterStructure] = useState<'all' | 'root' | 'sub'>('all');
  const [folderSortBy, setFolderSortBy] = useState<'name-asc' | 'name-desc' | 'items-desc' | 'items-asc' | 'hierarchy'>('name-asc');
  const [folderViewMode, setFolderViewMode] = useState<'cards' | 'list'>('cards');

  // Multi-selection of folders for batch actions
  const [selectedFolderKeys, setSelectedFolderKeys] = useState<Set<string>>(new Set());

  // Creation states
  const [singleFolderName, setSingleFolderName] = useState('');
  const [singleCategoryTarget, setSingleCategoryTarget] = useState<string>(categories?.[0]?.id || 'general');
  const [singleParentFolder, setSingleParentFolder] = useState<string>('');
  const [singleIsSecret, setSingleIsSecret] = useState(false);

  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>(categories?.[0]?.id || 'general');
  const [bulkParentFolder, setBulkParentFolder] = useState<string>('');
  const [bulkIsSecret, setBulkIsSecret] = useState(false);

  // Inline rename state
  const [editingFolderKey, setEditingFolderKey] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Inside folder state (Entering a folder to view and bulk-add articles)
  const [insideFolder, setInsideFolder] = useState<FolderItemInfo | null>(null);
  const [insideTab, setInsideTab] = useState<'available' | 'current' | 'all' | 'selected'>('available');
  const [insideSearchQuery, setInsideSearchQuery] = useState('');
  const [insideCategoryFilter, setInsideCategoryFilter] = useState<string>('all');
  const [insideSortBy, setInsideSortBy] = useState<'title-asc' | 'title-desc' | 'rank-asc' | 'rank-desc' | 'status'>('title-asc');
  const [insideViewMode, setInsideViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());

  // Internal reactive entities state
  const [internalEntities, setInternalEntities] = useState<HecosEntity[]>(() => {
    return entities && entities.length > 0 ? entities : HecosStorage.getEntities();
  });

  const reloadEntities = () => {
    setInternalEntities(HecosStorage.getEntities());
  };

  // Confirm delete modal / state
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState<{
    isOpen: boolean;
    folderNames: { name: string; categoryKey: string }[];
    affectedItemsCount: number;
  }>({
    isOpen: false,
    folderNames: [],
    affectedItemsCount: 0,
  });

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load configs based on scope
  const loadConfig = () => {
    setCategoriesConfig(HecosStorage.getScopeSubcategoriesConfig(scope));
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setSelectedFolderKeys(new Set());
      setInsideFolder(null);
      setSelectedToAdd(new Set());
      setSelectedToRemove(new Set());
      setInternalEntities(entities && entities.length > 0 ? entities : HecosStorage.getEntities());
    }
  }, [isOpen, scope, entities]);

  // Extract all entities belonging to this scope
  const relevantEntities = useMemo(() => {
    const list = internalEntities;
    if (scope === 'feat') {
      return list.filter((e) => e.category === 'feat' || e.featData);
    }
    if (scope === 'spell') {
      return list.filter((e) => e.category === 'spell' || e.spellData || e.tags?.includes('spell') || e.tags?.includes('magia'));
    }
    if (scope === 'item') {
      return list.filter((e) => e.category === 'item' || e.itemData || e.tags?.includes('item'));
    }
    if (scope === 'peril') {
      return list.filter((e) => e.category === 'peril' || e.perilData || e.category === 'creature');
    }
    if (scope === 'class') {
      return list.filter((e) => (e.category === 'class' || e.classData?.kind === 'class') && e.category !== 'archetype' && e.classData?.kind !== 'archetype');
    }
    if (scope === 'archetype') {
      return list.filter((e) => e.category === 'archetype' || e.classData?.kind === 'archetype');
    }
    if (scope === 'ancestry') {
      return list.filter((e) => e.category === 'ancestry' || e.ancestryData);
    }
    if (['fauna', 'flora', 'location', 'pc', 'npc', 'organization'].includes(scope)) {
      return list.filter((e) => e.category === scope);
    }
    return list;
  }, [internalEntities, scope]);

  // Helper to extract folders from an entity
  const getEntityFolders = (ent: HecosEntity): string[] => {
    if (scope === 'feat') {
      return ent.featData?.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
    }
    if (scope === 'spell') {
      const set = new Set<string>();
      (ent.spellData?.subcategories || []).forEach((s) => set.add(s));
      (ent.subcategories || []).forEach((s) => set.add(s));
      if (ent.subcategory) set.add(ent.subcategory);
      return Array.from(set);
    }
    if (scope === 'item') {
      return ent.itemData?.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
    }
    if (scope === 'peril') return ent.perilData?.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
    if ((scope === 'class' || scope === 'archetype') && ent.classData?.subcategories) return ent.classData.subcategories;
    if (scope === 'ancestry' && ent.ancestryData?.subcategories) return ent.ancestryData.subcategories;
    return ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
  };

  // Helper to parse hierarchy from folder name (Delimiter: ' / ')
  const parseFolderHierarchy = (name: string) => {
    const parts = name.split('/').map((s) => s.trim()).filter(Boolean);
    const isSubfolder = parts.length > 1;
    const parentPath = isSubfolder ? parts.slice(0, -1).join(' / ') : null;
    const leafName = parts[parts.length - 1] || name;
    return { isSubfolder, parentPath, leafName, depth: parts.length - 1 };
  };

  // Build unified list of folder items with counts and hierarchy metadata
  const allFoldersList = useMemo<FolderItemInfo[]>(() => {
    const list: FolderItemInfo[] = [];
    const seen = new Set<string>();

    Object.entries(categoriesConfig).forEach(([catKey, folderNames]) => {
      if (!Array.isArray(folderNames)) return;
      const catObj = categories.find((c) => c.id === catKey);
      const catName = catObj?.name || catKey;

      folderNames.forEach((fName) => {
        if (!fName || typeof fName !== 'string') return;
        const trimmed = fName.trim();
        const uniqueKey = `${catKey}:::${trimmed}`;
        if (seen.has(uniqueKey)) return;
        seen.add(uniqueKey);

        const matchedEntities = relevantEntities.filter((ent) => {
          const entFolders = getEntityFolders(ent);
          return entFolders.includes(trimmed);
        });

        const isSecret = HecosStorage.isFolderSecret(trimmed);
        const permission = HecosStorage.getFolderPermission(trimmed);
        const hierarchy = parseFolderHierarchy(trimmed);

        list.push({
          name: trimmed,
          categoryKey: catKey,
          categoryName: catName,
          itemCount: matchedEntities.length,
          entities: matchedEntities,
          isSecret,
          permission,
          isSubfolder: hierarchy.isSubfolder,
          parentPath: hierarchy.parentPath,
          leafName: hierarchy.leafName,
          depth: hierarchy.depth,
        });
      });
    });

    return list;
  }, [categoriesConfig, categories, relevantEntities, scope]);

  // Root folders list available for parent folder selection
  const availableParentFolders = useMemo(() => {
    const targetCat = activeTab === 'create_single' ? singleCategoryTarget : bulkCategoryTarget;
    return allFoldersList
      .filter((f) => f.categoryKey === targetCat && !f.isSubfolder)
      .map((f) => f.name);
  }, [allFoldersList, activeTab, singleCategoryTarget, bulkCategoryTarget]);

  // Filtered and sorted folders list
  const filteredAndSortedFoldersList = useMemo(() => {
    const filtered = allFoldersList.filter((folder) => {
      // 1. Category filter
      if (selectedCategoryId !== 'all' && folder.categoryKey !== selectedCategoryId) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = folder.name.toLowerCase().includes(q);
        const matchesCategory = folder.categoryName.toLowerCase().includes(q);
        const matchesParent = folder.parentPath?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesParent) return false;
      }

      // 3. Visibility / Status filter
      if (filterVisibility === 'public' && folder.isSecret) return false;
      if (filterVisibility === 'secret' && !folder.isSecret) return false;
      if (filterVisibility === 'empty' && folder.itemCount > 0) return false;
      if (filterVisibility === 'populated' && folder.itemCount === 0) return false;

      // 4. Structure filter
      if (filterStructure === 'root' && folder.isSubfolder) return false;
      if (filterStructure === 'sub' && !folder.isSubfolder) return false;

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (folderSortBy === 'name-asc') return a.name.localeCompare(b.name, 'pt-BR');
      if (folderSortBy === 'name-desc') return b.name.localeCompare(a.name, 'pt-BR');
      if (folderSortBy === 'items-desc') return b.itemCount - a.itemCount;
      if (folderSortBy === 'items-asc') return a.itemCount - b.itemCount;
      if (folderSortBy === 'hierarchy') {
        if (a.isSubfolder !== b.isSubfolder) return a.isSubfolder ? 1 : -1;
        return a.name.localeCompare(b.name, 'pt-BR');
      }
      return 0;
    });
  }, [allFoldersList, selectedCategoryId, searchQuery, filterVisibility, filterStructure, folderSortBy]);

  // Category items counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFoldersList.length };
    categories.forEach((cat) => {
      counts[cat.id] = allFoldersList.filter((f) => f.categoryKey === cat.id).length;
    });
    return counts;
  }, [allFoldersList, categories]);

  // Handle single creation (with optional parent folder)
  const handleCreateSingle = () => {
    const rawName = singleFolderName.trim();
    if (!rawName) return;
    const cat = singleCategoryTarget || categories?.[0]?.id || 'general';

    const finalName = singleParentFolder.trim()
      ? `${singleParentFolder.trim()} / ${rawName}`
      : rawName;

    HecosStorage.addScopeSubcategory(scope, cat, finalName);

    if (singleIsSecret) {
      HecosStorage.setFolderSecret(finalName, true);
    }

    setSingleFolderName('');
    setSingleParentFolder('');
    loadConfig();
    showToast(`Pasta "${finalName}" criada com sucesso!`);
    setActiveTab('manage');
    onRefresh?.();
  };

  // Handle bulk creation (with optional parent folder)
  const handleCreateBulk = () => {
    if (!bulkInputText.trim()) return;
    const lines = bulkInputText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;
    const cat = bulkCategoryTarget || categories?.[0]?.id || 'general';
    let createdCount = 0;

    lines.forEach((rawLine) => {
      const finalName = bulkParentFolder.trim() && !rawLine.includes('/')
        ? `${bulkParentFolder.trim()} / ${rawLine}`
        : rawLine;

      const success = HecosStorage.addScopeSubcategory(scope, cat, finalName);
      if (success) {
        createdCount++;
        if (bulkIsSecret) {
          HecosStorage.setFolderSecret(finalName, true);
        }
      }
    });

    setBulkInputText('');
    setBulkParentFolder('');
    loadConfig();
    showToast(`${createdCount} pasta(s) criada(s) com sucesso em "${categories.find((c) => c.id === cat)?.name || cat}"!`);
    setActiveTab('manage');
    onRefresh?.();
  };

  // Handle Quick "Add Subfolder" shortcut from any folder
  const handleInitiateSubfolder = (parentName: string, catKey: string) => {
    setSingleCategoryTarget(catKey);
    setSingleParentFolder(parentName);
    setSingleFolderName('');
    setActiveTab('create_single');
  };

  // Handle Rename
  const handleRename = (catKey: string, oldName: string) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingFolderKey(null);
      return;
    }

    HecosStorage.renameScopeSubcategory(scope, catKey, oldName, trimmed);

    if (insideFolder && insideFolder.name === oldName) {
      setInsideFolder((prev) => (prev ? { ...prev, name: trimmed, leafName: parseFolderHierarchy(trimmed).leafName } : null));
    }

    setEditingFolderKey(null);
    loadConfig();
    showToast(`Pasta renomeada de "${oldName}" para "${trimmed}"!`);
    onRefresh?.();
  };

  // Request Single Delete
  const requestDeleteSingle = (catKey: string, folderName: string) => {
    const item = allFoldersList.find((f) => f.categoryKey === catKey && f.name === folderName);
    const count = item?.itemCount || 0;
    setConfirmDeleteInfo({
      isOpen: true,
      folderNames: [{ name: folderName, categoryKey: catKey }],
      affectedItemsCount: count,
    });
  };

  // Request Multi Delete
  const requestDeleteMultiple = () => {
    if (selectedFolderKeys.size === 0) return;
    const targets: { name: string; categoryKey: string }[] = [];
    let totalItems = 0;

    selectedFolderKeys.forEach((key) => {
      const [catKey, name] = key.split(':::');
      if (catKey && name) {
        targets.push({ name, categoryKey: catKey });
        const item = allFoldersList.find((f) => f.categoryKey === catKey && f.name === name);
        totalItems += item?.itemCount || 0;
      }
    });

    setConfirmDeleteInfo({
      isOpen: true,
      folderNames: targets,
      affectedItemsCount: totalItems,
    });
  };

  // Execute Confirmed Delete
  const executeDelete = () => {
    confirmDeleteInfo.folderNames.forEach(({ name, categoryKey }) => {
      HecosStorage.deleteScopeSubcategory(scope, categoryKey, name);
    });

    setSelectedFolderKeys(new Set());
    setConfirmDeleteInfo({ isOpen: false, folderNames: [], affectedItemsCount: 0 });
    if (insideFolder && confirmDeleteInfo.folderNames.some((f) => f.name === insideFolder.name)) {
      setInsideFolder(null);
    }
    loadConfig();
    showToast(`${confirmDeleteInfo.folderNames.length} pasta(s) excluída(s) permanentemente com sucesso!`);
    onRefresh?.();
  };

  // Multi-select helpers
  const toggleSelectFolder = (catKey: string, name: string) => {
    const key = `${catKey}:::${name}`;
    setSelectedFolderKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedFolderKeys.size === filteredAndSortedFoldersList.length && filteredAndSortedFoldersList.length > 0) {
      setSelectedFolderKeys(new Set());
    } else {
      const allKeys = new Set(filteredAndSortedFoldersList.map((f) => `${f.categoryKey}:::${f.name}`));
      setSelectedFolderKeys(allKeys);
    }
  };

  // --- INSIDE FOLDER ARTICLE LOGIC WITH SORTING & FILTERING ---

  const currentFolderEntities = useMemo(() => {
    if (!insideFolder) return [];
    return relevantEntities.filter((ent) => {
      const folders = getEntityFolders(ent);
      return folders.includes(insideFolder.name);
    });
  }, [relevantEntities, insideFolder]);

  // Combined list of entities according to search, category filter, tab, and sorting
  const insideArticlesList = useMemo(() => {
    if (!insideFolder) return [];

    const list = relevantEntities.filter((ent) => {
      const folders = getEntityFolders(ent);
      const isAlreadyIn = folders.includes(insideFolder.name);

      // Tab filter
      if (insideTab === 'current' && !isAlreadyIn) return false;
      if (insideTab === 'available' && isAlreadyIn) return false;
      if (insideTab === 'selected' && !selectedToAdd.has(ent.id) && !selectedToRemove.has(ent.id)) return false;

      // Category / Tradition / Rank / Type filter
      if (insideCategoryFilter !== 'all') {
        const matchCategory = ent.category === insideCategoryFilter;
        const matchTradition = ent.spellData?.traditions?.some(
          (t) => t.toLowerCase() === insideCategoryFilter.toLowerCase()
        );
        const matchRank =
          ent.spellData?.rank !== undefined &&
          String(ent.spellData.rank) === insideCategoryFilter;
        const matchItemType = ent.itemData?.itemType === insideCategoryFilter;
        const matchFeatType = ent.featData?.featType === insideCategoryFilter;
        const matchTags = ent.tags?.some(
          (t) => t.toLowerCase() === insideCategoryFilter.toLowerCase()
        );

        if (
          !matchCategory &&
          !matchTradition &&
          !matchRank &&
          !matchItemType &&
          !matchFeatType &&
          !matchTags
        ) {
          return false;
        }
      }

      // Search query
      if (insideSearchQuery.trim()) {
        const q = insideSearchQuery.toLowerCase().trim();
        const matchTitle = ent.title?.toLowerCase().includes(q);
        const matchSubtitle = ent.subtitle?.toLowerCase().includes(q);
        const matchTags = ent.tags?.some((t) => t.toLowerCase().includes(q));
        const matchDesc = (typeof ent.content === 'string' && ent.content.toLowerCase().includes(q)) ||
          ent.spellData?.description?.toLowerCase().includes(q) ||
          ent.itemData?.description?.toLowerCase().includes(q) ||
          ent.featData?.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchTags && !matchDesc) return false;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (insideSortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '', 'pt-BR');
      if (insideSortBy === 'title-desc') return (b.title || '').localeCompare(a.title || '', 'pt-BR');
      if (insideSortBy === 'rank-asc') {
        const rankA = a.spellData?.rank ?? a.itemData?.level ?? a.featData?.level ?? 0;
        const rankB = b.spellData?.rank ?? b.itemData?.level ?? b.featData?.level ?? 0;
        return rankA - rankB;
      }
      if (insideSortBy === 'rank-desc') {
        const rankA = a.spellData?.rank ?? a.itemData?.level ?? a.featData?.level ?? 0;
        const rankB = b.spellData?.rank ?? b.itemData?.level ?? b.featData?.level ?? 0;
        return rankB - rankA;
      }
      if (insideSortBy === 'status') {
        const aIn = getEntityFolders(a).includes(insideFolder.name);
        const bIn = getEntityFolders(b).includes(insideFolder.name);
        if (aIn !== bIn) return aIn ? -1 : 1;
        return (a.title || '').localeCompare(b.title || '', 'pt-BR');
      }
      return 0;
    });
  }, [
    relevantEntities,
    insideFolder,
    insideTab,
    insideCategoryFilter,
    insideSearchQuery,
    insideSortBy,
    selectedToAdd,
    selectedToRemove,
  ]);

  // Navigation handlers
  const handleOpenFolderInside = (folder: FolderItemInfo) => {
    setInsideFolder(folder);
    setInsideTab(folder.itemCount === 0 ? 'available' : 'current');
    setInsideSearchQuery('');
    setInsideCategoryFilter('all');
    setSelectedToAdd(new Set());
    setSelectedToRemove(new Set());
  };

  const handleBackToFolders = () => {
    setInsideFolder(null);
    setSelectedToAdd(new Set());
    setSelectedToRemove(new Set());
    loadConfig();
  };

  // Toggle selection for batch addition or removal
  const handleToggleSelectEntity = (id: string, isAlreadyInFolder: boolean) => {
    if (isAlreadyInFolder) {
      setSelectedToRemove((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedToAdd((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const handleSelectAllVisibleArticles = () => {
    const visibleIds = insideArticlesList.map((e) => e.id);
    if (insideTab === 'current') {
      if (selectedToRemove.size === visibleIds.length && visibleIds.length > 0) {
        setSelectedToRemove(new Set());
      } else {
        setSelectedToRemove(new Set(visibleIds));
      }
    } else {
      if (selectedToAdd.size === visibleIds.length && visibleIds.length > 0) {
        setSelectedToAdd(new Set());
      } else {
        setSelectedToAdd(new Set(visibleIds));
      }
    }
  };

  const handleBatchAddToFolder = () => {
    if (!insideFolder || selectedToAdd.size === 0) return;
    const ids = Array.from(selectedToAdd);
    const count = HecosStorage.addFolderToEntities(insideFolder.name, ids);
    reloadEntities();
    loadConfig();
    setSelectedToAdd(new Set());
    showToast(`${count} ${count === 1 ? scopeDetails.singularEntity : scopeDetails.entityLabel} adicionado(s) à pasta "${insideFolder.name}"!`);
    onRefresh?.();
  };

  const handleSingleAddToFolder = (entityId: string) => {
    if (!insideFolder) return;
    HecosStorage.addFolderToEntities(insideFolder.name, [entityId]);
    reloadEntities();
    loadConfig();
    showToast(`Artigo adicionado à pasta "${insideFolder.name}".`);
    onRefresh?.();
  };

  const handleBatchRemoveFromFolder = () => {
    if (!insideFolder || selectedToRemove.size === 0) return;
    const ids = Array.from(selectedToRemove);
    const count = HecosStorage.removeFolderFromEntities(insideFolder.name, ids);
    reloadEntities();
    loadConfig();
    setSelectedToRemove(new Set());
    showToast(`${count} ${count === 1 ? scopeDetails.singularEntity : scopeDetails.entityLabel} removido(s) da pasta "${insideFolder.name}"!`);
    onRefresh?.();
  };

  const handleSingleRemoveFromFolder = (entityId: string) => {
    if (!insideFolder) return;
    HecosStorage.removeFolderFromEntities(insideFolder.name, [entityId]);
    reloadEntities();
    loadConfig();
    showToast(`Artigo desvinculado da pasta "${insideFolder.name}".`);
    onRefresh?.();
  };

  // Scope title and descriptions
  const scopeDetails = useMemo(() => {
    switch (scope) {
      case 'spell':
        return {
          title: 'Gerenciador de Pastas do Grimório',
          subtitle: 'Organize e gerencie as pastas e subpastas de feitiços e rituais de Hecos.',
          icon: Sparkles,
          entityLabel: 'feitiços',
          singularEntity: 'feitiço',
        };
      case 'item':
        return {
          title: 'Gerenciador de Pastas de Itens',
          subtitle: 'Organize o inventário de armas, artefatos, poções e tesouros de Hecos.',
          icon: Folder,
          entityLabel: 'itens',
          singularEntity: 'item',
        };
      case 'feat':
        return {
          title: 'Gerenciador de Pastas de Talentos',
          subtitle: 'Organize os talentos de classe, gerais, ancestrais e de perícia.',
          icon: Folder,
          entityLabel: 'talentos',
          singularEntity: 'talento',
        };
      case 'peril':
        return {
          title: 'Gerenciador de Pastas de Perigos & Bestas',
          subtitle: 'Organize as criaturas, perigos ambientais e armadilhas de Hecos.',
          icon: Shield,
          entityLabel: 'perigos',
          singularEntity: 'perigo',
        };
      default:
        return {
          title: `Gerenciador de Pastas (${scope})`,
          subtitle: 'Organize pastas e subpastas com controle refinado de artigos.',
          icon: FolderTree,
          entityLabel: 'artigos',
          singularEntity: 'artigo',
        };
    }
  }, [scope]);

  if (!isOpen) return null;

  return (
    <div
      id="folder-manager-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      {/* MODAL CONTAINER SIZED STRICTLY TO 85% OF SCREEN SPACE */}
      <div
        id="folder-manager-modal"
        className="w-[85vw] h-[85vh] bg-[#0c0914] border border-zinc-800/90 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative"
        style={{
          borderColor: `${colorStyles.hex}40`,
          boxShadow: `0 0 50px ${colorStyles.hex}18`,
        }}
      >
        {/* Subtle dynamic ambient glow matching category theme */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: colorStyles.hex }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: colorStyles.hex }}
        />

        {/* 1. MODAL TOP HEADER */}
        <div className="px-5 py-3.5 bg-[#110d1f]/90 border-b border-zinc-800/80 flex items-center justify-between gap-4 shrink-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${colorStyles.badge}`}
              style={{ boxShadow: `0 0 16px ${colorStyles.hex}25` }}
            >
              <FolderTree className={`w-5 h-5 ${colorStyles.iconText}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-zinc-100 truncate">
                  {scopeDetails.title}
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-widest font-bold"
                  style={{
                    backgroundColor: `${colorStyles.hex}15`,
                    borderColor: `${colorStyles.hex}50`,
                    color: colorStyles.hex,
                  }}
                >
                  {activeTheme}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800 hidden sm:inline">
                  {allFoldersList.length} pastas no total
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate hidden sm:block">
                {scopeDetails.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="folder-manager-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar janela de gerenciamento"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. PRIMARY ACTION BAR & TABS */}
        <div className="px-5 py-2.5 bg-[#0e0a1b] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveTab('manage');
                if (insideFolder) setInsideFolder(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'manage' && !insideFolder
                  ? colorStyles.activeTab
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Explorar Pastas</span>
              <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono">
                {allFoldersList.length}
              </span>
            </button>

            {insideFolder && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold animate-fade-in shadow-sm"
                style={{
                  backgroundColor: `${colorStyles.hex}20`,
                  borderColor: `${colorStyles.hex}60`,
                  color: colorStyles.hex,
                }}
              >
                <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[200px]">{insideFolder.name}</span>
                <button
                  type="button"
                  onClick={handleBackToFolders}
                  className="ml-1 p-0.5 text-zinc-400 hover:text-white hover:bg-black/30 rounded transition-colors cursor-pointer"
                  title="Voltar para a lista de pastas"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab('create_single');
                if (insideFolder) setInsideFolder(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'create_single'
                  ? colorStyles.activeTab
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Criar Uma Pasta / Subpasta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('create_bulk');
                if (insideFolder) setInsideFolder(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'create_bulk'
                  ? colorStyles.activeTab
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>+ Criar em Lote (Múltiplas)</span>
            </button>
          </div>

          {/* Multi-selection quick actions (when in manage tab) */}
          {activeTab === 'manage' && !insideFolder && selectedFolderKeys.size > 0 && (
            <div className="flex items-center gap-2 shrink-0 animate-fade-in">
              <span className="text-xs font-mono font-bold text-amber-300">
                {selectedFolderKeys.size} selecionada(s)
              </span>
              <button
                type="button"
                onClick={requestDeleteMultiple}
                className="px-3 py-1.5 rounded-xl bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-600/80 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Selecionadas</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. MODAL MAIN BODY */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* TAB 1: MANAGE EXISTING FOLDERS */}
          {activeTab === 'manage' && (
            insideFolder ? (
              /* ============================================================ */
              /* INSIDE FOLDER VIEW: BROWSE, FILTER, SEARCH, BULK ADD/REMOVE */
              /* ============================================================ */
              <div className="flex-1 flex flex-col bg-[#0c0a15] overflow-hidden animate-fade-in w-full">
                {/* Inside Folder Header */}
                <div className="p-4 bg-[#120e22] border-b border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleBackToFolders}
                      className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-sm"
                      title="Voltar para a lista de pastas"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Todas as Pastas</span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`p-1.5 rounded-lg border ${colorStyles.badge} flex items-center justify-center shrink-0`}>
                          <FolderOpen className={`w-4 h-4 ${colorStyles.iconText}`} />
                        </div>
                        {insideFolder.parentPath && (
                          <span className="text-xs text-zinc-400 font-mono">
                            {insideFolder.parentPath} <span className="text-zinc-600">/</span>
                          </span>
                        )}
                        <h3 className="text-lg font-black text-zinc-100 truncate">
                          {insideFolder.leafName}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {insideFolder.categoryName}
                        </span>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold ${colorStyles.badge}`}>
                          {currentFolderEntities.length} {currentFolderEntities.length === 1 ? scopeDetails.singularEntity : scopeDetails.entityLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate hidden sm:block">
                        Selecione artigos abaixo para vincular ou desvincular em lote desta pasta.
                      </p>
                    </div>
                  </div>

                  {/* Inside Navigation Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setInsideTab('available')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        insideTab === 'available'
                          ? colorStyles.activeTab
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Disponíveis para Adicionar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsideTab('current')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        insideTab === 'current'
                          ? colorStyles.activeTab
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <FolderCheck className="w-3.5 h-3.5" />
                      <span>Nesta Pasta ({currentFolderEntities.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsideTab('all')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        insideTab === 'all'
                          ? colorStyles.activeTab
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>Todos</span>
                    </button>
                  </div>
                </div>

                {/* Toolbar for Search, Filter, Sort and View Mode */}
                <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-[#100c1d] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={insideSearchQuery}
                      onChange={(e) => setInsideSearchQuery(e.target.value)}
                      placeholder={`Buscar artigos por título, tags ou descrição... (${insideArticlesList.length} encontrados)`}
                      className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none ${colorStyles.focusRing} transition-colors`}
                    />
                    {insideSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setInsideSearchQuery('')}
                        className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter & Sort Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Sort Order */}
                    <div className="flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded-xl border border-zinc-800 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                      <select
                        value={insideSortBy}
                        onChange={(e) => setInsideSortBy(e.target.value as any)}
                        className="bg-transparent text-zinc-200 text-xs outline-none cursor-pointer"
                      >
                        <option value="title-asc">Título: A - Z</option>
                        <option value="title-desc">Título: Z - A</option>
                        <option value="rank-asc">Círculo / Nível (Menor)</option>
                        <option value="rank-desc">Círculo / Nível (Maior)</option>
                        <option value="status">Status na Pasta</option>
                      </select>
                    </div>

                    {/* View Mode Toggle (Cards or List) */}
                    <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setInsideViewMode('cards')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          insideViewMode === 'cards'
                            ? colorStyles.activeTab
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Visualização em Cards"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInsideViewMode('list')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          insideViewMode === 'list'
                            ? colorStyles.activeTab
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Visualização em Lista"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Select All Toggle */}
                    <button
                      type="button"
                      onClick={handleSelectAllVisibleArticles}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Marcar / Desmarcar todos os visíveis"
                    >
                      {((insideTab === 'current' ? selectedToRemove.size : selectedToAdd.size) === insideArticlesList.length && insideArticlesList.length > 0) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span className="hidden sm:inline">Todos Visíveis</span>
                    </button>
                  </div>
                </div>

                {/* Bulk Operation Action Bar */}
                {(selectedToAdd.size > 0 || selectedToRemove.size > 0) && (
                  <div className="px-4 py-2.5 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">
                        {selectedToAdd.size > 0 && `${selectedToAdd.size} selecionado(s) para adicionar`}
                        {selectedToAdd.size > 0 && selectedToRemove.size > 0 && ' • '}
                        {selectedToRemove.size > 0 && `${selectedToRemove.size} selecionado(s) para desvincular`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedToAdd.size > 0 && (
                        <button
                          type="button"
                          onClick={handleBatchAddToFolder}
                          className={`px-4 py-1.5 rounded-xl ${colorStyles.primary} text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md`}
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Adicionar Selecionados em Lote ({selectedToAdd.size})</span>
                        </button>
                      )}
                      {selectedToRemove.size > 0 && (
                        <button
                          type="button"
                          onClick={handleBatchRemoveFromFolder}
                          className="px-4 py-1.5 rounded-xl bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-600 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remover Selecionados em Lote ({selectedToRemove.size})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Articles Content Area: Cards or List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {insideArticlesList.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800/80 space-y-3">
                      <FolderOpen className="w-10 h-10 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold text-zinc-300">Nenhum artigo encontrado nesta visualização</h4>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        {insideSearchQuery
                          ? `Nenhum resultado coincide com a busca "${insideSearchQuery}".`
                          : insideTab === 'current'
                          ? 'Esta pasta ainda não possui nenhum artigo vinculado. Clique na aba "Disponíveis para Adicionar" para incluir artigos em lote.'
                          : 'Todos os artigos já foram adicionados a esta pasta ou nenhum artigo atende ao filtro atual.'}
                      </p>
                    </div>
                  ) : insideViewMode === 'cards' ? (
                    /* CARDS VIEW */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {insideArticlesList.map((ent) => {
                        const entFolders = getEntityFolders(ent);
                        const isAlreadyIn = entFolders.includes(insideFolder.name);
                        const isChecked = isAlreadyIn ? selectedToRemove.has(ent.id) : selectedToAdd.has(ent.id);
                        const circleRank = ent.spellData?.rank ?? ent.itemData?.level ?? ent.featData?.level;

                        return (
                          <div
                            key={ent.id}
                            onClick={() => handleToggleSelectEntity(ent.id, isAlreadyIn)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative select-none ${
                              isChecked
                                ? colorStyles.selectionHighlight
                                : isAlreadyIn
                                ? 'bg-zinc-900/60 border-zinc-700/80 hover:border-zinc-500'
                                : 'bg-[#110d1f]/70 border-zinc-800 hover:border-zinc-700 hover:bg-[#161126]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelectEntity(ent.id, isAlreadyIn);
                                  }}
                                  className="mt-0.5 text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-pink-400" style={{ color: colorStyles.hex }} />
                                  ) : (
                                    <Square className="w-4 h-4 text-zinc-600" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-black text-zinc-100 group-hover:text-white truncate">
                                    {ent.title}
                                  </h5>
                                  {ent.subtitle && (
                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                      {ent.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {circleRank !== undefined && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0"
                                  style={{
                                    backgroundColor: `${colorStyles.hex}20`,
                                    borderColor: `${colorStyles.hex}40`,
                                    color: colorStyles.hex,
                                  }}
                                >
                                  {scope === 'spell' ? `${circleRank}º Círculo` : `Nv. ${circleRank}`}
                                </span>
                              )}
                            </div>

                            {/* Tags / Subcategories preview */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {ent.spellData?.traditions?.map((trad) => (
                                <span key={trad} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                  {trad}
                                </span>
                              ))}
                              {ent.itemData?.itemType && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                  {ent.itemData.itemType}
                                </span>
                              )}
                              {ent.tags?.slice(0, 2).map((tg) => (
                                <span key={tg} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900/80 text-zinc-500 border border-zinc-800/80">
                                  #{tg}
                                </span>
                              ))}
                            </div>

                            {/* Status and 1-Click Action */}
                            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                              {isAlreadyIn ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <FolderCheck className="w-3.5 h-3.5" />
                                  <span>Nesta Pasta</span>
                                </span>
                              ) : (
                                <span className="text-zinc-500 flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  <span>Disponível</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAlreadyIn) handleSingleRemoveFromFolder(ent.id);
                                  else handleSingleAddToFolder(ent.id);
                                }}
                                className={`px-2 py-0.8 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  isAlreadyIn
                                    ? 'bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-zinc-700'
                                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                                }`}
                              >
                                {isAlreadyIn ? 'Desvincular' : '+ Vincular'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div className="bg-[#100c1d] rounded-xl border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/60">
                      {insideArticlesList.map((ent) => {
                        const entFolders = getEntityFolders(ent);
                        const isAlreadyIn = entFolders.includes(insideFolder.name);
                        const isChecked = isAlreadyIn ? selectedToRemove.has(ent.id) : selectedToAdd.has(ent.id);
                        const circleRank = ent.spellData?.rank ?? ent.itemData?.level ?? ent.featData?.level;

                        return (
                          <div
                            key={ent.id}
                            onClick={() => handleToggleSelectEntity(ent.id, isAlreadyIn)}
                            className={`p-2.5 px-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                              isChecked
                                ? colorStyles.selectionHighlight
                                : 'hover:bg-zinc-900/60 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectEntity(ent.id, isAlreadyIn);
                                }}
                                className="text-zinc-400 hover:text-white cursor-pointer"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4" style={{ color: colorStyles.hex }} />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-600" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-zinc-100 truncate">
                                    {ent.title}
                                  </span>
                                  {circleRank !== undefined && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                                      {scope === 'spell' ? `${circleRank}º Círculo` : `Nv. ${circleRank}`}
                                    </span>
                                  )}
                                </div>
                                {ent.subtitle && (
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    {ent.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {isAlreadyIn ? (
                                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                  <FolderCheck className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Na Pasta</span>
                                </span>
                              ) : (
                                <span className="text-zinc-500 text-xs">
                                  Disponível
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAlreadyIn) handleSingleRemoveFromFolder(ent.id);
                                  else handleSingleAddToFolder(ent.id);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isAlreadyIn
                                    ? 'bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-zinc-700'
                                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                                }`}
                              >
                                {isAlreadyIn ? 'Desvincular' : '+ Vincular'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* FOLDERS OVERVIEW: BROWSE, SORT, FILTER & SUBFOLDERS */
              /* ============================================================ */
              <>
                {/* Left Categories Filter Sidebar */}
                <div className="w-full md:w-60 bg-[#100c1e] border-b md:border-b-0 md:border-r border-zinc-800/80 p-3 flex flex-col shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                    <span>Categorias de Hecos</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {categories.length}
                    </span>
                  </div>

                  <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto pb-1 md:pb-0 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId('all')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                        selectedCategoryId === 'all'
                          ? colorStyles.activeTab
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5" />
                        <span>Todas as Categorias</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30">
                        {categoryCounts['all'] || 0}
                      </span>
                    </button>

                    {categories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id;
                      const count = categoryCounts[cat.id] || 0;
                      const CatIcon = cat.icon || Folder;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                            isSelected
                              ? colorStyles.activeTab
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <CatIcon className="w-3.5 h-3.5 shrink-0" style={!isSelected && cat.color ? { color: cat.color } : undefined} />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 shrink-0">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary statistics */}
                  <div className="mt-auto pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1.5 hidden md:block">
                    <div className="flex items-center justify-between">
                      <span>Pastas Raiz:</span>
                      <span className="font-mono text-zinc-300">{allFoldersList.filter((f) => !f.isSubfolder).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Subpastas:</span>
                      <span className="font-mono" style={{ color: colorStyles.hex }}>
                        {allFoldersList.filter((f) => f.isSubfolder).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pastas com Itens:</span>
                      <span className="font-mono text-emerald-400">{allFoldersList.filter((f) => f.itemCount > 0).length}</span>
                    </div>
                  </div>
                </div>

                {/* Center / Right: Folder Explorer with Search, Sort & Filtering */}
                <div className="flex-1 flex flex-col bg-[#0c0a15] overflow-hidden">
                  {/* Search, Filter & Sort Toolbar */}
                  <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-[#100c1e] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                    {/* Search input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Buscar pastas por nome, hierarquia ou categoria... (${filteredAndSortedFoldersList.length} encontradas)`}
                        className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none ${colorStyles.focusRing} transition-colors`}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter and Sort options */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Structure Filter (All, Root, Subfolder) */}
                      <select
                        value={filterStructure}
                        onChange={(e) => setFilterStructure(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs outline-none cursor-pointer"
                      >
                        <option value="all">Todas as Estruturas</option>
                        <option value="root">Apenas Pastas Raiz</option>
                        <option value="sub">Apenas Subpastas</option>
                      </select>

                      {/* Status / Visibility Filter */}
                      <select
                        value={filterVisibility}
                        onChange={(e) => setFilterVisibility(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs outline-none cursor-pointer"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="populated">Com Artigos</option>
                        <option value="empty">Vazias (Sem Artigos)</option>
                        <option value="public">Apenas Públicas</option>
                        <option value="secret">Apenas Secretas (GM)</option>
                      </select>

                      {/* Sort Order */}
                      <select
                        value={folderSortBy}
                        onChange={(e) => setFolderSortBy(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs outline-none cursor-pointer"
                      >
                        <option value="name-asc">Nome: A - Z</option>
                        <option value="name-desc">Nome: Z - A</option>
                        <option value="items-desc">Mais Artigos</option>
                        <option value="items-asc">Menos Artigos</option>
                        <option value="hierarchy">Hierarquia (Raiz Primeiro)</option>
                      </select>

                      {/* View Mode Toggle (Cards or List) */}
                      <div className="flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setFolderViewMode('cards')}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            folderViewMode === 'cards'
                              ? colorStyles.activeTab
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="Visualização em Cards"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFolderViewMode('list')}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            folderViewMode === 'list'
                              ? colorStyles.activeTab
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="Visualização em Lista"
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Select all toggle */}
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Selecionar / Desmarcar todas as pastas visíveis"
                      >
                        {selectedFolderKeys.size === filteredAndSortedFoldersList.length && filteredAndSortedFoldersList.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        <span className="hidden lg:inline">Selecionar Todas</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Folders Grid / List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredAndSortedFoldersList.length === 0 ? (
                      <div className="text-center py-16 px-4 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800/80 space-y-3">
                        <Folder className="w-12 h-12 text-zinc-600 mx-auto" />
                        <h4 className="text-sm font-bold text-zinc-300">Nenhuma pasta encontrada</h4>
                        <p className="text-xs text-zinc-500 max-w-md mx-auto">
                          {searchQuery
                            ? `Nenhuma pasta coincide com a busca "${searchQuery}".`
                            : 'Nenhuma pasta cadastrada nesta categoria. Crie uma nova pasta individualmente ou em lote.'}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('create_single')}
                            className={`px-4 py-2 rounded-xl ${colorStyles.primary} text-xs font-bold transition-all cursor-pointer`}
                          >
                            + Criar Nova Pasta
                          </button>
                        </div>
                      </div>
                    ) : folderViewMode === 'cards' ? (
                      /* CARDS VIEW */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredAndSortedFoldersList.map((folder) => {
                          const isSelected = selectedFolderKeys.has(`${folder.categoryKey}:::${folder.name}`);
                          const isEditing = editingFolderKey === `${folder.categoryKey}:::${folder.name}`;

                          return (
                            <div
                              key={`${folder.categoryKey}:::${folder.name}`}
                              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 group relative ${
                                isSelected
                                  ? colorStyles.selectionHighlight
                                  : 'bg-[#110d1f]/80 hover:bg-[#151026] border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-2">
                                {/* Header: Checkbox, Parent Hierarchy & Actions */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleSelectFolder(folder.categoryKey, folder.name)}
                                      className="text-zinc-400 hover:text-white cursor-pointer shrink-0"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4" style={{ color: colorStyles.hex }} />
                                      ) : (
                                        <Square className="w-4 h-4 text-zinc-600" />
                                      )}
                                    </button>

                                    <div className="min-w-0">
                                      {folder.parentPath && (
                                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 mb-0.5">
                                          <CornerDownRight className="w-3 h-3 text-zinc-500 shrink-0" />
                                          <span className="truncate">{folder.parentPath}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        <Folder className={`w-4 h-4 shrink-0 ${colorStyles.iconText}`} />
                                        {isEditing ? (
                                          <input
                                            type="text"
                                            value={editingNameValue}
                                            onChange={(e) => setEditingNameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleRename(folder.categoryKey, folder.name);
                                              if (e.key === 'Escape') setEditingFolderKey(null);
                                            }}
                                            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-600 text-xs font-bold text-white outline-none w-full"
                                            autoFocus
                                          />
                                        ) : (
                                          <h4 className="text-xs font-black text-zinc-100 truncate">
                                            {folder.leafName}
                                          </h4>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {isEditing ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRename(folder.categoryKey, folder.name)}
                                        className="p-1 rounded text-emerald-400 hover:bg-emerald-950 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFolderKey(`${folder.categoryKey}:::${folder.name}`);
                                          setEditingNameValue(folder.name);
                                        }}
                                        className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                        title="Renomear pasta"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => requestDeleteSingle(folder.categoryKey, folder.name)}
                                      className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                      title="Excluir pasta permanentemente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Metadata badges */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                    {folder.categoryName}
                                  </span>
                                  {folder.isSubfolder && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-purple-400 flex items-center gap-1">
                                      <span>Subpasta</span>
                                    </span>
                                  )}
                                  {folder.isSecret && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300 flex items-center gap-1">
                                      <EyeOff className="w-3 h-3" />
                                      <span>Secreta</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Footer Action: Enter Folder to add articles & Add Subfolder */}
                              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleInitiateSubfolder(folder.name, folder.categoryKey)}
                                  className="text-[11px] font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                                  title="Criar uma nova subpasta dentro desta pasta"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Subpasta</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenFolderInside(folder)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                    folder.itemCount > 0
                                      ? colorStyles.primary
                                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                                  }`}
                                >
                                  <FolderOpen className="w-3.5 h-3.5" />
                                  <span>
                                    Entrar ({folder.itemCount})
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* LIST VIEW */
                      <div className="bg-[#100c1e] rounded-xl border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/60">
                        {filteredAndSortedFoldersList.map((folder) => {
                          const isSelected = selectedFolderKeys.has(`${folder.categoryKey}:::${folder.name}`);
                          const isEditing = editingFolderKey === `${folder.categoryKey}:::${folder.name}`;

                          return (
                            <div
                              key={`${folder.categoryKey}:::${folder.name}`}
                              className={`p-2.5 px-3.5 flex items-center justify-between gap-3 transition-colors ${
                                isSelected
                                  ? colorStyles.selectionHighlight
                                  : 'hover:bg-zinc-900/60 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectFolder(folder.categoryKey, folder.name)}
                                  className="text-zinc-400 hover:text-white cursor-pointer shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4" style={{ color: colorStyles.hex }} />
                                  ) : (
                                    <Square className="w-4 h-4 text-zinc-600" />
                                  )}
                                </button>

                                <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: `${folder.depth * 14}px` }}>
                                  {folder.isSubfolder ? (
                                    <CornerDownRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  ) : (
                                    <Folder className={`w-3.5 h-3.5 shrink-0 ${colorStyles.iconText}`} />
                                  )}

                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editingNameValue}
                                      onChange={(e) => setEditingNameValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename(folder.categoryKey, folder.name);
                                        if (e.key === 'Escape') setEditingFolderKey(null);
                                      }}
                                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-600 text-xs font-bold text-white outline-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-zinc-100 truncate">
                                      {folder.leafName}
                                    </span>
                                  )}

                                  {folder.parentPath && (
                                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline truncate">
                                      ({folder.parentPath})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hidden sm:inline">
                                  {folder.categoryName}
                                </span>

                                <span className="text-[11px] font-mono text-zinc-300">
                                  {folder.itemCount} artigos
                                </span>

                                {folder.isSecret && (
                                  <span title="Secreta (GM)">
                                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                  </span>
                                )}

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateSubfolder(folder.name, folder.categoryKey)}
                                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                    title="Criar subpasta nesta pasta"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFolderKey(`${folder.categoryKey}:::${folder.name}`);
                                      setEditingNameValue(folder.name);
                                    }}
                                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                    title="Renomear"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => requestDeleteSingle(folder.categoryKey, folder.name)}
                                    className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenFolderInside(folder)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                                      folder.itemCount > 0
                                        ? colorStyles.primary
                                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                                    }`}
                                  >
                                    <FolderOpen className="w-3 h-3" />
                                    <span>Entrar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          )}

          {/* TAB 2: CREATE SINGLE FOLDER OR SUBFOLDER */}
          {activeTab === 'create_single' && (
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-center items-center">
              <div className="w-full max-w-xl bg-[#110d1f] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                  <div className={`p-2.5 rounded-xl border ${colorStyles.badge}`}>
                    <Plus className={`w-5 h-5 ${colorStyles.iconText}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-100">Criar Nova Pasta ou Subpasta</h3>
                    <p className="text-xs text-zinc-400">
                      Crie uma pasta individual para organizar os conteúdos de {scopeDetails.entityLabel}.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Category Target */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-300">Categoria de Destino *</label>
                    <select
                      value={singleCategoryTarget}
                      onChange={(e) => setSingleCategoryTarget(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.englishName ? `(${c.englishName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Parent Folder Selector (Subfolder Support) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span>Pasta Pai (Hierarquia / Subpasta)</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Opcional</span>
                    </label>
                    <select
                      value={singleParentFolder}
                      onChange={(e) => setSingleParentFolder(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value="">Nenhuma (Criar como Pasta Raiz / Principal)</option>
                      {availableParentFolders.map((pName) => (
                        <option key={pName} value={pName}>
                          ↳ Subpasta de: {pName}
                        </option>
                      ))}
                    </select>
                    {singleParentFolder && (
                      <p className="text-[11px] text-purple-400 flex items-center gap-1 mt-1">
                        <CornerDownRight className="w-3 h-3" />
                        <span>A nova pasta será criada dentro de "{singleParentFolder}".</span>
                      </p>
                    )}
                  </div>

                  {/* Folder Name */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-300">Nome da Pasta *</label>
                    <input
                      type="text"
                      value={singleFolderName}
                      onChange={(e) => setSingleFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSingle();
                      }}
                      placeholder="Ex: Magias de Fogo, Artefatos Rúnicos, Evocação..."
                      className={`w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none ${colorStyles.focusRing}`}
                      autoFocus
                    />
                  </div>

                  {/* Secret toggle */}
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                        {singleIsSecret ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
                        <span>Visibilidade da Pasta</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {singleIsSecret
                          ? 'Secreta (Apenas o GM pode visualizar até ser revelada)'
                          : 'Pública (Visível para todos os jogadores)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSingleIsSecret(!singleIsSecret)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        singleIsSecret
                          ? 'bg-amber-950 text-amber-300 border-amber-600'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {singleIsSecret ? 'Secreta (GM)' : 'Pública'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSingle}
                    disabled={!singleFolderName.trim()}
                    className={`px-5 py-2 rounded-xl ${colorStyles.primary} text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md cursor-pointer`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Criar Pasta</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE MULTIPLE FOLDERS IN BULK */}
          {activeTab === 'create_bulk' && (
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-center items-center">
              <div className="w-full max-w-2xl bg-[#110d1f] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                  <div className={`p-2.5 rounded-xl border ${colorStyles.badge}`}>
                    <Layers className={`w-5 h-5 ${colorStyles.iconText}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-100">Criação de Pastas em Lote (Múltiplas)</h3>
                    <p className="text-xs text-zinc-400">
                      Cole ou digite múltiplos nomes de pastas de uma só vez (uma por linha ou separadas por vírgula).
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Target Category */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-300">Categoria de Destino *</label>
                    <select
                      value={bulkCategoryTarget}
                      onChange={(e) => setBulkCategoryTarget(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.englishName ? `(${c.englishName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Parent Folder for the batch */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span>Pasta Pai para o Lote (Opcional)</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Todas serão subpastas</span>
                    </label>
                    <select
                      value={bulkParentFolder}
                      onChange={(e) => setBulkParentFolder(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value="">Nenhuma (Criar como Pastas Raiz / Principais)</option>
                      {availableParentFolders.map((pName) => (
                        <option key={pName} value={pName}>
                          ↳ Subpastas de: {pName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Multi-line input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-zinc-300">Lista de Pastas a Criar *</label>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {
                          bulkInputText
                            .split(/[\n,;]+/)
                            .map((s) => s.trim())
                            .filter(Boolean).length
                        }{' '}
                        pastas detectadas
                      </span>
                    </div>
                    <textarea
                      value={bulkInputText}
                      onChange={(e) => setBulkInputText(e.target.value)}
                      rows={6}
                      placeholder={`Exemplo de lista para colar:\nEvocação\nAbjuração\nTransmutação\nIlusão\nNecromancia`}
                      className={`w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 font-mono text-xs outline-none ${colorStyles.focusRing}`}
                      autoFocus
                    />
                  </div>

                  {/* Secret toggle */}
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                        {bulkIsSecret ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
                        <span>Visibilidade das Novas Pastas</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {bulkIsSecret
                          ? 'Todas serão criadas como Secretas do GM.'
                          : 'Todas serão criadas como Públicas.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBulkIsSecret(!bulkIsSecret)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        bulkIsSecret
                          ? 'bg-amber-950 text-amber-300 border-amber-600'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {bulkIsSecret ? 'Secretas (GM)' : 'Públicas'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateBulk}
                    disabled={
                      bulkInputText
                        .split(/[\n,;]+/)
                        .map((s) => s.trim())
                        .filter(Boolean).length === 0
                    }
                    className={`px-5 py-2 rounded-xl ${colorStyles.primary} text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md cursor-pointer`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      Criar{' '}
                      {
                        bulkInputText
                          .split(/[\n,;]+/)
                          .map((s) => s.trim())
                          .filter(Boolean).length
                      }{' '}
                      Pastas
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 bg-[#110d1f] border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {toastMessage && (
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                <span>{toastMessage}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL (Single or Multi) */}
      {confirmDeleteInfo.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#140f22] border border-rose-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center gap-3 text-rose-400 border-b border-zinc-800 pb-3">
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-zinc-100">Confirmar Exclusão Permanente</h4>
                <p className="text-xs text-zinc-400">
                  {confirmDeleteInfo.folderNames && confirmDeleteInfo.folderNames.length === 1 && confirmDeleteInfo.folderNames[0]
                    ? `Excluir permanentemente a pasta "${confirmDeleteInfo.folderNames[0].name}"?`
                    : `Excluir permanentemente ${(confirmDeleteInfo.folderNames || []).length} pastas selecionadas?`}
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-300 space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <p>
                As pastas excluídas não retornarão ao recarregar a página. Os <strong>{confirmDeleteInfo.affectedItemsCount} {scopeDetails.entityLabel}</strong> que estavam nelas <strong>NÃO</strong> serão apagados do sistema, apenas desvinculados destas pastas.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteInfo({ isOpen: false, folderNames: [], affectedItemsCount: 0 })}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

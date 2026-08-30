import React, { useState, useMemo, useEffect } from 'react';
import { HecosEntity, FolderPermission, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Layers,
  Sparkles,
  Award,
  Gem,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Copy,
  ArrowRight,
  Filter,
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

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: FolderScope;
  categories?: FolderCategoryOption[];
  entities?: HecosEntity[];
  initialCategoryId?: string;
  themeColor?: 'amber' | 'cyan' | 'purple' | 'emerald' | 'rose';
  onRefresh?: () => void;
}

interface FolderItemInfo {
  name: string;
  categoryKey: string;
  categoryName: string;
  itemCount: number;
  entities: HecosEntity[];
  isSecret: boolean;
  permission: FolderPermission;
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
  // Theme styling resolver
  const activeTheme = useMemo(() => {
    if (themeColor) return themeColor;
    if (scope === 'spell' || scope === 'pc' || scope === 'location' || scope === 'ancestry') return 'cyan';
    if (scope === 'feat' || scope === 'tag') return 'amber';
    if (scope === 'item' || scope === 'class' || scope === 'npc') return 'purple';
    if (scope === 'fauna' || scope === 'flora') return 'emerald';
    if (scope === 'peril' || scope === 'organization') return 'rose';
    return 'cyan';
  }, [themeColor, scope]);

  const colorStyles = useMemo(() => {
    switch (activeTheme) {
      case 'amber':
        return {
          primary: 'bg-amber-500 hover:bg-amber-400 text-black',
          primarySoft: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
          accentBorder: 'border-amber-500/40',
          focusRing: 'focus:border-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          iconText: 'text-amber-400',
          hoverBg: 'hover:bg-amber-950/20',
          activeTab: 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20',
          selectionHighlight: 'bg-amber-950/60 border-amber-500/80 text-amber-100 ring-1 ring-amber-500/30',
        };
      case 'rose':
        return {
          primary: 'bg-rose-500 hover:bg-rose-400 text-black font-bold',
          primarySoft: 'bg-rose-950/40 text-rose-300 border-rose-500/40',
          accentBorder: 'border-rose-500/40',
          focusRing: 'focus:border-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          iconText: 'text-rose-400',
          hoverBg: 'hover:bg-rose-950/20',
          activeTab: 'bg-rose-500 text-black font-bold shadow-md shadow-rose-500/20',
          selectionHighlight: 'bg-rose-950/60 border-rose-500/80 text-rose-100 ring-1 ring-rose-500/30',
        };
      case 'cyan':
        return {
          primary: 'bg-cyan-500 hover:bg-cyan-400 text-black',
          primarySoft: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40',
          accentBorder: 'border-cyan-500/40',
          focusRing: 'focus:border-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          iconText: 'text-cyan-400',
          hoverBg: 'hover:bg-cyan-950/20',
          activeTab: 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20',
          selectionHighlight: 'bg-cyan-950/60 border-cyan-500/80 text-cyan-100 ring-1 ring-cyan-500/30',
        };
      case 'purple':
        return {
          primary: 'bg-purple-600 hover:bg-purple-500 text-white',
          primarySoft: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
          accentBorder: 'border-purple-500/40',
          focusRing: 'focus:border-purple-400',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          iconText: 'text-purple-400',
          hoverBg: 'hover:bg-purple-950/20',
          activeTab: 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20',
          selectionHighlight: 'bg-purple-950/60 border-purple-500/80 text-purple-100 ring-1 ring-purple-500/30',
        };
      case 'emerald':
      default:
        return {
          primary: 'bg-emerald-500 hover:bg-emerald-400 text-black',
          primarySoft: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
          accentBorder: 'border-emerald-500/40',
          focusRing: 'focus:border-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          iconText: 'text-emerald-400',
          hoverBg: 'hover:bg-emerald-950/20',
          activeTab: 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20',
          selectionHighlight: 'bg-emerald-950/60 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-500/30',
        };
    }
  }, [activeTheme]);

  // Current subcategories config from storage
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'secret' | 'empty' | 'populated'>('all');

  // Multi-selection state
  const [selectedFolderKeys, setSelectedFolderKeys] = useState<Set<string>>(new Set());

  // Creation mode state: single vs bulk
  const [activeTab, setActiveTab] = useState<'manage' | 'create_single' | 'create_bulk'>('manage');
  const [singleFolderName, setSingleFolderName] = useState('');
  const [singleCategoryTarget, setSingleCategoryTarget] = useState<string>(() =>
    initialCategoryId === 'all' ? (categories?.[0]?.id || 'general') : (initialCategoryId || categories?.[0]?.id || 'general')
  );
  const [singleIsSecret, setSingleIsSecret] = useState(false);

  // Bulk creation state
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>(() =>
    initialCategoryId === 'all' ? (categories?.[0]?.id || 'general') : (initialCategoryId || categories?.[0]?.id || 'general')
  );
  const [bulkIsSecret, setBulkIsSecret] = useState(false);

  // Inline editing state
  const [editingFolderKey, setEditingFolderKey] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Selected folder for inspecting linked items
  const [inspectingFolder, setInspectingFolder] = useState<FolderItemInfo | null>(null);

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
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load configs based on scope
  const loadConfig = () => {
    setCategoriesConfig(HecosStorage.getScopeSubcategoriesConfig(scope));
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setSelectedFolderKeys(new Set());
      setInspectingFolder(null);
    }
  }, [isOpen, scope]);

  // Extract all entities belonging to this scope
  const relevantEntities = useMemo(() => {
    if (scope === 'feat') {
      return entities.filter((e) => e.category === 'feat' || e.featData);
    }
    if (scope === 'spell') {
      return entities.filter((e) => e.category === 'spell' || e.spellData || e.tags?.includes('spell') || e.tags?.includes('magia'));
    }
    if (scope === 'item') {
      return entities.filter((e) => e.category === 'item' || e.itemData || e.tags?.includes('item'));
    }
    if (scope === 'peril') {
      return entities.filter((e) => e.category === 'peril' || e.perilData || e.category === 'creature');
    }
    if (scope === 'class') {
      return entities.filter((e) => (e.category === 'class' || e.classData?.kind === 'class') && e.category !== 'archetype' && e.classData?.kind !== 'archetype');
    }
    if (scope === 'archetype') {
      return entities.filter((e) => e.category === 'archetype' || e.classData?.kind === 'archetype');
    }
    if (scope === 'ancestry') {
      return entities.filter((e) => e.category === 'ancestry' || e.ancestryData);
    }
    if (['fauna', 'flora', 'location', 'pc', 'npc', 'organization'].includes(scope)) {
      return entities.filter((e) => e.category === scope);
    }
    return entities;
  }, [entities, scope]);

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

  // Build unified list of folder items with counts and entities
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

        list.push({
          name: trimmed,
          categoryKey: catKey,
          categoryName: catName,
          itemCount: matchedEntities.length,
          entities: matchedEntities,
          isSecret,
          permission,
        });
      });
    });

    return list;
  }, [categoriesConfig, categories, relevantEntities, scope]);

  // Filtered folders list based on category, search, and visibility filter
  const filteredFoldersList = useMemo(() => {
    return allFoldersList.filter((folder) => {
      // 1. Category filter
      if (selectedCategoryId !== 'all' && folder.categoryKey !== selectedCategoryId) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = folder.name.toLowerCase().includes(q);
        const matchesCategory = folder.categoryName.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }

      // 3. Visibility / Status filter
      if (filterVisibility === 'public' && folder.isSecret) return false;
      if (filterVisibility === 'secret' && !folder.isSecret) return false;
      if (filterVisibility === 'empty' && folder.itemCount > 0) return false;
      if (filterVisibility === 'populated' && folder.itemCount === 0) return false;

      return true;
    });
  }, [allFoldersList, selectedCategoryId, searchQuery, filterVisibility]);

  // Category items counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFoldersList.length };
    categories.forEach((cat) => {
      counts[cat.id] = allFoldersList.filter((f) => f.categoryKey === cat.id).length;
    });
    return counts;
  }, [allFoldersList, categories]);

  // Handle single creation
  const handleCreateSingle = () => {
    const trimmed = singleFolderName.trim();
    if (!trimmed) return;
    const cat = singleCategoryTarget || categories?.[0]?.id || 'general';

    HecosStorage.addScopeSubcategory(scope, cat, trimmed);

    if (singleIsSecret) {
      HecosStorage.setFolderSecret(trimmed, true);
    }

    setSingleFolderName('');
    loadConfig();
    showToast(`Pasta "${trimmed}" criada com sucesso!`);
    setActiveTab('manage');
    onRefresh?.();
  };

  // Handle bulk creation
  const handleCreateBulk = () => {
    if (!bulkInputText.trim()) return;
    const lines = bulkInputText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;
    const cat = bulkCategoryTarget || categories?.[0]?.id || 'general';
    let createdCount = 0;

    lines.forEach((folderName) => {
      const success = HecosStorage.addScopeSubcategory(scope, cat, folderName);
      if (success) {
        createdCount++;
        if (bulkIsSecret) {
          HecosStorage.setFolderSecret(folderName, true);
        }
      }
    });

    setBulkInputText('');
    loadConfig();
    showToast(`${createdCount} pastas foram criadas com sucesso em "${categories.find((c) => c.id === cat)?.name || cat}"!`);
    setActiveTab('manage');
    onRefresh?.();
  };

  // Handle Rename
  const handleRename = (catKey: string, oldName: string) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingFolderKey(null);
      return;
    }

    HecosStorage.renameScopeSubcategory(scope, catKey, oldName, trimmed);

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
    if (inspectingFolder && confirmDeleteInfo.folderNames.some((f) => f.name === inspectingFolder.name)) {
      setInspectingFolder(null);
    }
    loadConfig();
    showToast(`${confirmDeleteInfo.folderNames.length} pasta(s) excluída(s) com sucesso!`);
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
    if (selectedFolderKeys.size === filteredFoldersList.length && filteredFoldersList.length > 0) {
      setSelectedFolderKeys(new Set());
    } else {
      const allKeys = new Set(filteredFoldersList.map((f) => `${f.categoryKey}:::${f.name}`));
      setSelectedFolderKeys(allKeys);
    }
  };

  // Scope title and descriptions
  const scopeDetails = useMemo(() => {
    switch (scope) {
      case 'spell':
        return {
          title: 'Gerenciador de Pastas do Grimório',
          subtitle: 'Organize e gerencie as pastas de magias, círculos, tradições e rituais de Hecos.',
          icon: Sparkles,
          entityLabel: 'feitiços',
          singularEntity: 'feitiço',
        };
      case 'feat':
        return {
          title: 'Gerenciador de Pastas de Talentos',
          subtitle: 'Estruture pastas de talentos por ancestralidade, classe, perícias, vocação e gerais.',
          icon: Award,
          entityLabel: 'talentos',
          singularEntity: 'talento',
        };
      case 'item':
        return {
          title: 'Gerenciador de Pastas de Itens',
          subtitle: 'Classifique armas, armaduras, consumíveis, relíquias e tesouros em pastas personalizadas.',
          icon: Gem,
          entityLabel: 'itens',
          singularEntity: 'item',
        };
      default:
        return {
          title: 'Gerenciador Geral de Pastas',
          subtitle: 'Crie, organize, renomeie e defina a privacidade de pastas do cenário.',
          icon: Folder,
          entityLabel: 'documentos',
          singularEntity: 'documento',
        };
    }
  }, [scope]);

  if (!isOpen) return null;

  const ScopeIcon = scopeDetails.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 90% Screen Modal Container */}
      <div className="w-[94vw] max-w-6xl h-[90vh] max-h-[920px] bg-[#0c0a15] border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-[#120e20] border-b border-zinc-800/80 flex items-center justify-between gap-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl border ${colorStyles.badge} flex items-center justify-center shrink-0`}>
              <ScopeIcon className={`w-5 h-5 ${colorStyles.iconText}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-zinc-100 tracking-tight truncate">
                  {scopeDetails.title}
                </h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md border font-bold ${colorStyles.badge}`}>
                  {allFoldersList.length} pastas
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                  {relevantEntities.length} {scopeDetails.entityLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5 hidden sm:block">
                {scopeDetails.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. MODE NAVIGATION TABS */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#0f0c1a] border-b border-zinc-800/80 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'manage'
                  ? colorStyles.activeTab
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Gerenciar Pastas ({allFoldersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('create_single')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'create_single'
                  ? colorStyles.activeTab
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Criar Uma Pasta</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('create_bulk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'create_bulk'
                  ? colorStyles.activeTab
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>+ Criar Múltiplas (Lote)</span>
            </button>
          </div>

          {/* Multi-selection quick actions (when in manage tab) */}
          {activeTab === 'manage' && selectedFolderKeys.size > 0 && (
            <div className="flex items-center gap-2 shrink-0 animate-fade-in">
              <span className="text-xs font-mono font-bold text-amber-300">
                {selectedFolderKeys.size} selecionada(s)
              </span>
              <button
                type="button"
                onClick={requestDeleteMultiple}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600/80 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
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
            <>
              {/* Left Sidebar: Categories Navigation */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800/80 bg-[#0a0814] p-3 sm:p-4 flex flex-col shrink-0 overflow-y-auto max-h-48 md:max-h-full">
                <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
                  Categorias Principais
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedCategoryId === 'all'
                        ? `${colorStyles.primarySoft} border font-bold shadow-sm`
                        : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-4 h-4 text-zinc-400" />
                      <span>Todas as Categorias</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {allFoldersList.length}
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const Icon = cat.icon || Folder;
                    const isSelected = selectedCategoryId === cat.id;
                    const count = categoryCounts[cat.id] || 0;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? `${colorStyles.primarySoft} border font-bold shadow-sm`
                            : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-4 h-4 ${isSelected ? colorStyles.iconText : 'text-zinc-500'}`} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick info card */}
                <div className="mt-auto pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1.5 hidden md:block">
                  <div className="flex items-center justify-between">
                    <span>Pastas Públicas:</span>
                    <span className="font-mono text-zinc-300">{allFoldersList.filter((f) => !f.isSecret).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pastas Secretas (GM):</span>
                    <span className="font-mono text-amber-400">{allFoldersList.filter((f) => f.isSecret).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pastas com Itens:</span>
                    <span className="font-mono text-emerald-400">{allFoldersList.filter((f) => f.itemCount > 0).length}</span>
                  </div>
                </div>
              </div>

              {/* Center / Right: Folder Explorer and List */}
              <div className="flex-1 flex flex-col bg-[#0c0a15] overflow-hidden">
                {/* Search & Filter Toolbar */}
                <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-[#100c1b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Buscar pastas por nome ou categoria... (${filteredFoldersList.length} encontradas)`}
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

                  {/* Status / Visibility Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={filterVisibility}
                      onChange={(e) => setFilterVisibility(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs outline-none cursor-pointer"
                    >
                      <option value="all">Todas as Pastas</option>
                      <option value="populated">Com Itens</option>
                      <option value="empty">Vazias (Sem Itens)</option>
                      <option value="public">Apenas Públicas</option>
                      <option value="secret">Apenas Secretas (GM)</option>
                    </select>

                    {/* Select all toggle */}
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Selecionar / Desmarcar todas as pastas visíveis"
                    >
                      {selectedFolderKeys.size === filteredFoldersList.length && filteredFoldersList.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span className="hidden sm:inline">Selecionar Todas</span>
                    </button>
                  </div>
                </div>

                {/* Main Folders Grid / List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                  {filteredFoldersList.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800/80 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-300">Nenhuma pasta encontrada</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                          {searchQuery
                            ? `Nenhuma pasta coincide com a busca "${searchQuery}".`
                            : 'Nenhuma pasta cadastrada nesta categoria. Crie uma nova pasta individualmente ou em lote.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('create_single')}
                          className={`px-3.5 py-1.5 rounded-xl ${colorStyles.primary} text-xs font-bold transition-all cursor-pointer`}
                        >
                          + Criar Nova Pasta
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('create_bulk')}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          + Criar em Lote
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                      {filteredFoldersList.map((folder) => {
                        const uniqueKey = `${folder.categoryKey}:::${folder.name}`;
                        const isSelected = selectedFolderKeys.has(uniqueKey);
                        const isEditing = editingFolderKey === uniqueKey;
                        const isInspecting = inspectingFolder?.name === folder.name && inspectingFolder?.categoryKey === folder.categoryKey;

                        return (
                          <div
                            key={uniqueKey}
                            className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                              isSelected
                                ? colorStyles.selectionHighlight
                                : isInspecting
                                ? 'bg-zinc-900/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
                                : 'bg-[#110d1f]/80 hover:bg-[#151025] border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              {/* Selection checkbox & Folder info */}
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectFolder(folder.categoryKey, folder.name)}
                                  className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-zinc-600" />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editingNameValue}
                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleRename(folder.categoryKey, folder.name);
                                          if (e.key === 'Escape') setEditingFolderKey(null);
                                        }}
                                        className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-cyan-500 text-zinc-100 outline-none"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRename(folder.categoryKey, folder.name)}
                                        className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black cursor-pointer"
                                        title="Salvar"
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingFolderKey(null)}
                                        className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer"
                                        title="Cancelar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Folder className={`w-4 h-4 ${folder.isSecret ? 'text-zinc-500' : colorStyles.iconText} shrink-0`} />
                                      <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                                        {folder.name}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                      {folder.categoryName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setInspectingFolder(isInspecting ? null : folder)}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1 cursor-pointer"
                                    >
                                      <FileText className="w-3 h-3 text-zinc-500" />
                                      <span>
                                        {folder.itemCount} {folder.itemCount === 1 ? scopeDetails.singularEntity : scopeDetails.entityLabel}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Right Action buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Granular Folder Visibility Menu */}
                                <VisibilityBadgeMenu
                                  visibility={folder.permission.visibility}
                                  allowedUserIds={folder.permission.allowedUserIds}
                                  isSecret={folder.isSecret}
                                  onChange={(newVis, newAllowed) => {
                                    HecosStorage.setFolderPermission(folder.name, newVis, newAllowed);
                                    loadConfig();
                                    onRefresh?.();
                                  }}
                                  size="sm"
                                  compact
                                />

                                {/* Edit name button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFolderKey(uniqueKey);
                                    setEditingNameValue(folder.name);
                                  }}
                                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                  title="Renomear Pasta"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => requestDeleteSingle(folder.categoryKey, folder.name)}
                                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-700/60 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  title="Excluir Pasta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Linked Items drawer inside the card if inspected */}
                            {isInspecting && (
                              <div className="mt-2 pt-2 border-t border-zinc-800/80 bg-zinc-950/60 rounded-xl p-2.5 space-y-2 animate-fade-in">
                                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                  <span>{scopeDetails.entityLabel} dentro de "{folder.name}":</span>
                                  <button
                                    type="button"
                                    onClick={() => setInspectingFolder(null)}
                                    className="text-zinc-500 hover:text-zinc-300"
                                  >
                                    Fechar
                                  </button>
                                </div>

                                {!folder.entities || folder.entities.length === 0 ? (
                                  <p className="text-[11px] text-zinc-500 italic py-1">
                                    Nenhum {scopeDetails.singularEntity} vinculado a esta pasta ainda.
                                  </p>
                                ) : (
                                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                    {(folder.entities || []).map((ent) => (
                                      <div
                                        key={ent.id}
                                        className="px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                                      >
                                        <span className="text-zinc-200 truncate">{ent.title}</span>
                                        {ent.subtitle && (
                                          <span className="text-[10px] text-zinc-500 italic truncate max-w-[120px]">
                                            {ent.subtitle}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CREATE SINGLE FOLDER */}
          {activeTab === 'create_single' && (
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-center items-center">
              <div className="w-full max-w-xl bg-[#110d1f] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                  <div className={`p-2.5 rounded-xl border ${colorStyles.badge}`}>
                    <FolderPlus className={`w-5 h-5 ${colorStyles.iconText}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-100">Criar Nova Pasta</h3>
                    <p className="text-xs text-zinc-400">Adicione uma pasta individual para organizar seu catálogo.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
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
                      placeholder="Ex: Guerreiro, 3º Círculo, Armas Marciais, Necromancia..."
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none ${colorStyles.focusRing}`}
                      autoFocus
                    />
                  </div>

                  {/* Target Category */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-300">Categoria de Destino *</label>
                    <select
                      value={singleCategoryTarget}
                      onChange={(e) => setSingleCategoryTarget(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.englishName ? `(${c.englishName})` : ''}
                        </option>
                      ))}
                    </select>
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
                    <label className="font-bold text-zinc-300">Categoria de Destino para todas as pastas *</label>
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
                      rows={7}
                      placeholder={`Exemplo de lista para colar:\nFighter\nMago\nLadino\nClérigo\nMonge\nPaladino`}
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
        <div className="p-3.5 sm:p-4 bg-[#110d1d] border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
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
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
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
                <h4 className="text-base font-black text-zinc-100">Confirmar Exclusão</h4>
                <p className="text-xs text-zinc-400">
                  {confirmDeleteInfo.folderNames && confirmDeleteInfo.folderNames.length === 1 && confirmDeleteInfo.folderNames[0]
                    ? `Excluir a pasta "${confirmDeleteInfo.folderNames[0].name}"?`
                    : `Excluir ${(confirmDeleteInfo.folderNames || []).length} pastas selecionadas?`}
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-300 space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <p>
                As pastas serão removidas da listagem. Os <strong>{confirmDeleteInfo.affectedItemsCount} {scopeDetails.entityLabel}</strong> que estavam nelas <strong>NÃO</strong> serão apagados do sistema, apenas desvinculados destas pastas.
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

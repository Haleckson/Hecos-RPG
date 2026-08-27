import React, { useState, useMemo, useEffect } from 'react';
import { HecosEntity, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { getCategoryMeta } from '../utils/categories';
import { EntityCard } from './EntityCard';
import { AncestryCard } from './AncestryCard';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { FolderManagerModal, FolderScope, FolderCategoryOption } from './FolderManagerModal';
import {
  Search,
  Plus,
  Settings,
  Folder,
  FolderTree,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  BookOpen,
  Filter,
  Shield,
  Swords,
  Layers,
  Sparkles,
  Skull,
  Award,
  Globe,
  Users,
  Compass,
  TreePine,
  Flower2,
  Building,
  User,
  Crown,
  Tag,
  AlertTriangle,
  ChevronRight,
  Eye,
  Trash2,
  Edit2
} from 'lucide-react';

interface CategoryEntityExplorerProps {
  categoryKey: string;
  activeSubcategory: string | null;
  onSelectEntity: (id: string) => void;
  onEditEntity: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  onCreateNewEntity: (category: string) => void;
  isActualGm: boolean;
  selectedTagFilter?: string | null;
  onClearTagFilter?: () => void;
}

export const CategoryEntityExplorer: React.FC<CategoryEntityExplorerProps> = ({
  categoryKey,
  activeSubcategory: initialSubcategory,
  onSelectEntity,
  onEditEntity,
  onDeleteEntity,
  onCreateNewEntity,
  isActualGm,
  selectedTagFilter,
  onClearTagFilter,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const [entities, setEntities] = useState<HecosEntity[]>(() => HecosStorage.getEntities());

  useEffect(() => {
    return HecosStorage.subscribeEntities((newEnts) => {
      setEntities(newEnts);
    });
  }, []);

  // Determine Scope & Theme
  const scope: FolderScope = useMemo(() => {
    if (categoryKey === 'peril') return 'peril';
    if (categoryKey === 'class') return 'class';
    if (categoryKey === 'archetype' || categoryKey === 'arquetipos' || categoryKey === 'vocacao') return 'archetype';
    if (categoryKey === 'ancestry') return 'ancestry';
    if (categoryKey === 'fauna') return 'fauna';
    if (categoryKey === 'flora') return 'flora';
    if (categoryKey === 'location') return 'location';
    if (categoryKey === 'pc') return 'pc';
    if (categoryKey === 'npc') return 'npc';
    if (categoryKey === 'organization') return 'organization';
    return 'general';
  }, [categoryKey]);

  const meta = getCategoryMeta(categoryKey);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  type SortOption = 'alpha_asc' | 'alpha_desc' | 'type' | 'newest' | 'oldest';
  const [sortBy, setSortBy] = useState<SortOption>('alpha_asc');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(() => {
    if (initialSubcategory && initialSubcategory.toLowerCase() !== meta.name.toLowerCase() && initialSubcategory.toLowerCase() !== categoryKey.toLowerCase()) {
      return initialSubcategory;
    }
    return null;
  });

  useEffect(() => {
    if (initialSubcategory && initialSubcategory.toLowerCase() !== meta.name.toLowerCase() && initialSubcategory.toLowerCase() !== categoryKey.toLowerCase()) {
      setSelectedFolder(initialSubcategory);
    } else {
      setSelectedFolder(null);
    }
  }, [initialSubcategory, categoryKey, meta.name]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderSearchFilter, setFolderSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'folders'>('grid');
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Subcategories config from storage
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getScopeSubcategoriesConfig(scope)
  );

  const refreshConfig = () => {
    setCategoriesConfig(HecosStorage.getScopeSubcategoriesConfig(scope));
  };

  useEffect(() => {
    refreshConfig();
  }, [scope]);

  // Tab definitions per category
  const tabsList = useMemo<{ id: string; name: string; description?: string }[]>(() => {
    if (categoryKey === 'peril') {
      return [
        { id: 'all', name: 'Todos os Perigos', description: 'Visão geral de todas as ameaças' },
        { id: 'monsters', name: 'Monstros & Feras', description: 'Criaturas e entidades combativas' },
        { id: 'hazards_simple', name: 'Perigos Simples', description: 'Armadilhas e perigos de reação única' },
        { id: 'hazards_complex', name: 'Perigos Complexos', description: 'Perigos que agem em iniciativas cíclicas' },
        { id: 'haunts', name: 'Assombrações', description: 'Ecos espirituais e maldições' },
        { id: 'environmental', name: 'Ambientais', description: 'Fenômenos climáticos e ermos' },
      ];
    }
    if (categoryKey === 'class') {
      return [
        { id: 'all', name: 'Todas as Classes', description: 'Todas as classes de Hecos' },
        { id: 'combat', name: 'Combatentes', description: 'Classes marciais e de combate' },
        { id: 'caster', name: 'Conjuradores', description: 'Classes mágicas e místicas' },
        { id: 'specialist', name: 'Especialistas', description: 'Ladinos, peritos e classes táticas' },
      ];
    }
    if (categoryKey === 'archetype' || categoryKey === 'arquetipos' || categoryKey === 'vocacao') {
      return [
        { id: 'all', name: 'Todas as Vocações', description: 'Todas as vocações e arquétipos' },
        { id: 'combat', name: 'Dedicações Marciais', description: 'Vocações de combate e armas' },
        { id: 'mystic', name: 'Vocações Místicas', description: 'Vocações arcanas, divinas e do vazio' },
        { id: 'specialist', name: 'Vocações de Ofício & Perícia', description: 'Vocações de ofício, perícia e prestígio' },
      ];
    }
    if (categoryKey === 'ancestry') {
      return [
        { id: 'all', name: 'Todas', description: 'Todas as ancestralidades e heranças' },
        { id: 'ancestries', name: 'Ancestralidades', description: 'Povos originais de Hecos' },
        { id: 'heritages', name: 'Heranças Versáteis', description: 'Linhagens adaptáveis' },
      ];
    }
    return [
      { id: 'all', name: 'Tudo', description: `Todos os registros de ${meta.name}` }
    ];
  }, [categoryKey, meta.name]);

  // Folder Category Options for Modal
  const modalCategoryOptions: FolderCategoryOption[] = useMemo(() => {
    return tabsList.map((t) => ({
      id: t.id,
      name: t.name,
      englishName: t.id,
    }));
  }, [tabsList]);

  // Accessible entities for current category
  const categoryEntities = useMemo(() => {
    return entities.filter((ent) => {
      if (!HecosStorage.canUserAccessItem(ent, currentUser)) return false;

      if (categoryKey === 'peril') {
        return ent.category === 'peril' || ent.category === 'creature' || Boolean(ent.perilData);
      }
      if (categoryKey === 'class') {
        return (ent.category === 'class' || ent.classData?.kind === 'class') && ent.category !== 'archetype' && ent.classData?.kind !== 'archetype';
      }
      if (categoryKey === 'archetype' || categoryKey === 'arquetipos' || categoryKey === 'vocacao') {
        return ent.category === 'archetype' || ent.classData?.kind === 'archetype';
      }
      if (categoryKey === 'ancestry') {
        return ent.category === 'ancestry' || Boolean(ent.ancestryData);
      }
      return ent.category === categoryKey;
    });
  }, [entities, categoryKey, currentUser]);

  // Helper to extract folders from an entity
  const getEntityFolders = (ent: HecosEntity): string[] => {
    if (ent.perilData?.subcategories) return ent.perilData.subcategories;
    if (ent.classData?.subcategories) return ent.classData.subcategories;
    if (ent.ancestryData?.subcategories) return ent.ancestryData.subcategories;
    return ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
  };

  // Extract all available subcategories/folders for this category
  const allFolderNames = useMemo(() => {
    const set = new Set<string>();
    Object.values(categoriesConfig).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((f) => {
          if (f && typeof f === 'string') set.add(f.trim());
        });
      }
    });

    categoryEntities.forEach((ent) => {
      getEntityFolders(ent).forEach((f) => set.add(f));
    });

    return Array.from(set).sort();
  }, [categoriesConfig, categoryEntities]);

  // Folder live item counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { __none__: 0 };
    categoryEntities.forEach((ent) => {
      const subs = getEntityFolders(ent);
      if (subs.length === 0) {
        counts.__none__ = (counts.__none__ || 0) + 1;
      } else {
        subs.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });
    return counts;
  }, [categoryEntities]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: categoryEntities.length };
    tabsList.forEach((tab) => {
      if (tab.id === 'all') return;
      counts[tab.id] = categoryEntities.filter((ent) => {
        if (categoryKey === 'peril') {
          const pType = ent.perilData?.perilType || ent.category;
          if (tab.id === 'monsters') return pType === 'creature' || pType === 'monster' || ent.category === 'creature';
          if (tab.id === 'hazards_simple') return pType === 'hazard_simple';
          if (tab.id === 'hazards_complex') return pType === 'hazard_complex';
          if (tab.id === 'haunts') return pType === 'haunt';
          if (tab.id === 'environmental') return pType === 'environmental';
        }
        if (categoryKey === 'class') {
          if (tab.id === 'combat') {
            return Boolean(ent.classData?.keyAttribute?.toLowerCase().includes('força') || ent.classData?.attacksProficiency?.toLowerCase().includes('marciais') || ent.tags?.some((t) => t.toLowerCase().includes('combat') || t.toLowerCase().includes('marcial')));
          }
          if (tab.id === 'caster') {
            return Boolean(ent.classData?.isSpellcaster || ent.tags?.some((t) => t.toLowerCase().includes('conjur') || t.toLowerCase().includes('magia')));
          }
          if (tab.id === 'specialist') {
            return Boolean(ent.classData?.keyAttribute?.toLowerCase().includes('destreza') || ent.classData?.keyAttribute?.toLowerCase().includes('inteligência') || ent.tags?.some((t) => t.toLowerCase().includes('especialista') || t.toLowerCase().includes('perícia')));
          }
        }
        if (categoryKey === 'archetype' || categoryKey === 'arquetipos' || categoryKey === 'vocacao') {
          if (tab.id === 'combat') {
            return Boolean(ent.tags?.some((t) => t.toLowerCase().includes('marcial') || t.toLowerCase().includes('combate') || t.toLowerCase().includes('arma')) || ent.subtitle?.toLowerCase().includes('marcial') || ent.summary?.toLowerCase().includes('combate'));
          }
          if (tab.id === 'mystic') {
            return Boolean(ent.tags?.some((t) => t.toLowerCase().includes('místic') || t.toLowerCase().includes('magia') || t.toLowerCase().includes('arcano') || t.toLowerCase().includes('divin')) || ent.subtitle?.toLowerCase().includes('místic') || ent.summary?.toLowerCase().includes('mágic'));
          }
          if (tab.id === 'specialist') {
            return Boolean(ent.tags?.some((t) => t.toLowerCase().includes('ofício') || t.toLowerCase().includes('perícia') || t.toLowerCase().includes('prestígio') || t.toLowerCase().includes('especial')) || ent.subtitle?.toLowerCase().includes('ofício') || ent.summary?.toLowerCase().includes('perícia'));
          }
        }
        if (categoryKey === 'ancestry') {
          if (tab.id === 'ancestries') return ent.category === 'ancestry' && !ent.ancestryData?.isVersatileHeritage;
          if (tab.id === 'heritages') return Boolean(ent.ancestryData?.isVersatileHeritage);
        }
        return false;
      }).length;
    });
    return counts;
  }, [categoryEntities, tabsList, categoryKey]);

  // Filtered entities based on tab, folder, search, tag, level, rarity
  const filteredEntities = useMemo(() => {
    return categoryEntities.filter((ent) => {
      // 1. Tab Match
      if (selectedTab !== 'all') {
        if (categoryKey === 'peril') {
          const pType = ent.perilData?.perilType || ent.category;
          if (selectedTab === 'monsters' && pType !== 'creature' && pType !== 'monster' && ent.category !== 'creature') return false;
          if (selectedTab === 'hazards_simple' && pType !== 'hazard_simple') return false;
          if (selectedTab === 'hazards_complex' && pType !== 'hazard_complex') return false;
          if (selectedTab === 'haunts' && pType !== 'haunt') return false;
          if (selectedTab === 'environmental' && pType !== 'environmental') return false;
        } else if (categoryKey === 'class') {
          if (selectedTab === 'combat' && !(ent.classData?.keyAttribute?.toLowerCase().includes('força') || ent.classData?.attacksProficiency?.toLowerCase().includes('marciais') || ent.tags?.some((t) => t.toLowerCase().includes('combat') || t.toLowerCase().includes('marcial')))) return false;
          if (selectedTab === 'caster' && !(ent.classData?.isSpellcaster || ent.tags?.some((t) => t.toLowerCase().includes('conjur') || t.toLowerCase().includes('magia')))) return false;
          if (selectedTab === 'specialist' && !(ent.classData?.keyAttribute?.toLowerCase().includes('destreza') || ent.classData?.keyAttribute?.toLowerCase().includes('inteligência') || ent.tags?.some((t) => t.toLowerCase().includes('especialista') || t.toLowerCase().includes('perícia')))) return false;
        } else if (categoryKey === 'archetype' || categoryKey === 'arquetipos' || categoryKey === 'vocacao') {
          if (selectedTab === 'combat' && !(ent.tags?.some((t) => t.toLowerCase().includes('marcial') || t.toLowerCase().includes('combate') || t.toLowerCase().includes('arma')) || ent.subtitle?.toLowerCase().includes('marcial') || ent.summary?.toLowerCase().includes('combate'))) return false;
          if (selectedTab === 'mystic' && !(ent.tags?.some((t) => t.toLowerCase().includes('místic') || t.toLowerCase().includes('magia') || t.toLowerCase().includes('arcano') || t.toLowerCase().includes('divin')) || ent.subtitle?.toLowerCase().includes('místic') || ent.summary?.toLowerCase().includes('mágic'))) return false;
          if (selectedTab === 'specialist' && !(ent.tags?.some((t) => t.toLowerCase().includes('ofício') || t.toLowerCase().includes('perícia') || t.toLowerCase().includes('prestígio') || t.toLowerCase().includes('especial')) || ent.subtitle?.toLowerCase().includes('ofício') || ent.summary?.toLowerCase().includes('perícia'))) return false;
        } else if (categoryKey === 'ancestry') {
          if (selectedTab === 'ancestries' && ent.ancestryData?.isVersatileHeritage) return false;
          if (selectedTab === 'heritages' && !ent.ancestryData?.isVersatileHeritage) return false;
        }
      }

      // 2. Folder match
      if (selectedFolder !== null) {
        const entFolders = getEntityFolders(ent);
        if (selectedFolder === '__none__') {
          if (entFolders.length > 0) return false;
        } else {
          if (!entFolders.includes(selectedFolder) && ent.subcategory !== selectedFolder && !ent.tags?.includes(selectedFolder)) {
            return false;
          }
        }
      }

      // 3. Tag Filter
      if (selectedTagFilter) {
        if (!ent.tags?.includes(selectedTagFilter)) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = ent.title.toLowerCase().includes(q);
        const inSub = ent.subtitle?.toLowerCase().includes(q);
        const inSummary = ent.summary?.toLowerCase().includes(q);
        const inTags = ent.tags?.some((t) => t.toLowerCase().includes(q));
        const inContent = ent.content?.toLowerCase().includes(q);
        if (!inTitle && !inSub && !inSummary && !inTags && !inContent) return false;
      }

      // 5. Level filter
      if (filterLevel !== 'all') {
        const lvl = ent.perilData?.level ?? ent.classData?.level ?? ent.statblock?.level ?? null;
        if (lvl === null || lvl !== parseInt(filterLevel, 10)) return false;
      }

      // 6. Rarity filter
      if (filterRarity !== 'all') {
        const rarity = ent.perilData?.rarity || ent.classData?.rarity || ent.ancestryData?.rarity || 'Comum';
        if (rarity.toLowerCase() !== filterRarity.toLowerCase()) return false;
      }

      return true;
    });
  }, [
    categoryEntities,
    selectedTab,
    selectedFolder,
    selectedTagFilter,
    searchQuery,
    filterLevel,
    filterRarity,
    categoryKey,
  ]);

  // Sorted entities according to selected sort order
  const sortedEntities = useMemo(() => {
    const list = [...filteredEntities];
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'alpha_asc':
          return (a.title || '').localeCompare(b.title || '', 'pt-BR');
        case 'alpha_desc':
          return (b.title || '').localeCompare(a.title || '', 'pt-BR');
        case 'type': {
          const isHeritageA = Boolean(a.ancestryData?.isVersatileHeritage);
          const isHeritageB = Boolean(b.ancestryData?.isVersatileHeritage);
          if (isHeritageA !== isHeritageB) {
            return isHeritageA ? 1 : -1;
          }
          return (a.title || '').localeCompare(b.title || '', 'pt-BR');
        }
        case 'newest': {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        case 'oldest': {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return dateA - dateB;
        }
        default:
          return 0;
      }
    });
  }, [filteredEntities, sortBy]);

  // Color & Theme setup
  const themeClasses = useMemo(() => {
    if (scope === 'peril' || scope === 'organization') {
      return {
        accent: 'rose',
        textAccent: 'text-rose-400',
        bgAccent: 'bg-rose-500',
        badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-800',
        btnBg: 'bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-zinc-950',
        borderAccent: 'border-rose-700/60',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
        activeTab: 'bg-rose-500 text-black font-bold shadow-md shadow-rose-500/20',
      };
    }
    if (scope === 'class' || scope === 'npc') {
      return {
        accent: 'purple',
        textAccent: 'text-purple-400',
        bgAccent: 'bg-purple-500',
        badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800',
        btnBg: 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-zinc-950',
        borderAccent: 'border-purple-700/60',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
        activeTab: 'bg-purple-500 text-black font-bold shadow-md shadow-purple-500/20',
      };
    }
    if (scope === 'fauna' || scope === 'flora') {
      return {
        accent: 'emerald',
        textAccent: 'text-emerald-400',
        bgAccent: 'bg-emerald-500',
        badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950',
        borderAccent: 'border-emerald-700/60',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        activeTab: 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20',
      };
    }
    // Default cyan
    return {
      accent: 'cyan',
      textAccent: 'text-cyan-400',
      bgAccent: 'bg-cyan-500',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
      btnBg: 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950',
      borderAccent: 'border-cyan-700/60',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      activeTab: 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20',
    };
  }, [scope]);

  // Grouped by folders for folder/tree view
  const groupedByFolder = useMemo(() => {
    const map: Record<string, HecosEntity[]> = {};
    const noFolderList: HecosEntity[] = [];

    allFolderNames.forEach((f) => {
      map[f] = [];
    });

    filteredEntities.forEach((ent) => {
      const subs = getEntityFolders(ent);
      if (subs.length === 0) {
        noFolderList.push(ent);
      } else {
        subs.forEach((s) => {
          if (!map[s]) map[s] = [];
          map[s].push(ent);
        });
      }
    });

    return { map, noFolderList };
  }, [allFolderNames, filteredEntities]);

  const toggleFolderExpand = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? true : !prev[folderName],
    }));
  };

  const getCategoryIcon = () => {
    switch (categoryKey) {
      case 'peril':
        return <Skull className="w-5 h-5 text-rose-400" />;
      case 'class':
        return <Swords className="w-5 h-5 text-purple-400" />;
      case 'archetype':
      case 'arquetipos':
      case 'vocacao':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'ancestry':
        return <Users className="w-5 h-5 text-cyan-400" />;
      case 'fauna':
        return <TreePine className="w-5 h-5 text-emerald-400" />;
      case 'flora':
        return <Flower2 className="w-5 h-5 text-emerald-400" />;
      case 'location':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'pc':
        return <User className="w-5 h-5 text-cyan-400" />;
      case 'npc':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'organization':
        return <Crown className="w-5 h-5 text-rose-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. STANDARDIZED HEADER BANNER */}
      <div className="bg-[#090710] p-6 rounded-2xl border border-zinc-800/80 shadow-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 ${themeClasses.bgAccent}`} />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl bg-black/60 border ${themeClasses.borderAccent} ${themeClasses.glow}`}>
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
                  <span>{meta.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${themeClasses.badgeBg}`}>
                    {filteredEntities.length} {filteredEntities.length === 1 ? 'registro' : 'registros'}
                  </span>
                </h1>

                {/* GM Visibility Menu for folder / category */}
                {isActualGm && (
                  <VisibilityBadgeMenu
                    visibility={HecosStorage.getFolderPermission(categoryKey).visibility}
                    allowedUserIds={HecosStorage.getFolderPermission(categoryKey).allowedUserIds}
                    onChange={(newVis, newAllowed) => {
                      HecosStorage.setFolderPermission(categoryKey, newVis, newAllowed);
                    }}
                  />
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                {meta.description || 'Gerencie todas as entradas e vínculos cadastrados neste menu de Hecos.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
            {isActualGm && (
              <>
                {categoryKey !== 'ancestry' && (
                  <button
                    type="button"
                    onClick={() => setIsFolderManagerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    title="Gerenciar estrutura de pastas e subcategorias"
                  >
                    <Settings className={`w-3.5 h-3.5 ${themeClasses.textAccent}`} />
                    <span>Gerenciar Pastas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onCreateNewEntity(selectedFolder && selectedFolder !== '__none__' ? selectedFolder : categoryKey)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${themeClasses.btnBg}`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Novo em {meta.name}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. SUB-CATEGORY TABS (If multiple tabs exist) */}
        {tabsList.length > 1 && (
          <div className="overflow-x-auto no-scrollbar py-0.5 mt-5 pt-3.5 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 min-w-max p-1 rounded-xl bg-[#0d0a17] border border-zinc-800/80">
              {tabsList.map((tab) => {
                const isSelected = selectedTab === tab.id;
                const count = tabCounts[tab.id] || 0;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedTab(tab.id);
                      setSelectedFolder(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? themeClasses.activeTab
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    <span>{tab.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-black text-white font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. STANDARDIZED FILTER & VIEW TOOLBAR */}
      <div className="bg-[#090710] p-4 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left Side: Search & Folder Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar em ${meta.name} por nome, resumo, tags...`}
                className="w-full bg-black/50 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
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

            {/* Folder Dropdown Selector OR Sort Selector for Ancestry */}
            {categoryKey === 'ancestry' ? (
              <div className="relative min-w-[200px] sm:w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-zinc-200 font-semibold outline-none transition-all cursor-pointer"
                >
                  <option value="alpha_asc">Alfabética (A-Z)</option>
                  <option value="alpha_desc">Alfabética (Z-A)</option>
                  <option value="type">Por Tipo (Ancestralidade / Herança)</option>
                  <option value="newest">Mais Recente para Mais Antigo</option>
                  <option value="oldest">Mais Antigo para Mais Recente</option>
                </select>
              </div>
            ) : (
            <div className="relative min-w-[200px] sm:w-60">
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedFolder !== null
                    ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-sm'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${selectedFolder ? 'text-purple-400' : 'text-zinc-400'}`} />
                  <span className="truncate">
                    {selectedFolder === null
                      ? 'Todas as Pastas'
                      : selectedFolder === '__none__'
                      ? 'Sem Pasta (Raiz)'
                      : selectedFolder}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                    {selectedFolder === null
                      ? filteredEntities.length
                      : selectedFolder === '__none__'
                      ? folderCounts.__none__ || 0
                      : folderCounts[selectedFolder] || 0}
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
                    {/* Internal search in folder selector */}
                    <div className="p-2 border-b border-zinc-800 bg-black/40">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={folderSearchFilter}
                          onChange={(e) => setFolderSearchFilter(e.target.value)}
                          placeholder="Filtrar pastas..."
                          className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg pl-8 pr-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 outline-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-60 no-scrollbar">
                      {/* Option: All folders */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFolder(null);
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          selectedFolder === null
                            ? 'bg-cyan-500 text-zinc-950 font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Todas as Pastas</span>
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${selectedFolder === null ? 'bg-black/30 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                          {categoryEntities.length}
                        </span>
                      </button>

                      {/* Option: Uncategorized / Root */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFolder('__none__');
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          selectedFolder === '__none__'
                            ? 'bg-cyan-500 text-zinc-950 font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Sem Pasta (Raiz)</span>
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${selectedFolder === '__none__' ? 'bg-black/30 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                          {folderCounts.__none__ || 0}
                        </span>
                      </button>

                      {allFolderNames
                        .filter((f) => f.toLowerCase().includes(folderSearchFilter.toLowerCase()))
                        .map((folderName) => {
                          const isSelected = selectedFolder === folderName;
                          const count = folderCounts[folderName] || 0;
                          const isSecret = HecosStorage.isFolderSecret(folderName);

                          return (
                            <button
                              key={folderName}
                              type="button"
                              onClick={() => {
                                setSelectedFolder(folderName);
                                setIsFolderDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600 text-white font-bold'
                                  : 'text-zinc-300 hover:bg-zinc-800/80'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                                <span className="truncate">{folderName}</span>
                                {isSecret && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                                    GM
                                  </span>
                                )}
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    {isActualGm && (
                      <div className="p-1.5 border-t border-zinc-800 bg-[#090710]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFolderDropdownOpen(false);
                            setIsFolderManagerOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 rounded-lg transition-colors cursor-pointer font-semibold"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Gerenciar Pastas...</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            )}

            {/* Tag Filter Badge (if selected) */}
            {selectedTagFilter && (
              <button
                type="button"
                onClick={onClearTagFilter}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1.5 hover:bg-rose-900 cursor-pointer"
                title="Remover filtro de tag"
              >
                <span>#{selectedTagFilter}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Side: Level / Rarity Filters & View Switcher */}
          <div className="flex items-center gap-2 justify-between lg:justify-end">
            {/* Level Filter (if peril/class) */}
            {(categoryKey === 'peril' || categoryKey === 'class') && (
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-black/50 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">Todos Níveis</option>
                {Array.from({ length: 21 }, (_, i) => i).map((lvl) => (
                  <option key={lvl} value={lvl.toString()}>
                    Nível {lvl}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Switcher: Grid vs List vs Folders */}
            <div className="flex items-center bg-black/60 border border-zinc-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Visualização em Tabela Compacta"
              >
                <List className="w-4 h-4" />
              </button>
              {categoryKey !== 'ancestry' && (
                <button
                  type="button"
                  onClick={() => setViewMode('folders')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'folders'
                      ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Visualização em Árvore de Pastas"
                >
                  <FolderTree className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONTENT DISPLAY BASED ON VIEW MODE */}
      {filteredEntities.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#090710] border border-zinc-800/80 space-y-3 shadow-xl">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">
            Nenhum registro encontrado em {meta.name} com os filtros atuais.
          </p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Tente remover os termos de busca ou selecione outra pasta.
          </p>
          {isActualGm && (
            <button
              type="button"
              onClick={() => onCreateNewEntity(selectedFolder && selectedFolder !== '__none__' ? selectedFolder : categoryKey)}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all ${themeClasses.btnBg}`}
            >
              Criar Primeira Entrada em {meta.name}
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* COMPACT TABLE VIEW */
        <div className="bg-[#090710] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f1c] border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome / Título</th>
                  <th className="py-3 px-3">Pastas / Subcategorias</th>
                  <th className="py-3 px-3">Tags</th>
                  <th className="py-3 px-3">Atualizado</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sortedEntities.map((item) => {
                  const itemFolders = getEntityFolders(item);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEntity(item.id)}
                      className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.subtitle && (
                            <span className="text-zinc-500 font-normal text-[11px] truncate max-w-xs">
                              ({item.subtitle})
                            </span>
                          )}
                          {item.isSecret && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                              GM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {itemFolders.length > 0 ? (
                            itemFolders.map((f, fIdx) => (
                              <span
                                key={`${item.id}-fld-${f}-${fIdx}`}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-950/70 text-purple-300 border border-purple-800/60"
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-600 italic">Sem pasta</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {(item.tags || []).slice(0, 3).map((t, tIdx) => (
                            <span
                              key={`${item.id}-tag-${t}-${tIdx}`}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 border border-zinc-800"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isActualGm ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <VisibilityBadgeMenu
                              visibility={item.visibility}
                              allowedUserIds={item.allowedUserIds}
                              isSecret={item.isSecret}
                              onChange={(newVis, newAllowed) => {
                                HecosStorage.setEntityVisibility(item.id, newVis, newAllowed);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => onEditEntity(item.id)}
                              className="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEntity(item.id)}
                              className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Excluir"
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
      ) : viewMode === 'folders' ? (
        /* FOLDERS / TREE VIEW */
        <div className="space-y-4">
          {/* Folders Sections */}
          {allFolderNames.map((folderName) => {
            const list = groupedByFolder.map[folderName] || [];
            if (list.length === 0 && selectedFolder !== folderName) return null;
            const isExpanded = expandedFolders[folderName] !== false; // default expanded
            const isSecret = HecosStorage.isFolderSecret(folderName);

            return (
              <div
                key={folderName}
                className="bg-[#090710] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg"
              >
                <div
                  onClick={() => toggleFolderExpand(folderName)}
                  className="p-4 flex items-center justify-between gap-3 bg-[#0d0a17] hover:bg-zinc-900/60 transition-colors cursor-pointer border-b border-zinc-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    <Folder className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-zinc-200">{folderName}</h3>
                    {isSecret && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                        GM
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/60">
                    {list.length} {list.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-4">
                    {list.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-2">Nenhum item nesta pasta.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {list.map((item) => (
                          <EntityCard
                            key={item.id}
                            entity={item}
                            onSelect={onSelectEntity}
                            onEdit={onEditEntity}
                            onDelete={onDeleteEntity}
                            isGmMode={isActualGm}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Root / Uncategorized Section */}
          {groupedByFolder.noFolderList.length > 0 && (
            <div className="bg-[#090710] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg">
              <div
                onClick={() => toggleFolderExpand('__none__')}
                className="p-4 flex items-center justify-between gap-3 bg-[#0d0a17] hover:bg-zinc-900/60 transition-colors cursor-pointer border-b border-zinc-800/60"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${expandedFolders.__none__ !== false ? 'rotate-90' : ''}`} />
                  <Folder className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-bold text-zinc-300">Sem Pasta (Raiz)</h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {groupedByFolder.noFolderList.length} itens
                </span>
              </div>

              {expandedFolders.__none__ !== false && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupedByFolder.noFolderList.map((item) => (
                      <EntityCard
                        key={item.id}
                        entity={item}
                        onSelect={onSelectEntity}
                        onEdit={onEditEntity}
                        onDelete={onDeleteEntity}
                        isGmMode={isActualGm}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1800px]:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-3.5 items-stretch">
          {sortedEntities.map((item) => {
            if (item.category === 'ancestry') {
              return (
                <AncestryCard
                  key={item.id}
                  entity={item}
                  onSelect={onSelectEntity}
                  onEdit={onEditEntity}
                  onDelete={onDeleteEntity}
                  isGmMode={isActualGm}
                />
              );
            }
            return (
              <EntityCard
                key={item.id}
                entity={item}
                onSelect={onSelectEntity}
                onEdit={onEditEntity}
                onDelete={onDeleteEntity}
                isGmMode={isActualGm}
              />
            );
          })}
        </div>
      )}

      {/* 5. UNIVERSAL FOLDER MANAGER MODAL */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          onClose={() => setIsFolderManagerOpen(false)}
          scope={scope}
          categories={modalCategoryOptions}
          entities={entities}
          themeColor={themeClasses.accent as any}
          onRefresh={() => {
            refreshConfig();
            setEntities(HecosStorage.getEntities());
          }}
        />
      )}
    </div>
  );
};

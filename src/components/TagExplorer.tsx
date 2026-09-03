import React, { useState, useMemo } from 'react';
import { HecosStorage } from '../services/storage';
import { TagInfo, HecosEntity } from '../types';
import {
  Tag as TagIcon,
  ArrowRight,
  Shield,
  Award,
  Sparkles,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Settings,
  Folder,
  FolderTree,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Layers,
  Wand2
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { TraitModal } from './TraitModal';
import { TagModal } from './TagModal';
import { Tooltip } from './Tooltip';
import { FolderManagerModal } from './FolderManagerModal';
import {
  getTraitInfo,
  CANONICAL_TRADITIONS,
  CANONICAL_RARITIES,
  CANONICAL_SIZES,
  canonicalizeTraitName,
  getTraitCanonicalKey,
  extractEntityAllTraits,
  getTraitHierarchyTier
} from '../utils/traitUtils';

// Helper Tooltip Content for Traits in TagExplorer
function TraitTooltipContent({
  traitName,
  info,
  count,
}: {
  traitName: string;
  info: ReturnType<typeof getTraitInfo>;
  count: number;
}) {
  return (
    <div className="p-3 max-w-xs sm:max-w-sm space-y-2 text-left bg-[#0f0b1a] border border-amber-500/50 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
        <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-1">
          {info.isTradition ? <Wand2 className="w-3 h-3 text-cyan-300" /> : <Layers className="w-3 h-3 text-amber-400" />}
          <span>{info.category}</span>
        </span>
        <span className="text-xs font-bold text-amber-300 font-serif uppercase tracking-wide">
          {traitName}
        </span>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
        {info.description || 'Traço temático ou de regras de Hecos.'}
      </p>
      <div className="pt-1.5 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
        <span className="text-zinc-400">
          {count} artigo{count !== 1 ? 's' : ''} associado{count !== 1 ? 's' : ''}
        </span>
        <span className="text-amber-400 font-semibold">Clique para abrir painel</span>
      </div>
    </div>
  );
}

// Helper Tooltip Content for Tags in TagExplorer
function TagTooltipContent({
  tagName,
  count,
}: {
  tagName: string;
  count: number;
}) {
  const clean = tagName.replace(/^#/, '').trim();
  const customTags = HecosStorage.getCustomTags();
  const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tagData = customTags[norm] || customTags[clean.toLowerCase()];

  return (
    <div className="p-3 max-w-xs sm:max-w-sm space-y-2 text-left bg-[#0c121e] border border-cyan-500/50 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
        <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-1">
          <TagIcon className="w-3 h-3 text-cyan-300" />
          <span>{tagData?.category || 'Tag de Campanha'}</span>
        </span>
        <span className="text-xs font-bold text-cyan-200 font-mono">
          #{clean}
        </span>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
        {tagData?.description || 'Tag de agrupamento temático e narrativo para os artigos de Hecos.'}
      </p>
      <div className="pt-1.5 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
        <span className="text-zinc-400">
          {count} artigo{count !== 1 ? 's' : ''} associado{count !== 1 ? 's' : ''}
        </span>
        <span className="text-cyan-400 font-semibold">Clique para abrir painel</span>
      </div>
    </div>
  );
}

interface TagExplorerProps {
  onNavigateEntity: (id: string) => void;
  initialSelectedTag?: string;
  isGmMode?: boolean;
}

export const TagExplorer: React.FC<TagExplorerProps> = ({
  onNavigateEntity,
  initialSelectedTag,
  isGmMode,
}) => {
  const [activeTab, setActiveTab] = useState<'tags' | 'traits'>(() => {
    if (initialSelectedTag) return 'tags';
    try {
      const saved = localStorage.getItem('hecos_tag_explorer_active_tab');
      return saved === 'tags' ? 'tags' : 'traits';
    } catch {
      return 'traits';
    }
  });

  const [selectedTag, setSelectedTag] = useState<string | null>(initialSelectedTag || null);
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);

  // Filtering & Sorting State with persistence
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'hierarchy' | 'count-desc' | 'count-asc' | 'alpha-asc' | 'alpha-desc'>(() => {
    try {
      const saved = localStorage.getItem('hecos_tag_explorer_sort_by');
      if (saved === 'hierarchy' || saved === 'count-desc' || saved === 'count-asc' || saved === 'alpha-asc' || saved === 'alpha-desc') {
        return saved;
      }
    } catch {}
    return 'count-desc';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('hecos_tag_explorer_view_mode');
      return saved === 'list' ? 'list' : 'grid';
    } catch {}
    return 'grid';
  });

  // Persist sorting and view mode changes
  const handleSortChange = (newSort: 'hierarchy' | 'count-desc' | 'count-asc' | 'alpha-asc' | 'alpha-desc') => {
    setSortBy(newSort);
    try {
      localStorage.setItem('hecos_tag_explorer_sort_by', newSort);
    } catch {}
  };

  const handleTabChange = (newTab: 'tags' | 'traits') => {
    setActiveTab(newTab);
    if (newTab === 'tags') setSelectedTrait(null);
    else setSelectedTag(null);
    try {
      localStorage.setItem('hecos_tag_explorer_active_tab', newTab);
    } catch {}
  };

  const handleViewModeChange = (newMode: 'grid' | 'list') => {
    setViewMode(newMode);
    try {
      localStorage.setItem('hecos_tag_explorer_view_mode', newMode);
    } catch {}
  };

  // Modals state
  const [traitModalOpen, setTraitModalOpen] = useState(false);
  const [editingTraitName, setEditingTraitName] = useState<string | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time trait and tag updates
  React.useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    const unsubTraits = HecosStorage.subscribeTraits(() => setRefreshKey((k) => k + 1));
    const unsubTags = HecosStorage.subscribeTags(() => setRefreshKey((k) => k + 1));
    window.addEventListener('hecos:traits-updated', handleUpdate);
    window.addEventListener('hecos:tags-updated', handleUpdate);
    return () => {
      unsubTraits();
      unsubTags();
      window.removeEventListener('hecos:traits-updated', handleUpdate);
      window.removeEventListener('hecos:tags-updated', handleUpdate);
    };
  }, []);

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = Boolean(isGmMode || currentUser?.role === 'gm');

  const allEntities = HecosStorage.getEntities();
  // Filter entities according to user permissions
  const accessibleEntities = allEntities.filter((e) =>
    HecosStorage.canUserAccessItem(e, currentUser)
  );

  // Compute dynamic tags with case-insensitive unification
  const tags: TagInfo[] = useMemo(() => {
    const map = new Map<string, { displayName: string; count: number }>();

    accessibleEntities.forEach((ent) => {
      (ent.tags || []).forEach((t) => {
        const clean = typeof t === 'string' ? t.trim() : '';
        if (clean) {
          const lower = clean.toLowerCase();
          const existing = map.get(lower);
          if (existing) {
            existing.count += 1;
            if (clean?.[0] && clean[0] === clean[0].toUpperCase() && existing?.displayName?.[0] && existing.displayName[0] === existing.displayName[0].toLowerCase()) {
              existing.displayName = clean;
            }
          } else {
            map.set(lower, { displayName: clean, count: 1 });
          }
        }
      });
    });

    let list = Array.from(map.values()).map((v) => ({ name: v.displayName, count: v.count }));

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    // Sort list
    list.sort((a, b) => {
      switch (sortBy) {
        case 'count-asc':
          return a.count - b.count || a.name.localeCompare(b.name, 'pt-BR');
        case 'alpha-asc':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'alpha-desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        case 'count-desc':
        default:
          return b.count - a.count || a.name.localeCompare(b.name, 'pt-BR');
      }
    });

    return list;
  }, [accessibleEntities, searchTerm, sortBy]);

  // Compute dynamic traits with traditions, rarities, sizes integration & case-insensitive deduplication
  const traits: TagInfo[] = useMemo(() => {
    const map = new Map<string, { displayName: string; count: number }>();

    // 1. Preload Canonical Rarities, Traditions, and Sizes so they are ALWAYS available in Traits page
    CANONICAL_RARITIES.forEach((rarity) => {
      const canonical = canonicalizeTraitName(rarity);
      const key = getTraitCanonicalKey(canonical);
      map.set(key, { displayName: canonical, count: 0 });
    });

    CANONICAL_TRADITIONS.forEach((trad) => {
      const canonical = canonicalizeTraitName(trad);
      const key = getTraitCanonicalKey(canonical);
      map.set(key, { displayName: canonical, count: 0 });
    });

    CANONICAL_SIZES.forEach((size) => {
      const canonical = canonicalizeTraitName(size);
      const key = getTraitCanonicalKey(canonical);
      map.set(key, { displayName: canonical, count: 0 });
    });

    // 2. Add all registered custom traits from HecosStorage
    const custom = HecosStorage.getCustomTraits();
    Object.keys(custom).forEach((k) => {
      const clean = k.trim();
      if (clean) {
        const canonical = canonicalizeTraitName(clean);
        const key = getTraitCanonicalKey(canonical);
        if (!map.has(key)) {
          map.set(key, { displayName: canonical, count: 0 });
        }
      }
    });

    // 3. Count occurrences from all entities (including spell traditions, rarities, sizes)
    accessibleEntities.forEach((ent) => {
      const entTraits = extractEntityAllTraits(ent);
      entTraits.forEach((tr) => {
        const clean = typeof tr === 'string' ? tr.trim() : '';
        if (clean) {
          const canonical = canonicalizeTraitName(clean);
          const key = getTraitCanonicalKey(canonical);
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(key, { displayName: canonical, count: 1 });
          }
        }
      });
    });

    let list = Array.from(map.values()).map((v) => ({ name: v.displayName, count: v.count }));

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((t) => {
        const info = getTraitInfo(t.name);
        return (
          t.name.toLowerCase().includes(q) ||
          info.category.toLowerCase().includes(q) ||
          info.description.toLowerCase().includes(q)
        );
      });
    }

    // Sort list
    list.sort((a, b) => {
      switch (sortBy) {
        case 'hierarchy': {
          const tierA = getTraitHierarchyTier(a.name);
          const tierB = getTraitHierarchyTier(b.name);
          if (tierA !== tierB) return tierA - tierB;
          return a.name.localeCompare(b.name, 'pt-BR');
        }
        case 'count-asc':
          return a.count - b.count || a.name.localeCompare(b.name, 'pt-BR');
        case 'alpha-asc':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'alpha-desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        case 'count-desc':
        default:
          return b.count - a.count || a.name.localeCompare(b.name, 'pt-BR');
      }
    });

    return list;
  }, [accessibleEntities, searchTerm, sortBy]);

  const matchingEntities =
    activeTab === 'tags'
      ? selectedTag
        ? accessibleEntities.filter((e) =>
            (e.tags || []).some(
              (t) => typeof t === 'string' && t.toLowerCase() === selectedTag.toLowerCase()
            )
          )
        : []
      : selectedTrait
      ? accessibleEntities.filter((e) => {
          const list = extractEntityAllTraits(e);
          return list.some((tr) => tr.toLowerCase() === selectedTrait.toLowerCase());
        })
      : [];

  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const tagCategoriesConfig = HecosStorage.getScopeSubcategoriesConfig('tag');
  const tagFolderOptions = useMemo(() => {
    return [
      { id: 'all', name: 'Todas as Pastas' },
      { id: 'tags', name: 'Tags de Campanha & Lore' },
      { id: 'traits', name: 'Traços Oficiais PF2e' },
      { id: 'traditions', name: 'Tradições de Hecos' },
      { id: 'homebrew', name: 'Traços Homebrew' },
    ];
  }, []);

  const tagFolderPerm = HecosStorage.getFolderPermission('tags');

  return (
    <div key={refreshKey} className="bg-[#09080d] text-zinc-100 rounded-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* 1. STANDARDIZED HEADER BANNER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-black/60 border border-cyan-700/60 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <TagIcon className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
                <span>Tags & Traços (Traits)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  {activeTab === 'tags' ? `${tags.length} tags` : `${traits.length} traços`}
                </span>
              </h1>
              {isActualGm && (
                <VisibilityBadgeMenu
                  visibility={tagFolderPerm.visibility}
                  allowedUserIds={tagFolderPerm.allowedUserIds}
                  onChange={(newVis, newAllowed) => {
                    HecosStorage.setFolderPermission('tags', newVis, newAllowed);
                  }}
                />
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Navegue por tópicos de narrativa (Tags), Tradições Mágicas de Hecos e palavras-chave de regras oficiais PF2e (Traços).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end flex-wrap">
          {isActualGm && (
            <button
              type="button"
              onClick={() => setIsFolderManagerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Gerenciar estrutura de pastas e grupos"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gerenciar Pastas</span>
            </button>
          )}

          {activeTab === 'traits' && isActualGm && (
            <button
              type="button"
              onClick={() => {
                setEditingTraitName(null);
                setTraitModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-extrabold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Traço</span>
            </button>
          )}

          {activeTab === 'tags' && isActualGm && (
            <button
              type="button"
              onClick={() => {
                setEditingTagName(null);
                setTagModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-extrabold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nova Tag</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-CATEGORY TABS (Traits vs Tags) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#120e1e] border border-zinc-800 w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('traits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'traits'
              ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Traços & Tradições ({traits.length})</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('tags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tags'
              ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TagIcon className="w-3.5 h-3.5" />
          <span>Tags de Campanha ({tags.length})</span>
        </button>
      </div>

      {/* 3. STANDARDIZED FILTER & VIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0f0c1b] border border-zinc-800/80 shadow-md">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Filtrar ${activeTab === 'tags' ? 'tags' : 'traços e tradições'} por nome ou categoria...`}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/70 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-cyan-400 cursor-pointer font-medium"
            >
              {activeTab === 'traits' && (
                <option value="hierarchy">Hierarquia Canônica ([Raridade] &gt; [Tradição] &gt; [Tamanho] &gt; [A-Z])</option>
              )}
              <option value="count-desc">Mais usados primeiro</option>
              <option value="count-asc">Menos usados primeiro</option>
              <option value="alpha-asc">Ordem Alfabética (A-Z)</option>
              <option value="alpha-desc">Ordem Alfabética (Z-A)</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/60 border border-zinc-800 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Visualização em Grade / Badges"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Visualização em Lista Detalhada"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cloud & List Content */}
      {activeTab === 'tags' ? (
        tags.length === 0 ? (
          <div className="p-8 text-center bg-[#110e19] rounded-xl border border-zinc-800 text-zinc-400 text-xs">
            {searchTerm ? `Nenhuma tag encontrada para "${searchTerm}".` : 'Nenhuma tag encontrada nos artigos autorizados para o seu perfil.'}
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tags.map((tag) => {
              const isSelected = selectedTag?.toLowerCase() === tag.name.toLowerCase();
              return (
                <div
                  key={tag.name}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-[#120f1b] hover:bg-[#181324] border-zinc-800/80 hover:border-cyan-500/50'
                  }`}
                >
                  <Tooltip
                    content={<TagTooltipContent tagName={tag.name} count={tag.count} />}
                    side="top"
                    className="flex-1 min-w-0"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const next = isSelected ? null : tag.name;
                        setSelectedTag(next);
                        window.dispatchEvent(
                          new CustomEvent('hecos:open-tag-drawer', {
                            detail: { tag: tag.name },
                          })
                        );
                      }}
                      className="flex items-center gap-2 min-w-0 w-full text-left cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 group-hover:text-cyan-200">
                        <TagIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300 truncate">
                          #{tag.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {tag.count} artigo{tag.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                  </Tooltip>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTag(tag.name);
                        window.dispatchEvent(
                          new CustomEvent('hecos:open-tag-drawer', {
                            detail: { tag: tag.name },
                          })
                        );
                      }}
                      className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Abrir Gaveta Lateral"
                    >
                      Painel
                    </button>

                    {isActualGm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTagName(tag.name);
                          setTagModalOpen(true);
                          window.dispatchEvent(
                            new CustomEvent('hecos:open-tag-drawer', {
                              detail: { tag: tag.name },
                            })
                          );
                        }}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="Gerenciar Tag"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTag?.toLowerCase() === tag.name.toLowerCase();
              return (
                <div
                  key={tag.name}
                  className={`inline-flex items-center rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                      : 'bg-[#120f1b] hover:bg-purple-950/60 text-zinc-300 hover:text-purple-300 border-zinc-800'
                  }`}
                >
                  <Tooltip
                    content={<TagTooltipContent tagName={tag.name} count={tag.count} />}
                    side="top"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const next = isSelected ? null : tag.name;
                        setSelectedTag(next);
                        if (next) {
                          window.dispatchEvent(
                            new CustomEvent('hecos:open-tag-drawer', {
                              detail: { tag: next },
                            })
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <span>#{tag.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-zinc-900 text-cyan-300' : 'bg-black/60 text-zinc-500'
                        }`}
                      >
                        {tag.count}
                      </span>
                    </button>
                  </Tooltip>

                  {/* Edit / Delete Tag Icon for GM */}
                  {isActualGm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTagName(tag.name);
                        setTagModalOpen(true);
                        window.dispatchEvent(
                          new CustomEvent('hecos:open-tag-drawer', {
                            detail: { tag: tag.name },
                          })
                        );
                      }}
                      className="pr-2 pl-1 py-1 text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Gerenciar Tag"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : traits.length === 0 ? (
        <div className="p-8 text-center bg-[#110e19] rounded-xl border border-zinc-800 text-zinc-400 text-xs">
          {searchTerm ? `Nenhum traço encontrado para "${searchTerm}".` : 'Nenhum traço ou tradição registrado nos artigos ainda.'}
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {traits.map((tr) => {
            const isSelected = selectedTrait?.toLowerCase() === tr.name.toLowerCase();
            const traitInfo = getTraitInfo(tr.name);

            return (
              <div
                key={tr.name}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? `${traitInfo.color} ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]`
                    : `${traitInfo.color} bg-opacity-40 hover:bg-opacity-70 hover:brightness-110`
                }`}
              >
                <Tooltip
                  content={<TraitTooltipContent traitName={tr.name} info={traitInfo} count={tr.count} />}
                  side="top"
                  className="flex-1 min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next = isSelected ? null : tr.name;
                      setSelectedTrait(next);
                      window.dispatchEvent(
                        new CustomEvent('hecos:open-trait-drawer', {
                          detail: { trait: tr.name },
                        })
                      );
                    }}
                    className="flex items-center gap-2.5 min-w-0 w-full text-left cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-black/40 border border-current/30 text-inherit">
                      {traitInfo.isTradition ? <Wand2 className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-mono font-bold tracking-wide uppercase text-inherit truncate">
                          {tr.name}
                        </h4>
                        {traitInfo.isTradition && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-black/50 border border-current/30 text-inherit font-mono uppercase">
                            Tradição
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] opacity-80 truncate font-mono">
                        {tr.count} artigo{tr.count !== 1 ? 's' : ''} • {traitInfo.category}
                      </p>
                    </div>
                  </button>
                </Tooltip>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrait(tr.name);
                      window.dispatchEvent(
                        new CustomEvent('hecos:open-trait-drawer', {
                          detail: { trait: tr.name },
                        })
                      );
                    }}
                    className="px-2 py-1 rounded-lg bg-black/50 hover:bg-black/80 border border-current/40 text-inherit text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Abrir Gaveta Lateral"
                  >
                    Painel
                  </button>

                  {isActualGm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTraitName(tr.name);
                        setTraitModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 border border-current/40 text-inherit opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      title="Editar ou Configurar Traço / Cor"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {traits.map((tr) => {
            const isSelected = selectedTrait?.toLowerCase() === tr.name.toLowerCase();
            const traitInfo = getTraitInfo(tr.name);

            return (
              <div
                key={tr.name}
                className={`inline-flex items-center rounded-xl transition-all border shadow-sm ${traitInfo.color} ${
                  isSelected
                    ? 'ring-2 ring-amber-400 scale-105 brightness-125 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'hover:brightness-125'
                }`}
              >
                <Tooltip
                  content={<TraitTooltipContent traitName={tr.name} info={traitInfo} count={tr.count} />}
                  side="top"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next = isSelected ? null : tr.name;
                      setSelectedTrait(next);
                      if (next) {
                        window.dispatchEvent(
                          new CustomEvent('hecos:open-trait-drawer', {
                            detail: { trait: next },
                          })
                        );
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wide uppercase cursor-pointer"
                  >
                    <span>{tr.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 text-inherit font-bold">
                      {tr.count}
                    </span>
                  </button>
                </Tooltip>

                {/* Edit / Configure Trait button */}
                {isActualGm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTraitName(tr.name);
                      setTraitModalOpen(true);
                    }}
                    className="pr-2 pl-1 py-1 text-inherit opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    title="Editar ou Configurar Traço / Cor"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Matching Entities List */}
      {(selectedTag || selectedTrait) && (
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <span>Artigos correspondentes a</span>
              {activeTab === 'tags' ? (
                <span className="font-mono text-cyan-400">#{selectedTag}</span>
              ) : (
                <TraitBadge trait={selectedTrait || ''} size="sm" interactive={false} />
              )}
              <span className="text-xs text-zinc-500">({matchingEntities.length} encontrados)</span>
            </h3>

            <div className="flex items-center gap-3">
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('hecos:open-tag-drawer', {
                        detail: { tag: selectedTag },
                      })
                    );
                  }}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Abrir no Painel Lateral</span>
                </button>
              )}
              {selectedTrait && (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('hecos:open-trait-drawer', {
                        detail: { trait: selectedTrait },
                      })
                    );
                  }}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Abrir no Painel Lateral</span>
                </button>
              )}
              {selectedTrait && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTraitName(selectedTrait);
                    setTraitModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar/Configurar este Traço</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedTrait(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
              >
                Limpar filtro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matchingEntities.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigateEntity(item.id)}
                className="flex items-start justify-between p-4 rounded-xl bg-[#110e19] hover:bg-[#181324] border border-zinc-800/80 hover:border-cyan-500/50 text-left transition-all group shadow-md cursor-pointer"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-purple-400 font-mono">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 line-clamp-1">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs text-zinc-400 line-clamp-1">{item.subtitle}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Universal Folder Management Modal */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          onClose={() => setIsFolderManagerOpen(false)}
          scope="tag"
          categories={tagFolderOptions}
          entities={accessibleEntities}
          themeColor="purple"
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* Trait Management Modal */}
      <TraitModal
        isOpen={traitModalOpen}
        onClose={() => setTraitModalOpen(false)}
        traitName={editingTraitName}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Tag Management Modal */}
      <TagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        tagName={editingTagName}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

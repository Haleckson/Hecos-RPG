import React, { useState, useEffect } from 'react';
import { HecosEntity, EntityCategory, HecosUser, FolderPermission } from './types';
import { HecosStorage } from './services/storage';
import { CATEGORY_DEFINITIONS, CategoryDefinition, getCategoryMeta } from './utils/categories';
import { EntityView } from './components/EntityView';
import { EntityEditor } from './components/EntityEditor';
import { CommandPalette } from './components/CommandPalette';
import { InteractiveMap } from './components/InteractiveMap';
import { TimelineView } from './components/TimelineView';
import { TagExplorer } from './components/TagExplorer';
import { MusicJukebox } from './components/MusicJukebox';
import { DriveModal } from './components/DriveModal';
import { DiceRollerModal } from './components/DiceRollerModal';
import { AoNSearchModal } from './components/AoNSearchModal';
import { ConfirmModal } from './components/ConfirmModal';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { NewArticleModal } from './components/NewArticleModal';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { VisibilityBadgeMenu } from './components/VisibilityBadgeMenu';
import { FeatExplorer } from './components/FeatExplorer';
import { FeatCategoryType } from './types';
import { getEmptyAncestryData, serializeAncestryToHTML } from './utils/ancestrySerializer';
import { getEmptyFeatData, serializeFeatToHTML } from './utils/featSerializer';
import {
  subscribeFirebaseStatus,
  getFirebaseConnectionState,
  FirebaseConnectionStatus
} from './services/firebase';
import {
  Search,
  Plus,
  Compass,
  Sparkles,
  Lock,
  Unlock,
  Dices,
  Music,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  Download,
  Upload,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
  Cloud,
  Check,
  Trash2,
  Radio,
  Flame,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Users,
  LogOut,
  Key,
  Crown
} from 'lucide-react';

export function App() {
  const [entities, setEntities] = useState<HecosEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('codex');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'entities' | 'view' | 'edit' | 'map' | 'timeline' | 'tags'>('entities');
  
  const [editingEntity, setEditingEntity] = useState<HecosEntity | null>(null);
  const [isGmMode, setIsGmMode] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ 'codex': true });

  // Resizable & Collapsible Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('hecos_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 288;
    return isNaN(parsed) || parsed < 220 || parsed > 520 ? 288 : parsed;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('hecos_sidebar_collapsed') === 'true';
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = React.useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

  // Toggle Collapse function
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('hecos_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut: Alt+S or Ctrl+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 's') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resize Drag Handlers
  const handleMouseDownResizer = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(Math.max(moveEvent.clientX, 220), 520);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      localStorage.setItem('hecos_sidebar_width', String(sidebarWidthRef.current));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Modals & Auth State
  const [currentUser, setCurrentUser] = useState<HecosUser | null>(() => HecosStorage.getCurrentUser());
  const [folderPermissions, setFolderPermissions] = useState<Record<string, FolderPermission>>(() => HecosStorage.getFolderPermissions());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);

  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isAoNOpen, setIsAoNOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{ id: string; title: string } | null>(null);

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [firebaseStatus, setFirebaseStatus] = useState(getFirebaseConnectionState());

  // Real-time subscriptions and Initial load
  useEffect(() => {
    // 1. Subscribe to real-time entities updates (Firestore onSnapshot + Local sync)
    const unsubEntities = HecosStorage.subscribeEntities((list) => {
      setEntities(list);
    });

    // 2. Subscribe to Firebase connection & sync status
    const unsubFirebase = subscribeFirebaseStatus((state) => {
      setFirebaseStatus(state);
    });

    // 3. Subscribe to Auth user changes
    const unsubUser = HecosStorage.subscribeUser((user) => {
      setCurrentUser(user);
      if (user && user.role === 'gm') {
        setIsGmMode(true);
      }
    });

    // 4. Subscribe to Folder Permissions
    const unsubFolderPerms = HecosStorage.subscribeFolderPermissions((perms) => {
      setFolderPermissions(perms);
    });

    // 5. Trigger initial merge sync
    HecosStorage.syncWithFirebase();

    return () => {
      unsubEntities();
      unsubFirebase();
      unsubUser();
      unsubFolderPerms();
    };
  }, []);

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshEntities = () => {
    setEntities([...HecosStorage.getEntities()]);
  };

  const handleNavigateEntity = (idOrSlug: string) => {
    const found = HecosStorage.getEntityById(idOrSlug);
    if (found) {
      setSelectedEntityId(found.id);
      setActiveView('view');
      setEditingEntity(null);
    }
  };

  const handleOpenNewArticleModal = () => {
    setIsNewArticleModalOpen(true);
  };

  const handleCreateEntityOfCategory = (category: EntityCategory, customTitle?: string) => {
    const newId = 'entity-' + Date.now();
    const finalTitle = customTitle?.trim() || '';

    let newEnt: HecosEntity;

    if (category === 'ancestry') {
      const blankAncestry = getEmptyAncestryData();
      newEnt = {
        id: newId,
        slug: finalTitle
          ? finalTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : 'nova-ancestralidade-' + Date.now(),
        title: finalTitle || 'Nova Ancestralidade',
        subtitle: '',
        category: 'ancestry',
        summary: '',
        content: serializeAncestryToHTML(finalTitle, blankAncestry),
        ancestryData: blankAncestry,
        tags: ['ancestry', 'pf2e'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSecret: true,
      };
    } else if (category === 'feat') {
      const blankFeat = getEmptyFeatData();
      newEnt = {
        id: newId,
        slug: finalTitle
          ? finalTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : 'novo-talento-' + Date.now(),
        title: finalTitle || 'Novo Talento',
        subtitle: '',
        category: 'feat',
        summary: '',
        content: serializeFeatToHTML(finalTitle, blankFeat),
        featData: blankFeat,
        tags: ['talento', 'pf2e'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSecret: true,
      };
    } else {
      newEnt = {
        id: newId,
        slug: finalTitle
          ? finalTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : 'novo-artigo-' + Date.now(),
        title: finalTitle || 'Novo Artigo de Hecos',
        subtitle: '',
        category: category,
        summary: '',
        content: `### Descrição\nEscreva os detalhes de Hecos aqui.\n\nUse @ para linkar outras páginas, criaturas ou regras!`,
        tags: [category, 'Hecos'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSecret: true,
      };
    }

    setEditingEntity(newEnt);
    setActiveView('edit');
  };

  const handleCreateFeatDirectly = (presetCategory?: FeatCategoryType, presetSubcategory?: string) => {
    const newId = 'entity-' + Date.now();
    const blankFeat = getEmptyFeatData();
    if (presetCategory) {
      blankFeat.featType = presetCategory;
    }
    if (presetSubcategory) {
      blankFeat.subcategories = [presetSubcategory];
    }
    const newEnt: HecosEntity = {
      id: newId,
      slug: 'novo-talento-' + Date.now(),
      title: 'Novo Talento',
      subtitle: '',
      category: 'feat',
      subcategory: presetSubcategory || '',
      subcategories: presetSubcategory ? [presetSubcategory] : [],
      summary: '',
      content: serializeFeatToHTML('Novo Talento', blankFeat),
      featData: blankFeat,
      tags: ['talento', 'pf2e', ...(presetSubcategory ? [presetSubcategory] : [])],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: true,
    };
    setEditingEntity(newEnt);
    setActiveView('edit');
  };

  const handleCreateNewEntity = (presetCategoryOrSub?: string) => {
    // Open Category selector modal so user can choose ANY category from anywhere
    setIsNewArticleModalOpen(true);
  };

  const handleSaveEntity = (saved: HecosEntity) => {
    HecosStorage.saveEntity(saved);
    refreshEntities();
    setSelectedEntityId(saved.id);
    setActiveView('view');
    setEditingEntity(null);
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleDeleteEntity = (id: string) => {
    const ent = entities.find((e) => e.id === id || e.slug === id) || HecosStorage.getEntityById(id);
    const entityName = ent ? `"${ent.title}"` : 'este artigo';
    setEntityToDelete({ id, title: entityName });
  };

  const confirmDeleteEntity = () => {
    if (!entityToDelete) return;
    const { id } = entityToDelete;
    HecosStorage.deleteEntity(id);
    refreshEntities();
    if (selectedEntityId === id || (currentEntity && (currentEntity.id === id || currentEntity.slug === id))) {
      setSelectedEntityId(null);
      setActiveView('entities');
    }
    setEditingEntity(null);
    setEntityToDelete(null);
  };

  const currentEntity = selectedEntityId
    ? entities.find((e) => e.id === selectedEntityId)
    : null;

  // Filter entities for Category view
  const categoryEntities = entities.filter((e) => {
    // 3-Level Access Permission Check:
    // If GM is logged in and GM mode is active, GM can see everything.
    // Otherwise, check granular user access (GM, Public, or specific Player).
    const isActualGm = currentUser?.role === 'gm' && isGmMode;
    if (!isActualGm) {
      if (!HecosStorage.canUserAccess(e.visibility, e.allowedUserIds, currentUser, e.isSecret)) {
        return false;
      }
    }

    // Subcategory check
    if (activeSubcategory) {
      // Check if folder itself is restricted
      if (!isActualGm) {
        const folderPerm = HecosStorage.getFolderPermission(activeSubcategory);
        if (!HecosStorage.canUserAccess(folderPerm.visibility, folderPerm.allowedUserIds, currentUser)) {
          return false;
        }
      }

      if (activeSubcategory === 'NPC' && e.category === 'npc') return true;
      if (activeSubcategory === 'Criaturas' && e.category === 'creature') return true;
      if (activeSubcategory === 'Ancestralidades' && e.category === 'ancestry') return true;
      if (activeSubcategory === 'Classes' && e.category === 'class') return true;
      if (activeSubcategory === 'Arquétipos' && e.category === 'archetype') return true;
      if (activeSubcategory === 'Talentos' && e.category === 'feat') return true;
      if (activeSubcategory === 'Feitiços' && e.category === 'spell') return true;
      if (activeSubcategory === 'Itens' && e.category === 'item') return true;
      if (activeSubcategory === 'Locais' && e.category === 'location') return true;
      if (activeSubcategory === 'Fauna' && e.category === 'fauna') return true;
      if (activeSubcategory === 'Flora' && e.category === 'flora') return true;
      if (activeSubcategory === 'Organizações' && e.category === 'organization') return true;
      if (activeSubcategory === 'Regras' && e.category === 'rule') return true;
      if (activeSubcategory === 'Timeline' && e.category === 'timeline') return true;
      return false;
    }

    const currentCatDef = CATEGORY_DEFINITIONS.find((c) => c.id === selectedCategoryKey);
    if (currentCatDef?.categoryKey) {
      if (e.category !== currentCatDef.categoryKey) return false;
    } else if (selectedCategoryKey === 'codex' || selectedCategoryKey === 'menu-codex') {
      if (
        ![
          'creature',
          'spell',
          'item',
          'location',
          'fauna',
          'flora',
          'organization',
          'npc',
          'ancestry',
          'class',
          'archetype',
          'feat',
          'rule',
          'timeline'
        ].includes(e.category)
      ) {
        return false;
      }
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
        e.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (selectedTagFilter) {
      if (!e.tags.includes(selectedTagFilter)) return false;
    }

    return true;
  });

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    await HecosStorage.syncWithFirebase();
    refreshEntities();
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 2500);
  };

  const handleExportData = () => {
    const dataStr = HecosStorage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hecos_rpg_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050407] text-zinc-100 font-sans select-none antialiased">
      {/* Top Background Atmospheric Glows (Malva, Ciano, Bordô) */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#be123c]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 left-1/3 w-96 h-96 bg-[#b877db]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside
        style={{ width: isSidebarCollapsed ? undefined : `${sidebarWidth}px` }}
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-[#09080e]/95 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col transition-all duration-150 relative select-none ${
          isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
      >
        {/* Logo & Setting Title */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div
            onClick={() => {
              setSelectedCategoryKey('codex');
              setActiveSubcategory(null);
              setActiveView('entities');
              setSelectedEntityId(null);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-700 via-purple-600 to-cyan-500 p-0.5 shadow-[0_0_20px_rgba(190,18,60,0.4)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all">
              <div className="w-full h-full bg-[#09080e] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-lg bg-gradient-to-r from-cyan-400 via-purple-300 to-rose-400 bg-clip-text text-transparent">
                  H
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest bg-gradient-to-r from-zinc-100 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                HECOS
              </h1>
              <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">
                Pathfinder 2e Setting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse button for desktop */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Recolher menu lateral (Alt + S)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Quick Search Button (Ctrl+K) */}
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/60 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 text-xs text-zinc-400 transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Buscar em Hecos...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Category List Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {CATEGORY_DEFINITIONS.map((category) => {
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = expandedMenus[category.id];
            const isSelected = selectedCategoryKey === category.id && !activeSubcategory;
            const Icon = category.icon;

            return (
              <div key={category.id} className="space-y-0.5">
                <div
                  onClick={() => {
                    if (hasChildren) {
                      setExpandedMenus((prev) => ({ ...prev, [category.id]: !prev[category.id] }));
                    }
                    setSelectedCategoryKey(category.id);
                    setActiveSubcategory(null);
                    setSelectedEntityId(null);
                    if (category.viewType) {
                      setActiveView(category.viewType);
                    } else {
                      setActiveView('entities');
                    }
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-950/60 to-cyan-950/40 border border-cyan-500/40 text-cyan-200 shadow-md'
                      : 'hover:bg-zinc-900/60 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: category.color }}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{category.name}</span>
                  </div>

                  {hasChildren && (
                    <span className="text-zinc-500 hover:text-zinc-300 p-0.5">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>

                {/* Submenu for Codex */}
                {hasChildren && isExpanded && (
                  <div className="pl-5 space-y-0.5 pt-0.5 border-l border-zinc-800/80 ml-3.5">
                    {category.children!.map((child) => {
                      const isChildSelected = activeSubcategory === child.subcategory;
                      const ChildIcon = child.icon;
                      const subcatKey = child.subcategory || child.id;
                      const folderPerm = HecosStorage.getFolderPermission(subcatKey);
                      const isActualGm = currentUser?.role === 'gm' && isGmMode;
                      const canAccess = isActualGm || HecosStorage.canUserAccess(folderPerm.visibility, folderPerm.allowedUserIds, currentUser);

                      if (!canAccess) return null;

                      return (
                        <div
                          key={child.id}
                          className="flex items-center justify-between group/subcat rounded-lg hover:bg-zinc-900/50 transition-all pr-1"
                        >
                          <div
                            onClick={() => {
                              setSelectedCategoryKey(category.id);
                              setActiveSubcategory(child.subcategory!);
                              setSelectedEntityId(null);
                              if (child.viewType && child.viewType !== 'entities') {
                                setActiveView(child.viewType);
                              } else {
                                setActiveView('entities');
                              }
                              setIsSidebarOpen(false);
                            }}
                            className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isChildSelected
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span style={{ color: child.color }}>
                              <ChildIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="truncate">{child.name}</span>
                          </div>

                          {/* GM Granular Folder Visibility Menu */}
                          {currentUser?.role === 'gm' && (
                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                              <VisibilityBadgeMenu
                                visibility={folderPerm.visibility}
                                allowedUserIds={folderPerm.allowedUserIds}
                                onChange={(newVis, newAllowed) => {
                                  HecosStorage.setFolderPermission(subcatKey, newVis, newAllowed);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* GM Mode & Bottom Controls */}
        <div className="p-3 bg-[#0d0b13] border-t border-zinc-800/80 space-y-2 text-xs">
          {/* GM Secret Visibility Toggle */}
          <button
            onClick={() => setIsGmMode(!isGmMode)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all border ${
              isGmMode
                ? 'bg-rose-950/60 border-rose-600/60 text-rose-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isGmMode ? <Unlock className="w-4 h-4 text-rose-400" /> : <Lock className="w-4 h-4 text-zinc-500" />}
              <span>{isGmMode ? 'Modo Mestre (GM)' : 'Modo Jogador'}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-mono">
              {isGmMode ? 'Segredos ON' : 'Oculto'}
            </span>
          </button>

          {/* Firebase Real-time Persistence Status Badge */}
          <div
            onClick={() => setIsFirebaseModalOpen(true)}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
            title="Ver status detalhado da conexão com Firebase Realtime Database"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {firebaseStatus.status === 'connected' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                )}
              </span>
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-emerald-300 transition-colors">
                {firebaseStatus.status === 'connected' ? 'Realtime DB Conectado' : 'Modo Local / Offline'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono group-hover:text-zinc-300">
              {firebaseStatus.projectId || 'RTDB'}
            </span>
          </div>

          {/* Cloud Sync & Backup Buttons */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
            <button
              onClick={handleManualSync}
              className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
              title="Sincronizar com Firebase Realtime Database"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{syncStatus === 'synced' ? 'Sincronizado' : 'Sincronizar Cloud'}</span>
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-1 hover:text-purple-300 transition-colors"
              title="Exportar Backup JSON"
            >
              <Download className="w-3 h-3" />
              <span>Backup</span>
            </button>
          </div>
        </div>

        {/* Resizer Handle on right border (Desktop only) */}
        {!isSidebarCollapsed && (
          <div
            onMouseDown={handleMouseDownResizer}
            className={`hidden lg:block absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/60 active:bg-cyan-400 z-50 transition-colors ${
              isResizing ? 'bg-cyan-400 w-2 shadow-[0_0_12px_rgba(6,182,212,0.8)]' : 'bg-transparent'
            }`}
            title="Arraste para redimensionar o menu lateral"
          />
        )}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top App Header Bar */}
        <header className="px-6 py-3.5 bg-[#09080e]/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Expand sidebar button (shown when collapsed on desktop) */}
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-cyan-300 text-xs font-bold transition-all shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:scale-105 cursor-pointer"
                title="Expandir menu lateral (Alt + S)"
              >
                <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
                <span>Menu</span>
              </button>
            )}

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 uppercase tracking-wider font-semibold">Hecos</span>
              <span className="text-zinc-700">/</span>
              <span className="text-cyan-400 font-bold">
                {activeSubcategory || getCategoryMeta(selectedCategoryKey).name}
              </span>
              {selectedEntityId && currentEntity && (
                <>
                  <span className="text-zinc-700">/</span>
                  <span className="text-zinc-200 font-medium truncate max-w-[150px] sm:max-w-[250px]">
                    {currentEntity.title}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Utility Tools (GM Toggle, AoN, Dice, Music, Drive, New Article) */}
          <div className="flex items-center gap-2">
            {/* Quick GM Mode Toggle */}
            <button
              onClick={() => setIsGmMode(!isGmMode)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 ${
                isGmMode
                  ? 'bg-rose-950/80 border-rose-600/70 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'bg-[#110e19] hover:bg-[#1a1427] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={isGmMode ? 'Modo Mestre Ativo (Segredos Visíveis)' : 'Modo Jogador (Segredos Ocultos)'}
            >
              {isGmMode ? (
                <Unlock className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className="hidden sm:inline text-xs font-semibold">
                {isGmMode ? 'GM' : 'Jogador'}
              </span>
            </button>

            {/* Archives of Nethys (2e.aonprd.com) Quick Reference */}
            <button
              onClick={() => setIsAoNOpen(true)}
              className="p-2 rounded-xl bg-[#110e19] hover:bg-[#1a1427] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition-all shadow-sm flex items-center gap-1.5"
              title="Pesquisar Regras Oficiais no Archives of Nethys (2e.aonprd.com)"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="hidden lg:inline text-xs font-bold text-cyan-200">AoN PF2e</span>
            </button>

            {/* Dice Roller */}
            <button
              onClick={() => setIsDiceOpen(true)}
              className="p-2 rounded-xl bg-[#110e19] hover:bg-[#1a1427] border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 transition-all shadow-sm"
              title="Rolador de Dados Pathfinder 2e"
            >
              <Dices className="w-4 h-4" />
            </button>

            {/* Music Jukebox */}
            <button
              onClick={() => setIsJukeboxOpen(true)}
              className="p-2 rounded-xl bg-[#110e19] hover:bg-[#1a1427] border border-zinc-800 hover:border-rose-500/50 text-rose-400 transition-all shadow-sm"
              title="Jukebox de Ambiência (YouTube API)"
            >
              <Music className="w-4 h-4" />
            </button>

            {/* User Account / Login & Management */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.role === 'gm' && (
                  <button
                    type="button"
                    onClick={() => setIsUserManagementModalOpen(true)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                    title="Gerenciar Jogadores e Senhas (Apenas GM)"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden xl:inline">Jogadores</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentUser.role === 'gm'
                      ? 'bg-gradient-to-r from-amber-950/80 to-rose-950/70 border-amber-500/60 text-amber-200 shadow-sm'
                      : 'bg-gradient-to-r from-cyan-950/80 to-purple-950/70 border-cyan-500/50 text-cyan-200 shadow-sm'
                  }`}
                  title={`Conectado como: ${currentUser.name} (${currentUser.role === 'gm' ? 'Mestre' : 'Jogador'}). Clique para trocar de usuário ou sair.`}
                >
                  {currentUser.role === 'gm' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[90px] sm:max-w-[130px]">{currentUser.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/40 text-zinc-400 border border-white/10 hidden sm:inline">
                    {currentUser.role === 'gm' ? 'GM' : 'Player'}
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/60 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Fazer login (Mestre GM ou Jogador)"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

            {/* Google Drive Resources */}
            <button
              onClick={() => setIsDriveOpen(true)}
              className="p-2 rounded-xl bg-[#110e19] hover:bg-[#1a1427] border border-zinc-800 hover:border-purple-500/50 text-purple-300 transition-all shadow-sm"
              title="Recursos do Google Drive"
            >
              <FolderKanban className="w-4 h-4" />
            </button>

            {/* Create New Entity Button */}
            <button
              onClick={() => handleCreateNewEntity(activeSubcategory || selectedCategoryKey)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Novo Artigo</span>
            </button>
          </div>
        </header>

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
          {/* VIEW: Interactive Map */}
          {activeView === 'map' && (
            <div className="h-full">
              <InteractiveMap onNavigateEntity={handleNavigateEntity} />
            </div>
          )}

          {/* VIEW: Timeline */}
          {activeView === 'timeline' && (
            <TimelineView
              onNavigateEntity={handleNavigateEntity}
              onNewEntity={handleCreateNewEntity}
            />
          )}

          {/* VIEW: Tag Explorer */}
          {activeView === 'tags' && (
            <TagExplorer
              onNavigateEntity={handleNavigateEntity}
              initialSelectedTag={selectedTagFilter || undefined}
            />
          )}

          {/* VIEW: Single Entity Detailed View */}
          {activeView === 'view' && currentEntity && (
            <EntityView
              entity={currentEntity}
              onEdit={() => {
                setEditingEntity(currentEntity);
                setActiveView('edit');
              }}
              onDelete={() => handleDeleteEntity(currentEntity.id)}
              onNavigate={handleNavigateEntity}
              onTagClick={(tag) => {
                setSelectedTagFilter(tag);
                setActiveView('tags');
              }}
            />
          )}

          {/* VIEW: Notion & PF2e Entity Editor */}
          {activeView === 'edit' && editingEntity && (
            <EntityEditor
              entity={editingEntity}
              onSave={handleSaveEntity}
              onCancel={() => {
                setActiveView(selectedEntityId ? 'view' : 'entities');
                setEditingEntity(null);
              }}
              onDelete={() => handleDeleteEntity(editingEntity.id)}
              onNavigate={handleNavigateEntity}
            />
          )}

          {/* VIEW: Category Entities Grid View (Default) OR FeatExplorer for Feats */}
          {activeView === 'entities' && (
            selectedCategoryKey === 'feat' || activeSubcategory === 'Talentos' ? (
              <FeatExplorer
                entities={entities}
                onSelectEntity={handleNavigateEntity}
                onEditEntity={(id) => {
                  const ent = entities.find((e) => e.id === id || e.slug === id);
                  if (ent) {
                    setEditingEntity(ent);
                    setActiveView('edit');
                  }
                }}
                onCreateFeat={handleCreateFeatDirectly}
                onDeleteEntity={handleDeleteEntity}
                onTagClick={(tag) => {
                  setSelectedTagFilter(tag);
                  setActiveView('tags');
                }}
                isGmMode={isGmMode}
              />
            ) : (
              <div className="space-y-6">
                {/* Category Banner & Search */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#09080d] p-6 rounded-2xl border border-zinc-800/80 shadow-xl">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-100">
                      {activeSubcategory || getCategoryMeta(selectedCategoryKey).name}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      {getCategoryMeta(selectedCategoryKey, activeSubcategory || undefined).description ||
                        'Gerencie todas as entradas e vínculos cadastrados neste menu de Hecos.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Filtrar por nome ou tag..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {selectedTagFilter && (
                      <button
                        onClick={() => setSelectedTagFilter(null)}
                        className="px-2 py-1 text-xs rounded-lg bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1"
                      >
                        <span>#{selectedTagFilter}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Entities Cards Grid */}
                {categoryEntities.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#09080d] border border-zinc-800/60 space-y-3">
                    <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-sm text-zinc-400">Nenhum artigo encontrado nesta categoria com os filtros atuais.</p>
                    <button
                      onClick={() => handleCreateNewEntity(activeSubcategory || selectedCategoryKey)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition-all shadow-md"
                    >
                      Criar Primeira Entrada em {activeSubcategory || getCategoryMeta(selectedCategoryKey).name}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryEntities.map((item) => {
                      const isCiano = ['pc', 'spell', 'ancestry', 'rule'].includes(item.category);
                      const isMalva = ['npc', 'item', 'flora', 'class', 'feat', 'timeline'].includes(item.category);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNavigateEntity(item.id)}
                          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#0d0a15] hover:bg-[#140f21] border border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                        >
                          <div className="space-y-3">
                            {/* Card Top Pill & Actions */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                                  isCiano
                                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                    : isMalva
                                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                                    : 'bg-rose-950 text-rose-300 border-rose-800'
                                }`}
                              >
                                {getCategoryMeta(item.category).name} {item.statblock ? `• Nível ${item.statblock.level}` : ''}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {/* 3-Level Granular Visibility Menu */}
                                <div onClick={(e) => e.stopPropagation()}>
                                  <VisibilityBadgeMenu
                                    visibility={item.visibility}
                                    allowedUserIds={item.allowedUserIds}
                                    isSecret={item.isSecret}
                                    onChange={(newVis, newAllowed) => {
                                      HecosStorage.setEntityVisibility(item.id, newVis, newAllowed);
                                    }}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEntity(item.id);
                                  }}
                                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-800 transition-all"
                                  title={`Excluir "${item.title}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Card Title & Subtitle */}
                            <div>
                              <h3 className="text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                                {item.title}
                              </h3>
                              {item.subtitle && (
                                <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Card Summary */}
                            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                              {item.summary || 'Sem resumo cadastrado.'}
                            </p>
                          </div>

                          {/* Card Footer: Tags & Arrow */}
                          <div className="pt-4 mt-3 border-t border-zinc-800/80 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-zinc-400 border border-zinc-800"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectEntity={handleNavigateEntity}
      />

      <MusicJukebox
        isOpen={isJukeboxOpen}
        onClose={() => setIsJukeboxOpen(false)}
      />

      <DriveModal
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
      />

      <DiceRollerModal
        isOpen={isDiceOpen}
        onClose={() => setIsDiceOpen(false)}
      />

      <AoNSearchModal
        isOpen={isAoNOpen}
        onClose={() => setIsAoNOpen(false)}
      />

      <ConfirmModal
        isOpen={!!entityToDelete}
        title="Excluir Entrada do Codex"
        message={`Tem certeza de que deseja excluir permanentemente ${entityToDelete?.title} de Hecos?\n\nEsta ação removerá o artigo e seus dados do sistema.`}
        confirmLabel="Excluir Definitivamente"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteEntity}
        onCancel={() => setEntityToDelete(null)}
      />

      <NewArticleModal
        isOpen={isNewArticleModalOpen}
        onClose={() => setIsNewArticleModalOpen(false)}
        onCreate={handleCreateEntityOfCategory}
      />

      <FirebaseStatusModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
      />
    </div>
  );
}

export default App;

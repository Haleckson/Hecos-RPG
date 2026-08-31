import React, { useState, useEffect, useMemo } from 'react';
import {
  HecosEntity,
  EntityCategory,
  HecosUser,
  FolderPermission,
  FeatCategoryType,
  SpellCategoryType,
  ItemCategoryType,
  DrawerStackItem,
  DrawerBreadcrumb,
  DrawerType,
} from './types';
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
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { NewArticleModal } from './components/NewArticleModal';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { VisibilityBadgeMenu } from './components/VisibilityBadgeMenu';
import { GlobalTooltip } from './components/GlobalTooltip';
import { TrashBinModal } from './components/TrashBinModal';
import { FeatExplorer } from './components/FeatExplorer';
import { SpellExplorer } from './components/SpellExplorer';
import { ItemExplorer } from './components/ItemExplorer';
import { CategoryEntityExplorer } from './components/CategoryEntityExplorer';
import { SpellCreateModal } from './components/SpellCreateModal';
import { ItemCreateModal } from './components/ItemCreateModal';
import { AncestryCard } from './components/AncestryCard';
import { PerilCard } from './components/PerilCard';
import { EntityCard } from './components/EntityCard';
import { QuestBoard } from './components/QuestBoard';
import { PerilCreateModal } from './components/PerilCreateModal';
import { ClassCreateModal } from './components/ClassCreateModal';
import { NPCCreateModal } from './components/NPCCreateModal';
import { LocationCreateModal } from './components/LocationCreateModal';
import { QuestCreateModal } from './components/QuestCreateModal';
import { OrganizationCreateModal } from './components/OrganizationCreateModal';
import { FaunaCreateModal } from './components/FaunaCreateModal';
import { FloraCreateModal } from './components/FloraCreateModal';
import { PCCreateModal } from './components/PCCreateModal';
import { TraitDrawer } from './components/TraitDrawer';
import { TagDrawer } from './components/TagDrawer';
import { EntityDrawer } from './components/EntityDrawer';
import { FeatDrawer } from './components/FeatDrawer';
import { ItemDrawer } from './components/ItemDrawer';
import { HomePage } from './components/HomePage';
import { setupGlobalTextFormattingShortcuts } from './utils/keyboardShortcuts';
import { getEmptyAncestryData, serializeAncestryToHTML } from './utils/ancestrySerializer';
import { getEmptyFeatData, serializeFeatToHTML } from './utils/featSerializer';
import { getEmptySpellData, serializeSpellToHTML } from './utils/spellSerializer';
import { getEmptyItemData, serializeItemToHTML } from './utils/itemSerializer';
import { ImageCacheService } from './services/imageCacheService';
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
  ChevronLeft,
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
  Crown,
  LayoutGrid,
  List
} from 'lucide-react';

export function App() {
  const [entities, setEntities] = useState<HecosEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('codex');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'entities' | 'view' | 'edit' | 'map' | 'timeline' | 'tags' | 'quests'>('entities');
  
  const [editingEntity, setEditingEntity] = useState<HecosEntity | null>(null);
  const [isGmMode, setIsGmMode] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'codex': true,
    'codex-group-lore': true,
    'codex-group-mecanicas': true
  });

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

  // View Mode for Category Explorer: 'grid' vs 'compact'
  const [entityListViewMode, setEntityListViewMode] = useState<'grid' | 'compact'>('grid');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{ id: string; title: string } | null>(null);

  // Dedicated creation modals for robust PF2e entities
  const [isSpellCreateModalOpen, setIsSpellCreateModalOpen] = useState(false);
  const [editingSpellEntity, setEditingSpellEntity] = useState<HecosEntity | null>(null);
  const [spellModalPresetCategory, setSpellModalPresetCategory] = useState<SpellCategoryType | undefined>(undefined);
  const [spellModalPresetSubcategory, setSpellModalPresetSubcategory] = useState<string | undefined>(undefined);

  const [isItemCreateModalOpen, setIsItemCreateModalOpen] = useState(false);
  const [editingItemEntity, setEditingItemEntity] = useState<HecosEntity | null>(null);
  const [itemModalPresetCategory, setItemModalPresetCategory] = useState<ItemCategoryType | undefined>(undefined);
  const [itemModalPresetSubcategory, setItemModalPresetSubcategory] = useState<string | undefined>(undefined);

  const [isPerilCreateModalOpen, setIsPerilCreateModalOpen] = useState(false);
  const [editingPerilEntity, setEditingPerilEntity] = useState<HecosEntity | null>(null);
  const [isClassCreateModalOpen, setIsClassCreateModalOpen] = useState(false);
  const [classModalPresetKind, setClassModalPresetKind] = useState<'class' | 'archetype'>('class');

  const [isNpcCreateModalOpen, setIsNpcCreateModalOpen] = useState(false);
  const [editingNpcEntity, setEditingNpcEntity] = useState<HecosEntity | null>(null);

  const [isLocationCreateModalOpen, setIsLocationCreateModalOpen] = useState(false);
  const [editingLocationEntity, setEditingLocationEntity] = useState<HecosEntity | null>(null);

  const [isQuestCreateModalOpen, setIsQuestCreateModalOpen] = useState(false);
  const [editingQuestEntity, setEditingQuestEntity] = useState<HecosEntity | null>(null);

  const [isOrganizationCreateModalOpen, setIsOrganizationCreateModalOpen] = useState(false);
  const [editingOrganizationEntity, setEditingOrganizationEntity] = useState<HecosEntity | null>(null);

  const [isFaunaCreateModalOpen, setIsFaunaCreateModalOpen] = useState(false);
  const [editingFaunaEntity, setEditingFaunaEntity] = useState<HecosEntity | null>(null);

  const [isFloraCreateModalOpen, setIsFloraCreateModalOpen] = useState(false);
  const [editingFloraEntity, setEditingFloraEntity] = useState<HecosEntity | null>(null);

  const [isPcCreateModalOpen, setIsPcCreateModalOpen] = useState(false);
  const [editingPcEntity, setEditingPcEntity] = useState<HecosEntity | null>(null);

  // Stack-based drawer state for multi-layered sliding drawers with history & breadcrumbs
  const [drawerStack, setDrawerStack] = useState<DrawerStackItem[]>([]);

  // Push a drawer to the stack
  const pushDrawer = (type: DrawerType, data: any, title?: string) => {
    let resolvedTitle = title;
    if (!resolvedTitle) {
      if (type === 'entity') {
        const ent = HecosStorage.getEntityById(data.entityId);
        resolvedTitle = ent?.title || data.entityId;
      } else if (type === 'trait') {
        resolvedTitle = data.trait;
      } else if (type === 'tag') {
        resolvedTitle = '#' + data.tag;
      } else if (type === 'feat') {
        const ent = HecosStorage.getEntityById(data.featId);
        resolvedTitle = ent?.title || data.featId;
      } else if (type === 'item') {
        const ent = HecosStorage.getEntityById(data.itemId);
        resolvedTitle = ent?.title || data.itemId;
      }
    }

    const newItem: DrawerStackItem = {
      id: `drawer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      data,
      title: resolvedTitle,
    };

    setDrawerStack((prev) => {
      // Don't push duplicate if the top of the stack is already the exact same item
      if (prev.length > 0) {
        const top = prev[prev.length - 1];
        if (top.type === type && JSON.stringify(top.data) === JSON.stringify(data)) {
          return prev;
        }
      }
      return [...prev, newItem];
    });
  };

  // Close specific drawer at index (pops it and any above it)
  const closeDrawerAt = (index: number) => {
    setDrawerStack((prev) => prev.filter((_, i) => i < index));
  };

  // Jump to specific drawer in stack
  const jumpToDrawerIndex = (index: number) => {
    setDrawerStack((prev) => prev.slice(0, index + 1));
  };

  // Close all open drawers
  const closeAllDrawers = () => {
    setDrawerStack([]);
  };

  // Breadcrumbs array
  const drawerBreadcrumbs = useMemo<DrawerBreadcrumb[]>(() => {
    return drawerStack.map((item, idx) => ({
      id: item.id,
      index: idx,
      targetId: item.data?.entityId || item.data?.trait || item.data?.tag || item.data?.featId || item.data?.itemId || item.targetId || '',
      title:
        item.title ||
        (item.type === 'entity'
          ? 'Artigo'
          : item.type === 'trait'
          ? 'Traço'
          : item.type === 'tag'
          ? 'Tag'
          : item.type === 'feat'
          ? 'Talento'
          : 'Item'),
      type: item.type,
    }));
  }, [drawerStack]);

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [firebaseStatus, setFirebaseStatus] = useState(getFirebaseConnectionState());

  const isActualGm = HecosStorage.isUserGm(currentUser);

  // Compute effective category key based on selectedCategoryKey and activeSubcategory
  const effectiveCategoryKey = useMemo(() => {
    if (selectedCategoryKey === 'feat' || activeSubcategory === 'Talentos') return 'feat';
    if (selectedCategoryKey === 'spell' || activeSubcategory === 'Feitiços') return 'spell';
    if (selectedCategoryKey === 'item' || activeSubcategory === 'Itens') return 'item';
    if (selectedCategoryKey === 'quest' || activeSubcategory === 'Quests' || activeSubcategory === 'Missões') return 'quest';
    if (selectedCategoryKey === 'peril' || selectedCategoryKey === 'creature' || activeSubcategory === 'Perigos' || activeSubcategory === 'Ameaças') return 'peril';
    if (selectedCategoryKey === 'class' || activeSubcategory === 'Classes') return 'class';
    if (selectedCategoryKey === 'archetype' || selectedCategoryKey === 'arquetipos' || selectedCategoryKey === 'vocacao' || activeSubcategory === 'Vocação' || activeSubcategory === 'Arquétipos') return 'archetype';
    if (selectedCategoryKey === 'ancestry' || activeSubcategory === 'Ancestralidades') return 'ancestry';
    if (selectedCategoryKey === 'fauna' || activeSubcategory === 'Fauna') return 'fauna';
    if (selectedCategoryKey === 'flora' || activeSubcategory === 'Flora') return 'flora';
    if (selectedCategoryKey === 'location' || selectedCategoryKey === 'locais' || activeSubcategory === 'Locais') return 'location';
    if (selectedCategoryKey === 'npc' || activeSubcategory === 'NPC') return 'npc';
    if (selectedCategoryKey === 'pc' || activeSubcategory === 'PC') return 'pc';
    if (selectedCategoryKey === 'organization' || selectedCategoryKey === 'organizacoes' || activeSubcategory === 'Organizações') return 'organization';
    return selectedCategoryKey;
  }, [selectedCategoryKey, activeSubcategory]);

  // Trait Drawer Event Listener (hecos:open-trait-drawer)
  useEffect(() => {
    const handleOpenTraitDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ trait: string }>;
      if (customEvent.detail?.trait) {
        pushDrawer('trait', { trait: customEvent.detail.trait });
      }
    };
    window.addEventListener('hecos:open-trait-drawer', handleOpenTraitDrawer);
    return () => window.removeEventListener('hecos:open-trait-drawer', handleOpenTraitDrawer);
  }, []);

  // Tag Drawer Event Listener (hecos:open-tag-drawer)
  useEffect(() => {
    const handleOpenTagDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ tag: string }>;
      if (customEvent.detail?.tag) {
        pushDrawer('tag', { tag: customEvent.detail.tag });
      }
    };
    window.addEventListener('hecos:open-tag-drawer', handleOpenTagDrawer);
    return () => window.removeEventListener('hecos:open-tag-drawer', handleOpenTagDrawer);
  }, []);

  // Feat Drawer Event Listener (hecos:open-feat-drawer)
  useEffect(() => {
    const handleOpenFeatDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ featId?: string; id?: string }>;
      const targetId = customEvent.detail?.featId || customEvent.detail?.id;
      if (targetId) {
        pushDrawer('feat', { featId: targetId });
      }
    };
    window.addEventListener('hecos:open-feat-drawer', handleOpenFeatDrawer);
    return () => window.removeEventListener('hecos:open-feat-drawer', handleOpenFeatDrawer);
  }, []);

  // Item Drawer Event Listener (hecos:open-item-drawer)
  useEffect(() => {
    const handleOpenItemDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId?: string; id?: string }>;
      const targetId = customEvent.detail?.itemId || customEvent.detail?.id;
      if (targetId) {
        pushDrawer('item', { itemId: targetId });
      }
    };
    window.addEventListener('hecos:open-item-drawer', handleOpenItemDrawer);
    return () => window.removeEventListener('hecos:open-item-drawer', handleOpenItemDrawer);
  }, []);

  // Entity Drawer Event Listener (hecos:open-entity-drawer)
  useEffect(() => {
    const handleOpenEntityDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ entityId?: string; slug?: string; id?: string }>;
      const targetId = customEvent.detail?.entityId || customEvent.detail?.slug || customEvent.detail?.id;
      if (targetId) {
        pushDrawer('entity', { entityId: targetId });
      }
    };
    window.addEventListener('hecos:open-entity-drawer', handleOpenEntityDrawer);
    return () => window.removeEventListener('hecos:open-entity-drawer', handleOpenEntityDrawer);
  }, []);

  // Real-time subscriptions and Initial load
  useEffect(() => {
    // 1. Subscribe to real-time entities updates (Firestore onSnapshot + Local sync)
    const unsubEntities = HecosStorage.subscribeEntities((list) => {
      setEntities(list);
      // Preload images into cache in the background for zero-latency UI
      try {
        const imageUrls = list
          .map((e) => e.coverImage || e.npcData?.portraitImage || e.perilData?.portraitImage || e.organizationData?.symbolImage)
          .filter((url): url is string => Boolean(url && url.startsWith('http')));
        ImageCacheService.preloadImages(imageUrls.slice(0, 30));
      } catch (e) {
        console.warn('Preload images warning:', e);
      }
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

    // 6. Global keyboard formatting shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
    const cleanupShortcuts = setupGlobalTextFormattingShortcuts();

    return () => {
      unsubEntities();
      unsubFirebase();
      unsubUser();
      unsubFolderPerms();
      cleanupShortcuts();
    };
  }, []);

  const handleGoBack = () => {
    if (editingEntity) {
      setEditingEntity(null);
      setActiveView('view');
    } else if (selectedEntityId) {
      setSelectedEntityId(null);
      setActiveView('entities');
    } else if (activeSubcategory) {
      setActiveSubcategory(null);
    } else if (selectedCategoryKey !== 'codex') {
      setSelectedCategoryKey('codex');
      setActiveSubcategory(null);
      setSelectedEntityId(null);
      setActiveView('entities');
    } else if (activeView !== 'entities') {
      setActiveView('entities');
    }
  };

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
    if (category === 'spell') {
      setSpellModalPresetCategory(undefined);
      setSpellModalPresetSubcategory(undefined);
      setIsSpellCreateModalOpen(true);
      return;
    }

    if (category === 'item') {
      setItemModalPresetCategory(undefined);
      setItemModalPresetSubcategory(undefined);
      setIsItemCreateModalOpen(true);
      return;
    }

    if (category === 'creature' || (category as any) === 'peril') {
      setEditingPerilEntity(null);
      setIsPerilCreateModalOpen(true);
      return;
    }

    if (category === 'npc') {
      setEditingNpcEntity(null);
      setIsNpcCreateModalOpen(true);
      return;
    }

    if (category === 'location') {
      setEditingLocationEntity(null);
      setIsLocationCreateModalOpen(true);
      return;
    }

    if (category === 'quest') {
      setEditingQuestEntity(null);
      setIsQuestCreateModalOpen(true);
      return;
    }

    if (category === 'organization') {
      setEditingOrganizationEntity(null);
      setIsOrganizationCreateModalOpen(true);
      return;
    }

    if (category === 'fauna') {
      setEditingFaunaEntity(null);
      setIsFaunaCreateModalOpen(true);
      return;
    }

    if (category === 'flora') {
      setEditingFloraEntity(null);
      setIsFloraCreateModalOpen(true);
      return;
    }

    if (category === 'pc') {
      setEditingPcEntity(null);
      setIsPcCreateModalOpen(true);
      return;
    }

    if (category === 'class' || category === 'archetype') {
      setClassModalPresetKind(category === 'archetype' ? 'archetype' : 'class');
      setIsClassCreateModalOpen(true);
      return;
    }

    if (category === 'feat') {
      handleCreateFeatDirectly();
      return;
    }

    if (category === 'ancestry') {
      const newId = 'entity-' + Date.now();
      const finalTitle = customTitle?.trim() || '';
      const blankAncestry = getEmptyAncestryData();
      const newEnt: HecosEntity = {
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
        tags: ['ancestry'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSecret: true,
      };
      setEditingEntity(newEnt);
      setActiveView('edit');
      return;
    }

    const newId = 'entity-' + Date.now();
    const finalTitle = customTitle?.trim() || '';
    const newEnt: HecosEntity = {
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
      tags: ['talento', ...(presetSubcategory ? [presetSubcategory] : [])],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: true,
    };
    setEditingEntity(newEnt);
    setActiveView('edit');
  };

  const handleCreateSpellDirectly = (presetCategory?: SpellCategoryType, presetSubcategory?: string) => {
    setSpellModalPresetCategory(presetCategory);
    setSpellModalPresetSubcategory(presetSubcategory);
    setIsSpellCreateModalOpen(true);
  };

  const handleCreateItemDirectly = (presetCategory?: ItemCategoryType, presetSubcategory?: string) => {
    setEditingItemEntity(null);
    setItemModalPresetCategory(presetCategory);
    setItemModalPresetSubcategory(presetSubcategory);
    setIsItemCreateModalOpen(true);
  };

  const handleCreateNewEntity = (presetCategoryOrSub?: string) => {
    if (presetCategoryOrSub === 'spell') {
      handleCreateSpellDirectly();
      return;
    }
    if (presetCategoryOrSub === 'item') {
      handleCreateItemDirectly();
      return;
    }
    if (presetCategoryOrSub === 'feat') {
      handleCreateFeatDirectly();
      return;
    }
    if (
      presetCategoryOrSub === 'peril' ||
      presetCategoryOrSub === 'creature' ||
      presetCategoryOrSub === 'perigo' ||
      presetCategoryOrSub === 'perigos'
    ) {
      setEditingPerilEntity(null);
      setIsPerilCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'class') {
      setClassModalPresetKind('class');
      setIsClassCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'archetype' || presetCategoryOrSub === 'arquetipos' || presetCategoryOrSub === 'vocacao') {
      setClassModalPresetKind('archetype');
      setIsClassCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'ancestry') {
      handleCreateEntityOfCategory('ancestry');
      return;
    }
    if (presetCategoryOrSub === 'npc') {
      setEditingNpcEntity(null);
      setIsNpcCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'location' || presetCategoryOrSub === 'locais') {
      setEditingLocationEntity(null);
      setIsLocationCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'quest' || presetCategoryOrSub === 'missoes' || presetCategoryOrSub === 'quests') {
      setEditingQuestEntity(null);
      setIsQuestCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'organization' || presetCategoryOrSub === 'organizacoes') {
      setEditingOrganizationEntity(null);
      setIsOrganizationCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'fauna') {
      setEditingFaunaEntity(null);
      setIsFaunaCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'flora') {
      setEditingFloraEntity(null);
      setIsFloraCreateModalOpen(true);
      return;
    }
    if (presetCategoryOrSub === 'pc') {
      setEditingPcEntity(null);
      setIsPcCreateModalOpen(true);
      return;
    }
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

  const handleEditEntity = (id: string) => {
    const ent = entities.find((e) => e.id === id || e.slug === id) || HecosStorage.getEntityById(id);
    if (!ent) return;
    if (ent.category === 'spell' || ent.spellData) {
      setEditingSpellEntity(ent);
      setIsSpellCreateModalOpen(true);
    } else if (ent.category === 'item' || ent.itemData) {
      setEditingItemEntity(ent);
      setIsItemCreateModalOpen(true);
    } else if (ent.category === 'peril' || ent.category === 'creature' || ent.perilData) {
      setEditingPerilEntity(ent);
      setIsPerilCreateModalOpen(true);
    } else if (ent.category === 'npc' || ent.npcData) {
      setEditingNpcEntity(ent);
      setIsNpcCreateModalOpen(true);
    } else if (ent.category === 'location' || ent.locationData) {
      setEditingLocationEntity(ent);
      setIsLocationCreateModalOpen(true);
    } else if (ent.category === 'quest' || ent.questData) {
      setEditingQuestEntity(ent);
      setIsQuestCreateModalOpen(true);
    } else if (ent.category === 'organization' || ent.organizationData) {
      setEditingOrganizationEntity(ent);
      setIsOrganizationCreateModalOpen(true);
    } else if (ent.category === 'fauna' || ent.faunaData) {
      setEditingFaunaEntity(ent);
      setIsFaunaCreateModalOpen(true);
    } else if (ent.category === 'flora' || ent.floraData) {
      setEditingFloraEntity(ent);
      setIsFloraCreateModalOpen(true);
    } else if (ent.category === 'pc' || ent.pcData) {
      setEditingPcEntity(ent);
      setIsPcCreateModalOpen(true);
    } else {
      setSelectedEntityId(ent.id);
      setEditingEntity(ent);
      setActiveView('edit');
    }
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
    // Check item permission using centralized hierarchical helper
    if (!HecosStorage.canUserAccessItem(e, currentUser)) {
      return false;
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
      if ((activeSubcategory === 'Vocação' || activeSubcategory === 'Arquétipos') && e.category === 'archetype') return true;
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
        (e.title || '').toLowerCase().includes(q) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
        (e.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      if (!match) return false;
    }

    if (selectedTagFilter) {
      if (!(e.tags || []).includes(selectedTagFilter)) return false;
    }

    return true;
  });

  // Ordenar alfabeticamente quando visualizando a categoria/subcategoria Ancestralidades
  const sortedCategoryEntities = useMemo(() => {
    const list = [...categoryEntities];
    const isAncestryView =
      selectedCategoryKey === 'ancestry' ||
      selectedCategoryKey === 'ancestralidades' ||
      activeSubcategory === 'Ancestralidades' ||
      activeSubcategory === 'Ancestry' ||
      (list.length > 0 && list.every((e) => e.category === 'ancestry'));

    if (isAncestryView) {
      list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));
    }
    return list;
  }, [categoryEntities, selectedCategoryKey, activeSubcategory]);

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
            const hasGroups = category.groups && category.groups.length > 0;
            const hasChildren = (category.children && category.children.length > 0) || hasGroups;
            const isExpanded = expandedMenus[category.id];
            const isSelected = selectedCategoryKey === category.id && !activeSubcategory;
            const Icon = category.icon;
            const folderPerm = HecosStorage.getFolderPermission(category.id);
            const isActualGm = currentUser?.role === 'gm';
            const canAccess = isActualGm || HecosStorage.canUserAccess(folderPerm.visibility, folderPerm.allowedUserIds, currentUser);

            if (!canAccess) return null;

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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    isSelected
                      ? 'shadow-md font-bold'
                      : 'hover:bg-zinc-900/60 text-zinc-300 border-transparent'
                  }`}
                  style={isSelected ? {
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}60`,
                    color: category.color,
                    boxShadow: `0 0 16px ${category.color}20`
                  } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: category.color }}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{category.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {isActualGm && category.id !== 'codex' && (
                      <VisibilityBadgeMenu
                        visibility={folderPerm.visibility}
                        allowedUserIds={folderPerm.allowedUserIds}
                        onChange={(newVis, newAllowed) => {
                          HecosStorage.setFolderPermission(category.id, newVis, newAllowed);
                          setExpandedMenus((prev) => ({ ...prev }));
                        }}
                      />
                    )}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedMenus((prev) => ({ ...prev, [category.id]: !prev[category.id] }));
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Grouped Submenus (Lore & Mecânicas) or Direct Children for Codex */}
                {hasChildren && isExpanded && (
                  <div className="pl-3 space-y-1.5 pt-1 border-l border-zinc-800/80 ml-3.5">
                    {hasGroups ? (
                      category.groups!.map((group) => {
                        const groupKey = `${category.id}-group-${group.id}`;
                        const isGroupExpanded = expandedMenus[groupKey] !== false; // default open

                        return (
                          <div key={group.id} className="space-y-0.5">
                            {/* Group Header (e.g., LORE / MECÂNICAS) */}
                            <div
                              onClick={() => {
                                setExpandedMenus((prev) => ({
                                  ...prev,
                                  [groupKey]: !isGroupExpanded
                                }));
                              }}
                              className="flex items-center justify-between px-2 py-1 rounded text-[11px] font-bold tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 cursor-pointer transition-colors select-none uppercase"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/70" />
                                <span>{group.name}</span>
                              </div>
                              <span className="text-zinc-500 hover:text-zinc-300">
                                {isGroupExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </span>
                            </div>

                            {/* Group Items */}
                            {isGroupExpanded && (
                              <div className="pl-2 space-y-0.5 border-l border-zinc-800/60 ml-2">
                                {(group.items || []).map((child) => {
                                  const targetCat = child.categoryKey || child.id || category.id;
                                  const isChildSelected = (effectiveCategoryKey === targetCat || activeSubcategory === child.subcategory) && activeView === (child.viewType || 'entities');
                                  const ChildIcon = child.icon;
                                  const subcatKey = child.subcategory || child.id;
                                  const folderPerm = HecosStorage.getFolderPermission(subcatKey);
                                  const isActualGm = currentUser?.role === 'gm';
                                  const canAccess = isActualGm || HecosStorage.canUserAccess(folderPerm.visibility, folderPerm.allowedUserIds, currentUser);

                                  if (!canAccess) return null;

                                  return (
                                    <div
                                      key={child.id}
                                      className="flex items-center justify-between group/subcat rounded-lg hover:bg-zinc-900/50 transition-all pr-1"
                                    >
                                      <div
                                        onClick={() => {
                                          setSelectedCategoryKey(targetCat);
                                          setActiveSubcategory(child.subcategory || null);
                                          setSelectedEntityId(null);
                                          setEditingEntity(null);
                                          if (child.viewType && child.viewType !== 'entities') {
                                            setActiveView(child.viewType);
                                          } else {
                                            setActiveView('entities');
                                          }
                                          setIsSidebarOpen(false);
                                        }}
                                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                                          isChildSelected
                                            ? 'font-semibold'
                                            : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                                        }`}
                                        style={isChildSelected ? {
                                          backgroundColor: `${child.color}20`,
                                          borderColor: `${child.color}70`,
                                          color: child.color,
                                          boxShadow: `0 0 12px ${child.color}20`
                                        } : undefined}
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
                      })
                    ) : (
                      category.children!.map((child) => {
                        const targetCat = child.categoryKey || child.id || category.id;
                        const isChildSelected = (effectiveCategoryKey === targetCat || activeSubcategory === child.subcategory) && activeView === (child.viewType || 'entities');
                        const ChildIcon = child.icon;
                        const subcatKey = child.subcategory || child.id;
                        const folderPerm = HecosStorage.getFolderPermission(subcatKey);
                        const isActualGm = currentUser?.role === 'gm';
                        const canAccess = isActualGm || HecosStorage.canUserAccess(folderPerm.visibility, folderPerm.allowedUserIds, currentUser);

                        if (!canAccess) return null;

                        return (
                          <div
                            key={child.id}
                            className="flex items-center justify-between group/subcat rounded-lg hover:bg-zinc-900/50 transition-all pr-1"
                          >
                            <div
                              onClick={() => {
                                setSelectedCategoryKey(targetCat);
                                setActiveSubcategory(child.subcategory || null);
                                setSelectedEntityId(null);
                                setEditingEntity(null);
                                if (child.viewType && child.viewType !== 'entities') {
                                  setActiveView(child.viewType);
                                } else {
                                  setActiveView('entities');
                                }
                                setIsSidebarOpen(false);
                              }}
                              className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                                isChildSelected
                                  ? 'font-semibold'
                                  : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                              }`}
                              style={isChildSelected ? {
                                backgroundColor: `${child.color}20`,
                                borderColor: `${child.color}70`,
                                color: child.color,
                                boxShadow: `0 0 12px ${child.color}20`
                              } : undefined}
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
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Controls */}
        <div className="p-3 bg-[#0d0b13] border-t border-zinc-800/80 space-y-2 text-xs">
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
          <div className="flex items-center gap-3 flex-wrap">
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

            {/* Back Navigation Button */}
            {(selectedCategoryKey !== 'codex' || activeSubcategory !== null || selectedEntityId !== null || editingEntity !== null || activeView !== 'entities') && (
              <button
                type="button"
                onClick={handleGoBack}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-cyan-300 text-xs font-bold transition-all shadow-sm cursor-pointer hover:border-cyan-500/50"
                title="Voltar ao nível anterior"
              >
                <ChevronLeft className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}

            {/* Interactive Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryKey('codex');
                  setActiveSubcategory(null);
                  setSelectedEntityId(null);
                  setEditingEntity(null);
                  setActiveView('entities');
                  setSearchFilter('');
                  setSelectedTagFilter(null);
                }}
                className={`uppercase tracking-wider font-bold transition-all hover:underline cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-800/60 ${
                  selectedCategoryKey === 'codex' && !activeSubcategory && !selectedEntityId && !editingEntity && activeView === 'entities'
                    ? 'text-cyan-300'
                    : 'text-zinc-400 hover:text-cyan-300'
                }`}
                title="Página Inicial do Codex Hecos"
              >
                Hecos
              </button>

              {/* Category Level (only if not at root Codex) */}
              {(() => {
                const effectiveCatKey = currentEntity ? currentEntity.category : effectiveCategoryKey;
                if (effectiveCatKey === 'codex' && !currentEntity) return null;
                const catMeta = getCategoryMeta(effectiveCatKey);
                return (
                  <>
                    <span className="text-zinc-700 select-none">/</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryKey(effectiveCatKey);
                        setActiveSubcategory(null);
                        setSelectedEntityId(null);
                        setEditingEntity(null);
                        setActiveView('entities');
                      }}
                      className={`font-bold transition-all hover:underline cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-800/60 ${
                        !activeSubcategory && !selectedEntityId && !editingEntity
                          ? 'text-cyan-300'
                          : 'text-zinc-300 hover:text-cyan-300'
                      }`}
                      title={`Navegar para a categoria ${catMeta.name}`}
                    >
                      {catMeta.name}
                    </button>
                  </>
                );
              })()}

              {/* Subcategory Level (prevent duplicating category name) */}
              {(() => {
                const effectiveCatKey = currentEntity ? currentEntity.category : effectiveCategoryKey;
                const catMeta = getCategoryMeta(effectiveCatKey);
                const sub = activeSubcategory || currentEntity?.subcategory;
                if (!sub || sub.toLowerCase() === catMeta.name.toLowerCase()) return null;
                return (
                  <>
                    <span className="text-zinc-700 select-none">/</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubcategory(sub);
                        setSelectedEntityId(null);
                        setEditingEntity(null);
                        setActiveView('entities');
                      }}
                      className={`font-medium transition-all hover:underline cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-800/60 ${
                        !selectedEntityId && !editingEntity
                          ? 'text-amber-300 font-bold'
                          : 'text-zinc-400 hover:text-amber-300'
                      }`}
                      title={`Navegar para a subcategoria ${sub}`}
                    >
                      {sub}
                    </button>
                  </>
                );
              })()}

              {/* Entity Level */}
              {selectedEntityId && currentEntity && (
                <>
                  <span className="text-zinc-700 select-none">/</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntity(null);
                      setActiveView('view');
                    }}
                    className={`font-bold truncate max-w-[150px] sm:max-w-[280px] hover:text-cyan-300 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-800/60 ${
                      !editingEntity ? 'text-cyan-200' : 'text-zinc-400'
                    }`}
                    title={`Visualizar ${currentEntity.title}`}
                  >
                    {currentEntity.title}
                  </button>
                </>
              )}

              {/* Special Views or Editing Level */}
              {editingEntity && (
                <>
                  <span className="text-zinc-700 select-none">/</span>
                  <span className="text-amber-400 font-bold px-1 py-0.5">Editar</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Utility Tools (AoN, Dice, Music, Drive, New Article) */}
          <div className="flex items-center gap-2">
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
                  <>
                    <button
                      type="button"
                      onClick={() => setIsTrashOpen(true)}
                      className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(225,29,72,0.25)]"
                      title="Lixeira do Sistema (Restaurar ou Excluir Definitivamente)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden xl:inline">Lixeira</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserManagementModalOpen(true)}
                      className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                      title="Gerenciar Jogadores e Senhas (Apenas GM)"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden xl:inline">Jogadores</span>
                    </button>
                  </>
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
            {isActualGm && (
              <button
                onClick={() => handleCreateNewEntity(activeSubcategory || selectedCategoryKey)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Novo Artigo</span>
              </button>
            )}
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
              onEditEntity={(id) => handleEditEntity(id)}
              onDeleteEntity={handleDeleteEntity}
              isGmMode={isActualGm}
            />
          )}

          {/* VIEW: Tag Explorer */}
          {activeView === 'tags' && (
            <TagExplorer
              onNavigateEntity={handleNavigateEntity}
              initialSelectedTag={selectedTagFilter || undefined}
            />
          )}

          {/* VIEW: Quest Kanban Board */}
          {activeView === 'quests' && (
            <QuestBoard
              onNavigateEntity={handleNavigateEntity}
              onEditEntity={(ent) => handleEditEntity(ent.id)}
              onCreateQuest={() => handleCreateNewEntity('quest')}
              onDeleteEntity={handleDeleteEntity}
              isGmMode={isActualGm}
            />
          )}

          {/* VIEW: Single Entity Detailed View */}
          {activeView === 'view' && currentEntity && (
            <EntityView
              entity={currentEntity}
              onEdit={() => handleEditEntity(currentEntity.id)}
              onDelete={() => handleDeleteEntity(currentEntity.id)}
              onNavigate={handleNavigateEntity}
              onTagClick={(tag) => {
                setSelectedTagFilter(tag);
                setActiveView('tags');
              }}
            />
          )}

          {/* VIEW: Notion & PF2e Entity Editor (GM Only) */}
          {activeView === 'edit' && editingEntity && isActualGm && (
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

          {/* VIEW: Category Entities Grid View (Default) OR Custom Explorers for Feats, Spells, Items */}
          {activeView === 'entities' && (
            effectiveCategoryKey === 'feat' ? (
              <FeatExplorer
                entities={entities}
                onSelectEntity={handleNavigateEntity}
                onEditEntity={(id) => handleEditEntity(id)}
                onCreateFeat={handleCreateFeatDirectly}
                onDeleteEntity={handleDeleteEntity}
                onTagClick={(tag) => {
                  setSelectedTagFilter(tag);
                  setActiveView('tags');
                }}
                isGmMode={isActualGm}
              />
            ) : effectiveCategoryKey === 'spell' ? (
              <SpellExplorer
                entities={entities}
                onSelectEntity={handleNavigateEntity}
                onEditEntity={(id) => handleEditEntity(id)}
                onCreateSpell={handleCreateSpellDirectly}
                onDeleteEntity={handleDeleteEntity}
                onTagClick={(tag) => {
                  setSelectedTagFilter(tag);
                  setActiveView('tags');
                }}
                isGmMode={isActualGm}
              />
            ) : effectiveCategoryKey === 'item' ? (
              <ItemExplorer
                entities={entities}
                onSelectEntity={handleNavigateEntity}
                onEditEntity={(id) => handleEditEntity(id)}
                onCreateItem={handleCreateItemDirectly}
                onDeleteEntity={handleDeleteEntity}
                onTagClick={(tag) => {
                  setSelectedTagFilter(tag);
                  setActiveView('tags');
                }}
                isGmMode={isActualGm}
              />
            ) : effectiveCategoryKey === 'quest' ? (
              <QuestBoard
                onNavigateEntity={handleNavigateEntity}
                onEditEntity={(ent) => handleEditEntity(ent.id)}
                onCreateQuest={() => handleCreateNewEntity('quest')}
                onDeleteEntity={handleDeleteEntity}
                isGmMode={isActualGm}
              />
            ) : effectiveCategoryKey === 'codex' && !activeSubcategory && !searchFilter.trim() && !selectedTagFilter ? (
              <HomePage
                entities={entities}
                onSelectEntity={handleNavigateEntity}
                onNavigateCategory={(catKey) => {
                  setSelectedCategoryKey(catKey);
                  setActiveSubcategory(null);
                  setSelectedEntityId(null);
                  setEditingEntity(null);
                  if (catKey === 'quest' || catKey === 'quests') {
                    setActiveView('quests');
                  } else if (catKey === 'timeline') {
                    setActiveView('timeline');
                  } else if (catKey === 'map') {
                    setActiveView('map');
                  } else {
                    setActiveView('entities');
                  }
                }}
                onCreateArticle={() => setIsNewArticleModalOpen(true)}
                isGm={isActualGm}
              />
            ) : !['diary', 'rule', 'gm_notes', 'timeline'].includes(effectiveCategoryKey) ? (
              <CategoryEntityExplorer
                categoryKey={effectiveCategoryKey}
                activeSubcategory={activeSubcategory}
                onSelectEntity={(id) => {
                  const ent = entities.find((e) => e.id === id || e.slug === id);
                  if (
                    ent &&
                    (ent.category === 'peril' ||
                      ent.category === 'creature' ||
                      ent.perilData ||
                      ent.category === 'npc' ||
                      ent.npcData ||
                      ent.category === 'ancestry' ||
                      ent.ancestryData ||
                      ent.category === 'fauna' ||
                      ent.faunaData ||
                      ent.category === 'flora' ||
                      ent.floraData ||
                      ent.category === 'location' ||
                      ent.locationData ||
                      ent.category === 'organization' ||
                      ent.organizationData ||
                      ent.category === 'pc' ||
                      ent.pcData)
                  ) {
                    pushDrawer('entity', { entityId: ent.id }, ent.title);
                  } else {
                    handleNavigateEntity(id);
                  }
                }}
                onEditEntity={(id) => handleEditEntity(id)}
                onDeleteEntity={handleDeleteEntity}
                onCreateNewEntity={(cat) => handleCreateNewEntity(cat)}
                isActualGm={isActualGm}
                selectedTagFilter={selectedTagFilter}
                onClearTagFilter={() => setSelectedTagFilter(null)}
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
                    {/* View Mode Toggle: Grid vs Compact List */}
                    <div className="flex items-center bg-black/50 border border-zinc-800 p-0.5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEntityListViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          entityListViewMode === 'grid'
                            ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Visualização em Grade"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntityListViewMode('compact')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          entityListViewMode === 'compact'
                            ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Visualização Compacta Minimalista"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>

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

                {/* Entities Cards Grid OR Compact Table */}
                {sortedCategoryEntities.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#09080d] border border-zinc-800/60 space-y-3">
                    <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-sm text-zinc-400">Nenhum artigo encontrado nesta categoria com os filtros atuais.</p>
                    {isActualGm && (
                      <button
                        onClick={() => handleCreateNewEntity(activeSubcategory || selectedCategoryKey)}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition-all shadow-md cursor-pointer"
                      >
                        Criar Primeira Entrada em {activeSubcategory || getCategoryMeta(selectedCategoryKey).name}
                      </button>
                    )}
                  </div>
                ) : entityListViewMode === 'compact' ? (
                  /* COMPACT MINIMALIST TABLE VIEW */
                  <div className="bg-[#09080e] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#120f1c] border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4">Nome / Título</th>
                            <th className="py-2.5 px-3">Categoria</th>
                            <th className="py-2.5 px-3">Tags</th>
                            <th className="py-2.5 px-3">Atualizado</th>
                            <th className="py-2.5 px-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {sortedCategoryEntities.map((item) => {
                            const isCiano = ['pc', 'spell', 'ancestry', 'rule'].includes(item.category);
                            const isMalva = ['npc', 'item', 'flora', 'class', 'feat', 'timeline'].includes(item.category);

                            return (
                              <tr
                                key={item.id}
                                onClick={() => handleNavigateEntity(item.id)}
                                className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                              >
                                <td className="py-2.5 px-4 font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
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
                                <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                                  <span
                                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                      isCiano
                                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                        : isMalva
                                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                                        : 'bg-rose-950 text-rose-300 border-rose-800'
                                    }`}
                                  >
                                    {getCategoryMeta(item.category).name}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {(item.tags || []).slice(0, 3).map((t, tIdx) => (
                                      <span
                                        key={`${item.id}-tbltag-${t}-${tIdx}`}
                                        className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 border border-zinc-800"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-zinc-500 font-mono text-[10px]">
                                  {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('pt-BR') : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
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
                                        onClick={() => handleDeleteEntity(item.id)}
                                        className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3 h-3" />
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
                  /* STANDARD CARDS GRID VIEW - Adaptive: 4 cols on >=1080p for Perils, 3 cols on <1080p */
                  <div
                    className={
                      effectiveCategoryKey === 'peril' || selectedCategoryKey === 'peril'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-4 gap-3 sm:gap-4 items-stretch'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1800px]:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-3.5 items-stretch'
                    }
                  >
                    {sortedCategoryEntities.map((item) => {
                      if (item.category === 'ancestry') {
                        return (
                          <AncestryCard
                            key={item.id}
                            entity={item}
                            onSelect={(id) => {
                              window.dispatchEvent(
                                new CustomEvent('hecos:open-entity-drawer', {
                                  detail: { entityId: id, slug: item.slug }
                                })
                              );
                            }}
                            onEdit={(id) => {
                              const ent = entities.find((e) => e.id === id);
                              if (ent) {
                                setEditingEntity(ent);
                                setActiveView('edit');
                              }
                            }}
                            onDelete={handleDeleteEntity}
                            isGmMode={isActualGm}
                          />
                        );
                      }

                      if (item.category === 'peril' || item.category === 'creature' || item.perilData) {
                        return (
                          <PerilCard
                            key={item.id}
                            entity={item}
                            onSelect={handleNavigateEntity}
                            onEdit={(id) => {
                              const ent = entities.find((e) => e.id === id);
                              if (ent) {
                                setEditingPerilEntity(ent);
                                setIsPerilCreateModalOpen(true);
                              }
                            }}
                            onDelete={handleDeleteEntity}
                            isGmMode={isActualGm}
                          />
                        );
                      }

                      return (
                        <EntityCard
                          key={item.id}
                          entity={item}
                          onSelect={handleNavigateEntity}
                          onDelete={handleDeleteEntity}
                          onTagClick={(tag) => setSelectedTagFilter(tag)}
                          isGmMode={isActualGm}
                        />
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

      {/* Confirm Delete Modal (Moves to Lixeira / Trash by default) */}
      <ConfirmDeleteModal
        isOpen={!!entityToDelete}
        itemName={entityToDelete?.title || ''}
        itemType="Artigo"
        isPermanent={false}
        confirmLabel="Mover para Lixeira"
        onConfirm={confirmDeleteEntity}
        onCancel={() => setEntityToDelete(null)}
      />

      <NewArticleModal
        isOpen={isNewArticleModalOpen}
        onClose={() => setIsNewArticleModalOpen(false)}
        onCreate={handleCreateEntityOfCategory}
      />

      {/* Robust PF2e Spell Creation Modal */}
      <SpellCreateModal
        isOpen={isSpellCreateModalOpen}
        onClose={() => {
          setIsSpellCreateModalOpen(false);
          setEditingSpellEntity(null);
        }}
        entityToEdit={editingSpellEntity || undefined}
        presetCategory={spellModalPresetCategory}
        presetSubcategory={spellModalPresetSubcategory}
        onSave={(newSpellEntity) => {
          refreshEntities();
          if (activeView === 'entities') {
            window.dispatchEvent(
              new CustomEvent('hecos:open-spell-drawer', { detail: { spellId: newSpellEntity.id } })
            );
          } else {
            handleNavigateEntity(newSpellEntity.id);
          }
          setIsSpellCreateModalOpen(false);
          setEditingSpellEntity(null);
        }}
      />

      {/* Robust PF2e Item Creation & Editing Modal */}
      <ItemCreateModal
        isOpen={isItemCreateModalOpen}
        onClose={() => {
          setIsItemCreateModalOpen(false);
          setEditingItemEntity(null);
        }}
        entityToEdit={editingItemEntity || undefined}
        presetCategory={itemModalPresetCategory}
        presetSubcategory={itemModalPresetSubcategory}
        onSave={(newItemEntity) => {
          refreshEntities();
          if (activeView === 'entities') {
            window.dispatchEvent(
              new CustomEvent('hecos:open-item-drawer', { detail: { itemId: newItemEntity.id } })
            );
          } else {
            handleNavigateEntity(newItemEntity.id);
          }
          setIsItemCreateModalOpen(false);
          setEditingItemEntity(null);
        }}
      />

      {/* Robust PF2e Perils & Hazards Creation Modal */}
      <PerilCreateModal
        isOpen={isPerilCreateModalOpen}
        initialEntity={editingPerilEntity}
        onClose={() => {
          const edited = editingPerilEntity;
          setIsPerilCreateModalOpen(false);
          setEditingPerilEntity(null);
          if (edited) {
            window.dispatchEvent(
              new CustomEvent('hecos:open-entity-drawer', {
                detail: { entityId: edited.id, slug: edited.slug }
              })
            );
          }
        }}
        onSave={(newPerilEntity) => {
          refreshEntities();
          window.dispatchEvent(
            new CustomEvent('hecos:open-entity-drawer', {
              detail: { entityId: newPerilEntity.id, slug: newPerilEntity.slug }
            })
          );
          setIsPerilCreateModalOpen(false);
          setEditingPerilEntity(null);
        }}
      />

      {/* Robust PF2e Class & Archetype Creation Modal */}
      <ClassCreateModal
        isOpen={isClassCreateModalOpen}
        initialKind={classModalPresetKind}
        onClose={() => setIsClassCreateModalOpen(false)}
        onSave={(newClassEntity) => {
          refreshEntities();
          handleNavigateEntity(newClassEntity.id);
          setIsClassCreateModalOpen(false);
        }}
      />

      {/* Hecos NPC Creation & Edition Modal */}
      <NPCCreateModal
        isOpen={isNpcCreateModalOpen}
        initEntity={editingNpcEntity}
        onClose={() => {
          setIsNpcCreateModalOpen(false);
          setEditingNpcEntity(null);
        }}
        onSave={(newNpcEntity) => {
          refreshEntities();
          handleNavigateEntity(newNpcEntity.id);
          setIsNpcCreateModalOpen(false);
          setEditingNpcEntity(null);
        }}
      />

      {/* Hecos Location Creation & Edition Modal */}
      <LocationCreateModal
        isOpen={isLocationCreateModalOpen}
        initEntity={editingLocationEntity}
        onClose={() => {
          setIsLocationCreateModalOpen(false);
          setEditingLocationEntity(null);
        }}
        onSave={(newEntity) => {
          refreshEntities();
          handleNavigateEntity(newEntity.id);
          setIsLocationCreateModalOpen(false);
          setEditingLocationEntity(null);
        }}
      />

      {/* Hecos Quest Creation & Edition Modal */}
      <QuestCreateModal
        isOpen={isQuestCreateModalOpen}
        initEntity={editingQuestEntity}
        onClose={() => {
          setIsQuestCreateModalOpen(false);
          setEditingQuestEntity(null);
        }}
        onSave={(newEntity) => {
          refreshEntities();
          handleNavigateEntity(newEntity.id);
          setIsQuestCreateModalOpen(false);
          setEditingQuestEntity(null);
        }}
      />

      {/* Hecos Organization Creation & Edition Modal */}
      <OrganizationCreateModal
        isOpen={isOrganizationCreateModalOpen}
        initEntity={editingOrganizationEntity}
        onClose={() => {
          setIsOrganizationCreateModalOpen(false);
          setEditingOrganizationEntity(null);
        }}
        onSave={(newEntity) => {
          refreshEntities();
          handleNavigateEntity(newEntity.id);
          setIsOrganizationCreateModalOpen(false);
          setEditingOrganizationEntity(null);
        }}
      />

      {/* Hecos Fauna Creation & Edition Modal */}
      <FaunaCreateModal
        isOpen={isFaunaCreateModalOpen}
        initEntity={editingFaunaEntity}
        onClose={() => {
          setIsFaunaCreateModalOpen(false);
          setEditingFaunaEntity(null);
        }}
        onSave={(newEntity) => {
          refreshEntities();
          handleNavigateEntity(newEntity.id);
          setIsFaunaCreateModalOpen(false);
          setEditingFaunaEntity(null);
        }}
      />

      {/* Hecos Flora Creation & Edition Modal */}
      <FloraCreateModal
        isOpen={isFloraCreateModalOpen}
        initEntity={editingFloraEntity}
        onClose={() => {
          setIsFloraCreateModalOpen(false);
          setEditingFloraEntity(null);
        }}
        onSave={(newEntity) => {
          refreshEntities();
          handleNavigateEntity(newEntity.id);
          setIsFloraCreateModalOpen(false);
          setEditingFloraEntity(null);
        }}
      />

      {/* Hecos PC Creation & Edition Modal */}
      <PCCreateModal
        isOpen={isPcCreateModalOpen}
        initEntity={editingPcEntity}
        onClose={() => {
          setIsPcCreateModalOpen(false);
          setEditingPcEntity(null);
        }}
        onSave={(newEntity) => {
          refreshEntities();
          handleNavigateEntity(newEntity.id);
          setIsPcCreateModalOpen(false);
          setEditingPcEntity(null);
        }}
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

      <TrashBinModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onRestoreEntity={(restored) => {
          refreshEntities();
          handleNavigateEntity(restored.id);
        }}
      />

      {/* Multi-layered Stackable Drawers */}
      {drawerStack.map((item, index) => {
        const isTopmost = index === drawerStack.length - 1;

        if (item.type === 'entity') {
          return (
            <EntityDrawer
              key={item.id}
              entityId={item.data.entityId}
              isOpen={true}
              onClose={() => closeDrawerAt(index)}
              onNavigateToPage={(id) => {
                closeAllDrawers();
                handleNavigateEntity(id);
              }}
              onEditEntity={(id) => {
                closeAllDrawers();
                handleEditEntity(id);
              }}
              isGmMode={isGmMode}
              stackIndex={index}
              stackTotal={drawerStack.length}
              stackBreadcrumbs={drawerBreadcrumbs}
              onJumpToStackIndex={jumpToDrawerIndex}
              onCloseAll={closeAllDrawers}
            />
          );
        }

        if (item.type === 'trait') {
          return (
            <TraitDrawer
              key={item.id}
              trait={item.data.trait}
              isOpen={true}
              onClose={() => closeDrawerAt(index)}
              onNavigate={(id) => {
                closeAllDrawers();
                handleNavigateEntity(id);
              }}
              isGmMode={isGmMode}
              stackIndex={index}
              stackTotal={drawerStack.length}
              stackBreadcrumbs={drawerBreadcrumbs}
              onJumpToStackIndex={jumpToDrawerIndex}
              onCloseAll={closeAllDrawers}
            />
          );
        }

        if (item.type === 'tag') {
          return (
            <TagDrawer
              key={item.id}
              tag={item.data.tag}
              isOpen={true}
              onClose={() => closeDrawerAt(index)}
              onNavigate={(id) => {
                closeAllDrawers();
                handleNavigateEntity(id);
              }}
              isGmMode={isGmMode}
              onTagUpdated={refreshEntities}
              stackIndex={index}
              stackTotal={drawerStack.length}
              stackBreadcrumbs={drawerBreadcrumbs}
              onJumpToStackIndex={jumpToDrawerIndex}
              onCloseAll={closeAllDrawers}
            />
          );
        }

        if (item.type === 'feat') {
          return (
            <FeatDrawer
              key={item.id}
              featId={item.data.featId}
              entities={entities}
              isOpen={true}
              onClose={() => closeDrawerAt(index)}
              onNavigateFullPage={(id) => {
                closeAllDrawers();
                handleNavigateEntity(id);
              }}
              onEditFeat={(feat) => {
                closeAllDrawers();
                handleEditEntity(feat.id);
              }}
              onDeleteFeat={(id) => {
                closeAllDrawers();
                handleDeleteEntity(id);
              }}
              onTagClick={(tag) => {
                pushDrawer('tag', { tag });
              }}
              isGmMode={isGmMode}
              stackIndex={index}
              stackTotal={drawerStack.length}
              stackBreadcrumbs={drawerBreadcrumbs}
              onJumpToStackIndex={jumpToDrawerIndex}
              onCloseAll={closeAllDrawers}
            />
          );
        }

        if (item.type === 'item') {
          return (
            <ItemDrawer
              key={item.id}
              itemId={item.data.itemId}
              entities={entities}
              isOpen={true}
              onClose={() => closeDrawerAt(index)}
              onNavigateFullPage={(id) => {
                closeAllDrawers();
                handleNavigateEntity(id);
              }}
              onEditItem={(itm) => {
                closeAllDrawers();
                handleEditEntity(itm.id);
              }}
              onDeleteItem={(id) => {
                closeAllDrawers();
                handleDeleteEntity(id);
              }}
              onTagClick={(tag) => {
                pushDrawer('tag', { tag });
              }}
              isGmMode={isGmMode}
              stackIndex={index}
              stackTotal={drawerStack.length}
              stackBreadcrumbs={drawerBreadcrumbs}
              onJumpToStackIndex={jumpToDrawerIndex}
              onCloseAll={closeAllDrawers}
            />
          );
        }

        return null;
      })}

      {/* Global Tooltip that overlays all windows with highest z-index */}
      <GlobalTooltip />
    </div>
  );
}

export default App;

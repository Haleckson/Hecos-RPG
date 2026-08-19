import { HecosEntity, InteractiveMapData, YouTubeAmbianceTrack, GoogleDriveResource, TagInfo, HecosUser, FolderPermission, ItemVisibility } from '../types';
import { INITIAL_ENTITIES, INITIAL_MAPS, INITIAL_YOUTUBE_TRACKS, INITIAL_DRIVE_RESOURCES } from '../data/initialHecosData';
import {
  syncEntityToFirebase,
  deleteEntityFromFirebase,
  loadEntitiesFromFirebase,
  subscribeToEntitiesRealtime,
  subscribeToDeletedEntitiesRealtime,
  subscribeToMapsRealtime,
  syncMapToFirebase,
  loadMapsFromFirebase,
  seedDatabaseIfEmpty,
  subscribeToFeatCategoriesRealtime,
  syncFeatCategoriesToFirebase,
  subscribeToSecretFoldersRealtime,
  syncSecretFoldersToFirebase,
  subscribeToPublicFoldersRealtime,
  syncPublicFoldersToFirebase,
  syncUsersToFirebase,
  loadUsersFromFirebase,
  subscribeToUsersRealtime,
  syncFolderPermissionsToFirebase,
  loadFolderPermissionsFromFirebase,
  subscribeToFolderPermissionsRealtime
} from './firebase';

const STORAGE_KEYS = {
  ENTITIES: 'hecos_entities_v1',
  DELETED_ENTITIES: 'hecos_deleted_entities_v1',
  MAPS: 'hecos_maps_v1',
  YOUTUBE_TRACKS: 'hecos_youtube_v1',
  DRIVE_RESOURCES: 'hecos_drive_v1',
  FEAT_CATEGORIES: 'hecos_feat_categories_v1',
  GM_MODE: 'hecos_gm_mode_v1',
  RECENT_PAGES: 'hecos_recent_pages_v1',
  SECRET_FOLDERS: 'hecos_secret_folders_v1',
  PUBLIC_FOLDERS: 'hecos_public_folders_v1',
  USERS: 'hecos_users_v1',
  CURRENT_USER: 'hecos_current_user_v1',
  FOLDER_PERMISSIONS: 'hecos_folder_permissions_v1',
};

export const INITIAL_ADMIN_USER: HecosUser = {
  id: 'gm_henrick',
  username: 'Henrick(GM)',
  password: '159753',
  name: 'Henrick (GM)',
  role: 'gm',
  createdAt: new Date().toISOString()
};

export const DEFAULT_FEAT_CATEGORIES_CONFIG: Record<string, string[]> = {
  general: ['Combate', 'Defesa', 'Mobilidade', 'Sentidos & Percepção', 'Sobrevivência', 'Iniciativa', 'Utilitários'],
  skill: ['Acrobacia', 'Arcanismo', 'Atletismo', 'Diplomacia', 'Enganação', 'Furtividade', 'Intimidação', 'Ladrongagem', 'Manufatura', 'Medicina', 'Natureza', 'Ocultismo', 'Performance', 'Religião', 'Sociedade', 'Sobrevivência'],
  class: ['Fighter (Guerreiro)', 'Wizard (Mago)', 'Rogue (Ladino)', 'Cleric (Clérigo)', 'Champion (Campeão)', 'Barbarian (Bárbaro)', 'Bard (Bardo)', 'Druid (Druida)', 'Monk (Monge)', 'Ranger (Patrulheiro)', 'Sorcerer (Feiticeiro)', 'Thaumaturge', 'Guerreiro da Obsidiana'],
  archetype: ['Caminhante da Penumbra', 'Cavaleiro', 'Assassino', 'Duelista', 'Médico de Batalha', 'Mestre de Armas', 'Arquimago do Eclipse', 'Sentinela do Vazio'],
  ancestry: ['Humano', 'Elfo', 'Anão', 'Umbralis', 'Corine', 'Gnomo', 'Goblin', 'Golias', 'Meio-Elfo', 'Versátil'],
  extras: ['Eclipse & Penumbra', 'Bênçãos do Vazio', 'Rituais de Obsidiana', 'Relíquias Vivas', 'Homebrew']
};

type EntitySubscriber = (entities: HecosEntity[]) => void;
type MapSubscriber = (maps: InteractiveMapData[]) => void;
type FeatCategoriesSubscriber = (config: Record<string, string[]>) => void;

export class HecosStorage {
  private static entitiesCache: HecosEntity[] | null = null;
  private static mapsCache: InteractiveMapData[] | null = null;
  private static tracksCache: YouTubeAmbianceTrack[] | null = null;
  private static driveCache: GoogleDriveResource[] | null = null;
  private static featCategoriesCache: Record<string, string[]> | null = null;
  private static usersCache: HecosUser[] | null = null;
  private static currentUserCache: HecosUser | null = null;
  private static folderPermissionsCache: Record<string, FolderPermission> | null = null;

  private static entitySubscribers = new Set<EntitySubscriber>();
  private static mapSubscribers = new Set<MapSubscriber>();
  private static featCategoriesSubscribers = new Set<FeatCategoriesSubscriber>();
  private static userSubscribers = new Set<(user: HecosUser | null) => void>();
  private static usersListSubscribers = new Set<(users: HecosUser[]) => void>();
  private static folderPermissionsSubscribers = new Set<(perms: Record<string, FolderPermission>) => void>();
  private static isRealtimeInitialized = false;

  /**
   * Subscribe to feat subcategories configuration
   */
  static subscribeFeatCategories(subscriber: FeatCategoriesSubscriber): () => void {
    subscriber(this.getAllFeatSubcategoriesConfig());
    this.featCategoriesSubscribers.add(subscriber);
    return () => {
      this.featCategoriesSubscribers.delete(subscriber);
    };
  }

  private static notifyFeatCategoriesSubscribers(): void {
    const config = this.getAllFeatSubcategoriesConfig();
    this.featCategoriesSubscribers.forEach((sub) => {
      try {
        sub(config);
      } catch (e) {
        console.warn("Error notifying feat categories subscriber:", e);
      }
    });
  }

  /**
   * Subscribe to real-time entity updates
   */
  static subscribeEntities(subscriber: EntitySubscriber): () => void {
    this.ensureRealtimeInitialized();
    subscriber(this.getEntities());
    this.entitySubscribers.add(subscriber);
    return () => {
      this.entitySubscribers.delete(subscriber);
    };
  }

  /**
   * Subscribe to real-time map updates
   */
  static subscribeMaps(subscriber: MapSubscriber): () => void {
    this.ensureRealtimeInitialized();
    subscriber(this.getMaps());
    this.mapSubscribers.add(subscriber);
    return () => {
      this.mapSubscribers.delete(subscriber);
    };
  }

  private static notifyEntitySubscribers(): void {
    const list = this.getEntities();
    this.entitySubscribers.forEach((sub) => {
      try {
        sub(list);
      } catch (e) {
        console.warn("Error notifying entity subscriber:", e);
      }
    });
  }

  private static notifyMapSubscribers(): void {
    const list = this.getMaps();
    this.mapSubscribers.forEach((sub) => {
      try {
        sub(list);
      } catch (e) {
        console.warn("Error notifying map subscriber:", e);
      }
    });
  }

  /**
   * Setup real-time listeners with Firebase Realtime Database
   */
  static ensureRealtimeInitialized(): void {
    if (this.isRealtimeInitialized) return;
    this.isRealtimeInitialized = true;

    // Seed RTDB with initial lore if completely empty
    seedDatabaseIfEmpty(INITIAL_ENTITIES).catch(() => {});

    // Listen for deleted entities in real-time from other devices
    subscribeToDeletedEntitiesRealtime((deletedIds) => {
      if (!deletedIds || deletedIds.length === 0) return;
      const currentDeleted = this.getDeletedEntityIds();
      let changed = false;
      deletedIds.forEach((id) => {
        if (!currentDeleted.has(id)) {
          currentDeleted.add(id);
          currentDeleted.add(id.toLowerCase().trim());
          changed = true;
        }
      });
      if (changed) {
        this.saveDeletedEntityIds(currentDeleted);
        const filtered = this.getEntities();
        this.entitiesCache = filtered;
        this.saveEntitiesLocal(filtered);
        this.notifyEntitySubscribers();
      }
    });

    // Start real-time Realtime Database listener for entities
    subscribeToEntitiesRealtime((firebaseList) => {
      if (!firebaseList || firebaseList.length === 0) return;
      const deletedIds = this.getDeletedEntityIds();
      const current = this.getEntities();
      const map = new Map<string, HecosEntity>();

      current.forEach((e) => {
        if (!this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)) {
          map.set(e.id, e);
        }
      });

      let hasNewChanges = false;
      firebaseList.forEach((e: any) => {
        if (e && e.id && !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)) {
          const existing = map.get(e.id);
          // If not existing or Firebase RTDB node has newer update
          if (!existing || (e.updatedAt && (!existing.updatedAt || e.updatedAt > existing.updatedAt))) {
            map.set(e.id, e);
            hasNewChanges = true;
          }
        }
      });

      if (hasNewChanges || map.size !== current.length) {
        const merged = Array.from(map.values());
        this.entitiesCache = merged;
        this.saveEntitiesLocal(merged);
        this.notifyEntitySubscribers();
      }
    });

    // Start real-time listener for maps
    subscribeToMapsRealtime((mapsList) => {
      if (!mapsList || mapsList.length === 0) return;
      const current = this.getMaps();
      const map = new Map<string, InteractiveMapData>();
      current.forEach(m => map.set(m.id, m));
      mapsList.forEach((m: any) => {
        if (m && m.id) {
          map.set(m.id, m);
        }
      });
      const merged = Array.from(map.values());
      this.mapsCache = merged;
      this.saveMaps(merged);
      this.notifyMapSubscribers();
    });

    // Start real-time listener for feat categories & subcategories
    subscribeToFeatCategoriesRealtime((categoriesConfig) => {
      if (!categoriesConfig || typeof categoriesConfig !== 'object') return;
      this.featCategoriesCache = categoriesConfig;
      try {
        localStorage.setItem(STORAGE_KEYS.FEAT_CATEGORIES, JSON.stringify(categoriesConfig));
      } catch (e) {
        console.warn("Error saving categories to local:", e);
      }
      this.notifyFeatCategoriesSubscribers();
    });

    // Start real-time listener for public (revealed) folders
    subscribeToPublicFoldersRealtime((publicFolders) => {
      if (!Array.isArray(publicFolders)) return;
      try {
        localStorage.setItem(STORAGE_KEYS.PUBLIC_FOLDERS, JSON.stringify(publicFolders));
      } catch (e) {
        console.warn("Error saving public folders to local:", e);
      }
      this.notifyEntitySubscribers();
    });

    // Start real-time listener for secret folders (backward compatibility)
    subscribeToSecretFoldersRealtime((secretFolders) => {
      if (!Array.isArray(secretFolders)) return;
      try {
        localStorage.setItem(STORAGE_KEYS.SECRET_FOLDERS, JSON.stringify(secretFolders));
      } catch (e) {
        console.warn("Error saving secret folders to local:", e);
      }
      this.notifyEntitySubscribers();
    });

    // Start real-time listener for users
    subscribeToUsersRealtime((firebaseUsers) => {
      if (!firebaseUsers || firebaseUsers.length === 0) return;
      const current = this.getUsers();
      const map = new Map<string, HecosUser>();
      current.forEach((u) => map.set(u.id, u));
      firebaseUsers.forEach((u) => {
        if (u && u.id) map.set(u.id, u);
      });
      if (!map.has(INITIAL_ADMIN_USER.id)) {
        map.set(INITIAL_ADMIN_USER.id, INITIAL_ADMIN_USER);
      }
      this.usersCache = Array.from(map.values());
      this.saveUsersLocal(this.usersCache);
      this.notifyUsersListSubscribers();
    });

    // Start real-time listener for folder permissions
    subscribeToFolderPermissionsRealtime((perms) => {
      if (!perms) return;
      this.folderPermissionsCache = perms;
      try {
        localStorage.setItem(STORAGE_KEYS.FOLDER_PERMISSIONS, JSON.stringify(perms));
      } catch {}
      this.notifyEntitySubscribers();
    });
  }

  /**
   * Retrieves the set of deleted entity IDs and slugs (lowercase normalized)
   */
  static getDeletedEntityIds(): Set<string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_ENTITIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const set = new Set<string>();
          parsed.forEach(item => {
            if (typeof item === 'string') {
              set.add(item);
              set.add(item.toLowerCase().trim());
            }
          });
          return set;
        }
      }
    } catch (e) {
      console.warn("Error reading deleted entity IDs:", e);
    }
    return new Set<string>();
  }

  /**
   * Saves the set of deleted entity IDs
   */
  static saveDeletedEntityIds(ids: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_ENTITIES, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.warn("Error saving deleted entity IDs:", e);
    }
  }

  /**
   * Checks if an entity is in the deleted set by id, slug or title
   */
  static isEntityDeleted(
    deletedIds: Set<string>,
    id?: string,
    slug?: string,
    title?: string
  ): boolean {
    if (!deletedIds || deletedIds.size === 0) return false;
    if (id && (deletedIds.has(id) || deletedIds.has(id.toLowerCase().trim()))) return true;
    if (slug && (deletedIds.has(slug) || deletedIds.has(slug.toLowerCase().trim()))) return true;
    if (title && (deletedIds.has(title) || deletedIds.has(title.toLowerCase().trim()))) return true;
    return false;
  }

  /**
   * Initialize and retrieve entities
   */
  static getEntities(): HecosEntity[] {
    const deletedIds = this.getDeletedEntityIds();
    if (this.entitiesCache) {
      // Ensure cache does not contain deleted items
      return this.entitiesCache.filter(
        (e) => !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)
      );
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENTITIES);
      if (stored) {
        const parsed: HecosEntity[] = JSON.parse(stored);
        // Filter out any entity that has been deleted
        const activeEntities = parsed.filter(
          (e) => !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)
        );
        const existingIds = new Set(
          activeEntities.flatMap((e) => [
            e.id,
            e.id.toLowerCase(),
            e.slug,
            e.slug.toLowerCase(),
            e.title.toLowerCase()
          ])
        );
        let changed = false;

        // Ensure all entities have isSecret defined (default to true: secret mode)
        activeEntities.forEach((e) => {
          if (e.isSecret === undefined) {
            e.isSecret = true;
            changed = true;
          }
        });

        for (const initEnt of INITIAL_ENTITIES) {
          // Never re-add if deleted or already present
          if (
            !existingIds.has(initEnt.id) &&
            !existingIds.has(initEnt.id.toLowerCase()) &&
            !this.isEntityDeleted(deletedIds, initEnt.id, initEnt.slug, initEnt.title)
          ) {
            activeEntities.push({
              ...initEnt,
              isSecret: initEnt.isSecret !== undefined ? initEnt.isSecret : true
            });
            changed = true;
          }
        }
        this.entitiesCache = activeEntities;
        if (changed || activeEntities.length !== parsed.length) {
          this.saveEntitiesLocal(this.entitiesCache);
        }
        return this.entitiesCache;
      }
    } catch (e) {
      console.warn("Error reading local storage entities:", e);
    }
    // Fallback to initial seed minus deleted (all secret by default)
    this.entitiesCache = INITIAL_ENTITIES.filter(
      (e) => !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)
    ).map((e) => ({
      ...e,
      isSecret: e.isSecret !== undefined ? e.isSecret : true
    }));
    this.saveEntitiesLocal(this.entitiesCache);
    return this.entitiesCache;
  }

  /**
   * Try loading from Firebase Realtime Database asynchronously and merge
   */
  static async syncWithFirebase(): Promise<HecosEntity[]> {
    this.ensureRealtimeInitialized();
    try {
      const firebaseList = await loadEntitiesFromFirebase();
      const deletedIds = this.getDeletedEntityIds();
      if (firebaseList && firebaseList.length > 0) {
        const current = this.getEntities();
        const map = new Map<string, HecosEntity>();
        current.forEach((e) => {
          if (!this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)) {
            map.set(e.id, e);
          }
        });
        firebaseList.forEach((e) => {
          if (e && e.id && !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)) {
            map.set(e.id, e);
          }
        });
        const merged = Array.from(map.values());
        this.entitiesCache = merged;
        this.saveEntitiesLocal(merged);
        this.notifyEntitySubscribers();
        return merged;
      } else {
        // If RTDB has no data, seed with local data
        seedDatabaseIfEmpty(this.getEntities()).catch(() => {});
      }
    } catch (e) {
      console.warn("Firebase RTDB sync error:", e);
    }
    return this.getEntities();
  }

  static getEntityById(idOrSlug: string): HecosEntity | undefined {
    const clean = (idOrSlug || '').toLowerCase().trim();
    return this.getEntities().find(
      (e) =>
        e.id === idOrSlug ||
        e.slug === idOrSlug ||
        (e.id && e.id.toLowerCase().trim() === clean) ||
        (e.slug && e.slug.toLowerCase().trim() === clean)
    );
  }

  static saveEntity(entity: HecosEntity): void {
    const deletedIds = this.getDeletedEntityIds();
    const cleanId = entity.id.toLowerCase().trim();
    const cleanSlug = entity.slug?.toLowerCase().trim();
    const cleanTitle = entity.title?.toLowerCase().trim();

    deletedIds.delete(entity.id);
    deletedIds.delete(cleanId);
    if (entity.slug) {
      deletedIds.delete(entity.slug);
      if (cleanSlug) deletedIds.delete(cleanSlug);
    }
    if (entity.title) {
      deletedIds.delete(entity.title);
      if (cleanTitle) deletedIds.delete(cleanTitle);
    }
    this.saveDeletedEntityIds(deletedIds);

    const list = this.getEntities();
    const index = list.findIndex((e) => e.id === entity.id);
    const updatedEntity = {
      ...entity,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      list[index] = updatedEntity;
    } else {
      list.push(updatedEntity);
    }

    this.entitiesCache = [...list];
    this.saveEntitiesLocal(this.entitiesCache);
    this.notifyEntitySubscribers();

    // Sync to Firebase Realtime Database in background
    syncEntityToFirebase(updatedEntity).catch((err) => console.warn(err));
  }

  static deleteEntity(id: string): void {
    const cleanId = id.toLowerCase().trim();
    const ent = this.getEntityById(id);
    const deletedIds = this.getDeletedEntityIds();

    // Register all identifier variations to permanently mark as deleted
    deletedIds.add(id);
    deletedIds.add(cleanId);
    if (ent?.id) {
      deletedIds.add(ent.id);
      deletedIds.add(ent.id.toLowerCase().trim());
    }
    if (ent?.slug) {
      deletedIds.add(ent.slug);
      deletedIds.add(ent.slug.toLowerCase().trim());
    }
    if (ent?.title) {
      deletedIds.add(ent.title);
      deletedIds.add(ent.title.toLowerCase().trim());
    }

    // Also look up in INITIAL_ENTITIES in case of static template matches
    const initMatch = INITIAL_ENTITIES.find(
      (ie) =>
        ie.id === id ||
        ie.slug === id ||
        ie.id.toLowerCase() === cleanId ||
        ie.slug.toLowerCase() === cleanId ||
        (ent && (ie.id === ent.id || ie.slug === ent.slug))
    );
    if (initMatch) {
      deletedIds.add(initMatch.id);
      deletedIds.add(initMatch.id.toLowerCase());
      deletedIds.add(initMatch.slug);
      deletedIds.add(initMatch.slug.toLowerCase());
      deletedIds.add(initMatch.title);
      deletedIds.add(initMatch.title.toLowerCase());
    }

    this.saveDeletedEntityIds(deletedIds);

    // Remove from in-memory cache and localStorage
    const list = this.getEntities().filter(
      (e) => !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)
    );
    this.entitiesCache = list;
    this.saveEntitiesLocal(list);
    this.notifyEntitySubscribers();

    // Sync deletion to Firebase Realtime Database
    deleteEntityFromFirebase(id).catch((err) => console.warn(err));
    if (ent?.id && ent.id !== id) {
      deleteEntityFromFirebase(ent.id).catch((err) => console.warn(err));
    }
    if (ent?.slug && ent.slug !== id) {
      deleteEntityFromFirebase(ent.slug).catch((err) => console.warn(err));
    }
    if (initMatch?.id && initMatch.id !== id) {
      deleteEntityFromFirebase(initMatch.id).catch((err) => console.warn(err));
    }
  }

  private static saveEntitiesLocal(entities: HecosEntity[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(entities));
    } catch (e) {
      console.warn("Error saving entities to localStorage:", e);
    }
  }

  /**
   * Maps
   */
  static getMaps(): InteractiveMapData[] {
    if (this.mapsCache) return this.mapsCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MAPS);
      if (stored) {
        this.mapsCache = JSON.parse(stored);
        return this.mapsCache!;
      }
    } catch (e) {
      console.warn(e);
    }
    this.mapsCache = [...INITIAL_MAPS];
    this.saveMaps(this.mapsCache);
    return this.mapsCache;
  }

  static saveMaps(maps: InteractiveMapData[]): void {
    this.mapsCache = [...maps];
    try {
      localStorage.setItem(STORAGE_KEYS.MAPS, JSON.stringify(maps));
    } catch (e) {
      console.warn(e);
    }
  }

  static saveMap(map: InteractiveMapData): void {
    const maps = this.getMaps();
    const idx = maps.findIndex(m => m.id === map.id);
    if (idx >= 0) maps[idx] = map;
    else maps.push(map);
    this.saveMaps(maps);
    this.notifyMapSubscribers();
    syncMapToFirebase(map).catch(() => {});
  }

  static deleteMap(mapId: string): void {
    const maps = this.getMaps().filter(m => m.id !== mapId);
    this.saveMaps(maps);
    this.notifyMapSubscribers();
  }

  /**
   * Tracks
   */
  static getTracks(): YouTubeAmbianceTrack[] {
    if (this.tracksCache) return this.tracksCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.YOUTUBE_TRACKS);
      if (stored) {
        this.tracksCache = JSON.parse(stored);
        return this.tracksCache!;
      }
    } catch (e) {
      console.warn(e);
    }
    this.tracksCache = [...INITIAL_YOUTUBE_TRACKS];
    this.saveTracks(this.tracksCache);
    return this.tracksCache;
  }

  static saveTracks(tracks: YouTubeAmbianceTrack[]): void {
    this.tracksCache = [...tracks];
    try {
      localStorage.setItem(STORAGE_KEYS.YOUTUBE_TRACKS, JSON.stringify(tracks));
    } catch (e) {
      console.warn(e);
    }
  }

  static deleteTrack(trackId: string): void {
    const tracks = this.getTracks().filter(t => t.id !== trackId);
    this.saveTracks(tracks);
  }

  /**
   * Drive resources
   */
  static getDriveResources(): GoogleDriveResource[] {
    if (this.driveCache) return this.driveCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DRIVE_RESOURCES);
      if (stored) {
        this.driveCache = JSON.parse(stored);
        return this.driveCache!;
      }
    } catch (e) {
      console.warn(e);
    }
    this.driveCache = [...INITIAL_DRIVE_RESOURCES];
    this.saveDriveResources(this.driveCache);
    return this.driveCache;
  }

  static saveDriveResources(resources: GoogleDriveResource[]): void {
    this.driveCache = [...resources];
    try {
      localStorage.setItem(STORAGE_KEYS.DRIVE_RESOURCES, JSON.stringify(resources));
    } catch (e) {
      console.warn(e);
    }
  }

  static deleteDriveResource(resourceId: string): void {
    const resources = this.getDriveResources().filter(r => r.id !== resourceId);
    this.saveDriveResources(resources);
  }

  /**
   * Feat Categories & Subcategories Management
   */
  static getAllFeatSubcategoriesConfig(): Record<string, string[]> {
    if (this.featCategoriesCache) return this.featCategoriesCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FEAT_CATEGORIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          // Merge defaults with stored custom subcategories
          const merged: Record<string, string[]> = {};
          const allKeys = Array.from(
            new Set([...Object.keys(DEFAULT_FEAT_CATEGORIES_CONFIG), ...Object.keys(parsed)])
          );

          for (const key of allKeys) {
            const defs = DEFAULT_FEAT_CATEGORIES_CONFIG[key] || [];
            const customs = Array.isArray(parsed[key]) ? parsed[key] : [];
            const subSet = new Set<string>();
            defs.forEach((s) => subSet.add(s));
            customs.forEach((s: string) => {
              if (typeof s === 'string' && s.trim()) subSet.add(s.trim());
            });
            merged[key] = Array.from(subSet);
          }

          this.featCategoriesCache = merged;
          return this.featCategoriesCache;
        }
      }
    } catch (e) {
      console.warn("Error reading feat categories from storage:", e);
    }

    // Default configuration
    this.featCategoriesCache = { ...DEFAULT_FEAT_CATEGORIES_CONFIG };
    this.saveAllFeatSubcategoriesConfig(this.featCategoriesCache);
    return this.featCategoriesCache;
  }

  static getFeatSubcategories(categoryKey?: string): string[] {
    const config = this.getAllFeatSubcategoriesConfig();
    if (!categoryKey || categoryKey === 'all') {
      // Return all subcategories combined
      const all = new Set<string>();
      Object.values(config).forEach((list) => {
        list.forEach((sub) => all.add(sub));
      });
      return Array.from(all);
    }
    return config[categoryKey] || [];
  }

  static saveAllFeatSubcategoriesConfig(config: Record<string, string[]>): void {
    this.featCategoriesCache = { ...config };
    try {
      localStorage.setItem(STORAGE_KEYS.FEAT_CATEGORIES, JSON.stringify(config));
    } catch (e) {
      console.warn("Error saving feat categories config:", e);
    }
    this.notifyFeatCategoriesSubscribers();
    syncFeatCategoriesToFirebase(config).catch(() => {});
  }

  static addFeatSubcategory(categoryKey: string, subcategoryName: string): boolean {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !categoryKey) return false;
    const config = this.getAllFeatSubcategoriesConfig();
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    config[categoryKey] = list;
    this.saveAllFeatSubcategoriesConfig(config);
    return true;
  }

  static renameFeatSubcategory(categoryKey: string, oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew || !categoryKey || oldName === trimmedNew) return false;
    const config = this.getAllFeatSubcategoriesConfig();
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    const idx = list.indexOf(oldName);
    if (idx === -1) return false;
    list[idx] = trimmedNew;
    config[categoryKey] = list;
    this.saveAllFeatSubcategoriesConfig(config);

    // Also update all entities that had this subcategory
    const entities = this.getEntities();
    let changedEntities = false;
    entities.forEach((ent) => {
      if (ent.category === 'feat' || ent.featData) {
        let updated = false;
        let subcats = ent.featData?.subcategories || ent.subcategories || [];
        if (subcats.includes(oldName)) {
          subcats = subcats.map((s) => (s === oldName ? trimmedNew : s));
          if (ent.featData) ent.featData.subcategories = subcats;
          ent.subcategories = subcats;
          updated = true;
        }
        if (ent.subcategory === oldName) {
          ent.subcategory = trimmedNew;
          updated = true;
        }
        if (updated) {
          HecosStorage.saveEntity(ent);
          changedEntities = true;
        }
      }
    });

    return true;
  }

  static deleteFeatSubcategory(categoryKey: string, subcategoryName: string): boolean {
    if (!categoryKey || !subcategoryName) return false;
    const config = this.getAllFeatSubcategoriesConfig();
    if (!config[categoryKey]) return false;
    config[categoryKey] = config[categoryKey].filter((s) => s !== subcategoryName);
    this.saveAllFeatSubcategoriesConfig(config);

    // Also remove from affected entities
    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'feat' || ent.featData) {
        let updated = false;
        let subcats = ent.featData?.subcategories || ent.subcategories || [];
        if (subcats.includes(subcategoryName)) {
          subcats = subcats.filter((s) => s !== subcategoryName);
          if (ent.featData) ent.featData.subcategories = subcats;
          ent.subcategories = subcats;
          updated = true;
        }
        if (ent.subcategory === subcategoryName) {
          ent.subcategory = subcats[0] || '';
          updated = true;
        }
        if (updated) {
          HecosStorage.saveEntity(ent);
        }
      }
    });

    return true;
  }

  /**
   * Assign or update subcategories for a given feat entity
   */
  static assignFeatSubcategories(featId: string, subcategories: string[]): boolean {
    const ent = this.getEntityById(featId);
    if (!ent) return false;
    const cleanSubcats = Array.from(new Set(subcategories.map((s) => s.trim()).filter(Boolean)));
    if (!ent.featData) {
      ent.featData = {
        level: 1,
        featType: 'general',
        rarity: 'Comum',
        traits: [],
        actionCost: '1',
        prerequisites: '',
        description: ent.content || ''
      };
    }
    ent.featData.subcategories = cleanSubcats;
    ent.subcategories = cleanSubcats;
    ent.subcategory = cleanSubcats[0] || ent.subcategory || '';
    
    // Also add subcategories to tags if helpful
    const currentTags = new Set(ent.tags || []);
    cleanSubcats.forEach((s) => currentTags.add(s));
    ent.tags = Array.from(currentTags);

    this.saveEntity(ent);
    return true;
  }

  /**
   * Toggle a subcategory on a feat
   */
  static toggleFeatSubcategory(featId: string, subcategoryName: string): boolean {
    const ent = this.getEntityById(featId);
    if (!ent) return false;
    const current = ent.featData?.subcategories || ent.subcategories || [];
    const set = new Set(current);
    if (set.has(subcategoryName)) {
      set.delete(subcategoryName);
    } else {
      set.add(subcategoryName);
    }
    return this.assignFeatSubcategories(featId, Array.from(set));
  }

  /**
   * Get set of revealed/public folders / subcategories
   */
  static getPublicFolders(): Set<string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUBLIC_FOLDERS);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading public folders:', e);
    }
    return new Set<string>();
  }

  /**
   * Check if a folder/subcategory is marked secret (GM only).
   * BY DEFAULT, EVERY FOLDER IS SECRET unless the GM explicitly clicked the Eye to reveal it!
   */
  static isFolderSecret(folderOrSubcategory: string): boolean {
    if (!folderOrSubcategory) return false;
    const trimmed = folderOrSubcategory.trim();
    if (trimmed === 'all' || trimmed === '__none__' || trimmed === '') return false;
    const publics = this.getPublicFolders();
    const isPublic = publics.has(trimmed) || publics.has(trimmed.toLowerCase());
    return !isPublic;
  }

  /**
   * Toggle secret state for a folder/subcategory
   */
  static toggleFolderSecret(folderOrSubcategory: string): boolean {
    if (!folderOrSubcategory) return false;
    const trimmed = folderOrSubcategory.trim();
    const publics = this.getPublicFolders();
    const currentlySecret = this.isFolderSecret(trimmed);

    if (currentlySecret) {
      // Reveal folder -> mark as public
      publics.add(trimmed);
      publics.add(trimmed.toLowerCase());
    } else {
      // Make secret -> remove from public
      publics.delete(trimmed);
      publics.delete(trimmed.toLowerCase());
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PUBLIC_FOLDERS, JSON.stringify(Array.from(publics)));
    } catch (e) {
      console.warn('Error saving public folders:', e);
    }
    this.notifyEntitySubscribers();
    syncPublicFoldersToFirebase(Array.from(publics)).catch(() => {});
    return this.isFolderSecret(trimmed);
  }

  /**
   * Set secret state for a folder
   */
  static setFolderSecret(folderOrSubcategory: string, isSecret: boolean): void {
    if (!folderOrSubcategory) return;
    const trimmed = folderOrSubcategory.trim();
    const publics = this.getPublicFolders();
    if (isSecret) {
      publics.delete(trimmed);
      publics.delete(trimmed.toLowerCase());
    } else {
      publics.add(trimmed);
      publics.add(trimmed.toLowerCase());
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PUBLIC_FOLDERS, JSON.stringify(Array.from(publics)));
    } catch (e) {
      console.warn('Error saving public folders:', e);
    }
    this.notifyEntitySubscribers();
    syncPublicFoldersToFirebase(Array.from(publics)).catch(() => {});
  }

  /**
   * Set entity granular visibility ('gm' | 'all' | 'custom')
   */
  static setEntityVisibility(
    entityId: string,
    visibility: ItemVisibility,
    allowedUserIds: string[] = []
  ): void {
    const ent = this.getEntityById(entityId);
    if (!ent) return;
    ent.visibility = visibility;
    ent.allowedUserIds = allowedUserIds;
    ent.isSecret = visibility === 'gm';
    this.saveEntity(ent);
  }

  /**
   * Toggle entity secret status directly (legacy fallback)
   */
  static toggleEntitySecret(entityId: string): boolean {
    const ent = this.getEntityById(entityId);
    if (!ent) return false;
    const currentlySecret = ent.visibility === 'gm' || (ent.isSecret && ent.visibility !== 'all');
    if (currentlySecret) {
      ent.visibility = 'all';
      ent.isSecret = false;
    } else {
      ent.visibility = 'gm';
      ent.isSecret = true;
    }
    this.saveEntity(ent);
    return ent.isSecret;
  }

  /**
   * Folder / Subcategory Granular Permissions
   */
  static getFolderPermissions(): Record<string, FolderPermission> {
    if (this.folderPermissionsCache) return this.folderPermissionsCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOLDER_PERMISSIONS);
      if (stored) {
        this.folderPermissionsCache = JSON.parse(stored);
        return this.folderPermissionsCache || {};
      }
    } catch (e) {
      console.warn("Error reading folder permissions:", e);
    }
    this.folderPermissionsCache = {};
    return this.folderPermissionsCache;
  }

  static getFolderPermission(folderId: string): FolderPermission {
    if (!folderId) return { folderId: '', visibility: 'gm', allowedUserIds: [] };
    const clean = folderId.trim().toLowerCase();
    const all = this.getFolderPermissions();
    if (all[clean]) return all[clean];

    // Fallback to legacy isFolderSecret
    const isSecret = this.isFolderSecret(folderId);
    return {
      folderId,
      visibility: isSecret ? 'gm' : 'all',
      allowedUserIds: []
    };
  }

  static setFolderPermission(
    folderId: string,
    visibility: ItemVisibility,
    allowedUserIds: string[] = []
  ): void {
    if (!folderId) return;
    const clean = folderId.trim().toLowerCase();
    const all = { ...this.getFolderPermissions() };
    all[clean] = {
      folderId,
      visibility,
      allowedUserIds
    };
    this.folderPermissionsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDER_PERMISSIONS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error saving folder permissions:", e);
    }

    // Also sync legacy public folders
    if (visibility === 'all') {
      this.setFolderSecret(folderId, false);
    } else {
      this.setFolderSecret(folderId, true);
    }

    syncFolderPermissionsToFirebase(all).catch(() => {});
    this.notifyFolderPermissionsSubscribers();
    this.notifyEntitySubscribers();
  }

  static subscribeFolderPermissions(callback: (perms: Record<string, FolderPermission>) => void): () => void {
    this.folderPermissionsSubscribers.add(callback);
    callback(this.getFolderPermissions());
    return () => this.folderPermissionsSubscribers.delete(callback);
  }

  private static notifyFolderPermissionsSubscribers() {
    const perms = this.getFolderPermissions();
    this.folderPermissionsSubscribers.forEach((cb) => {
      try {
        cb(perms);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Check if an item (entity or folder) is accessible to the specified or current user
   */
  static canUserAccess(
    visibility?: ItemVisibility,
    allowedUserIds?: string[],
    currentUser?: HecosUser | null,
    isSecretFallback?: boolean
  ): boolean {
    const user = currentUser !== undefined ? currentUser : this.getCurrentUser();

    // 1. GM has full unrestricted access to everything
    if (user && user.role === 'gm') {
      return true;
    }

    // Resolve effective visibility
    let effectiveVisibility: ItemVisibility = visibility || (isSecretFallback === false ? 'all' : 'gm');
    if (!visibility && isSecretFallback === undefined) {
      effectiveVisibility = 'gm';
    }

    // 2. If visibility is 'all', anyone can view (even without login)
    if (effectiveVisibility === 'all') {
      return true;
    }

    // 3. If visibility is 'gm', only GM can view
    if (effectiveVisibility === 'gm') {
      return false;
    }

    // 4. If visibility is 'custom', only GM and specific players can view
    if (effectiveVisibility === 'custom') {
      if (!user) return false;
      if (!allowedUserIds || allowedUserIds.length === 0) return false;
      return allowedUserIds.some(
        (id) =>
          id === user.id ||
          id.toLowerCase() === user.username.toLowerCase() ||
          id.toLowerCase() === user.name.toLowerCase()
      );
    }

    return false;
  }

  /**
   * User & Authentication System
   */
  static getUsers(): HecosUser[] {
    if (this.usersCache) return this.usersCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasAdmin = parsed.some((u) => u.username === INITIAL_ADMIN_USER.username);
          if (!hasAdmin) {
            parsed.unshift(INITIAL_ADMIN_USER);
          }
          this.usersCache = parsed;
          return this.usersCache;
        }
      }
    } catch (e) {
      console.warn("Error reading users:", e);
    }
    this.usersCache = [INITIAL_ADMIN_USER];
    this.saveUsersLocal(this.usersCache);
    return this.usersCache;
  }

  private static saveUsersLocal(users: HecosUser[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn("Error saving users:", e);
    }
  }

  static saveUser(user: HecosUser): void {
    const list = this.getUsers();
    const idx = list.findIndex(
      (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    this.usersCache = [...list];
    this.saveUsersLocal(this.usersCache);
    this.notifyUsersListSubscribers();
    syncUsersToFirebase(this.usersCache).catch(() => {});
  }

  static deleteUser(userId: string): boolean {
    const list = this.getUsers();
    const target = list.find((u) => u.id === userId);
    if (!target || target.username === INITIAL_ADMIN_USER.username) {
      return false;
    }
    const filtered = list.filter((u) => u.id !== userId);
    this.usersCache = filtered;
    this.saveUsersLocal(filtered);
    this.notifyUsersListSubscribers();
    syncUsersToFirebase(filtered).catch(() => {});

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.logout();
    }
    return true;
  }

  static getCurrentUser(): HecosUser | null {
    if (this.currentUserCache !== null) return this.currentUserCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          const existing = this.getUsers().find(
            (u) => u.id === parsed.id || u.username === parsed.username
          );
          if (existing) {
            this.currentUserCache = existing;
            this.setGmMode(existing.role === 'gm');
            return this.currentUserCache;
          }
        }
      }
    } catch (e) {
      console.warn("Error reading current user:", e);
    }
    if (this.getGmMode()) {
      this.currentUserCache = INITIAL_ADMIN_USER;
      this.saveCurrentUserLocal(this.currentUserCache);
      return this.currentUserCache;
    }
    this.currentUserCache = null;
    return null;
  }

  private static saveCurrentUserLocal(user: HecosUser | null) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn("Error saving current user:", e);
    }
  }

  static login(
    username: string,
    password?: string
  ): { success: boolean; user?: HecosUser; error?: string } {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();
    if (!cleanUser) {
      return { success: false, error: 'Informe o nome de usuário.' };
    }

    const allUsers = this.getUsers();
    const found = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUser.toLowerCase()
    );

    if (!found) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (found.password && found.password !== cleanPass) {
      return { success: false, error: 'Senha incorreta.' };
    }

    this.currentUserCache = found;
    this.saveCurrentUserLocal(found);
    this.setGmMode(found.role === 'gm');
    this.notifyUserSubscribers();
    this.notifyEntitySubscribers();
    return { success: true, user: found };
  }

  static logout(): void {
    this.currentUserCache = null;
    this.saveCurrentUserLocal(null);
    this.setGmMode(false);
    this.notifyUserSubscribers();
    this.notifyEntitySubscribers();
  }

  static subscribeUser(callback: (user: HecosUser | null) => void): () => void {
    this.userSubscribers.add(callback);
    callback(this.getCurrentUser());
    return () => this.userSubscribers.delete(callback);
  }

  private static notifyUserSubscribers() {
    const user = this.getCurrentUser();
    this.userSubscribers.forEach((cb) => {
      try {
        cb(user);
      } catch (e) {
        console.error(e);
      }
    });
  }

  static subscribeUsersList(callback: (users: HecosUser[]) => void): () => void {
    this.usersListSubscribers.add(callback);
    callback(this.getUsers());
    return () => this.usersListSubscribers.delete(callback);
  }

  private static notifyUsersListSubscribers() {
    const users = this.getUsers();
    this.usersListSubscribers.forEach((cb) => {
      try {
        cb(users);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Get GM Mode state
   */
  static getGmMode(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GM_MODE);
      return stored === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Set GM Mode state
   */
  static setGmMode(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GM_MODE, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Error saving GM mode:', e);
    }
  }

  /**
   * Toggle GM Mode state
   */
  static toggleGmMode(): boolean {
    const current = this.getGmMode();
    const next = !current;
    this.setGmMode(next);
    if (!next && this.currentUserCache?.role === 'gm') {
      // If GM mode manually disabled, keep user logged in or guest
    }
    return next;
  }

  /**
   * Tags computation
   */
  static getAllTags(): TagInfo[] {
    const entities = this.getEntities();
    const counts = new Map<string, number>();
    entities.forEach(entity => {
      entity.tags.forEach(tag => {
        const t = tag.trim();
        if (t) {
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      });
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Reset / restore default Hecos lore
   */
  static restoreDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.DELETED_ENTITIES);
    this.entitiesCache = [...INITIAL_ENTITIES];
    this.mapsCache = [...INITIAL_MAPS];
    this.tracksCache = [...INITIAL_YOUTUBE_TRACKS];
    this.driveCache = [...INITIAL_DRIVE_RESOURCES];
    this.saveEntitiesLocal(this.entitiesCache);
    this.saveMaps(this.mapsCache);
    this.saveTracks(this.tracksCache);
    this.saveDriveResources(this.driveCache);
    this.notifyEntitySubscribers();
    this.notifyMapSubscribers();
  }

  /**
   * Export all data as JSON
   */
  static exportAllData(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entities: this.getEntities(),
      maps: this.getMaps(),
      tracks: this.getTracks(),
      driveResources: this.getDriveResources(),
      deletedEntityIds: Array.from(this.getDeletedEntityIds())
    }, null, 2);
  }

  /**
   * Import all data from JSON
   */
  static importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.entities && Array.isArray(parsed.entities)) {
        if (parsed.deletedEntityIds && Array.isArray(parsed.deletedEntityIds)) {
          this.saveDeletedEntityIds(new Set(parsed.deletedEntityIds));
        }
        this.entitiesCache = parsed.entities;
        this.saveEntitiesLocal(this.entitiesCache!);
        if (parsed.maps) this.saveMaps(parsed.maps);
        if (parsed.tracks) this.saveTracks(parsed.tracks);
        if (parsed.driveResources) this.saveDriveResources(parsed.driveResources);
        this.notifyEntitySubscribers();
        this.notifyMapSubscribers();
        return true;
      }
    } catch (e) {
      console.warn("Import error:", e);
    }
    return false;
  }
}

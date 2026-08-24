import { HecosEntity, InteractiveMapData, YouTubeAmbianceTrack, GoogleDriveResource, TagInfo, HecosUser, FolderPermission, ItemVisibility, TrashedEntity, ImageAdjustment } from '../types';
import { INITIAL_ENTITIES, INITIAL_MAPS, INITIAL_YOUTUBE_TRACKS, INITIAL_DRIVE_RESOURCES } from '../data/initialHecosData';
import {
  syncEntityToFirebase,
  deleteEntityFromFirebase,
  loadEntitiesFromFirebase,
  subscribeToEntitiesRealtime,
  subscribeToDeletedEntitiesRealtime,
  subscribeToTrashRealtime,
  syncTrashToFirebase,
  loadTrashFromFirebase,
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
  subscribeToFolderPermissionsRealtime,
  syncImageAdjustmentsToFirebase,
  loadImageAdjustmentsFromFirebase,
  subscribeToImageAdjustmentsRealtime
} from './firebase';

const STORAGE_KEYS = {
  ENTITIES: 'hecos_entities_v1',
  DELETED_ENTITIES: 'hecos_deleted_entities_v1',
  TRASH: 'hecos_trash_entities_v1',
  MAPS: 'hecos_maps_v1',
  YOUTUBE_TRACKS: 'hecos_youtube_v1',
  DRIVE_RESOURCES: 'hecos_drive_v1',
  FEAT_CATEGORIES: 'hecos_feat_categories_v1',
  SPELL_CATEGORIES: 'hecos_spell_categories_v1',
  ITEM_CATEGORIES: 'hecos_item_categories_v1',
  GM_MODE: 'hecos_gm_mode_v1',
  RECENT_PAGES: 'hecos_recent_pages_v1',
  SECRET_FOLDERS: 'hecos_secret_folders_v1',
  PUBLIC_FOLDERS: 'hecos_public_folders_v1',
  USERS: 'hecos_users_v1',
  CURRENT_USER: 'hecos_current_user_v1',
  FOLDER_PERMISSIONS: 'hecos_folder_permissions_v1',
  IMAGE_ADJUSTMENTS: 'hecos_image_adjustments_v1',
  CUSTOM_TRAITS: 'hecos_custom_traits_v1',
};

export const INITIAL_ADMIN_USER: HecosUser = {
  id: 'gm_henrick',
  username: 'Henrick',
  password: '159753',
  name: 'Henrick (GM)',
  role: 'gm',
  createdAt: new Date().toISOString()
};

export const DEFAULT_FEAT_CATEGORIES_CONFIG: Record<string, string[]> = {
  ancestry: ['Humano', 'Elfo', 'Anão', 'Umbralis', 'Corine', 'Gnomo', 'Goblin', 'Golias', 'Meio-Elfo', 'Versátil'],
  class: ['Fighter (Guerreiro)', 'Wizard (Mago)', 'Rogue (Ladino)', 'Cleric (Clérigo)', 'Champion (Campeão)', 'Barbarian (Bárbaro)', 'Bard (Bardo)', 'Druid (Druida)', 'Monk (Monge)', 'Ranger (Patrulheiro)', 'Sorcerer (Feiticeiro)', 'Thaumaturge', 'Guerreiro da Obsidiana'],
  extras: ['Eclipse & Penumbra', 'Bênçãos do Vazio', 'Rituais de Obsidiana', 'Relíquias Vivas', 'Homebrew'],
  general: ['Combate', 'Defesa', 'Mobilidade', 'Sentidos & Percepção', 'Sobrevivência', 'Iniciativa', 'Utilitários'],
  skill: ['Acrobacia', 'Arcanismo', 'Atletismo', 'Diplomacia', 'Enganação', 'Furtividade', 'Intimidação', 'Ladrongagem', 'Manufatura', 'Medicina', 'Natureza', 'Ocultismo', 'Performance', 'Religião', 'Sociedade', 'Sobrevivência'],
  archetype: ['Caminhante da Penumbra', 'Cavaleiro', 'Assassino', 'Duelista', 'Médico de Batalha', 'Mestre de Armas', 'Arquimago do Eclipse', 'Sentinela do Vazio']
};

export const DEFAULT_SPELL_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo'],
  arcane: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Evocação', 'Transmutação', 'Ilusão', 'Abjuração'],
  divine: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Cura', 'Necromancia', 'Proteção & Bênção'],
  occult: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Adivinhação', 'Encantamento', 'Mente & Sombras'],
  primal: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Elemental (Fogo/Gelo/Terra/Ar)', 'Metamorfose', 'Plantas & Animais'],
  focus: ['Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Mago', 'Monge', 'Oráculo', 'Campeão', 'Bardo', 'Domínios Divinos'],
  ritual: ['Rituais de Nível 1-3', 'Rituais de Nível 4-6', 'Rituais de Nível 7-9', 'Rituais de 10º Círculo', 'Grandes Rituais de Hecos'],
  extras: ['Magias do Eclipse', 'Feitiços de Obsidiana', 'Trama da Penumbra', 'Homebrew & Variantes']
};

export const DEFAULT_ITEM_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Nível 0-4', 'Nível 5-9', 'Nível 10-14', 'Nível 15-20', 'Artefatos Lendários'],
  weapons: ['Armas Simples', 'Armas Marciais', 'Armas Avançadas', 'Armas Rúnicas', 'Armas de Fogo', 'Armas Naturais'],
  armor: ['Armaduras Leves', 'Armaduras Médias', 'Armaduras Pesadas', 'Escudos Reforçados', 'Vestes de Explorador', 'Runas Fundamentais'],
  consumables: ['Poções & Elixires', 'Pergaminhos', 'Talismãs & Amuletos', 'Óleos Mágicos', 'Munições Especiais'],
  alchemical: ['Bombas Alquímicas', 'Venenos & Toxinas', 'Itens Medicinais', 'Ferramentas de Alquimia'],
  magical: ['Varinhas & Cajados', 'Anéis Mágicos', 'Mantos & Vestimentas', 'Itens de Investigação', 'Itens Investidos'],
  artifacts: ['Relíquias do Eclipse', 'Artefatos da Era dos Deuses', 'Armas Celestiais', 'Relíquias de Obsidiana'],
  gear: ['Kits de Aventura', 'Ferramentas de Perícia', 'Instrumentos Musicais', 'Livros & Grimórios', 'Equipamento Geral'],
  extras: ['Itens de Hecos', 'Materiais Especiais (Vidro Estelar, Adamante)', 'Tesouros de Sessão', 'Homebrew']
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
  private static trashCache: TrashedEntity[] | null = null;

  private static entitySubscribers = new Set<EntitySubscriber>();
  private static mapSubscribers = new Set<MapSubscriber>();
  private static featCategoriesSubscribers = new Set<FeatCategoriesSubscriber>();
  private static userSubscribers = new Set<(user: HecosUser | null) => void>();
  private static usersListSubscribers = new Set<(users: HecosUser[]) => void>();
  private static folderPermissionsSubscribers = new Set<(perms: Record<string, FolderPermission>) => void>();
  private static imageAdjustmentSubscribers = new Set<(adjustments: Record<string, ImageAdjustment>) => void>();
  private static imageAdjustmentsCache: Record<string, ImageAdjustment> | null = null;
  private static trashSubscribers = new Set<(trash: TrashedEntity[]) => void>();
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
    subscribeToDeletedEntitiesRealtime((deletedMap) => {
      if (!deletedMap || typeof deletedMap !== 'object') return;
      const currentDeleted = this.getDeletedEntityIds();
      let changed = false;
      
      Object.entries(deletedMap).forEach(([safeKey, delInfo]) => {
        const id = delInfo?.id || safeKey;
        if (id) {
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

    // Start real-time Realtime Database listener for trash
    subscribeToTrashRealtime((remoteTrash) => {
      if (!Array.isArray(remoteTrash)) return;
      this.trashCache = remoteTrash;
      try {
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(remoteTrash));
      } catch (e) {
        console.warn("Error saving trash to localStorage:", e);
      }
      this.notifyTrashSubscribers();
    });

    // Start real-time Realtime Database listener for entities
    subscribeToEntitiesRealtime((firebaseList) => {
      if (!firebaseList || firebaseList.length === 0) return;
      const deletedIds = this.getDeletedEntityIds();
      const current = this.getEntities();
      const map = new Map<string, HecosEntity>();

      current.forEach((e) => {
        if (!this.isEntityDeleted(deletedIds, e.id, e.slug)) {
          map.set(e.id, e);
        }
      });

      let hasNewChanges = false;
      firebaseList.forEach((e: any) => {
        if (e && e.id) {
          // If remote entity was updated, un-delete it if it was erroneously marked
          if (this.isEntityDeleted(deletedIds, e.id, e.slug)) {
            deletedIds.delete(e.id);
            deletedIds.delete(e.id.toLowerCase().trim());
            if (e.slug) {
              deletedIds.delete(e.slug);
              deletedIds.delete(e.slug.toLowerCase().trim());
            }
            this.saveDeletedEntityIds(deletedIds);
          }

          const existing = map.get(e.id);
          // If not existing or Firebase RTDB node has newer update
          if (!existing || (e.updatedAt && (!existing.updatedAt || e.updatedAt >= existing.updatedAt))) {
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

    // Start real-time listener for image adjustments
    subscribeToImageAdjustmentsRealtime((adjustments) => {
      if (!adjustments) return;
      this.imageAdjustmentsCache = adjustments;
      try {
        localStorage.setItem(STORAGE_KEYS.IMAGE_ADJUSTMENTS, JSON.stringify(adjustments));
      } catch {}
      this.notifyImageAdjustmentSubscribers();
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
   * Checks if an entity is in the deleted set by id or slug
   */
  static isEntityDeleted(
    deletedIds: Set<string>,
    id?: string,
    slug?: string
  ): boolean {
    if (!deletedIds || deletedIds.size === 0) return false;
    if (id && (deletedIds.has(id) || deletedIds.has(id.toLowerCase().trim()))) return true;
    if (slug && (deletedIds.has(slug) || deletedIds.has(slug.toLowerCase().trim()))) return true;
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
        (e) => Boolean(e && e.id && !this.isEntityDeleted(deletedIds, e.id, e.slug))
      );
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENTITIES);
      if (stored) {
        const rawParsed = JSON.parse(stored);
        const parsed: HecosEntity[] = Array.isArray(rawParsed) ? rawParsed.filter(Boolean) : [];
        // Filter out any entity that has been deleted or is invalid
        const activeEntities = parsed.filter(
          (e) => Boolean(e && e.id && !this.isEntityDeleted(deletedIds, e.id, e.slug))
        );
        const existingIds = new Set(
          activeEntities.flatMap((e) => [
            e.id,
            e.id?.toLowerCase(),
            e.slug,
            e.slug?.toLowerCase()
          ]).filter(Boolean)
        );
        let changed = false;

        // Ensure all entities have isSecret defined (default to true: secret mode)
        activeEntities.forEach((e) => {
          if (e && e.isSecret === undefined) {
            e.isSecret = true;
            changed = true;
          }
        });

        for (const initEnt of INITIAL_ENTITIES) {
          // Never re-add if deleted or already present
          if (
            initEnt &&
            initEnt.id &&
            !existingIds.has(initEnt.id) &&
            !existingIds.has(initEnt.id.toLowerCase()) &&
            !this.isEntityDeleted(deletedIds, initEnt.id, initEnt.slug)
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
      (e) => Boolean(e && e.id && !this.isEntityDeleted(deletedIds, e.id, e.slug))
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
          if (!this.isEntityDeleted(deletedIds, e.id, e.slug)) {
            map.set(e.id, e);
          }
        });
        firebaseList.forEach((e) => {
          if (e && e.id && !this.isEntityDeleted(deletedIds, e.id, e.slug)) {
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

    deletedIds.delete(entity.id);
    deletedIds.delete(cleanId);
    if (entity.slug) {
      deletedIds.delete(entity.slug);
      if (cleanSlug) deletedIds.delete(cleanSlug);
    }
    this.saveDeletedEntityIds(deletedIds);

    // Remove from trash if present
    const trash = this.getTrashedEntities().filter((t) => t.entity.id !== entity.id);
    if (trash.length !== this.getTrashedEntities().length) {
      this.saveTrashLocal(trash);
    }

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

  static deleteEntity(id: string, permanent: boolean = false): void {
    if (!permanent) {
      this.moveToTrash(id);
      return;
    }

    const cleanId = id.toLowerCase().trim();
    const ent = this.getEntityById(id);
    const deletedIds = this.getDeletedEntityIds();

    // Register identifier variations
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

    this.saveDeletedEntityIds(deletedIds);

    // Remove from trash as well
    const trash = this.getTrashedEntities().filter((t) => t.entity.id !== id);
    if (trash.length !== this.getTrashedEntities().length) {
      this.saveTrashLocal(trash);
    }

    // Remove from in-memory cache and localStorage
    const list = this.getEntities().filter(
      (e) => !this.isEntityDeleted(deletedIds, e.id, e.slug)
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
  }

  /**
   * --- TRASH & RECYCLE BIN SUBSYSTEM ---
   */
  static getTrashedEntities(): TrashedEntity[] {
    if (this.trashCache) return this.trashCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRASH);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.trashCache = parsed;
          return this.trashCache;
        }
      }
    } catch (e) {
      console.warn("Error reading trash from localStorage:", e);
    }
    this.trashCache = [];
    return this.trashCache;
  }

  private static saveTrashLocal(trash: TrashedEntity[]): void {
    this.trashCache = [...trash];
    try {
      localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
    } catch (e) {
      console.warn("Error saving trash to localStorage:", e);
    }
    // Sync trash state to Firebase RTDB for other devices
    syncTrashToFirebase(trash).catch((err) => console.warn(err));
    this.notifyTrashSubscribers();
  }

  static subscribeTrash(subscriber: (trash: TrashedEntity[]) => void): () => void {
    subscriber(this.getTrashedEntities());
    this.trashSubscribers.add(subscriber);
    return () => {
      this.trashSubscribers.delete(subscriber);
    };
  }

  private static notifyTrashSubscribers(): void {
    const list = this.getTrashedEntities();
    this.trashSubscribers.forEach((sub) => {
      try {
        sub(list);
      } catch (err) {
        console.warn("Error in trash subscriber:", err);
      }
    });
  }

  /**
   * Moves an entity to the Trash bin instead of hard deleting it.
   */
  static moveToTrash(id: string): boolean {
    const entity = this.getEntityById(id);
    if (!entity) return false;

    const currentUser = this.getCurrentUser();
    const trashedItem: TrashedEntity = {
      entity: { ...entity },
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser?.name || 'Mestre (GM)',
      originalCategory: entity.category,
    };

    // 1. Add to Trash list (syncs to Firebase)
    const currentTrash = this.getTrashedEntities().filter((t) => t.entity.id !== entity.id);
    currentTrash.unshift(trashedItem);
    this.saveTrashLocal(currentTrash);

    // 2. Remove from active entities list
    const list = this.getEntities().filter((e) => e.id !== entity.id && e.slug !== entity.slug);
    this.entitiesCache = list;
    this.saveEntitiesLocal(list);
    this.notifyEntitySubscribers();

    // 3. Remove from Firebase active entities
    deleteEntityFromFirebase(entity.id).catch((err) => console.warn(err));

    return true;
  }

  /**
   * Restores an entity from the trash back to active entities.
   */
  static restoreFromTrash(entityId: string): HecosEntity | null {
    const trash = this.getTrashedEntities();
    const itemIndex = trash.findIndex((t) => t.entity.id === entityId);
    if (itemIndex === -1) return null;

    const [trashed] = trash.splice(itemIndex, 1);
    this.saveTrashLocal(trash);

    // Remove from deleted ids if it was flagged
    const deletedIds = this.getDeletedEntityIds();
    deletedIds.delete(trashed.entity.id);
    deletedIds.delete(trashed.entity.id.toLowerCase().trim());
    if (trashed.entity.slug) {
      deletedIds.delete(trashed.entity.slug);
      deletedIds.delete(trashed.entity.slug.toLowerCase().trim());
    }
    this.saveDeletedEntityIds(deletedIds);

    // Add back to active entities
    const restoredEntity: HecosEntity = {
      ...trashed.entity,
      updatedAt: new Date().toISOString(),
    };
    this.saveEntity(restoredEntity);

    return restoredEntity;
  }

  /**
   * Permanently deletes a single item from the trash.
   */
  static permanentlyDeleteFromTrash(entityId: string): void {
    const trash = this.getTrashedEntities().filter((t) => t.entity.id !== entityId);
    this.saveTrashLocal(trash);
    // Hard delete from database and add to blacklist
    this.deleteEntity(entityId, true);
  }

  /**
   * Empties the entire trash bin permanently.
   */
  static emptyTrash(): void {
    const trash = this.getTrashedEntities();
    trash.forEach((t) => {
      this.deleteEntity(t.entity.id, true);
    });
    this.saveTrashLocal([]);
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
   * Spell Subcategories & Folders Configuration
   */
  static getAllSpellSubcategoriesConfig(): Record<string, string[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPELL_CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading spell categories config:", e);
    }
    return DEFAULT_SPELL_CATEGORIES_CONFIG;
  }

  static saveAllSpellSubcategoriesConfig(config: Record<string, string[]>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SPELL_CATEGORIES, JSON.stringify(config));
    } catch (e) {
      console.warn("Error saving spell categories config:", e);
    }
    this.notifyEntitySubscribers();
  }

  static addSpellSubcategory(categoryKey: string, subcategoryName: string): boolean {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !categoryKey) return false;
    const config = this.getAllSpellSubcategoriesConfig();
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    config[categoryKey] = list;
    this.saveAllSpellSubcategoriesConfig(config);
    return true;
  }

  static renameSpellSubcategory(categoryKey: string, oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew || !categoryKey || oldName === trimmedNew) return false;
    const config = this.getAllSpellSubcategoriesConfig();
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    const idx = list.indexOf(oldName);
    if (idx === -1) return false;
    list[idx] = trimmedNew;
    config[categoryKey] = list;
    this.saveAllSpellSubcategoriesConfig(config);

    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'spell') {
        let updated = false;
        let subcats = ent.subcategories || [];
        if (subcats.includes(oldName)) {
          subcats = subcats.map((s) => (s === oldName ? trimmedNew : s));
          ent.subcategories = subcats;
          updated = true;
        }
        if (ent.subcategory === oldName) {
          ent.subcategory = trimmedNew;
          updated = true;
        }
        if (updated) {
          HecosStorage.saveEntity(ent);
        }
      }
    });
    return true;
  }

  static deleteSpellSubcategory(categoryKey: string, subcategoryName: string): boolean {
    if (!categoryKey || !subcategoryName) return false;
    const config = this.getAllSpellSubcategoriesConfig();
    if (!config[categoryKey]) return false;
    config[categoryKey] = config[categoryKey].filter((s) => s !== subcategoryName);
    this.saveAllSpellSubcategoriesConfig(config);

    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'spell') {
        let updated = false;
        let subcats = ent.subcategories || [];
        if (subcats.includes(subcategoryName)) {
          subcats = subcats.filter((s) => s !== subcategoryName);
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

  static assignSpellSubcategories(spellId: string, subcategories: string[]): boolean {
    const ent = this.getEntityById(spellId);
    if (!ent) return false;
    const cleanSubcats = Array.from(new Set(subcategories.map((s) => s.trim()).filter(Boolean)));
    ent.subcategories = cleanSubcats;
    ent.subcategory = cleanSubcats[0] || ent.subcategory || '';
    const currentTags = new Set(ent.tags || []);
    cleanSubcats.forEach((s) => currentTags.add(s));
    ent.tags = Array.from(currentTags);
    this.saveEntity(ent);
    return true;
  }

  /**
   * Item Subcategories & Folders Configuration
   */
  static getAllItemSubcategoriesConfig(): Record<string, string[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ITEM_CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading item categories config:", e);
    }
    return DEFAULT_ITEM_CATEGORIES_CONFIG;
  }

  static saveAllItemSubcategoriesConfig(config: Record<string, string[]>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEM_CATEGORIES, JSON.stringify(config));
    } catch (e) {
      console.warn("Error saving item categories config:", e);
    }
    this.notifyEntitySubscribers();
  }

  static addItemSubcategory(categoryKey: string, subcategoryName: string): boolean {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !categoryKey) return false;
    const config = this.getAllItemSubcategoriesConfig();
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    config[categoryKey] = list;
    this.saveAllItemSubcategoriesConfig(config);
    return true;
  }

  static renameItemSubcategory(categoryKey: string, oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew || !categoryKey || oldName === trimmedNew) return false;
    const config = this.getAllItemSubcategoriesConfig();
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    const idx = list.indexOf(oldName);
    if (idx === -1) return false;
    list[idx] = trimmedNew;
    config[categoryKey] = list;
    this.saveAllItemSubcategoriesConfig(config);

    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'item') {
        let updated = false;
        let subcats = ent.subcategories || [];
        if (subcats.includes(oldName)) {
          subcats = subcats.map((s) => (s === oldName ? trimmedNew : s));
          ent.subcategories = subcats;
          updated = true;
        }
        if (ent.subcategory === oldName) {
          ent.subcategory = trimmedNew;
          updated = true;
        }
        if (updated) {
          HecosStorage.saveEntity(ent);
        }
      }
    });
    return true;
  }

  static deleteItemSubcategory(categoryKey: string, subcategoryName: string): boolean {
    if (!categoryKey || !subcategoryName) return false;
    const config = this.getAllItemSubcategoriesConfig();
    if (!config[categoryKey]) return false;
    config[categoryKey] = config[categoryKey].filter((s) => s !== subcategoryName);
    this.saveAllItemSubcategoriesConfig(config);

    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'item') {
        let updated = false;
        let subcats = ent.subcategories || [];
        if (subcats.includes(subcategoryName)) {
          subcats = subcats.filter((s) => s !== subcategoryName);
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

  static assignItemSubcategories(itemId: string, subcategories: string[]): boolean {
    const ent = this.getEntityById(itemId);
    if (!ent) return false;
    const cleanSubcats = Array.from(new Set(subcategories.map((s) => s.trim()).filter(Boolean)));
    ent.subcategories = cleanSubcats;
    ent.subcategory = cleanSubcats[0] || ent.subcategory || '';
    const currentTags = new Set(ent.tags || []);
    cleanSubcats.forEach((s) => currentTags.add(s));
    ent.tags = Array.from(currentTags);
    this.saveEntity(ent);
    return true;
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
    if (all[folderId]) return all[folderId];

    // Special default for GM Notes: only GM by default
    if (clean === 'gm-notes' || clean === 'gm_note' || clean === 'notas do gm' || clean === 'gm') {
      return {
        folderId,
        visibility: 'gm',
        allowedUserIds: []
      };
    }

    // Top-level public menus by default: PC, Diário, Mapa, Tags, Codex
    if (['pc', 'diario', 'session', 'mapa', 'map', 'tags', 'codex'].includes(clean)) {
      return {
        folderId,
        visibility: 'all',
        allowedUserIds: []
      };
    }

    // Fallback to legacy isFolderSecret for subcategories
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

  static getEntityPermission(entityId: string): FolderPermission {
    const ent = this.getEntityById(entityId);
    if (!ent) return { folderId: entityId, visibility: 'gm', allowedUserIds: [] };
    const effectiveVis = ent.visibility || (ent.isSecret === false ? 'all' : 'gm');
    return {
      folderId: entityId,
      visibility: effectiveVis,
      allowedUserIds: ent.allowedUserIds || []
    };
  }

  static setEntityPermission(entityId: string, visibility: ItemVisibility, allowedUserIds: string[] = []): void {
    const ent = this.getEntityById(entityId);
    if (!ent) return;
    ent.visibility = visibility;
    ent.allowedUserIds = allowedUserIds;
    ent.isSecret = visibility === 'gm';
    this.saveEntity(ent);
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
   * Resolve live effective permission for any item, trait, feat, spell, heritage or linked entity.
   * If the item references a unique standalone entity (by featEntityId or entityId), it synchronizes with that source entity.
   */
  static getEffectiveItemPermission(item: {
    visibility?: ItemVisibility;
    allowedUserIds?: string[];
    featEntityId?: string;
    entityId?: string;
    id?: string;
  }): { visibility: ItemVisibility; allowedUserIds: string[]; sourceEntity?: HecosEntity } {
    const linkedId = item.featEntityId || item.entityId;
    if (linkedId) {
      const source = this.getEntityById(linkedId);
      if (source) {
        const perm = this.getEntityPermission(source.id);
        return {
          visibility: perm.visibility,
          allowedUserIds: perm.allowedUserIds,
          sourceEntity: source,
        };
      }
    }
    return {
      visibility: item.visibility || 'all',
      allowedUserIds: item.allowedUserIds || [],
    };
  }

  /**
   * Check if a referenced item/feat/spell/heritage is accessible, checking both its own rules and any source entity link.
   */
  static canUserAccessItem(
    item: {
      visibility?: ItemVisibility;
      allowedUserIds?: string[];
      featEntityId?: string;
      entityId?: string;
      isSecret?: boolean;
    },
    currentUser?: HecosUser | null
  ): boolean {
    const user = currentUser !== undefined ? currentUser : this.getCurrentUser();
    if (user && user.role === 'gm') {
      return true;
    }
    const eff = this.getEffectiveItemPermission(item);
    // If the source entity is not accessible to this user, block access
    if (!this.canUserAccess(eff.visibility, eff.allowedUserIds, user)) {
      return false;
    }
    // If the local item also specifies its own visibility, check that too
    if (item.visibility && item.visibility !== 'all') {
      if (!this.canUserAccess(item.visibility, item.allowedUserIds, user, item.isSecret)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Helper to check if current user is an authenticated GM (has edit rights).
   */
  static isUserGm(currentUser?: HecosUser | null): boolean {
    const user = currentUser !== undefined ? currentUser : this.getCurrentUser();
    return Boolean(user && user.role === 'gm');
  }

  /**
   * User & Authentication System
   */
  static getUsers(): HecosUser[] {
    if (this.usersCache) return this.usersCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any previous admin record
          parsed = parsed.map((u: HecosUser) => {
            if (u.id === INITIAL_ADMIN_USER.id || u.username.toLowerCase() === 'henrick(gm)' || u.username.toLowerCase() === 'henrick') {
              return { ...u, username: 'Henrick', role: 'gm', name: u.name || 'Henrick (GM)' };
            }
            return u;
          });
          const hasAdmin = parsed.some((u: HecosUser) => u.username.toLowerCase() === 'henrick');
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
      (u) =>
        u.username.toLowerCase() === cleanUser.toLowerCase() ||
        (u.role === 'gm' &&
          (cleanUser.toLowerCase() === 'henrick' ||
            cleanUser.toLowerCase() === 'henrick(gm)' ||
            cleanUser.toLowerCase() === 'henrick (gm)'))
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
      imageAdjustments: this.getImageAdjustments(),
      deletedEntityIds: Array.from(this.getDeletedEntityIds())
    }, null, 2);
  }

  // ==========================================
  // IMAGE ADJUSTMENTS MANAGEMENT (GM Position & Zoom)
  // ==========================================

  static getImageAdjustments(): Record<string, ImageAdjustment> {
    if (this.imageAdjustmentsCache) return this.imageAdjustmentsCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_ADJUSTMENTS);
      if (stored) {
        this.imageAdjustmentsCache = JSON.parse(stored);
        return this.imageAdjustmentsCache || {};
      }
    } catch (e) {
      console.warn("Error reading image adjustments:", e);
    }
    this.imageAdjustmentsCache = {};
    return this.imageAdjustmentsCache;
  }

  static getImageAdjustment(imageKeyOrUrl: string): ImageAdjustment | null {
    if (!imageKeyOrUrl) return null;
    const all = this.getImageAdjustments();
    const clean = imageKeyOrUrl.trim();
    if (all[clean]) return all[clean];
    if (all[imageKeyOrUrl]) return all[imageKeyOrUrl];
    return null;
  }

  static saveImageAdjustment(imageKeyOrUrl: string, adjustment: ImageAdjustment): void {
    if (!imageKeyOrUrl) return;
    const clean = imageKeyOrUrl.trim();
    const all = { ...this.getImageAdjustments() };
    all[clean] = adjustment;
    this.imageAdjustmentsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_ADJUSTMENTS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error saving image adjustments:", e);
    }
    syncImageAdjustmentsToFirebase(all).catch(() => {});
    this.notifyImageAdjustmentSubscribers();
  }

  static subscribeImageAdjustments(callback: (adjustments: Record<string, ImageAdjustment>) => void): () => void {
    this.ensureRealtimeInitialized();
    this.imageAdjustmentSubscribers.add(callback);
    callback(this.getImageAdjustments());
    return () => this.imageAdjustmentSubscribers.delete(callback);
  }

  private static notifyImageAdjustmentSubscribers(): void {
    const all = this.getImageAdjustments();
    this.imageAdjustmentSubscribers.forEach((cb) => {
      try {
        cb(all);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ==========================================
  // TRAIT & TAG GLOBAL MANAGEMENT (GM Edit & Delete)
  // ==========================================

  private static customTraitsCache: Record<string, { category: string; description: string; color: string }> | null = null;
  private static traitSubscribers = new Set<() => void>();

  static getCustomTraits(): Record<string, { category: string; description: string; color: string }> {
    if (this.customTraitsCache) return this.customTraitsCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TRAITS);
      if (stored) {
        this.customTraitsCache = JSON.parse(stored);
        return this.customTraitsCache || {};
      }
    } catch (e) {
      console.warn("Error reading custom traits:", e);
    }
    this.customTraitsCache = {};
    return this.customTraitsCache;
  }

  static saveCustomTrait(
    traitName: string,
    data: { category: string; description: string; color?: string }
  ): void {
    if (!traitName) return;
    const cleanKey = traitName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const all = { ...this.getCustomTraits() };
    all[cleanKey] = {
      category: data.category || 'Mecânica Hecos',
      description: data.description || 'Traço customizado do mundo de Hecos.',
      color: data.color || 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]',
    };
    this.customTraitsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TRAITS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error saving custom trait:", e);
    }
    this.traitSubscribers.forEach((cb) => cb());
  }

  static deleteCustomTrait(traitName: string): void {
    if (!traitName) return;
    const cleanKey = traitName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const all = { ...this.getCustomTraits() };
    delete all[cleanKey];
    this.customTraitsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TRAITS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error deleting custom trait:", e);
    }
    this.traitSubscribers.forEach((cb) => cb());
  }

  static subscribeTraits(callback: () => void): () => void {
    this.traitSubscribers.add(callback);
    return () => this.traitSubscribers.delete(callback);
  }

  /**
   * Delete a Trait globally from ALL entities and custom definitions
   */
  static deleteTraitGlobally(traitName: string): { affectedCount: number } {
    if (!traitName) return { affectedCount: 0 };
    const target = traitName.trim().toLowerCase();
    const entities = this.getEntities();
    let affectedCount = 0;

    const updatedEntities = entities.map((ent) => {
      let modified = false;

      // Filter ent.traits
      if (ent.traits && Array.isArray(ent.traits)) {
        const filtered = ent.traits.filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
        if (filtered.length !== ent.traits.length) {
          ent.traits = filtered;
          modified = true;
        }
      }

      // Filter ent.statblock.traits
      if (ent.statblock && ent.statblock.traits && Array.isArray(ent.statblock.traits)) {
        const filtered = ent.statblock.traits.filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
        if (filtered.length !== ent.statblock.traits.length) {
          ent.statblock.traits = filtered;
          modified = true;
        }
      }

      // Filter ent.ancestryData.traits
      if (ent.ancestryData && ent.ancestryData.traits) {
        if (Array.isArray(ent.ancestryData.traits)) {
          const filtered = (ent.ancestryData.traits as string[]).filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
          if (filtered.length !== ent.ancestryData.traits.length) {
            ent.ancestryData.traits = filtered.join(', ');
            modified = true;
          }
        } else if (typeof ent.ancestryData.traits === 'string') {
          const parts = ent.ancestryData.traits.split(',').map((s) => s.trim()).filter((s) => s.toLowerCase() !== target);
          const newStr = parts.join(', ');
          if (newStr !== ent.ancestryData.traits) {
            ent.ancestryData.traits = newStr;
            modified = true;
          }
        }
      }

      // Filter ent.featData.traits
      if (ent.featData && ent.featData.traits && Array.isArray(ent.featData.traits)) {
        const filtered = ent.featData.traits.filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
        if (filtered.length !== ent.featData.traits.length) {
          ent.featData.traits = filtered;
          modified = true;
        }
      }

      // Filter ent.spellData.traits
      if (ent.spellData && ent.spellData.traits && Array.isArray(ent.spellData.traits)) {
        const filtered = ent.spellData.traits.filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
        if (filtered.length !== ent.spellData.traits.length) {
          ent.spellData.traits = filtered;
          modified = true;
        }
      }

      // Filter ent.itemData.traits
      if (ent.itemData && ent.itemData.traits && Array.isArray(ent.itemData.traits)) {
        const filtered = ent.itemData.traits.filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
        if (filtered.length !== ent.itemData.traits.length) {
          ent.itemData.traits = filtered;
          modified = true;
        }
      }

      if (modified) {
        affectedCount++;
        return { ...ent, updatedAt: new Date().toISOString() };
      }
      return ent;
    });

    if (affectedCount > 0) {
      this.entitiesCache = updatedEntities;
      this.saveEntitiesLocal(updatedEntities);
      updatedEntities.forEach((ent) => {
        syncEntityToFirebase(ent).catch(() => {});
      });
      this.notifyEntitySubscribers();
    }

    this.deleteCustomTrait(traitName);
    return { affectedCount };
  }

  /**
   * Rename a Trait globally in ALL entities and custom definitions
   */
  static renameTraitGlobally(oldName: string, newName: string): { affectedCount: number } {
    if (!oldName || !newName || oldName.trim() === newName.trim()) return { affectedCount: 0 };
    const oldTarget = oldName.trim().toLowerCase();
    const cleanNew = newName.trim();
    const entities = this.getEntities();
    let affectedCount = 0;

    const updatedEntities = entities.map((ent) => {
      let modified = false;

      if (ent.traits && Array.isArray(ent.traits)) {
        const updated = ent.traits.map((t) => (t.toLowerCase() === oldTarget ? cleanNew : t));
        if (JSON.stringify(updated) !== JSON.stringify(ent.traits)) {
          ent.traits = updated;
          modified = true;
        }
      }

      if (ent.ancestryData && ent.ancestryData.traits) {
        if (Array.isArray(ent.ancestryData.traits)) {
          const updated = (ent.ancestryData.traits as string[]).map((t) => (t.toLowerCase() === oldTarget ? cleanNew : t));
          const newStr = updated.join(', ');
          if (newStr !== ent.ancestryData.traits) {
            ent.ancestryData.traits = newStr;
            modified = true;
          }
        } else if (typeof ent.ancestryData.traits === 'string') {
          const parts = ent.ancestryData.traits.split(',').map((s) => (s.trim().toLowerCase() === oldTarget ? cleanNew : s.trim()));
          const newStr = parts.join(', ');
          if (newStr !== ent.ancestryData.traits) {
            ent.ancestryData.traits = newStr;
            modified = true;
          }
        }
      }

      if (ent.featData && ent.featData.traits && Array.isArray(ent.featData.traits)) {
        const updated = ent.featData.traits.map((t) => (t.toLowerCase() === oldTarget ? cleanNew : t));
        if (JSON.stringify(updated) !== JSON.stringify(ent.featData.traits)) {
          ent.featData.traits = updated;
          modified = true;
        }
      }

      if (ent.spellData && ent.spellData.traits && Array.isArray(ent.spellData.traits)) {
        const updated = ent.spellData.traits.map((t) => (t.toLowerCase() === oldTarget ? cleanNew : t));
        if (JSON.stringify(updated) !== JSON.stringify(ent.spellData.traits)) {
          ent.spellData.traits = updated;
          modified = true;
        }
      }

      if (ent.itemData && ent.itemData.traits && Array.isArray(ent.itemData.traits)) {
        const updated = ent.itemData.traits.map((t) => (t.toLowerCase() === oldTarget ? cleanNew : t));
        if (JSON.stringify(updated) !== JSON.stringify(ent.itemData.traits)) {
          ent.itemData.traits = updated;
          modified = true;
        }
      }

      if (modified) {
        affectedCount++;
        return { ...ent, updatedAt: new Date().toISOString() };
      }
      return ent;
    });

    if (affectedCount > 0) {
      this.entitiesCache = updatedEntities;
      this.saveEntitiesLocal(updatedEntities);
      updatedEntities.forEach((ent) => {
        syncEntityToFirebase(ent).catch(() => {});
      });
      this.notifyEntitySubscribers();
    }

    // Rename in custom definitions
    const oldKey = oldName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const customTraits = this.getCustomTraits();
    if (customTraits[oldKey]) {
      const data = customTraits[oldKey];
      this.deleteCustomTrait(oldName);
      this.saveCustomTrait(cleanNew, data);
    }

    return { affectedCount };
  }

  /**
   * Rename a Tag globally in ALL entities
   */
  static renameTagGlobally(oldName: string, newName: string): { affectedCount: number } {
    if (!oldName || !newName || oldName.trim() === newName.trim()) return { affectedCount: 0 };
    const oldTarget = oldName.trim().toLowerCase().replace(/^#/, '');
    const cleanNew = newName.trim().replace(/^#/, '');
    const entities = this.getEntities();
    let affectedCount = 0;

    const updatedEntities = entities.map((ent) => {
      if (ent.tags && Array.isArray(ent.tags)) {
        const updated = ent.tags.map((t) => (t.toLowerCase() === oldTarget ? cleanNew : t));
        if (JSON.stringify(updated) !== JSON.stringify(ent.tags)) {
          affectedCount++;
          return { ...ent, tags: updated, updatedAt: new Date().toISOString() };
        }
      }
      return ent;
    });

    if (affectedCount > 0) {
      this.entitiesCache = updatedEntities;
      this.saveEntitiesLocal(updatedEntities);
      updatedEntities.forEach((ent) => {
        syncEntityToFirebase(ent).catch(() => {});
      });
      this.notifyEntitySubscribers();
    }
    return { affectedCount };
  }

  /**
   * Delete a Tag globally from ALL entities
   */
  static deleteTagGlobally(tagName: string): { affectedCount: number } {
    if (!tagName) return { affectedCount: 0 };
    const target = tagName.trim().toLowerCase().replace(/^#/, '');
    const entities = this.getEntities();
    let affectedCount = 0;

    const updatedEntities = entities.map((ent) => {
      if (ent.tags && Array.isArray(ent.tags)) {
        const filtered = ent.tags.filter((t) => typeof t === 'string' && t.trim().toLowerCase() !== target);
        if (filtered.length !== ent.tags.length) {
          affectedCount++;
          return { ...ent, tags: filtered, updatedAt: new Date().toISOString() };
        }
      }
      return ent;
    });

    if (affectedCount > 0) {
      this.entitiesCache = updatedEntities;
      this.saveEntitiesLocal(updatedEntities);
      updatedEntities.forEach((ent) => {
        syncEntityToFirebase(ent).catch(() => {});
      });
      this.notifyEntitySubscribers();
    }
    return { affectedCount };
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

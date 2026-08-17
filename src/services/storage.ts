import { HecosEntity, InteractiveMapData, YouTubeAmbianceTrack, GoogleDriveResource, TagInfo } from '../types';
import { INITIAL_ENTITIES, INITIAL_MAPS, INITIAL_YOUTUBE_TRACKS, INITIAL_DRIVE_RESOURCES } from '../data/initialHecosData';
import {
  syncEntityToFirebase,
  deleteEntityFromFirebase,
  loadEntitiesFromFirebase,
  subscribeToEntitiesRealtime,
  subscribeToMapsRealtime,
  syncMapToFirebase,
  loadMapsFromFirebase
} from './firebase';

const STORAGE_KEYS = {
  ENTITIES: 'hecos_entities_v1',
  DELETED_ENTITIES: 'hecos_deleted_entities_v1',
  MAPS: 'hecos_maps_v1',
  YOUTUBE_TRACKS: 'hecos_youtube_v1',
  DRIVE_RESOURCES: 'hecos_drive_v1',
  GM_MODE: 'hecos_gm_mode_v1',
  RECENT_PAGES: 'hecos_recent_pages_v1',
};

type EntitySubscriber = (entities: HecosEntity[]) => void;
type MapSubscriber = (maps: InteractiveMapData[]) => void;

export class HecosStorage {
  private static entitiesCache: HecosEntity[] | null = null;
  private static mapsCache: InteractiveMapData[] | null = null;
  private static tracksCache: YouTubeAmbianceTrack[] | null = null;
  private static driveCache: GoogleDriveResource[] | null = null;

  private static entitySubscribers = new Set<EntitySubscriber>();
  private static mapSubscribers = new Set<MapSubscriber>();
  private static isRealtimeInitialized = false;

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
   * Setup real-time listener with Firestore
   */
  static ensureRealtimeInitialized(): void {
    if (this.isRealtimeInitialized) return;
    this.isRealtimeInitialized = true;

    // Start real-time Firestore listener for entities
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
          // If not existing or Firebase doc is updated
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

    // Start real-time Firestore listener for maps
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

        for (const initEnt of INITIAL_ENTITIES) {
          // Never re-add if deleted or already present
          if (
            !existingIds.has(initEnt.id) &&
            !existingIds.has(initEnt.id.toLowerCase()) &&
            !this.isEntityDeleted(deletedIds, initEnt.id, initEnt.slug, initEnt.title)
          ) {
            activeEntities.push(initEnt);
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
    // Fallback to initial seed minus deleted
    this.entitiesCache = INITIAL_ENTITIES.filter(
      (e) => !this.isEntityDeleted(deletedIds, e.id, e.slug, e.title)
    );
    this.saveEntitiesLocal(this.entitiesCache);
    return this.entitiesCache;
  }

  /**
   * Try loading from Firebase asynchronously and merge
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
      }
    } catch (e) {
      console.warn("Firebase sync error:", e);
    }
    return this.getEntities();
  }

  static getEntityById(idOrSlug: string): HecosEntity | undefined {
    const clean = idOrSlug.toLowerCase().trim();
    return this.getEntities().find(
      (e) =>
        e.id === idOrSlug ||
        e.slug === idOrSlug ||
        e.id.toLowerCase().trim() === clean ||
        e.slug.toLowerCase().trim() === clean
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

    // Sync to Firebase in background
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

    // Sync deletion to Firebase
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



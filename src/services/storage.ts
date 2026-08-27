import { HecosEntity, InteractiveMapData, YouTubeAmbianceTrack, GoogleDriveResource, TagInfo, HecosUser, FolderPermission, ItemVisibility, TrashedEntity, ImageAdjustment } from '../types';
import { INITIAL_ENTITIES, INITIAL_MAPS, INITIAL_YOUTUBE_TRACKS, INITIAL_DRIVE_RESOURCES } from '../data/initialHecosData';
import { migrateAllSpellEntities, migrateSpellEntity } from '../utils/spellMigration';
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
  subscribeToSpellCategoriesRealtime,
  syncSpellCategoriesToFirebase,
  subscribeToScopeCategoriesRealtime,
  syncScopeCategoriesToFirebase,
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
  subscribeToImageAdjustmentsRealtime,
  syncCustomTraitsToFirebase,
  loadCustomTraitsFromFirebase,
  subscribeToCustomTraitsRealtime,
  syncCustomTagsToFirebase,
  loadCustomTagsFromFirebase,
  subscribeToCustomTagsRealtime
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
  CUSTOM_TAGS: 'hecos_custom_tags_v1',
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
  all: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Magias de Ataque', 'Magias Utilitárias', 'Defesa & Abjuração'],
  cinetica: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Cinética & Força', 'Calor & Fogo', 'Eletricidade & Raios', 'Gravidade'],
  eterea: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Espaço & Teleporte', 'Tempo & Cronurgia', 'Ilusões & Mente', 'Dimensões & Alma'],
  biologica: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Cura & Regeneração', 'Biomassa & Carne', 'Flora & Venenos', 'Sangue & Metamorfose'],
  abiotica: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Metal & Forja', 'Cristais & Vidro Estelar', 'Terra & Rochas', 'Obsidiana & Selos'],
  e_fisica: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Cinética & Força', 'Calor & Fogo', 'Eletricidade & Raios', 'Gravidade'],
  e_meta: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Espaço & Teleporte', 'Tempo & Cronurgia', 'Ilusões & Mente', 'Dimensões & Alma'],
  m_organica: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Cura & Regeneração', 'Biomassa & Carne', 'Flora & Venenos', 'Sangue & Metamorfose'],
  m_inorganica: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Metal & Forja', 'Cristais & Vidro Estelar', 'Terra & Rochas', 'Obsidiana & Selos'],
  omni: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Magia Primordial', 'Unificação de Hecos', 'Ecos do Eclipse'],
  focus: ['Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Mago', 'Monge', 'Oráculo', 'Campeão', 'Bardo', 'Domínios Divinos', 'Sentinela do Vazio'],
  ritual: ['Rituais de Nível 1-3', 'Rituais de Nível 4-6', 'Rituais de Nível 7-9', 'Rituais de 10º Círculo', 'Grandes Rituais de Hecos'],
  extras: ['Magias do Eclipse', 'Feitiços de Obsidiana', 'Trama da Penumbra', 'Homebrew & Variantes'],
  arcane: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Evocação', 'Transmutação', 'Ilusão', 'Abjuração'],
  divine: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Cura', 'Necromancia', 'Proteção & Bênção'],
  occult: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Adivinhação', 'Encantamento', 'Mente & Sombras'],
  primal: ['Truques', '1º Círculo', '2º Círculo', '3º Círculo', '4º Círculo', '5º Círculo', '6º Círculo', '7º Círculo', '8º Círculo', '9º Círculo', '10º Círculo', 'Elemental (Fogo/Gelo/Terra/Ar)', 'Metamorfose', 'Plantas & Animais']
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

export const DEFAULT_PERIL_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Nível -1 a 4', 'Nível 5 a 9', 'Nível 10 a 14', 'Nível 15 a 20', 'Chefes & Lendários'],
  monsters: ['Bestas & Feras', 'Mortos-Vivos', 'Humanoides & Bandidos', 'Aberrantes & Vazio', 'Constructos', 'Dragões', 'Extraplanares'],
  hazards_simple: ['Armadilhas Mecânicas', 'Armadilhas Mágicas', 'Alarmes & Emboscadas'],
  hazards_complex: ['Salões Mortais', 'Gatilhos de Masmorra', 'Mecanismos Antigos'],
  haunts: ['Espíritos Vingativos', 'Ecos do Eclipse', 'Maldições Locais'],
  environmental: ['Ventos Solares', 'Chuva Ácida', 'Frio Extremo', 'Terrenos Instáveis']
};

export const DEFAULT_CLASS_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Combatentes', 'Conjuradores Arcanos', 'Conjuradores Divinos', 'Conjuradores Primal', 'Conjuradores Ocultistas', 'Especialistas'],
  classes: ['Combatentes de Linha de Frente', 'Magos & Feiticeiros', 'Curandeiros & Santos', 'Furtivos & Especialistas', 'Disciplinas de Hecos']
};

export const DEFAULT_ARCHETYPE_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Dedicações Marciais', 'Vocações Místicas', 'Vocações de Perícia & Ofício', 'Vocações de Prestígio', 'Vocações de Hecos'],
  combat: ['Caminhante da Penumbra', 'Cavaleiro', 'Duelista', 'Mestre de Armas', 'Guerreiro de Obsidiana'],
  mystic: ['Arquimago do Eclipse', 'Oráculo das Estrelas', 'Invocador de Ecos', 'Sentinela do Vazio'],
  specialist: ['Assassino da Corte', 'Médico de Batalha', 'Alquimista do Vidro', 'Explorador dos Ermos']
};

export const DEFAULT_ANCESTRY_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Ancestralidades Comuns', 'Ancestralidades Incomuns', 'Ancestralidades Raras', 'Heranças Versáteis', 'Povos de Hecos'],
  ancestries: ['Povos da Obsidiana', 'Povos do Lago', 'Povos das Alturas', 'Nômades do Deserto'],
  heritages: ['Heranças Elementais', 'Heranças Místicas', 'Heranças Sombrias', 'Heranças Dracônicas']
};

export const DEFAULT_FAUNA_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Predadores de Hecos', 'Herbívoros Silvestres', 'Aves & Criaturas Aladas', 'Bestas Aquáticas & do Lago', 'Criaturas Místicas']
};

export const DEFAULT_FLORA_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Ervas Medicinais & Cura', 'Fungos & Esporos Luminescentes', 'Plantas Tóxicas & Venenosas', 'Árvores Sagradas & Antigas', 'Flora do Eclipse']
};

export const DEFAULT_LOCATION_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Cidades & Capitais', 'Masmorras & Ruínas de Obsidiana', 'Santuários & Templos', 'Ermos & Florestas', 'Regiões & Províncias']
};

export const DEFAULT_PC_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Personagens Ativos', 'Personagens da Reserva', 'Históricos & Falecidos', 'Aliados de Campanha']
};

export const DEFAULT_NPC_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Aliados & Companheiros', 'Vilões & Antagonistas', 'Mercadores & Artesãos', 'Líderes & Autoridades', 'Contatos Neutros', 'Informantes']
};

export const DEFAULT_ORGANIZATION_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Guildas & Facções', 'Cultos & Ordens Místicas', 'Governos & Casas Nobres', 'Ordens Militares & Guardas', 'Empórios Comerciais']
};

export const DEFAULT_MAP_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Mapas Mundiais & Continentais', 'Mapas Regionais & Ermos', 'Cidades & Capitais', 'Masmorras & Plantas Baixas', 'Campos de Batalha']
};

export const DEFAULT_TAG_CATEGORIES_CONFIG: Record<string, string[]> = {
  all: ['Tags de Campanha & Lore', 'Tags de Sessão & Quests', 'Traços Oficiais PF2e', 'Traços Homebrew & Hecos']
};

type EntitySubscriber = (entities: HecosEntity[]) => void;
type MapSubscriber = (maps: InteractiveMapData[]) => void;
type FeatCategoriesSubscriber = (config: Record<string, string[]>) => void;
export type SpellCategoriesSubscriber = (config: Record<string, string[]>) => void;

export class HecosStorage {
  private static entitiesCache: HecosEntity[] | null = null;
  private static mapsCache: InteractiveMapData[] | null = null;
  private static tracksCache: YouTubeAmbianceTrack[] | null = null;
  private static driveCache: GoogleDriveResource[] | null = null;
  private static featCategoriesCache: Record<string, string[]> | null = null;
  private static spellCategoriesCache: Record<string, string[]> | null = null;
  private static usersCache: HecosUser[] | null = null;
  private static currentUserCache: HecosUser | null = null;
  private static folderPermissionsCache: Record<string, FolderPermission> | null = null;
  private static trashCache: TrashedEntity[] | null = null;

  private static entitySubscribers = new Set<EntitySubscriber>();
  private static mapSubscribers = new Set<MapSubscriber>();
  private static featCategoriesSubscribers = new Set<FeatCategoriesSubscriber>();
  private static spellCategoriesSubscribers = new Set<SpellCategoriesSubscriber>();
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
   * Subscribe to spell subcategories configuration
   */
  static subscribeSpellCategories(subscriber: SpellCategoriesSubscriber): () => void {
    subscriber(this.getAllSpellSubcategoriesConfig());
    this.spellCategoriesSubscribers.add(subscriber);
    return () => {
      this.spellCategoriesSubscribers.delete(subscriber);
    };
  }

  private static notifySpellCategoriesSubscribers(): void {
    const config = this.getAllSpellSubcategoriesConfig();
    this.spellCategoriesSubscribers.forEach((sub) => {
      try {
        sub(config);
      } catch (e) {
        console.warn("Error notifying spell categories subscriber:", e);
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
        const rawMerged = Array.from(map.values());
        const { entities: merged } = migrateAllSpellEntities(rawMerged);
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
        console.warn("Error saving feat categories to local:", e);
      }
      this.notifyFeatCategoriesSubscribers();
    });

    // Start real-time listener for spell categories & subcategories
    subscribeToSpellCategoriesRealtime((categoriesConfig) => {
      if (!categoriesConfig || typeof categoriesConfig !== 'object') return;
      this.spellCategoriesCache = categoriesConfig;
      try {
        localStorage.setItem(STORAGE_KEYS.SPELL_CATEGORIES, JSON.stringify(categoriesConfig));
      } catch (e) {
        console.warn("Error saving spell categories to local:", e);
      }
      this.notifySpellCategoriesSubscribers();
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

    // Start real-time listener for custom traits
    subscribeToCustomTraitsRealtime((traits) => {
      if (!traits || typeof traits !== 'object') return;
      this.customTraitsCache = traits;
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TRAITS, JSON.stringify(traits));
      } catch {}
      this.traitSubscribers.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error(e);
        }
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hecos:traits-updated'));
      }
    });

    // Start real-time listener for custom tags
    subscribeToCustomTagsRealtime((tags) => {
      if (!tags || typeof tags !== 'object') return;
      this.customTagsCache = tags;
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(tags));
      } catch {}
      this.tagSubscribers.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error(e);
        }
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hecos:tags-updated'));
      }
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

        // Automatic spell traditions & traits migration
        const { entities: migratedEntities, hasAnyChange: spellMigrationOccurred } = migrateAllSpellEntities(activeEntities);
        if (spellMigrationOccurred) {
          changed = true;
          // Sync migrated spells to Firebase if connected
          migratedEntities.forEach((mEnt) => {
            if (mEnt.category === 'spell' || mEnt.spellData) {
              syncEntityToFirebase(mEnt).catch(() => {});
            }
          });
        }

        this.entitiesCache = migratedEntities;
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
        const rawMerged = Array.from(map.values());
        const { entities: merged, hasAnyChange } = migrateAllSpellEntities(rawMerged);
        this.entitiesCache = merged;
        this.saveEntitiesLocal(merged);
        if (hasAnyChange) {
          merged.forEach((mEnt) => {
            if (mEnt.category === 'spell' || mEnt.spellData) {
              syncEntityToFirebase(mEnt).catch(() => {});
            }
          });
        }
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
    const { entity: cleanSpellEntity } = migrateSpellEntity(entity);
    const updatedEntity = {
      ...cleanSpellEntity,
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

  /**
   * Remove a specific trait from an entity across its various sub-structures
   */
  static removeTraitFromEntity(entityId: string, traitToRemove: string): HecosEntity | null {
    const entity = this.getEntityById(entityId);
    if (!entity) return null;

    const lower = traitToRemove.toLowerCase().trim();
    let hasChanged = false;

    const updated: HecosEntity = { ...entity };

    // 1. General entity traits
    if (updated.traits && updated.traits.length > 0) {
      const filtered = updated.traits.filter((t) => t.toLowerCase().trim() !== lower);
      if (filtered.length !== updated.traits.length) {
        updated.traits = filtered;
        hasChanged = true;
      }
    }

    // 2. Spell traits & traditions
    if (updated.spellData) {
      const spellCopy = { ...updated.spellData };
      if (spellCopy.traits && spellCopy.traits.length > 0) {
        const filteredTraits = spellCopy.traits.filter((t) => t.toLowerCase().trim() !== lower);
        if (filteredTraits.length !== spellCopy.traits.length) {
          spellCopy.traits = filteredTraits;
          hasChanged = true;
        }
      }
      if (spellCopy.traditions && spellCopy.traditions.length > 0) {
        const filteredTrads = spellCopy.traditions.filter((t) => t.toLowerCase().trim() !== lower);
        if (filteredTrads.length !== spellCopy.traditions.length) {
          spellCopy.traditions = filteredTrads;
          hasChanged = true;
        }
      }
      updated.spellData = spellCopy;
    }

    // 3. Statblock traits
    if (updated.statblock && updated.statblock.traits) {
      const filteredStatTraits = updated.statblock.traits.filter((t) => t.toLowerCase().trim() !== lower);
      if (filteredStatTraits.length !== updated.statblock.traits.length) {
        updated.statblock = { ...updated.statblock, traits: filteredStatTraits };
        hasChanged = true;
      }
    }

    // 4. Feat traits
    if (updated.featData && updated.featData.traits) {
      const filteredFeatTraits = updated.featData.traits.filter((t) => t.toLowerCase().trim() !== lower);
      if (filteredFeatTraits.length !== updated.featData.traits.length) {
        updated.featData = { ...updated.featData, traits: filteredFeatTraits };
        hasChanged = true;
      }
    }

    // 5. Item traits
    if (updated.itemData && updated.itemData.traits) {
      const filteredItemTraits = updated.itemData.traits.filter((t) => t.toLowerCase().trim() !== lower);
      if (filteredItemTraits.length !== updated.itemData.traits.length) {
        updated.itemData = { ...updated.itemData, traits: filteredItemTraits };
        hasChanged = true;
      }
    }

    // 6. Peril / Hazard traits
    if (updated.perilData && updated.perilData.traits) {
      const filteredPerilTraits = updated.perilData.traits.filter((t) => t.toLowerCase().trim() !== lower);
      if (filteredPerilTraits.length !== updated.perilData.traits.length) {
        updated.perilData = { ...updated.perilData, traits: filteredPerilTraits };
        hasChanged = true;
      }
    }

    // 7. Class traits
    if (updated.classData && updated.classData.traits) {
      const filteredClassTraits = updated.classData.traits.filter((t) => t.toLowerCase().trim() !== lower);
      if (filteredClassTraits.length !== updated.classData.traits.length) {
        updated.classData = { ...updated.classData, traits: filteredClassTraits };
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.saveEntity(updated);
      return updated;
    }
    return entity;
  }

  /**
   * Add a tag to an entity
   */
  static addTagToEntity(entityId: string, newTag: string): HecosEntity | null {
    const entity = this.getEntityById(entityId);
    if (!entity) return null;

    const clean = newTag.trim().replace(/^#/, '');
    if (!clean) return entity;

    const currentTags = entity.tags || [];
    const lower = clean.toLowerCase();
    if (currentTags.some((t) => t.toLowerCase() === lower)) {
      return entity;
    }

    const updatedTags = [...currentTags, clean];
    const updated: HecosEntity = {
      ...entity,
      tags: updatedTags,
      spellData: entity.spellData ? { ...entity.spellData, tags: updatedTags } : entity.spellData,
    };

    this.saveEntity(updated);
    return updated;
  }

  /**
   * Remove a tag from an entity
   */
  static removeTagFromEntity(entityId: string, tagToRemove: string): HecosEntity | null {
    const entity = this.getEntityById(entityId);
    if (!entity) return null;

    const lower = tagToRemove.toLowerCase().trim().replace(/^#/, '');
    const currentTags = entity.tags || [];
    const filtered = currentTags.filter((t) => t.toLowerCase().replace(/^#/, '').trim() !== lower);

    const updated: HecosEntity = {
      ...entity,
      tags: filtered,
      spellData: entity.spellData
        ? {
            ...entity.spellData,
            tags: (entity.spellData.tags || []).filter(
              (t) => t.toLowerCase().replace(/^#/, '').trim() !== lower
            ),
          }
        : entity.spellData,
    };

    this.saveEntity(updated);
    return updated;
  }

  /**
   * Update/Rename a tag in an entity
   */
  static updateTagInEntity(entityId: string, oldTag: string, newTag: string): HecosEntity | null {
    const entity = this.getEntityById(entityId);
    if (!entity) return null;

    const oldClean = oldTag.toLowerCase().trim().replace(/^#/, '');
    const newClean = newTag.trim().replace(/^#/, '');
    if (!newClean) return this.removeTagFromEntity(entityId, oldTag);

    const currentTags = entity.tags || [];
    const updatedTags = currentTags.map((t) =>
      t.toLowerCase().trim().replace(/^#/, '') === oldClean ? newClean : t
    );

    const updated: HecosEntity = {
      ...entity,
      tags: Array.from(new Set(updatedTags)),
      spellData: entity.spellData
        ? {
            ...entity.spellData,
            tags: Array.from(
              new Set(
                (entity.spellData.tags || []).map((t) =>
                  t.toLowerCase().trim().replace(/^#/, '') === oldClean ? newClean : t
                )
              )
            ),
          }
        : entity.spellData,
    };

    this.saveEntity(updated);
    return updated;
  }

  /**
   * Get recently modified/created entities sorted by updatedAt/createdAt
   */
  static getRecentEntities(limit: number = 10): HecosEntity[] {
    const all = this.getEntities();
    return [...all]
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, limit);
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
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          this.featCategoriesCache = parsed;
          return this.featCategoriesCache;
        }
      }
    } catch (e) {
      console.warn("Error reading feat categories from storage:", e);
    }

    // Default configuration on first run
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
        if (Array.isArray(list)) {
          list.forEach((sub) => all.add(sub));
        }
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
    const config = { ...this.getAllFeatSubcategoriesConfig() };
    const targetKey = categoryKey === 'all' ? 'general' : categoryKey;
    const list = config[targetKey] ? [...config[targetKey]] : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    config[targetKey] = list;
    this.saveAllFeatSubcategoriesConfig(config);
    return true;
  }

  static renameFeatSubcategory(categoryKey: string, oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew || !categoryKey || oldName === trimmedNew) return false;
    const config = { ...this.getAllFeatSubcategoriesConfig() };
    let modified = false;

    if (categoryKey && categoryKey !== 'all' && config[categoryKey]) {
      const idx = config[categoryKey].indexOf(oldName);
      if (idx !== -1) {
        config[categoryKey][idx] = trimmedNew;
        modified = true;
      }
    }
    Object.keys(config).forEach((cat) => {
      if (categoryKey === 'all' || !categoryKey) {
        const idx = (config[cat] || []).indexOf(oldName);
        if (idx !== -1) {
          config[cat][idx] = trimmedNew;
          modified = true;
        }
      }
    });

    if (!modified) return false;
    this.saveAllFeatSubcategoriesConfig(config);

    // Also update all entities that had this subcategory
    const entities = this.getEntities();
    entities.forEach((ent) => {
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
      if (ent.tags?.includes(oldName)) {
        ent.tags = ent.tags.map((t) => (t === oldName ? trimmedNew : t));
        updated = true;
      }
      if (updated) {
        HecosStorage.saveEntity(ent);
      }
    });

    return true;
  }

  static deleteFeatSubcategory(categoryKey: string, subcategoryName: string): boolean {
    if (!subcategoryName) return false;
    const config = { ...this.getAllFeatSubcategoriesConfig() };

    if (categoryKey && categoryKey !== 'all' && config[categoryKey]) {
      config[categoryKey] = config[categoryKey].filter((s) => s !== subcategoryName);
    }
    Object.keys(config).forEach((cat) => {
      if (categoryKey === 'all' || !categoryKey) {
        if (config[cat]?.includes(subcategoryName)) {
          config[cat] = config[cat].filter((s) => s !== subcategoryName);
        }
      }
    });

    this.saveAllFeatSubcategoriesConfig(config);

    // Also remove from affected entities thoroughly
    const entities = this.getEntities();
    entities.forEach((ent) => {
      let updated = false;
      if (ent.featData?.subcategories?.includes(subcategoryName)) {
        ent.featData.subcategories = ent.featData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.subcategories?.includes(subcategoryName)) {
        ent.subcategories = ent.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.subcategory === subcategoryName) {
        ent.subcategory = (ent.featData?.subcategories && ent.featData.subcategories[0]) || (ent.subcategories && ent.subcategories[0]) || '';
        updated = true;
      }
      if (ent.tags?.includes(subcategoryName)) {
        ent.tags = ent.tags.filter((t) => t !== subcategoryName);
        updated = true;
      }
      if (updated) {
        HecosStorage.saveEntity(ent);
      }
    });

    // Remove folder secret flag if no longer present in any category
    const allRemaining = new Set<string>();
    Object.values(config).forEach((list) => (list || []).forEach((s) => allRemaining.add(s)));
    if (!allRemaining.has(subcategoryName)) {
      HecosStorage.setFolderSecret(subcategoryName, false);
    }

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
    ent.subcategory = (cleanSubcats && cleanSubcats[0]) || ent.subcategory || '';
    
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
    if (this.spellCategoriesCache) {
      return this.spellCategoriesCache;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPELL_CATEGORIES);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          this.spellCategoriesCache = parsed;
          return this.spellCategoriesCache;
        }
      }
    } catch (e) {
      console.warn("Error reading spell categories config:", e);
    }
    this.spellCategoriesCache = { ...DEFAULT_SPELL_CATEGORIES_CONFIG };
    this.saveAllSpellSubcategoriesConfig(this.spellCategoriesCache);
    return this.spellCategoriesCache;
  }

  static saveAllSpellSubcategoriesConfig(config: Record<string, string[]>): void {
    this.spellCategoriesCache = { ...config };
    try {
      localStorage.setItem(STORAGE_KEYS.SPELL_CATEGORIES, JSON.stringify(config));
    } catch (e) {
      console.warn("Error saving spell categories config:", e);
    }
    this.notifySpellCategoriesSubscribers();
    this.notifyEntitySubscribers();
    syncSpellCategoriesToFirebase(config).catch(() => {});
  }

  static addSpellSubcategory(categoryKey: string, subcategoryName: string): boolean {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !categoryKey) return false;
    const config = { ...this.getAllSpellSubcategoriesConfig() };
    const targetKey = categoryKey === 'all' ? 'e_fisica' : categoryKey;
    const list = config[targetKey] ? [...config[targetKey]] : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    config[targetKey] = list;
    this.saveAllSpellSubcategoriesConfig(config);
    return true;
  }

  static renameSpellSubcategory(categoryKey: string, oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew || !categoryKey || oldName === trimmedNew) return false;
    const config = { ...this.getAllSpellSubcategoriesConfig() };
    let modified = false;

    if (categoryKey && categoryKey !== 'all' && config[categoryKey]) {
      const idx = config[categoryKey].indexOf(oldName);
      if (idx !== -1) {
        config[categoryKey][idx] = trimmedNew;
        modified = true;
      }
    }
    Object.keys(config).forEach((cat) => {
      if (categoryKey === 'all' || !categoryKey) {
        const idx = (config[cat] || []).indexOf(oldName);
        if (idx !== -1) {
          config[cat][idx] = trimmedNew;
          modified = true;
        }
      }
    });

    if (!modified) return false;
    this.saveAllSpellSubcategoriesConfig(config);

    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'spell' || ent.spellData || ent.tags?.includes('spell') || ent.tags?.includes('magia')) {
        let updated = false;
        let subcats = ent.spellData?.subcategories || ent.subcategories || [];
        if (subcats.includes(oldName)) {
          subcats = subcats.map((s) => (s === oldName ? trimmedNew : s));
          ent.subcategories = subcats;
          if (ent.spellData) {
            ent.spellData.subcategories = subcats;
          }
          updated = true;
        }
        if (ent.subcategory === oldName) {
          ent.subcategory = trimmedNew;
          updated = true;
        }
        if (ent.tags?.includes(oldName)) {
          ent.tags = ent.tags.map((t) => (t === oldName ? trimmedNew : t));
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
    if (!subcategoryName) return false;
    const config = { ...this.getAllSpellSubcategoriesConfig() };

    if (categoryKey && categoryKey !== 'all' && config[categoryKey]) {
      config[categoryKey] = config[categoryKey].filter((s) => s !== subcategoryName);
    }
    Object.keys(config).forEach((cat) => {
      if (categoryKey === 'all' || !categoryKey) {
        if (config[cat]?.includes(subcategoryName)) {
          config[cat] = config[cat].filter((s) => s !== subcategoryName);
        }
      }
    });

    this.saveAllSpellSubcategoriesConfig(config);

    // Unlink the deleted folder from ALL spell entities thoroughly
    const entities = this.getEntities();
    entities.forEach((ent) => {
      if (ent.category === 'spell' || ent.spellData || ent.tags?.includes('spell') || ent.tags?.includes('magia') || ent.tags?.includes(subcategoryName) || ent.subcategories?.includes(subcategoryName)) {
        let updated = false;

        // 1. Unlink from ent.subcategories
        if (ent.subcategories?.includes(subcategoryName)) {
          ent.subcategories = ent.subcategories.filter((s) => s !== subcategoryName);
          updated = true;
        }

        // 2. Unlink from ent.spellData.subcategories
        if (ent.spellData?.subcategories?.includes(subcategoryName)) {
          ent.spellData.subcategories = ent.spellData.subcategories.filter((s) => s !== subcategoryName);
          updated = true;
        }

        // 3. Unlink from ent.subcategory field
        if (ent.subcategory === subcategoryName) {
          ent.subcategory = (ent.spellData?.subcategories && ent.spellData.subcategories[0]) || (ent.subcategories && ent.subcategories[0]) || '';
          updated = true;
        }

        // 4. Unlink from ent.tags if present
        if (ent.tags?.includes(subcategoryName)) {
          ent.tags = ent.tags.filter((t) => t !== subcategoryName);
          updated = true;
        }

        if (updated) {
          HecosStorage.saveEntity(ent);
        }
      }
    });

    // Remove folder secret flag if no longer present in any category
    const allRemaining = new Set<string>();
    Object.values(config).forEach((list) => (list || []).forEach((s) => allRemaining.add(s)));
    if (!allRemaining.has(subcategoryName)) {
      HecosStorage.setFolderSecret(subcategoryName, false);
    }

    return true;
  }

  static assignSpellSubcategories(spellId: string, subcategories: string[]): boolean {
    const ent = this.getEntityById(spellId);
    if (!ent) return false;
    const cleanSubcats = Array.from(new Set(subcategories.map((s) => s.trim()).filter(Boolean)));
    ent.subcategories = cleanSubcats;
    if (ent.spellData) {
      ent.spellData.subcategories = cleanSubcats;
    }
    ent.subcategory = (cleanSubcats && cleanSubcats[0]) || ent.subcategory || '';
    const currentTags = new Set(ent.tags || []);
    cleanSubcats.forEach((s) => currentTags.add(s));
    ent.tags = Array.from(currentTags);
    this.saveEntity(ent);
    return true;
  }

  static toggleSpellSubcategory(spellId: string, subcategoryName: string): boolean {
    const ent = this.getEntityById(spellId);
    if (!ent) return false;
    const current = ent.spellData?.subcategories || ent.subcategories || (ent.subcategory ? [ent.subcategory] : []);
    const set = new Set(current);
    if (set.has(subcategoryName)) {
      set.delete(subcategoryName);
    } else {
      set.add(subcategoryName);
    }
    return this.assignSpellSubcategories(spellId, Array.from(set));
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
          ent.subcategory = (subcats && subcats[0]) || '';
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
    ent.subcategory = (cleanSubcats && cleanSubcats[0]) || ent.subcategory || '';
    const currentTags = new Set(ent.tags || []);
    cleanSubcats.forEach((s) => currentTags.add(s));
    ent.tags = Array.from(currentTags);
    this.saveEntity(ent);
    return true;
  }

  /**
   * Universal Subcategories & Folders Management for all Scopes
   */
  static getScopeSubcategoriesConfig(scope: string): Record<string, string[]> {
    if (scope === 'feat') return this.getAllFeatSubcategoriesConfig();
    if (scope === 'spell') return this.getAllSpellSubcategoriesConfig();
    if (scope === 'item') return this.getAllItemSubcategoriesConfig();

    const key = `hecos_${scope}_categories_v1`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Error reading ${scope} categories:`, e);
    }

    let defs: Record<string, string[]> = { all: ['Geral', 'Favoritos', 'Arquivo'] };
    if (scope === 'peril') defs = DEFAULT_PERIL_CATEGORIES_CONFIG;
    else if (scope === 'class') defs = DEFAULT_CLASS_CATEGORIES_CONFIG;
    else if (scope === 'archetype') defs = DEFAULT_ARCHETYPE_CATEGORIES_CONFIG;
    else if (scope === 'ancestry') defs = DEFAULT_ANCESTRY_CATEGORIES_CONFIG;
    else if (scope === 'fauna') defs = DEFAULT_FAUNA_CATEGORIES_CONFIG;
    else if (scope === 'flora') defs = DEFAULT_FLORA_CATEGORIES_CONFIG;
    else if (scope === 'location') defs = DEFAULT_LOCATION_CATEGORIES_CONFIG;
    else if (scope === 'pc') defs = DEFAULT_PC_CATEGORIES_CONFIG;
    else if (scope === 'npc') defs = DEFAULT_NPC_CATEGORIES_CONFIG;
    else if (scope === 'organization') defs = DEFAULT_ORGANIZATION_CATEGORIES_CONFIG;
    else if (scope === 'map') defs = DEFAULT_MAP_CATEGORIES_CONFIG;
    else if (scope === 'tag') defs = DEFAULT_TAG_CATEGORIES_CONFIG;

    return defs;
  }

  static saveScopeSubcategoriesConfig(scope: string, config: Record<string, string[]>): void {
    if (scope === 'feat') return this.saveAllFeatSubcategoriesConfig(config);
    if (scope === 'spell') return this.saveAllSpellSubcategoriesConfig(config);
    if (scope === 'item') return this.saveAllItemSubcategoriesConfig(config);

    const key = `hecos_${scope}_categories_v1`;
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch (e) {
      console.warn(`Error saving ${scope} categories:`, e);
    }
    this.notifyEntitySubscribers();
  }

  static addScopeSubcategory(scope: string, categoryKey: string, subcategoryName: string): boolean {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !categoryKey) return false;
    const config = this.getScopeSubcategoriesConfig(scope);
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    config[categoryKey] = list;
    this.saveScopeSubcategoriesConfig(scope, config);
    return true;
  }

  static renameScopeSubcategory(scope: string, categoryKey: string, oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew || !categoryKey || oldName === trimmedNew) return false;
    const config = this.getScopeSubcategoriesConfig(scope);
    const list = config[categoryKey] ? [...config[categoryKey]] : [];
    const idx = list.indexOf(oldName);
    if (idx === -1) return false;
    list[idx] = trimmedNew;
    config[categoryKey] = list;
    this.saveScopeSubcategoriesConfig(scope, config);

    // Update entities in storage
    const entities = this.getEntities();
    entities.forEach((ent) => {
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
      if (ent.featData?.subcategories?.includes(oldName)) {
        ent.featData.subcategories = ent.featData.subcategories.map((s) => (s === oldName ? trimmedNew : s));
        updated = true;
      }
      if (ent.spellData?.subcategories?.includes(oldName)) {
        ent.spellData.subcategories = ent.spellData.subcategories.map((s) => (s === oldName ? trimmedNew : s));
        updated = true;
      }
      if (ent.itemData?.subcategories?.includes(oldName)) {
        ent.itemData.subcategories = ent.itemData.subcategories.map((s) => (s === oldName ? trimmedNew : s));
        updated = true;
      }
      if (updated) {
        HecosStorage.saveEntity(ent);
      }
    });

    return true;
  }

  static deleteScopeSubcategory(scope: string, categoryKey: string, subcategoryName: string): boolean {
    if (!categoryKey || !subcategoryName) return false;
    if (scope === 'spell') {
      return this.deleteSpellSubcategory(categoryKey, subcategoryName);
    }
    if (scope === 'feat') {
      return this.deleteFeatSubcategory(categoryKey, subcategoryName);
    }
    if (scope === 'item') {
      return this.deleteItemSubcategory(categoryKey, subcategoryName);
    }

    const config = this.getScopeSubcategoriesConfig(scope);
    if (!config[categoryKey]) return false;
    config[categoryKey] = config[categoryKey].filter((s) => s !== subcategoryName);
    this.saveScopeSubcategoriesConfig(scope, config);

    const entities = this.getEntities();
    entities.forEach((ent) => {
      let updated = false;
      if (ent.subcategories?.includes(subcategoryName)) {
        ent.subcategories = ent.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.subcategory === subcategoryName) {
        ent.subcategory = (ent.subcategories && ent.subcategories[0]) || '';
        updated = true;
      }
      if (ent.featData?.subcategories?.includes(subcategoryName)) {
        ent.featData.subcategories = ent.featData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.spellData?.subcategories?.includes(subcategoryName)) {
        ent.spellData.subcategories = ent.spellData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.itemData?.subcategories?.includes(subcategoryName)) {
        ent.itemData.subcategories = ent.itemData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.perilData?.subcategories?.includes(subcategoryName)) {
        ent.perilData.subcategories = ent.perilData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.classData?.subcategories?.includes(subcategoryName)) {
        ent.classData.subcategories = ent.classData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.ancestryData?.subcategories?.includes(subcategoryName)) {
        ent.ancestryData.subcategories = ent.ancestryData.subcategories.filter((s) => s !== subcategoryName);
        updated = true;
      }
      if (ent.tags?.includes(subcategoryName)) {
        ent.tags = ent.tags.filter((t) => t !== subcategoryName);
        updated = true;
      }
      if (updated) {
        HecosStorage.saveEntity(ent);
      }
    });

    const allRemaining = new Set<string>();
    Object.values(config).forEach((list) => (list || []).forEach((s) => allRemaining.add(s)));
    if (!allRemaining.has(subcategoryName)) {
      HecosStorage.setFolderSecret(subcategoryName, false);
    }

    return true;
  }

  static assignEntitySubcategories(entityId: string, subcategories: string[]): boolean {
    const ent = this.getEntityById(entityId);
    if (!ent) return false;
    const cleanSubcats = Array.from(new Set(subcategories.map((s) => s.trim()).filter(Boolean)));
    ent.subcategories = cleanSubcats;
    ent.subcategory = (cleanSubcats && cleanSubcats[0]) || ent.subcategory || '';
    if (ent.featData) ent.featData.subcategories = cleanSubcats;
    if (ent.spellData) ent.spellData.subcategories = cleanSubcats;
    if (ent.itemData) ent.itemData.subcategories = cleanSubcats;

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
   */
  static isFolderSecret(folderOrSubcategory: string): boolean {
    if (!folderOrSubcategory) return false;
    const trimmed = folderOrSubcategory.trim();
    if (trimmed === 'all' || trimmed === '__none__' || trimmed === '') return false;
    
    // Check granular folder permissions first
    const perms = this.getFolderPermissions();
    const perm = perms[trimmed.toLowerCase()] || perms[trimmed];
    if (perm) {
      return perm.visibility === 'gm';
    }
    
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
      id?: string;
      category?: string;
      subcategory?: string;
      subcategories?: string[];
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

    // 1. Explicit item-level visibility
    if (item.visibility === 'all') {
      return true;
    }
    if (item.visibility === 'gm') {
      return false;
    }
    if (item.visibility === 'custom') {
      if (!user) return false;
      return Boolean(item.allowedUserIds?.some((id) =>
        id === user.id ||
        id.toLowerCase() === user.username.toLowerCase() ||
        id.toLowerCase() === user.name.toLowerCase()
      ));
    }

    // 2. If item is a link to another entity (e.g. featEntityId or entityId)
    const eff = this.getEffectiveItemPermission(item);
    if (eff.sourceEntity) {
      return this.canUserAccess(eff.visibility, eff.allowedUserIds, user);
    }

    // 3. Explicit legacy isSecret flag: false means public
    if (item.isSecret === false) {
      return true;
    }

    // 4. Check parent category permission (e.g. 'feat', 'spell', 'item', 'ancestries', etc.)
    if (item.category) {
      const catPerm = this.getFolderPermission(item.category);
      if (catPerm && catPerm.visibility) {
        if (this.canUserAccess(catPerm.visibility, catPerm.allowedUserIds, user)) {
          return true;
        }
      }
    }

    // 5. If item has isSecret === true and no category permission opened it
    if (item.isSecret === true) {
      return false;
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
      (entity.tags || []).forEach(tag => {
        const t = (tag || '').trim();
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
  private static customTagsCache: Record<string, { description: string; category?: string; color?: string }> | null = null;
  private static tagSubscribers = new Set<() => void>();

  static getCustomTags(): Record<string, { description: string; category?: string; color?: string }> {
    if (this.customTagsCache) return this.customTagsCache;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TAGS);
      if (stored) {
        this.customTagsCache = JSON.parse(stored);
        return this.customTagsCache || {};
      }
    } catch (e) {
      console.warn("Error reading custom tags:", e);
    }
    this.customTagsCache = {};
    return this.customTagsCache;
  }

  static saveCustomTag(
    tagName: string,
    data: { description: string; category?: string; color?: string }
  ): void {
    if (!tagName) return;
    const clean = tagName.trim().replace(/^#/, '');
    const cleanKey = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const exactKey = clean.toLowerCase();
    const all = { ...this.getCustomTags() };
    const entry = {
      category: data.category || 'Campanha e Narrativa',
      description: data.description || 'Tag temática ou de organização em Hecos.',
      color: data.color || 'border-cyan-800/80 bg-cyan-950/80 text-cyan-300',
    };
    all[cleanKey] = entry;
    if (exactKey !== cleanKey) {
      all[exactKey] = entry;
    }
    this.customTagsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error saving custom tag:", e);
    }
    syncCustomTagsToFirebase(all).catch(() => {});
    this.tagSubscribers.forEach((cb) => cb());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hecos:tags-updated', { detail: { tag: clean } }));
    }
  }

  static deleteCustomTag(tagName: string): void {
    if (!tagName) return;
    const clean = tagName.trim().replace(/^#/, '');
    const cleanKey = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const exactKey = clean.toLowerCase();
    const all = { ...this.getCustomTags() };
    delete all[cleanKey];
    delete all[exactKey];
    this.customTagsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error deleting custom tag:", e);
    }
    syncCustomTagsToFirebase(all).catch(() => {});
    this.tagSubscribers.forEach((cb) => cb());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hecos:tags-updated', { detail: { tag: clean } }));
    }
  }

  static subscribeTags(callback: () => void): () => void {
    this.ensureRealtimeInitialized();
    this.tagSubscribers.add(callback);
    return () => this.tagSubscribers.delete(callback);
  }

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
    const clean = traitName.trim();
    const cleanKey = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const exactKey = clean.toLowerCase();
    const all = { ...this.getCustomTraits() };
    const entry = {
      category: data.category || 'Mecânica Hecos',
      description: data.description || 'Traço customizado do mundo de Hecos.',
      color: data.color || 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]',
    };
    all[cleanKey] = entry;
    if (exactKey !== cleanKey) {
      all[exactKey] = entry;
    }
    this.customTraitsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TRAITS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error saving custom trait:", e);
    }
    syncCustomTraitsToFirebase(all).catch(() => {});
    this.traitSubscribers.forEach((cb) => cb());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hecos:traits-updated', { detail: { trait: clean } }));
    }
  }

  static deleteCustomTrait(traitName: string): void {
    if (!traitName) return;
    const clean = traitName.trim();
    const cleanKey = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const exactKey = clean.toLowerCase();
    const all = { ...this.getCustomTraits() };
    delete all[cleanKey];
    delete all[exactKey];
    this.customTraitsCache = all;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TRAITS, JSON.stringify(all));
    } catch (e) {
      console.warn("Error deleting custom trait:", e);
    }
    syncCustomTraitsToFirebase(all).catch(() => {});
    this.traitSubscribers.forEach((cb) => cb());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hecos:traits-updated', { detail: { trait: clean } }));
    }
  }

  static subscribeTraits(callback: () => void): () => void {
    this.ensureRealtimeInitialized();
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

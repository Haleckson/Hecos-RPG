export type EntityCategory =
  | 'pc'
  | 'npc'
  | 'creature'
  | 'spell'
  | 'item'
  | 'location'
  | 'fauna'
  | 'flora'
  | 'organization'
  | 'ancestry'
  | 'class'
  | 'archetype'
  | 'session'
  | 'gm_note'
  | 'feat'
  | 'rule'
  | 'timeline'
  | 'quest';

export type ActionCost = 1 | 2 | 3 | 'free' | 'reaction' | 'passive';

export interface PF2eAction {
  id: string;
  name: string;
  cost: ActionCost;
  traits?: string[];
  trigger?: string;
  requirement?: string;
  description: string;
}

export type SpellTradition = 'arcano' | 'divino' | 'oculto' | 'primal' | 'outras';

export type SpellCategoryType =
  | 'all'
  | 'arcane'
  | 'divine'
  | 'occult'
  | 'primal'
  | 'focus'
  | 'ritual'
  | 'extras';

export interface PF2eSpellAttributes {
  rank: number; // 0 = Truque / Cantrip, 1-10
  traditions: string[];
  spellType?: 'spell' | 'focus' | 'ritual' | 'other' | 'cantrip';
  subcategories?: string[];
  castTime: string;
  range?: string;
  area?: string;
  targets?: string;
  duration?: string;
  savingThrow?: string;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único';
  traits: string[];
  description: string;
  heightened?: string;
  criticalSuccess?: string;
  success?: string;
  failure?: string;
  criticalFailure?: string;
  hecosLore?: string;
  gmNotes?: string;
}

export type ItemCategoryType =
  | 'all'
  | 'weapons'
  | 'armor'
  | 'consumables'
  | 'alchemical'
  | 'magical'
  | 'artifacts'
  | 'gear'
  | 'extras';

export interface PF2eItemAttributes {
  level: number;
  itemType?: ItemCategoryType;
  subcategories?: string[];
  price?: string;
  bulk?: string;
  hands?: string;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único';
  usage?: string;
  activation?: string;
  activationAction?: string;
  activationTrigger?: string;
  activationRequirement?: string;
  activationFrequency?: string;
  activationEffect?: string;
  traits: string[];
  hardness?: number;
  hp?: number;
  brokenThreshold?: number;
  damage?: string;
  damageType?: string;
  weaponGroup?: string;
  weaponRange?: string;
  reload?: string;
  armorBonus?: number;
  dexCap?: number;
  checkPenalty?: number;
  speedPenalty?: string;
  strengthReq?: number;
  craftFormula?: string;
  craftRequirements?: string;
  specialProperties?: string;
  description?: string;
  hecosLore?: string;
  gmNotes?: string;
}

export interface PF2eStatblock {
  level: number;
  traits: string[];
  alignmentOrTradition?: string;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  perception?: number;
  senses?: string;
  languages?: string[];
  skills?: Record<string, number>;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  ac?: number;
  fort?: number;
  ref?: number;
  will?: number;
  hp?: number;
  immunities?: string[];
  resistances?: string[];
  weaknesses?: string[];
  speed?: string;
  actions?: PF2eAction[];
  spells?: {
    tradition: string;
    dc: number;
    attack: number;
    spellsByRank: Record<number, string[]>;
  };
  specialAbilities?: { name: string; description: string }[];
}

export interface ItemAttributes extends PF2eItemAttributes {}

export interface LocationAttributes {
  settlementType?: string;
  ruler?: string;
  population?: string;
  dangerLevel?: string;
  planeOrRegion?: string;
  districts?: string[];
  coordinates?: { x: number; y: number };
}

export interface SessionAttributes {
  sessionNumber: number;
  inGameDate: string;
  realDate: string;
  attendees: string[];
  xpAwarded?: number;
  lootAwarded?: string[];
  locationsVisited?: string[];
}

export interface TimelineEventAttributes {
  era: string;
  year: string;
  order: number;
  importance: 'cosmic' | 'major' | 'minor' | 'session';
  relatedEntityIds?: string[];
}

export type QuestStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
export type QuestDifficulty = 'Trivial' | 'Baixa' | 'Moderada' | 'Severa' | 'Extrema' | 'Lendária';

export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
  isSecret?: boolean;
}

export interface QuestAttributes {
  status: QuestStatus;
  difficulty?: QuestDifficulty;
  recommendedLevel?: number;
  questGiver?: string; // Entity ID or name
  location?: string; // Entity ID or location name
  objectives: QuestObjective[];
  rewards?: {
    xp?: number;
    gold?: string;
    items?: string[]; // Entity IDs or descriptions
  };
  actOrChapter?: string;
}

export interface GMNoteAttributes {
  category: 'plot' | 'secret_lore' | 'encounter_plan' | 'scratchpad';
  isRevealedToPlayers: boolean;
  linkedQuests?: string[];
}

export interface AncestryHeritage {
  id: string;
  name: string;
  description: string;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
}

export interface AncestryFeat {
  id: string;
  name: string;
  rank: 1 | 5 | 9 | 13 | 17;
  actions?: '1' | '2' | '3' | 'free' | 'reaction' | 'passive';
  traits?: string[];
  prerequisites?: string;
  description: string;
  featEntityId?: string;
  slug?: string;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
}

export type FeatCategoryType =
  | 'general'
  | 'skill'
  | 'class'
  | 'archetype'
  | 'ancestry'
  | 'extras'
  | 'hecos';

export type FeatRarity = 'Comum' | 'Incomum' | 'Raro' | 'Único';

export type FeatActionCost =
  | 'passive'
  | '1'
  | '2'
  | '3'
  | 'free'
  | 'reaction'
  | '1-to-2'
  | '1-to-3'
  | 'activity'
  | 'custom';

export interface PF2eFeatAttributes {
  level: number;
  featType: FeatCategoryType;
  subcategories?: string[];
  rarity: FeatRarity;
  traits: string[];
  actionCost: FeatActionCost;
  actionCostDetails?: string;
  prerequisites: string;
  frequency?: string;
  trigger?: string;
  requirements?: string;
  description: string;
  criticalSuccess?: string;
  success?: string;
  failure?: string;
  criticalFailure?: string;
  special?: string;
  associatedClassOrAncestry?: string;
  hecosLore?: string;
  roleplayTips?: string;
  gmNotes?: string;
}

export interface FeatCategoryFolderInfo {
  id: FeatCategoryType;
  name: string;
  englishName: string;
  description: string;
  color: string;
  accentColor: string;
  subcategories: string[];
}

export interface AncestryAlbumImage {
  id: string;
  url: string;
  caption?: string;
  author?: string;
  createdAt?: number;
}

export interface AncestryAttributes {
  // Álbum & Galeria Visual (Subcategoria colapsável no topo de Lore)
  album?: AncestryAlbumImage[];

  // Cabeçalho
  hp: string;
  size: string;
  speed: string;
  senses: string;
  attributes: string;
  traits: string;
  innate: string;
  languages: string;

  // Mecânicas
  heritages: AncestryHeritage[];
  culturalArsenal: {
    proficienciesAndWeapons: string;
    uniqueItemsAndArchetypes: string;
  };
  feats: {
    rank1: AncestryFeat[];
    rank5: AncestryFeat[];
    rank9: AncestryFeat[];
    rank13: AncestryFeat[];
    rank17: AncestryFeat[];
  };

  // Lore
  physiology: {
    physicalDescription: string;
    functionalAnatomy: string;
    bodyLanguage: string;
    lifeCycle: string;
    dietAndMetabolism: string;
  };
  identity: {
    narrativeHook: string;
    psychologyAndPhilosophy: string;
    creationMyth: string;
    epicsAndFigures: string;
    purpose: string;
    theAdventurer: string;
  };
  culture: {
    etiquetteAndCustoms: string;
    namesAndMeanings: string;
    clothingAndFashion: string;
    artisticExpressions: string;
    gastronomy: string;
    leisureAndSports: string;
  };
  spirituality: {
    nativePantheon: string;
    funeraryPractices: string;
    magicalConnection: string;
  };
  society: {
    socialStructure: string;
    lawsAndTaboos: string;
    economyAndTrade: string;
    educationAndRites: string;
  };
  warfare: {
    nativeFightingStyles: string;
    militaryOrganization: string;
    defenseEngineering: string;
  };
  world: {
    geographicalDistribution: string;
    diplomaticRelations: string;
    externalPerspective: string;
  };
  gmGuide: {
    roleplayingNpcs: string;
    themesAndConflicts: string;
    secretLore?: string;
    adventureHooks?: string;
    trueOrigins?: string;
    gmNotes?: string;
  };
}

export type PerilKind = 'monster' | 'hazard_simple' | 'hazard_complex' | 'environmental' | 'haunt';

export interface PerilAttack {
  id: string;
  name: string;
  type: 'melee' | 'ranged';
  bonus: number;
  traits: string[];
  damage: string;
  range?: string;
  extraEffects?: string;
}

export interface PerilAction {
  id: string;
  name: string;
  cost: '1' | '2' | '3' | 'free' | 'reaction';
  traits: string[];
  trigger?: string;
  effect: string;
}

export interface PerilFieldVisibility {
  name?: ItemVisibility;
  level?: ItemVisibility;
  typeAndTraits?: ItemVisibility;
  description?: ItemVisibility;
  sensesAndPerception?: ItemVisibility;
  acAndDefenses?: ItemVisibility;
  hpAndHealth?: ItemVisibility;
  hardnessAndBT?: ItemVisibility;
  weaknessesAndResistances?: ItemVisibility;
  immunities?: ItemVisibility;
  attacksAndDamage?: ItemVisibility;
  actionsAndAbilities?: ItemVisibility;
  disableAndReset?: ItemVisibility;
  routine?: ItemVisibility;
  spells?: ItemVisibility;
  gmNotes?: ItemVisibility;
  allowedUsers?: Record<string, string[]>;
}

export interface PerilAttributes {
  perilKind: PerilKind;
  level: number;
  rarity: 'Comum' | 'Incomum' | 'Raro' | 'Único';
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  traits: string[];
  stealthCheck?: string; // e.g. "Furtividade +15 ou Percepção CD 25 para notar"
  
  // Perception & Senses
  perception?: number;
  senses?: string;
  languages?: string[];
  skills?: Record<string, number>;
  attributes?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  // Defenses
  ac?: number;
  fort?: number;
  ref?: number;
  will?: number;
  hp?: number;
  maxHp?: number;
  hardness?: number;
  brokenThreshold?: number;
  immunities?: string[];
  weaknesses?: string[];
  resistances?: string[];

  // Speed & Offense
  speed?: string;
  attacks?: PerilAttack[];
  actions?: PerilAction[];
  spells?: {
    tradition: string;
    dc: number;
    attack: number;
    spellsList: string;
  };

  // Hazard Mechanics
  disable?: string; // Desativação
  reset?: string; // Reset
  routine?: string; // Rotina (Hazard Complexo)

  // Lore & Notes
  description?: string;
  hecosLore?: string;
  gmNotes?: string;

  // Field-level visibility settings
  fieldVisibility?: PerilFieldVisibility;
}

export type ClassProficiencyRank = 'Destreinado' | 'Treinado' | 'Especialista' | 'Mestre' | 'Lendário';

export interface ClassFeature {
  id: string;
  level: number;
  name: string;
  description: string;
  actionCost?: string;
  traits?: string[];
}

export interface ClassSubclass {
  id: string;
  name: string;
  description: string;
  grantedFeatures?: string;
}

export interface ClassArchetypeFeat {
  id: string;
  level: number;
  name: string;
  description: string;
  prerequisites?: string;
  actionCost?: string;
  traits?: string[];
}

export interface ClassAttributes {
  kind: 'class' | 'archetype';
  hpPerLevel?: number; // e.g. 6, 8, 10, 12
  keyAttribute?: string; // Força, Destreza, etc.
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único';
  
  // Proficiencies
  perceptionProficiency?: ClassProficiencyRank;
  savingThrows?: {
    fortitude: ClassProficiencyRank;
    reflex: ClassProficiencyRank;
    will: ClassProficiencyRank;
  };
  skillsProficiency?: string;
  attacksProficiency?: string;
  defensesProficiency?: string;
  classDcProficiency?: ClassProficiencyRank;
  
  // Spellcasting (optional)
  spellcasting?: {
    isSpellcaster: boolean;
    tradition?: 'Arcana' | 'Divina' | 'Oculta' | 'Primal' | 'Nenhuma';
    spellType?: 'Preparado' | 'Espontâneo' | 'Foco';
    keyAttribute?: string;
  };

  // Features by Level
  features?: ClassFeature[];
  subclasses?: ClassSubclass[];

  // Archetype specifics
  archetypeDedicationLevel?: number;
  prerequisites?: string;
  access?: string;
  dedicationFeat?: ClassArchetypeFeat;
  archetypeFeats?: ClassArchetypeFeat[];

  description?: string;
  hecosLore?: string;
  gmNotes?: string;
}

export type ItemVisibility = 'gm' | 'all' | 'custom';

export type UserRole = 'gm' | 'player';

export interface HecosUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface FolderPermission {
  folderId: string;
  visibility: ItemVisibility;
  allowedUserIds?: string[];
}

export interface HecosEntity {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: EntityCategory;
  subcategory?: string;
  subcategories?: string[];
  tags: string[];
  traits?: string[]; // PF2e-style mechanics traits (e.g. Humanoide, Incomum, Fogo, Transmutação...)
  summary: string;
  content: string; // Markdown content with @mention and block support
  coverImage?: string;
  icon?: string;
  isSecret?: boolean;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
  createdAt: string;
  updatedAt: string;

  // Category specific specialized data
  statblock?: PF2eStatblock;
  perilData?: PerilAttributes;
  classData?: ClassAttributes;
  ancestryData?: AncestryAttributes;
  featData?: PF2eFeatAttributes;
  itemData?: ItemAttributes;
  locationData?: LocationAttributes;
  sessionData?: SessionAttributes;
  timelineData?: TimelineEventAttributes;
  gmNoteData?: GMNoteAttributes;
  spellData?: PF2eSpellAttributes;
  questData?: QuestAttributes;
}

export interface MapPin {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  subtitle?: string;
  category: 'city' | 'dungeon' | 'ruins' | 'anomaly' | 'landmark' | 'poi' | 'nature' | 'temple' | 'settlement' | 'hazard' | 'faction';
  description: string;
  linkedEntityId?: string;
  dangerLevel?: 'Seguro' | 'Baixo' | 'Moderado' | 'Perigoso' | 'Extremo' | 'Mortal' | 'Desconhecido';
  iconType?: string;
  color?: string;
  isSecret?: boolean;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
  gmNotes?: string;
  tags?: string[];
  region?: string;
}

export interface InteractiveMapData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  scale?: string;
  gridSize?: number;
  pins: MapPin[];
  isSecret?: boolean;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
}

export interface YouTubeAmbianceTrack {
  id: string;
  title: string;
  url: string;
  videoId: string;
  category: 'ambient' | 'combat' | 'tavern' | 'eerie' | 'mystic' | 'eclipse';
  description?: string;
}

export interface GoogleDriveResource {
  id: string;
  title: string;
  url: string;
  type: 'folder' | 'document' | 'sheet' | 'pdf' | 'other';
  description?: string;
  linkedEntityId?: string;
}

export interface TagInfo {
  name: string;
  count: number;
  category?: string;
}

export interface TrashedEntity {
  entity: HecosEntity;
  deletedAt: string;
  deletedBy?: string;
  originalCategory: string;
}

export interface ImageAdjustment {
  x: number; // horizontal translation % (-200 to 200, default 0)
  y: number; // vertical translation % (-200 to 200, default 0)
  scale: number; // zoom scale multiplier (0.15 to 8.0, default 1.0)
  fitMode?: 'cover' | 'contain' | 'custom';
}

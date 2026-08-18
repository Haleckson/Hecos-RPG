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
  | 'timeline';

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

export interface PF2eSpellSlot {
  rank: number;
  traditions: string[];
  castTime: string;
  range?: string;
  area?: string;
  targets?: string;
  duration?: string;
  savingThrow?: string;
  traits: string[];
  description: string;
  heightened?: string;
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

export interface ItemAttributes {
  level: number;
  price?: string;
  bulk?: string;
  rarity: 'Comum' | 'Incomum' | 'Raro' | 'Único';
  usage?: string;
  activation?: string;
  traits: string[];
}

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

export interface GMNoteAttributes {
  category: 'plot' | 'secret_lore' | 'encounter_plan' | 'scratchpad';
  isRevealedToPlayers: boolean;
  linkedQuests?: string[];
}

export interface AncestryHeritage {
  id: string;
  name: string;
  description: string;
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

export interface AncestryAttributes {
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

export interface HecosEntity {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: EntityCategory;
  subcategory?: string;
  subcategories?: string[];
  tags: string[];
  summary: string;
  content: string; // Markdown content with @mention and block support
  coverImage?: string;
  icon?: string;
  isSecret?: boolean;
  createdAt: string;
  updatedAt: string;

  // Category specific specialized data
  statblock?: PF2eStatblock;
  ancestryData?: AncestryAttributes;
  featData?: PF2eFeatAttributes;
  itemData?: ItemAttributes;
  locationData?: LocationAttributes;
  sessionData?: SessionAttributes;
  timelineData?: TimelineEventAttributes;
  gmNoteData?: GMNoteAttributes;
  spellData?: PF2eSpellSlot;
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

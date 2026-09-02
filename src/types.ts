export type EntityCategory =
  | 'pc'
  | 'npc'
  | 'creature'
  | 'peril'
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

export type SpellTradition =
  | 'Cinética'
  | 'Etérea'
  | 'Biológica'
  | 'Abiótica'
  | 'Omni'
  | 'E. Física'
  | 'E. Meta'
  | 'M. Orgânica'
  | 'M. Inorgânica'
  | 'arcano'
  | 'divino'
  | 'oculto'
  | 'primal'
  | 'outras';

export type SpellTraditionType = SpellTradition;

export type SpellCategoryType =
  | 'all'
  | 'cinetica'
  | 'eterea'
  | 'biologica'
  | 'abiotica'
  | 'omni'
  | 'e_fisica'
  | 'e_meta'
  | 'm_organica'
  | 'm_inorganica'
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
  spellType?: 'spell' | 'focus' | 'ritual' | 'other' | 'cantrip' | 'extras';
  subcategories?: string[];
  tags?: string[];
  castTime: string;
  range?: string;
  area?: string;
  targets?: string;
  trigger?: string;
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
  rarity?: string;
  alignmentOrTradition?: string;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | string;
  perception?: number;
  senses?: string;
  languages?: string[];
  innate?: string;
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
  saves?: {
    fort?: number;
    ref?: number;
    will?: number;
    fortitude?: number;
    reflex?: number;
  } | Record<string, number>;
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

export interface LocationPointOfInterest {
  id: string;
  name: string;
  type?: string;
  description?: string;
  notes?: string;
  district?: string;
  linkedEntityId?: string;
  isSecret?: boolean;
}

export interface LocationAttributes {
  settlementType?: string;
  ruler?: string;
  rulerEntityId?: string;
  population?: string;
  dangerLevel?: 'Seguro' | 'Baixo' | 'Moderado' | 'Perigoso' | 'Extremo' | 'Mortal' | string;
  planeOrRegion?: string;
  climate?: string;
  government?: string;
  factionsPresent?: string[];
  factionEntityIds?: string[];
  inhabitantNpcIds?: string[]; // IDs de NPCs residentes / figuras notáveis vinculadas
  questIds?: string[]; // IDs de Quests vinculadas a este local
  fauna?: string[];
  faunaEntityIds?: string[];
  flora?: string[];
  floraEntityIds?: string[];
  pointsOfInterest?: LocationPointOfInterest[];
  districts?: string[];
  coordinates?: { x: number; y: number };
  mapImage?: string;
  subcategories?: string[];
  gmSecrets?: string;
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

export interface TimelineEra {
  id: string;
  title: string;
  order: number;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineYear {
  id: string;
  eraId: string;
  title: string;
  numericOrder: number;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type TimelineDate = TimelineYear;

export interface TimelineEventAttributes {
  eraId?: string;
  yearId?: string;
  dateId?: string;
  dayMonth?: string;
  era?: string;
  year?: string;
  order?: number;
  importance?: 'cosmic' | 'major' | 'minor' | 'session';
  relatedEntityIds?: string[];
}

export type QuestStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
export type QuestDifficulty = 'Trivial' | 'Baixa' | 'Moderada' | 'Severa' | 'Extrema' | 'Lendária';
export type QuestType = 'Principal' | 'Secundária' | 'Contrato de Caça' | 'Pessoal' | 'Rumor' | 'Facção';
export type QuestPriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';

export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
  isSecret?: boolean;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
}

export type QuestAttachmentType = 'image' | 'audio' | 'video' | 'document' | 'map' | 'handout' | 'other';

export interface QuestAttachment {
  id: string;
  title: string;
  url: string;
  type: QuestAttachmentType;
  caption?: string;
  description?: string;
  authorOrSource?: string;
  createdAt?: string | number;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
  isSecret?: boolean;
  // YouTube or Google Drive metadata
  videoId?: string;
  embedUrl?: string;
  driveFileId?: string;
  isDriveAudio?: boolean;
}

export interface QuestFieldVisibility {
  // Identidade & Metadados
  status?: ItemVisibility | boolean;
  difficulty?: ItemVisibility | boolean;
  recommendedLevel?: ItemVisibility | boolean;
  questType?: ItemVisibility | boolean;
  priority?: ItemVisibility | boolean;
  deadline?: ItemVisibility | boolean;
  actOrChapter?: ItemVisibility | boolean;
  subcategories?: ItemVisibility | boolean;
  tags?: ItemVisibility | boolean;

  // Envolvidos & Localidades
  questGiver?: ItemVisibility | boolean;
  location?: ItemVisibility | boolean;
  organization?: ItemVisibility | boolean;
  involvedNpcs?: ItemVisibility | boolean;
  involvedLocations?: ItemVisibility | boolean;
  involvedOrgs?: ItemVisibility | boolean;

  // Objetivos & Narrativa
  objectivesBlock?: ItemVisibility | boolean;
  objectives?: ItemVisibility | boolean;
  narrativeLore?: ItemVisibility | boolean;
  briefing?: ItemVisibility | boolean;

  // Recompensas
  rewardsBlock?: ItemVisibility | boolean;
  rewardsXp?: ItemVisibility | boolean;
  rewardsCurrency?: ItemVisibility | boolean;
  rewardsItems?: ItemVisibility | boolean;
  rewardsReputation?: ItemVisibility | boolean;
  rewardsOrgReputation?: ItemVisibility | boolean;

  // Anexos & Multimídia (Imagens, Músicas, Vídeos, Documentos, etc.)
  attachmentsBlock?: ItemVisibility | boolean;
  attachmentImages?: ItemVisibility | boolean;
  attachmentAudio?: ItemVisibility | boolean;
  attachmentVideos?: ItemVisibility | boolean;
  attachmentDocuments?: ItemVisibility | boolean;
  attachmentHandouts?: ItemVisibility | boolean;

  // Conexões & Backlinks
  backlinks?: ItemVisibility | boolean;

  // Usuários com permissão personalizada
  allowedUsers?: Record<string, string[]>;

  // Chaves dinâmicas para objetivos (obj_ID), itens (item_ID), anexos (att_ID), npcs (npc_ID), locs (loc_ID), orgs (org_ID)
  [key: string]: any;
}

export interface QuestRewardCurrency {
  cp?: number | string;
  sp?: number | string;
  gp?: number | string;
  pp?: number | string;
  custom?: string;
}

export interface QuestRewardItem {
  id?: string;
  name: string;
  quantity?: number | string;
  itemEntityId?: string;
  itemId?: string;
  slug?: string;
  itemType?: string;
  rarity?: string;
  level?: number;
  price?: string;
  bulk?: string;
  traits?: string[];
  icon?: string;
  description?: string;
  notes?: string;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
  isSecret?: boolean;
}

export interface QuestOrganizationReputation {
  id?: string;
  organizationEntityId?: string;
  organizationName: string;
  reputationChange: string | number; // ex: "+15", "+1 Favor", "Respeito +2"
  notes?: string;
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
  isSecret?: boolean;
}

export interface QuestRewards {
  xp?: number;
  gold?: string; // Mantido para compatibilidade
  currency?: QuestRewardCurrency; // Moedas detalhadas (cp, sp, gp, pp, custom)
  items?: (string | QuestRewardItem)[]; // Lista de itens (nomes ou itens detalhados)
  structuredItems?: QuestRewardItem[]; // Lista tipada de itens
  reputation?: string; // Reputação geral / favores
  organizationReputations?: QuestOrganizationReputation[]; // Reputação específica com organizações
}

export interface QuestAttributes {
  status: QuestStatus;
  difficulty?: QuestDifficulty;
  recommendedLevel?: number;
  questType?: QuestType;
  priority?: QuestPriority;
  deadline?: string;
  questGiver?: string; // Entity ID or name
  questGiverEntityId?: string;
  involvedNpcIds?: string[]; // NPCs envolvidos (alvos, aliados, testemunhas)
  location?: string; // Entity ID or location name
  locationEntityId?: string;
  involvedLocationIds?: string[]; // Locais adicionais envolvidos
  relatedLocationIds?: string[]; // Alias para involvedLocationIds
  organization?: string; // Nome da Organização patrocinadora/vinculada
  organizationEntityId?: string;
  involvedOrgIds?: string[]; // Organizações envolvidas
  linkedOrganizationIds?: string[]; // Alias para involvedOrgIds
  faction?: string; // Alias para organization
  factionEntityId?: string; // Alias para organizationEntityId
  objectives: QuestObjective[];
  rewards?: QuestRewards;
  attachments?: QuestAttachment[];
  briefing?: string;
  narrativeLore?: string;
  actOrChapter?: string;
  subcategories?: string[];
  gmNotes?: string;
  gmSecrets?: string;
  fieldVisibility?: QuestFieldVisibility;
}

export type OrganizationType =
  | 'Guilda'
  | 'Ordem de Cavalaria'
  | 'Culto Religioso'
  | 'Império / Reino'
  | 'Sindicato do Crime'
  | 'Círculo Arcano'
  | 'Companhia Mercenária'
  | 'Academia / Eruditos'
  | 'Facção Política'
  | 'Outro';

export type OrganizationScope = 'Local' | 'Regional' | 'Nacional' | 'Continental' | 'Planar';

export interface OrganizationRank {
  id: string;
  rankName: string;
  description?: string;
  requirements?: string;
}

export interface OrganizationAttributes {
  type?: OrganizationType | string;
  leader?: string;
  leaderEntityId?: string;
  headquarters?: string;
  headquartersLocationId?: string;
  memberNpcIds?: string[]; // IDs de NPCs membros/líderes vinculados
  affiliatedLocationIds?: string[]; // IDs de Locais onde a organização atua
  questIds?: string[]; // IDs de Quests vinculadas à organização
  alignment?: string;
  scope?: OrganizationScope | string;
  motto?: string;
  resources?: string;
  influence?: 'Baixa' | 'Média' | 'Alta' | 'Dominante' | string;
  allies?: string[];
  alliedOrgIds?: string[];
  allyEntityIds?: string[]; // Alias para alliedOrgIds
  rivals?: string[];
  rivalOrgIds?: string[];
  rivalEntityIds?: string[]; // Alias para rivalOrgIds
  ranks?: OrganizationRank[];
  symbolImage?: string;
  traits?: string[];
  subcategories?: string[];
  gmSecrets?: string;
}

export interface FaunaHarvestPart {
  id: string;
  name: string;
  utility?: string;
  dcOrDifficulty?: string;
  value?: string;
}

export interface FaunaAttributes {
  habitat?: string;
  locationEntityId?: string;
  linkedLocationIds?: string[];
  habitatLocationIds?: string[];
  classification?: string;
  diet?: 'Carnívoro' | 'Herbívoro' | 'Onívoro' | 'Mágico / Cristalino' | 'Necrófago' | string;
  temperament?: 'Dócil' | 'Arisco' | 'Territorial' | 'Predador Agressivo' | 'Treinável' | string;
  dangerLevel?: 'Inofensivo' | 'Baixo' | 'Médio' | 'Perigoso' | 'Mortal' | string;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único' | string;
  size?: 'Miúdo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Imenso' | string;
  behavior?: string;
  domestication?: string;
  harvestableParts?: FaunaHarvestPart[];
  tokenImage?: string;
  portraitImage?: string;
  traits?: string[];
  subcategories?: string[];
  gmNotes?: string;
}

export interface FloraAttributes {
  habitat?: string;
  locationEntityId?: string;
  linkedLocationIds?: string[];
  habitatLocationIds?: string[];
  classification?: string;
  properties?: ('Medicinal' | 'Venenosa' | 'Reagente Alquímico' | 'Alucinógena' | 'Nutritiva' | 'Mágica' | string)[];
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único' | string;
  harvestSeason?: string;
  preparationAndEffects?: string;
  dangerOrToxicity?: string;
  preservationTime?: string;
  tokenImage?: string;
  portraitImage?: string;
  traits?: string[];
  subcategories?: string[];
  gmNotes?: string;
}

export interface PCAttributes {
  // Identidade & Jogador
  playerName?: string;
  characterClass?: string;
  class?: string; // alias
  subclass?: string;
  level?: number;
  rarity?: NPCRarity;
  size?: NPCSize | string;
  traits?: string[];
  subcategories?: string[];

  // Imagens Especializadas
  portraitImage?: string; // Retrato vertical
  tokenImage?: string;    // Token quadrado/circular de mesa/VTT

  // Perfil & Origem
  ancestry?: string;      // ex: Humano, Elfo de Vidro, Autômato
  ancestryEntityId?: string;
  heritage?: string;      // ex: Herança do Crepúsculo
  background?: string;    // Antecedente
  deity?: string;         // Divindade / Patrono
  alignment?: string;     // Alinhamento / Filosofia
  occupation?: string;    // Papel / Ocupação / Título
  role?: string;          // Alias for occupation / role
  organization?: string;  // Facção / Afiliação / Guilda
  organizationEntityId?: string;
  linkedOrganizationIds?: string[];
  organizationIds?: string[];
  faction?: string;
  factionEntityId?: string;
  location?: string;      // Onde reside / Base atual
  locationEntityId?: string;
  linkedLocationIds?: string[];
  locationIds?: string[];
  questIds?: string[];
  wealth?: string;        // Nível de riqueza / Condição
  pronouns?: string;      // ex: Ele/Dele, Ela/Dela, Neutro
  age?: string;           // Idade aparente ou real
  gender?: string;

  // Guia de Interpretação / Roleplay
  concept?: string;        // Essência / Conceito em 1 frase
  voiceAndSpeech?: string; // Tom de voz, sotaque, velocidade, gírias
  voice?: string;          // Alias
  mannerisms?: string;     // Gestos, tiques, hábitos, postura
  personality?: string;    // Personalidade
  appearance?: string;     // Aparência física
  firstImpression?: string;// Primeira impressão do personagem

  // Narrativa & Dinâmica Social
  motivations?: string;    // O que deseja / Objetivos
  motivation?: string;     // Alias
  triggers?: string;       // O que o irrita / Gatilhos emocionais
  canOffer?: string;       // Favores, serviços, itens ou informações
  secrets?: string;        // Segredos conhecidos
  backstory?: string;      // Histórico prévio / Background
  notes?: string;

  // Relacionamentos & Vínculos Sociais
  relationships?: NPCRelationship[];

  // Rumores & Missões (Quests)
  rumors?: NPCRumor[];
  quests?: NPCQuestLink[];

  // Loot & Inventário / Posses
  loot?: NPCLootItem[];
  inventory?: any[];
  currency?: {
    po?: number | string;
    pp?: number | string;
    pc?: number | string;
    custom?: string;
  };

  // Confidencial do Mestre (GM-Only)
  gmSecret?: string;
  gmPlotHook?: string;
  gmNotes?: string;

  // Estatísticas Mecânicas & Combate
  hasCombatStats?: boolean;
  ac?: number;
  hp?: number;
  maxHp?: number;
  perception?: number;
  speed?: string;
  heroPoints?: number;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  fort?: number;
  ref?: number;
  will?: number;
  saves?: {
    fortitude?: number;
    reflex?: number;
    will?: number;
  };
  attributes?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  };
  attacks?: any[];
  spells?: any;
  keySkills?: string;
  specialAbilities?: any;

  // Memória & Histórico de Sessões
  sessionLog?: NPCSessionMemory[];

  // Visibilidade granular de campos
  fieldVisibility?: NPCFieldVisibility;
}

export interface GMNoteAttributes {
  category: 'plot' | 'secret_lore' | 'encounter_plan' | 'scratchpad';
  isRevealedToPlayers: boolean;
  linkedQuests?: string[];
}

export type NPCDisposition = 'helpful' | 'friendly' | 'indifferent' | 'unfriendly' | 'hostile' | 'unknown';
export type NPCRarity = 'Comum' | 'Incomum' | 'Raro' | 'Único';
export type NPCSize = 'Miúdo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Imenso';

export interface NPCRumor {
  id: string;
  text: string;
  isTrue?: boolean;
  source?: string;
}

export interface NPCQuestLink {
  id: string;
  questEntityId?: string;
  title: string;
  roleInQuest?: string; // ex: "Doador da Missão", "Alvo / Procurado", "Aliado", "Recompensador", "Obstáculo"
  description?: string;
  isSecret?: boolean;
}

export interface NPCLootItem {
  id: string;
  name: string;
  quantity?: number | string;
  itemEntityId?: string;
  itemId?: string;
  slug?: string;
  category?: string;
  priceOrValue?: string;
  description?: string;
  isEquipped?: boolean;
  isSecret?: boolean; // Item oculto / Drop secreto do GM
}

export interface NPCRelationship {
  id: string;
  targetEntityId?: string; // ID da entidade relacionada (NPC, PC ou outra)
  targetName: string;
  targetSlug?: string;
  targetCategory?: string; // 'npc' | 'pc' | 'entity'
  targetAvatar?: string;
  relationshipType: string; // ex: "Irmão mais velho", "Rival de guilda", "Devedor", "Mentor arcano", "Amante"
  attitude?: NPCDisposition;
  notes?: string;
  isSecret?: boolean; // GM-only
}

export interface NPCSessionMemory {
  id: string;
  sessionTitleOrNumber: string;
  date?: string;
  note: string;
}

export interface NPCAttributes {
  // Identidade Básica
  level?: number;
  rarity?: NPCRarity;
  size?: NPCSize;
  traits?: string[];
  subcategories?: string[];

  // Imagens Especializadas
  portraitImage?: string; // Retrato vertical
  tokenImage?: string;    // Token circular de mesa/VTT

  // Perfil & Origem
  ancestry?: string;      // ex: Humano, Elfo de Vidro, Autômato
  ancestryEntityId?: string; // ID da entidade da Ancestralidade vinculada
  heritage?: string;      // ex: Herança do Crepúsculo
  occupation?: string;    // Profissão / Cargo / Título
  role?: string;          // Alias for occupation / role
  organization?: string;  // Facção / Afiliação / Guilda
  organizationEntityId?: string; // ID da entidade de organização vinculada
  linkedOrganizationIds?: string[]; // IDs de organizações vinculadas
  organizationIds?: string[]; // Alias para linkedOrganizationIds
  faction?: string;       // Alias for organization
  factionEntityId?: string; // Alias for organizationEntityId
  wealth?: string;        // Nível de riqueza
  location?: string;      // Onde reside / Local atual
  locationEntityId?: string; // ID da entidade de local vinculada
  linkedLocationIds?: string[]; // IDs de locais vinculados
  locationIds?: string[]; // Alias para linkedLocationIds
  questIds?: string[];    // IDs de quests vinculadas
  pronouns?: string;      // ex: Ele/Dele, Ela/Dela, Neutro
  age?: string;           // Idade aparente ou real
  gender?: string;
  alignment?: string;
  disposition?: NPCDisposition;

  // Guia de Interpretação / Roleplay
  concept?: string;        // Essência / Conceito em 1 frase
  voiceAndSpeech?: string; // Tom de voz, sotaque, velocidade, gírias
  voice?: string;          // Alias for voiceAndSpeech
  mannerisms?: string;     // Gestos, tiques, hábitos, postura
  personality?: string;    // Personalidade
  appearance?: string;     // Aparência física
  firstImpression?: string;// Primeira impressão dos jogadores

  // Narrativa & Dinâmica Social
  motivations?: string;    // O que deseja / Objetivos
  motivation?: string;     // Alias
  triggers?: string;       // O que o irrita / Gatilhos emocionais
  canOffer?: string;       // Favores, serviços, itens ou informações
  secrets?: string;        // Segredos conhecidos por poucos

  // Relacionamentos & Vínculos Sociais
  relationships?: NPCRelationship[];

  // Rumores & Missões (Quests)
  rumors?: NPCRumor[];     // Rumores ouvidos nas tavernas
  quests?: NPCQuestLink[]; // Missões vinculadas ou ganchos ativos

  // Loot & Inventário / Posses
  loot?: NPCLootItem[];
  inventory?: any[];       // Alias for loot/items
  currency?: {
    po?: number | string; // Peças de Ouro
    pp?: number | string; // Peças de Prata
    pc?: number | string; // Peças de Cobre
    custom?: string;      // ex: "3 Gemas de Obsidiana Lapidadas"
  };

  // Confidencial do Mestre (GM-Only)
  gmSecret?: string;       // Segredo oculto da campanha / reviravolta
  gmPlotHook?: string;     // Gancho de enredo
  gmNotes?: string;        // GM notes

  // Estatísticas Mecânicas / Combate (Opcional)
  hasCombatStats?: boolean;
  ac?: number;
  hp?: number;
  perception?: number;
  speed?: string;
  saves?: {
    fortitude?: number;
    reflex?: number;
    will?: number;
  };
  keySkills?: string;       // ex: "Enganação +16, Diplomacia +14, Sociedade +12"
  specialAbilities?: string;// ex: "Aura de Blefe, Esquiva Sobrenatural"

  // Memória & Histórico de Sessões
  sessionLog?: NPCSessionMemory[];

  // Visibilidade de campos específicos (Suporte a visibilidade granular por campo, bloco, tag ou pasta)
  fieldVisibility?: NPCFieldVisibility;
}

export interface NPCFieldVisibility {
  // Imagens & Mídia
  portraitImage?: ItemVisibility | boolean;
  tokenImage?: ItemVisibility | boolean;

  // Identidade & Cabeçalho
  level?: ItemVisibility | boolean;
  disposition?: ItemVisibility | boolean;
  role?: ItemVisibility | boolean;
  traits?: ItemVisibility | boolean;
  subcategories?: ItemVisibility | boolean;
  locationFactionCard?: ItemVisibility | boolean;

  // Perfil & Identidade Social
  identityBlock?: ItemVisibility | boolean;
  occupation?: ItemVisibility | boolean;
  location?: ItemVisibility | boolean;
  ancestry?: ItemVisibility | boolean;
  faction?: ItemVisibility | boolean;
  wealth?: ItemVisibility | boolean;
  alignment?: ItemVisibility | boolean;
  ageAndPronouns?: ItemVisibility | boolean;

  // Psicologia & Interpretação
  psychologyBlock?: ItemVisibility | boolean;
  voiceAndSpeech?: ItemVisibility | boolean;
  personality?: ItemVisibility | boolean;
  motivations?: ItemVisibility | boolean;
  appearance?: ItemVisibility | boolean;
  canOffer?: ItemVisibility | boolean;
  triggers?: ItemVisibility | boolean;
  secrets?: ItemVisibility | boolean;

  // Histórico & Lore Markdown
  narrativeLore?: ItemVisibility | boolean;

  // Mecânicas & Combate
  combatStats?: ItemVisibility | boolean;
  acAndDefenses?: ItemVisibility | boolean;
  hpAndHealth?: ItemVisibility | boolean;
  perceptionAndSenses?: ItemVisibility | boolean;
  speed?: ItemVisibility | boolean;
  keySkills?: ItemVisibility | boolean;
  specialAbilities?: ItemVisibility | boolean;

  // Relações & Missões
  relationships?: ItemVisibility | boolean;
  questsAndRumors?: ItemVisibility | boolean;
  quests?: ItemVisibility | boolean;
  rumors?: ItemVisibility | boolean;

  // Inventário & Bens
  inventory?: ItemVisibility | boolean;
  currency?: ItemVisibility | boolean;
  loot?: ItemVisibility | boolean;

  // Conexões Cruzadas
  backlinks?: ItemVisibility | boolean;

  // Memória & Histórico
  sessionLog?: ItemVisibility | boolean;

  // Usuários com permissão personalizada
  allowedUsers?: Record<string, string[]>;

  // Chaves dinâmicas para tags (tag_Nome), pastas (folder_Nome), relacionamentos (rel_ID), etc.
  [key: string]: any;
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
  | 'vocation'
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
  cost?: string;
  access?: string;
  description: string;
  criticalSuccess?: string;
  success?: string;
  failure?: string;
  criticalFailure?: string;
  special?: string;
  associatedClassOrAncestry?: string;
  // Archetype & Vocation specific metadata
  mentorNpcNames?: string[];
  questRequirement?: string;
  vocationLevel?: 1 | 3 | 6 | 9 | 12 | 15 | 18;
  vocationProgressionLine?: string;
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
  name?: string;
  isVersatileHeritage?: boolean;
  subcategories?: string[];
  // Álbum & Galeria Visual (Subcategoria colapsável no topo de Lore)
  album?: AncestryAlbumImage[];

  // Cabeçalho
  rarity?: string;
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
  loot?: ItemVisibility;
  gmNotes?: ItemVisibility;
  allowedUsers?: Record<string, string[]>;
}

export interface PerilLootCurrency {
  cp?: number | string; // Peças de Cobre
  sp?: number | string; // Peças de Prata
  gp?: number | string; // Peças de Ouro
  pp?: number | string; // Peças de Platina
  custom?: string;      // Riquezas adicionais, gemas, joias ou descrição livre
}

export interface PerilLootItem {
  id: string;
  itemId?: string; // ID da entidade da categoria 'item'
  name: string;
  quantity?: number | string;
  itemType?: ItemCategoryType;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único' | string;
  level?: number;
  price?: string;
  bulk?: string;
  traits?: string[];
  icon?: string;
  description?: string;
  notes?: string; // ex: "Guardado na bolsa", "Empunhado", "No ninho"
}

export interface PerilLootData {
  currency?: PerilLootCurrency;
  items?: PerilLootItem[];
  notes?: string; // Anotações gerais de tesouro
}

export interface PerilAttributes {
  subcategories?: string[];
  perilKind: PerilKind;
  perilType?: string; // Backwards-compatible alias
  portraitImage?: string;
  tokenImage?: string;
  level: number;
  rarity: 'Comum' | 'Incomum' | 'Raro' | 'Único' | string;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Minúsculo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Gigantesco' | string;
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

  // Loot & Treasure
  loot?: PerilLootData;

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
  featEntityId?: string;
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
  featEntityId?: string;
}

export interface VocationProgressionLevel {
  level: 1 | 3 | 6 | 9 | 12 | 15 | 18;
  title: string;
  actionCost?: string;
  traits?: string[];
  description: string;
  benefitsSummary?: string;
  featEntityId?: string;
}

export interface ClassAttributes {
  level?: number;
  isSpellcaster?: boolean;
  subcategories?: string[];
  kind: 'class' | 'archetype' | 'vocation';
  hpPerLevel?: number; // e.g. 6, 8, 10, 12
  keyAttribute?: string; // Força, Destreza, etc.
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Único';
  traits?: string[];
  
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

  // Archetype specifics (PF2e + Quests + NPC Trainers)
  archetypeDedicationLevel?: number;
  prerequisites?: string;
  access?: string;
  dedicationFeat?: ClassArchetypeFeat;
  archetypeFeats?: ClassArchetypeFeat[];
  trainerNpcs?: string[]; // Names or titles of NPCs who provide training
  trainerNpcIds?: string[]; // Entity IDs of linked NPCs
  linkedQuests?: string[]; // Names of linked quests
  linkedQuestIds?: string[]; // Entity IDs of linked quests
  trainingRequirements?: string; // Training time, narrative condition, costs

  // Vocation specifics (Background+ with fixed progression at levels 1, 3, 6, 9, 12, 15, 18)
  vocationTheme?: string;
  initialBonusSkill?: string; // e.g. "Treinado em Sobrevivência e Lore (Ermos)"
  vocationProgression?: VocationProgressionLevel[];

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
  gmNotes?: string;
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
  npcData?: NPCAttributes;
  organizationData?: OrganizationAttributes;
  faunaData?: FaunaAttributes;
  floraData?: FloraAttributes;
  pcData?: PCAttributes;
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

export interface EntityRelationshipUpdates {
  /** IDs of Locations to link bidirectionally */
  addLocationIds?: string[];
  /** IDs of Locations to unlink bidirectionally */
  removeLocationIds?: string[];
  /** Exact full list of Location IDs (synchronizes additions and removals) */
  locationIds?: string[];

  /** IDs of Organizations to link bidirectionally */
  addOrganizationIds?: string[];
  /** IDs of Organizations to unlink bidirectionally */
  removeOrganizationIds?: string[];
  /** Exact full list of Organization IDs */
  organizationIds?: string[];

  /** IDs of Quests to link bidirectionally */
  addQuestIds?: string[];
  /** IDs of Quests to unlink bidirectionally */
  removeQuestIds?: string[];
  /** Exact full list of Quest IDs */
  questIds?: string[];

  /** IDs of NPCs to link bidirectionally */
  addNpcIds?: string[];
  /** IDs of NPCs to unlink bidirectionally */
  removeNpcIds?: string[];
  /** Exact full list of NPC IDs */
  npcIds?: string[];

  /** IDs of Fauna to link bidirectionally */
  addFaunaIds?: string[];
  /** IDs of Fauna to unlink bidirectionally */
  removeFaunaIds?: string[];
  /** Exact full list of Fauna IDs */
  faunaIds?: string[];

  /** IDs of Flora to link bidirectionally */
  addFloraIds?: string[];
  /** IDs of Flora to unlink bidirectionally */
  removeFloraIds?: string[];
  /** Exact full list of Flora IDs */
  floraIds?: string[];
}

export type DrawerType = 'entity' | 'trait' | 'tag' | 'feat' | 'item';

export interface DrawerStackItem {
  id: string;
  type: DrawerType;
  targetId?: string;
  data?: any;
  title?: string;
  category?: EntityCategory;
}

export interface DrawerBreadcrumb {
  id: string;
  type: DrawerType;
  targetId?: string;
  title: string;
  index: number;
}

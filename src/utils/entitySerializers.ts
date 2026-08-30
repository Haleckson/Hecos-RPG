import {
  LocationAttributes,
  QuestAttributes,
  OrganizationAttributes,
  FaunaAttributes,
  FloraAttributes,
  PCAttributes,
} from '../types';

/* =========================================================================
   1. LOCAIS (LOCATION)
   ========================================================================= */

export function getEmptyLocationData(): LocationAttributes {
  return {
    settlementType: 'Cidade',
    ruler: '',
    population: '',
    dangerLevel: 'Moderado',
    planeOrRegion: '',
    climate: '',
    government: '',
    factionsPresent: [],
    pointsOfInterest: [],
    districts: [],
    coordinates: undefined,
    mapImage: '',
    subcategories: [],
    gmSecrets: '',
  };
}

export function serializeLocationToHTML(
  title: string,
  loc: LocationAttributes,
  summary?: string,
  extraDescription?: string
): string {
  const parts: string[] = [];

  if (summary) {
    parts.push(`<p class="lead-text italic text-zinc-300 mb-4">${summary}</p>`);
  }

  if (extraDescription) {
    parts.push(`<div class="mb-6">${extraDescription}</div>`);
  }

  return parts.join('\n\n') || '<p>Nenhum detalhe adicional informado.</p>';
}

/* =========================================================================
   2. QUESTS (MISSÕES)
   ========================================================================= */

export function getEmptyQuestData(): QuestAttributes {
  return {
    status: 'not_started',
    difficulty: 'Moderada',
    recommendedLevel: 1,
    questType: 'Secundária',
    priority: 'Normal',
    deadline: '',
    questGiver: '',
    questGiverEntityId: '',
    location: '',
    locationEntityId: '',
    objectives: [
      { id: 'obj-1', text: 'Investigar os primeiros indícios', completed: false },
    ],
    rewards: {
      xp: 80,
      gold: '25 PO',
      items: [],
      reputation: '',
    },
    actOrChapter: '',
    subcategories: [],
    gmNotes: '',
  };
}

export function serializeQuestToHTML(
  title: string,
  quest: QuestAttributes,
  summary?: string,
  extraDescription?: string
): string {
  const parts: string[] = [];

  if (summary) {
    parts.push(`<p class="lead-text italic text-cyan-200 mb-4">${summary}</p>`);
  }

  if (quest.objectives && quest.objectives.length > 0) {
    parts.push(`<h3>Objetivos da Missão</h3>\n<ul>` +
      quest.objectives.map(o => `<li>[${o.completed ? 'x' : ' '}] ${o.text}</li>`).join('\n') +
      `\n</ul>`
    );
  }

  if (extraDescription) {
    parts.push(`<div class="mb-6">${extraDescription}</div>`);
  }

  return parts.join('\n\n') || '<p>Nenhum detalhe de missão registrado.</p>';
}

/* =========================================================================
   3. ORGANIZAÇÕES (ORGANIZATION)
   ========================================================================= */

export function getEmptyOrganizationData(): OrganizationAttributes {
  return {
    type: 'Guilda',
    leader: '',
    headquarters: '',
    alignment: 'Neutro',
    scope: 'Regional',
    motto: '',
    resources: '',
    influence: 'Média',
    allies: [],
    rivals: [],
    ranks: [],
    symbolImage: '',
    traits: [],
    subcategories: [],
    gmSecrets: '',
  };
}

export function serializeOrganizationToHTML(
  title: string,
  org: OrganizationAttributes,
  summary?: string,
  extraDescription?: string
): string {
  const parts: string[] = [];

  if (org.motto) {
    parts.push(`<blockquote class="border-l-2 border-rose-500 pl-4 py-1 text-rose-200 italic font-serif">"${org.motto}"</blockquote>`);
  }

  if (summary) {
    parts.push(`<p class="lead-text text-zinc-300 mb-4">${summary}</p>`);
  }

  if (extraDescription) {
    parts.push(`<div class="mb-6">${extraDescription}</div>`);
  }

  return parts.join('\n\n') || '<p>Nenhum detalhe de facção registrado.</p>';
}

/* =========================================================================
   4. FAUNA (FAUNA)
   ========================================================================= */

export function getEmptyFaunaData(): FaunaAttributes {
  return {
    habitat: 'Florestas e Bosques',
    diet: 'Onívoro',
    temperament: 'Arisco',
    dangerLevel: 'Baixo',
    rarity: 'Comum',
    size: 'Médio',
    behavior: '',
    domestication: '',
    harvestableParts: [],
    tokenImage: '',
    portraitImage: '',
    traits: ['Animal'],
    subcategories: [],
    gmNotes: '',
  };
}

export function serializeFaunaToHTML(
  title: string,
  fauna: FaunaAttributes,
  summary?: string,
  extraDescription?: string
): string {
  const parts: string[] = [];

  if (summary) {
    parts.push(`<p class="lead-text text-emerald-200/90 italic mb-4">${summary}</p>`);
  }

  if (fauna.behavior) {
    parts.push(`<h3>Comportamento & Hábitos</h3>\n<p>${fauna.behavior}</p>`);
  }

  if (extraDescription) {
    parts.push(`<div class="mb-6">${extraDescription}</div>`);
  }

  return parts.join('\n\n') || '<p>Nenhum detalhe zoológico registrado.</p>';
}

/* =========================================================================
   5. FLORA (FLORA)
   ========================================================================= */

export function getEmptyFloraData(): FloraAttributes {
  return {
    habitat: 'Ermos & Florestas Antigas',
    properties: ['Medicinal'],
    rarity: 'Comum',
    harvestSeason: 'Primavera e Outono',
    preparationAndEffects: '',
    dangerOrToxicity: '',
    preservationTime: '',
    tokenImage: '',
    portraitImage: '',
    traits: ['Planta'],
    subcategories: [],
    gmNotes: '',
  };
}

export function serializeFloraToHTML(
  title: string,
  flora: FloraAttributes,
  summary?: string,
  extraDescription?: string
): string {
  const parts: string[] = [];

  if (summary) {
    parts.push(`<p class="lead-text text-emerald-200/90 italic mb-4">${summary}</p>`);
  }

  if (flora.preparationAndEffects) {
    parts.push(`<h3>Preparo & Efeitos</h3>\n<p>${flora.preparationAndEffects}</p>`);
  }

  if (extraDescription) {
    parts.push(`<div class="mb-6">${extraDescription}</div>`);
  }

  return parts.join('\n\n') || '<p>Nenhum detalhe botânico registrado.</p>';
}

/* =========================================================================
   6. PC (PERSONAGEM JOGADOR)
   ========================================================================= */

export function getEmptyPCData(): PCAttributes {
  return {
    playerName: '',
    characterClass: '',
    subclass: '',
    level: 1,
    ancestry: '',
    heritage: '',
    background: '',
    deity: '',
    alignment: '',
    portraitImage: '',
    tokenImage: '',
    ac: 15,
    hp: 18,
    maxHp: 18,
    perception: 4,
    speed: '9m (25 ft)',
    heroPoints: 1,
    attributes: {
      str: 10,
      dex: 14,
      con: 12,
      int: 10,
      wis: 12,
      cha: 10,
    },
    backstory: '',
    concept: '',
    notes: '',
    subcategories: [],
    traits: ['Humanoide'],
  };
}

export function serializePCToHTML(
  title: string,
  pc: PCAttributes,
  summary?: string,
  extraDescription?: string
): string {
  const parts: string[] = [];

  if (pc.concept) {
    parts.push(`<blockquote class="border-l-2 border-cyan-500 pl-4 py-1 text-cyan-200 italic font-serif">"${pc.concept}"</blockquote>`);
  }

  if (summary) {
    parts.push(`<p class="lead-text text-zinc-300 mb-4">${summary}</p>`);
  }

  if (pc.backstory) {
    parts.push(`<h3>Histórico & Antecedentes</h3>\n<p>${pc.backstory}</p>`);
  }

  if (extraDescription) {
    parts.push(`<div class="mb-6">${extraDescription}</div>`);
  }

  return parts.join('\n\n') || '<p>Nenhum detalhe de personagem registrado.</p>';
}

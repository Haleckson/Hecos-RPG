import { HecosEntity, PF2eSpellAttributes } from '../types';
import { serializeSpellToHTML, parseSpellFromContent } from './spellSerializer';

/**
 * Complete map of legacy / alternate tradition strings to their canonical Hecos tradition names.
 */
export const TRADITION_CANONICAL_MAP: Record<string, 'Cinética' | 'Etérea' | 'Biológica' | 'Abiótica' | 'Omni'> = {
  // Cinética (Kinetic)
  cinetica: 'Cinética',
  cinética: 'Cinética',
  kinetic: 'Cinética',
  'e. fisica': 'Cinética',
  'e. física': 'Cinética',
  'e.fisica': 'Cinética',
  'e.física': 'Cinética',
  efisica: 'Cinética',
  efísica: 'Cinética',
  e_fisica: 'Cinética',
  'energia fisica': 'Cinética',
  'energia física': 'Cinética',
  arcano: 'Cinética',
  arcana: 'Cinética',
  arcane: 'Cinética',

  // Etérea (Ethereal)
  eterea: 'Etérea',
  etérea: 'Etérea',
  ethereal: 'Etérea',
  'e. meta': 'Etérea',
  'e.meta': 'Etérea',
  'e. metafisica': 'Etérea',
  'e. metafísica': 'Etérea',
  'e.metafisica': 'Etérea',
  'e.metafísica': 'Etérea',
  emeta: 'Etérea',
  e_meta: 'Etérea',
  'energia metafisica': 'Etérea',
  'energia metafísica': 'Etérea',
  oculto: 'Etérea',
  oculta: 'Etérea',
  occult: 'Etérea',

  // Biológica (Biological)
  biologica: 'Biológica',
  biológica: 'Biológica',
  biological: 'Biológica',
  'm. organica': 'Biológica',
  'm. orgânica': 'Biológica',
  'm.organica': 'Biológica',
  'm.orgânica': 'Biológica',
  morganica: 'Biológica',
  morgânica: 'Biológica',
  m_organica: 'Biológica',
  'materia organica': 'Biológica',
  'matéria orgânica': 'Biológica',
  primal: 'Biológica',

  // Abiótica (Abiotic)
  abiotica: 'Abiótica',
  abiótica: 'Abiótica',
  abiotic: 'Abiótica',
  'm. inorganica': 'Abiótica',
  'm. inorgânica': 'Abiótica',
  'm.inorganica': 'Abiótica',
  'm.inorgânica': 'Abiótica',
  minorganica: 'Abiótica',
  minorgânica: 'Abiótica',
  m_inorganica: 'Abiótica',
  'materia inorganica': 'Abiótica',
  'matéria inorgânica': 'Abiótica',
  divino: 'Abiótica',
  divina: 'Abiótica',
  divine: 'Abiótica',

  // Omni
  omni: 'Omni',
  'omni tradition': 'Omni',
  'omni tradição': 'Omni',
};

/**
 * Normalizes any tradition name to its canonical form ('Cinética' | 'Etérea' | 'Biológica' | 'Abiótica' | 'Omni').
 * Returns null if not recognized as a known tradition.
 */
export function getCanonicalTradition(input: string): 'Cinética' | 'Etérea' | 'Biológica' | 'Abiótica' | 'Omni' | null {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();
  
  if (TRADITION_CANONICAL_MAP[clean]) {
    return TRADITION_CANONICAL_MAP[clean];
  }

  const withoutDots = clean.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  if (TRADITION_CANONICAL_MAP[withoutDots]) {
    return TRADITION_CANONICAL_MAP[withoutDots];
  }

  const collapsed = clean.replace(/[^a-z0-9áàâãéèêíïóôõöúçñ]/gi, '');
  if (TRADITION_CANONICAL_MAP[collapsed]) {
    return TRADITION_CANONICAL_MAP[collapsed];
  }

  if (collapsed.includes('cinetic') || (collapsed.includes('fisic') && !collapsed.includes('meta')) || collapsed.includes('arcano') || collapsed.includes('arcane')) {
    return 'Cinética';
  }
  if (collapsed.includes('eter') || collapsed.includes('meta') || collapsed.includes('ocult') || collapsed.includes('occult')) {
    return 'Etérea';
  }
  if (collapsed.includes('biolog') || (collapsed.includes('organic') && !collapsed.includes('inorganic')) || collapsed.includes('primal')) {
    return 'Biológica';
  }
  if (collapsed.includes('abiotic') || collapsed.includes('inorganic') || collapsed.includes('divin')) {
    return 'Abiótica';
  }
  if (collapsed.includes('omni')) {
    return 'Omni';
  }

  return null;
}

/**
 * Checks whether a given string corresponds to any magic tradition (old or new).
 */
export function isTraditionTrait(trait: string): boolean {
  return getCanonicalTradition(trait) !== null;
}

/**
 * Migrates a spell entity to ensure:
 * 1. Traditions in spellData.traditions are strictly canonical ('Cinética', 'Etérea', 'Biológica', 'Abiótica', 'Omni')
 * 2. Legacy tradition names or duplicate tradition traits in spellData.traits are removed or migrated into spellData.traditions
 * 3. Subcategories and tags referencing old names are updated
 * 4. Embedded HTML JSON_SPELL_DATA and markdown headers are synchronized
 */
export function migrateSpellEntity(entity: HecosEntity): { entity: HecosEntity; changed: boolean } {
  if (!entity) return { entity, changed: false };
  const isSpell = entity.category === 'spell' || Boolean(entity.spellData) || entity.tags?.includes('spell') || entity.tags?.includes('magia') || entity.tags?.includes('feitiço');
  if (!isSpell) return { entity, changed: false };

  let changed = false;
  const updatedEntity: HecosEntity = { ...entity };

  // Parse spellData if missing or ensure clean copy
  const rawSpellData: PF2eSpellAttributes = updatedEntity.spellData
    ? { ...updatedEntity.spellData }
    : parseSpellFromContent(updatedEntity.content || '', undefined);

  // 1. Process and normalize traditions
  const canonicalTraditionsSet = new Set<'Cinética' | 'Etérea' | 'Biológica' | 'Abiótica' | 'Omni'>();
  const originalTraditions = Array.isArray(rawSpellData.traditions) ? rawSpellData.traditions : [];

  originalTraditions.forEach((t) => {
    const canon = getCanonicalTradition(t);
    if (canon) {
      canonicalTraditionsSet.add(canon);
    }
  });

  // 2. Check traits for legacy traditions (e.g. "E.Meta", "E. Meta", "Etérea", "E. Física")
  const originalTraits = Array.isArray(rawSpellData.traits) ? rawSpellData.traits : [];
  const cleanTraits: string[] = [];

  originalTraits.forEach((t) => {
    const canon = getCanonicalTradition(t);
    if (canon) {
      // If a trait was actually a tradition, ensure it's in canonical traditions and NOT in traits
      canonicalTraditionsSet.add(canon);
      changed = true;
    } else {
      // Keep only genuine non-tradition traits
      if (t && t.trim() && !cleanTraits.some(existing => existing.toLowerCase() === t.toLowerCase().trim())) {
        cleanTraits.push(t.trim());
      }
    }
  });

  // Fallback: if no tradition was detected at all, default to Cinética if empty
  if (canonicalTraditionsSet.size === 0 && originalTraditions.length === 0 && originalTraits.length === 0) {
    canonicalTraditionsSet.add('Cinética');
    changed = true;
  }

  const finalTraditions = Array.from(canonicalTraditionsSet);

  // Check if traditions changed
  if (
    finalTraditions.length !== originalTraditions.length ||
    !finalTraditions.every((t) => originalTraditions.includes(t))
  ) {
    changed = true;
  }

  // Check if traits changed
  if (
    cleanTraits.length !== originalTraits.length ||
    !cleanTraits.every((t, i) => t === originalTraits[i])
  ) {
    changed = true;
  }

  // 3. Process subcategories and tags
  const originalSubcategories = Array.isArray(rawSpellData.subcategories)
    ? rawSpellData.subcategories
    : updatedEntity.subcategories || (updatedEntity.subcategory ? [updatedEntity.subcategory] : []);

  const cleanSubcategories = originalSubcategories.map((sub) => {
    const canon = getCanonicalTradition(sub);
    if (canon && canon !== sub) {
      changed = true;
      return canon;
    }
    if (sub === 'e_fisica') { changed = true; return 'Cinética'; }
    if (sub === 'e_meta') { changed = true; return 'Etérea'; }
    if (sub === 'm_organica') { changed = true; return 'Biológica'; }
    if (sub === 'm_inorganica') { changed = true; return 'Abiótica'; }
    return sub;
  });

  let cleanSubcategory = updatedEntity.subcategory || '';
  const subCanon = getCanonicalTradition(cleanSubcategory);
  if (subCanon && subCanon !== cleanSubcategory) {
    cleanSubcategory = subCanon;
    changed = true;
  }

  const originalTags = Array.isArray(updatedEntity.tags) ? updatedEntity.tags : [];
  const cleanTags = originalTags.map((tag) => {
    const canon = getCanonicalTradition(tag);
    if (canon && canon !== tag) {
      changed = true;
      return canon;
    }
    return tag;
  });

  // 4. Update spellData structure
  const updatedSpellData: PF2eSpellAttributes = {
    ...rawSpellData,
    traditions: finalTraditions,
    traits: cleanTraits,
    subcategories: cleanSubcategories,
  };

  updatedEntity.spellData = updatedSpellData;
  updatedEntity.subcategory = cleanSubcategory || (cleanSubcategories && cleanSubcategories[0]) || '';
  updatedEntity.subcategories = cleanSubcategories || [];
  updatedEntity.tags = cleanTags;

  // 5. Update serialized content if HTML format with JSON_SPELL_DATA
  if (updatedEntity.content && updatedEntity.content.includes('<!-- JSON_SPELL_DATA:')) {
    const newContent = serializeSpellToHTML(updatedEntity.title || '', updatedSpellData);
    if (newContent !== updatedEntity.content) {
      updatedEntity.content = newContent;
      changed = true;
    }
  }

  return { entity: updatedEntity, changed };
}

/**
 * Runs migration across an array of entities, returning the updated list and a boolean flag.
 */
export function migrateAllSpellEntities(entities: HecosEntity[]): { entities: HecosEntity[]; hasAnyChange: boolean } {
  let hasAnyChange = false;
  const migrated = entities.map((ent) => {
    if (!ent) return ent;
    const { entity: updated, changed } = migrateSpellEntity(ent);
    if (changed) {
      hasAnyChange = true;
    }
    return updated;
  });
  return { entities: migrated, hasAnyChange };
}

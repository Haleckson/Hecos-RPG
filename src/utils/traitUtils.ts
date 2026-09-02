import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';

export interface TraitDefinition {
  category: string;
  description: string;
  color: string;
}

export const CANONICAL_TRADITIONS: Array<'Cinética' | 'Etérea' | 'Biológica' | 'Abiótica' | 'Omni'> = [
  'Cinética',
  'Etérea',
  'Biológica',
  'Abiótica',
  'Omni',
];

export const CANONICAL_RARITIES: Array<'Comum' | 'Incomum' | 'Raro' | 'Único'> = [
  'Comum',
  'Incomum',
  'Raro',
  'Único',
];

export const CANONICAL_SIZES: Array<'Minúsculo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Gigantesco'> = [
  'Minúsculo',
  'Pequeno',
  'Médio',
  'Grande',
  'Enorme',
  'Gigantesco',
];

/**
 * Checks whether a given string is a pseudo-trait / category header rather than a genuine rule trait.
 * Filters out "Nível X", "Perigo", "Perigo Simples", "Monstro", "Assombração", "Perigo Complexo", "Perigo Ambiental", "PF2e", etc.
 */
export function isPseudoTrait(traitName: string | undefined | null): boolean {
  if (!traitName || typeof traitName !== 'string') return true;
  const clean = traitName.trim();
  if (!clean) return true;
  const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Level patterns like "Nível 1", "Nivel 2", "Level 3", "Nv 4", "Nvl 5"
  if (/^(nivel|level|nv|nvl)\s*\d+$/i.test(norm)) return true;

  // 2. Generic peril kinds, category headers or meta tags that are not PF2e rule traits
  const pseudoKeywords = [
    'perigo',
    'perigos',
    'perigoso',
    'perigoso simples',
    'perigosos simples',
    'perigo simples',
    'perigos simples',
    'perigo complexo',
    'perigos complexos',
    'perigo ambiental',
    'perigos ambientais',
    'perigosos ambientais',
    'monstro',
    'monstros',
    'criatura',
    'criaturas',
    'hazard',
    'hazards',
    'simple hazard',
    'complex hazard',
    'environmental hazard',
    'monster',
    'monsters',
    'creature',
    'creatures',
    'pf2e',
    'hecos',
  ];

  if (pseudoKeywords.includes(norm)) return true;

  return false;
}

/**
 * Normalizes size strings into canonical Portuguese standard:
 * Minúsculo, Pequeno, Médio, Grande, Enorme, Gigantesco
 */
export function canonicalizeSizeName(size: string | undefined | null): string {
  if (!size || typeof size !== 'string') return '';
  const norm = size.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm === 'minusculo' || norm === 'tiny') return 'Minúsculo';
  if (norm === 'pequeno' || norm === 'small') return 'Pequeno';
  if (norm === 'medio' || norm === 'medium') return 'Médio';
  if (norm === 'grande' || norm === 'large') return 'Grande';
  if (norm === 'enorme' || norm === 'huge') return 'Enorme';
  if (norm === 'gigantesco' || norm === 'gargantuesco' || norm === 'imenso' || norm === 'gargantuan') return 'Gigantesco';
  return size.trim();
}

/**
 * Normalizes rarity strings into canonical Portuguese standard:
 * Comum, Incomum, Raro, Único
 */
export function canonicalizeRarityName(rarity: string | undefined | null): string {
  if (!rarity || typeof rarity !== 'string') return '';
  const norm = rarity.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm === 'comum' || norm === 'common') return 'Comum';
  if (norm === 'incomum' || norm === 'uncommon') return 'Incomum';
  if (norm === 'raro' || norm === 'rare') return 'Raro';
  if (norm === 'unico' || norm === 'unique') return 'Único';
  return rarity.trim();
}

/**
 * Normalizes any trait name to its canonical display form
 */
export function canonicalizeTraitName(traitName: string | undefined | null): string {
  if (!traitName || typeof traitName !== 'string') return '';
  const clean = traitName.trim();
  if (!clean) return '';
  const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Check Rarity
  if (CORE_RARITIES.some(r => r.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm)) {
    return canonicalizeRarityName(clean);
  }

  // Check Size
  if (CORE_SIZES.some(s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm)) {
    return canonicalizeSizeName(clean);
  }

  // Check Traditions
  if (norm === 'cinetica') return 'Cinética';
  if (norm === 'eterea') return 'Etérea';
  if (norm === 'biologica') return 'Biológica';
  if (norm === 'abiotica') return 'Abiótica';
  if (norm === 'omni') return 'Omni';
  if (norm === 'arcana' || norm === 'arcane') return 'Arcana';
  if (norm === 'divina' || norm === 'divine') return 'Divina';
  if (norm === 'oculta' || norm === 'occult') return 'Oculta';
  if (norm === 'primal') return 'Primal';
  if (norm === 'e. fisica' || norm === 'energia fisica') return 'E. Física';
  if (norm === 'e. meta' || norm === 'e. metafisica' || norm === 'energia metafisica') return 'E. Metafísica';
  if (norm === 'm. organica' || norm === 'materia organica') return 'M. Orgânica';
  if (norm === 'm. inorganica' || norm === 'materia inorganica') return 'M. Inorgânica';

  // Return formatted display
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Returns a unique canonical key for deduplication
 */
export function getTraitCanonicalKey(traitName: string | undefined | null): string {
  if (!traitName || typeof traitName !== 'string') return '';
  const canonical = canonicalizeTraitName(traitName);
  return canonical.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Standard categories for Traits in Hecos & PF2e, ordered by canonical hierarchy:
 * [Raridade] -> [Tamanho] -> [Tradição de Magia] -> [Outros Traits em Ordem Alfabética]
 */
export const TRAIT_CATEGORIES: string[] = [
  'Raridade',
  'Tamanho',
  'Tradições de Hecos',
  'Tradição de Magia',
  'Ações e Atividades',
  'Ancestralidade e Herança',
  'Classe',
  'Condições',
  'Criaturas',
  'Dano e Elementos',
  'Equipamento e Itens',
  'Extra',
  'Escolas e Magias',
];

/**
 * Returns the tier for a trait category name:
 * 1: Raridade
 * 2: Tamanho
 * 3: Tradição de Magia / Tradições de Hecos
 * 4: Outras Categorias (Ordem Alfabética)
 */
export function getTraitCategoryTier(categoryName: string): number {
  if (!categoryName || typeof categoryName !== 'string') return 4;
  const norm = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (norm === 'raridade' || norm === 'rarity') return 1;
  if (norm === 'tamanho' || norm === 'size') return 2;
  if (
    norm.includes('tradicao') ||
    norm.includes('tradic') ||
    norm.includes('tradition') ||
    norm === 'tradicoes de hecos'
  ) {
    return 3;
  }
  return 4;
}

/**
 * Sorts any list of trait category names following the canonical hierarchy:
 * [Raridade] + [Tamanho] + [Tradição de Magia] + [Outros em Ordem Alfabética]
 */
export function sortTraitCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const tierA = getTraitCategoryTier(a);
    const tierB = getTraitCategoryTier(b);
    if (tierA !== tierB) return tierA - tierB;
    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
  });
}

export const DEFAULT_TRAIT_DESCRIPTIONS: Record<string, TraitDefinition> = {
  // Tradições de Feitiços de Hecos
  cinetica: {
    category: 'Tradições de Hecos',
    description: 'Manipulação de energia térmica, cinética, gravidade, eletricidade e forças físicas materiais.',
    color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300',
  },
  cinética: {
    category: 'Tradições de Hecos',
    description: 'Manipulação de energia térmica, cinética, gravidade, eletricidade e forças físicas materiais.',
    color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300',
  },
  eterea: {
    category: 'Tradições de Hecos',
    description: 'Manipulação do tempo, espaço, alma, ilusões e forças transcendentais.',
    color: 'border-purple-700/80 bg-purple-950/80 text-purple-300',
  },
  etérea: {
    category: 'Tradições de Hecos',
    description: 'Manipulação do tempo, espaço, alma, ilusões e forças transcendentais.',
    color: 'border-purple-700/80 bg-purple-950/80 text-purple-300',
  },
  biologica: {
    category: 'Tradições de Hecos',
    description: 'Manipulação e transmutação da carne, sangue, biomassa, flora, cura e organismos vivos.',
    color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300',
  },
  biológica: {
    category: 'Tradições de Hecos',
    description: 'Manipulação e transmutação da carne, sangue, biomassa, flora, cura e organismos vivos.',
    color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300',
  },
  abiotica: {
    category: 'Tradições de Hecos',
    description: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos, matéria inanimada.',
    color: 'border-amber-700/80 bg-amber-950/80 text-amber-300',
  },
  abiótica: {
    category: 'Tradições de Hecos',
    description: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos, matéria inanimada.',
    color: 'border-amber-700/80 bg-amber-950/80 text-amber-300',
  },
  omni: {
    category: 'Tradições de Hecos',
    description: 'Tradição mágica universal que unifica todas as vertentes da energia e matéria de Hecos.',
    color: 'border-rose-600/80 bg-rose-950/80 text-rose-300',
  },
  'e. fisica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação de energia térmica, cinética, gravidade, eletricidade e forças físicas materiais.',
    color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300',
  },
  'energia fisica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação de energia térmica, cinética, gravidade, eletricidade e forças físicas materiais.',
    color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300',
  },
  'e. meta': {
    category: 'Tradições de Hecos',
    description: 'Manipulação do tempo, espaço, alma, ilusões e forças transcendentais.',
    color: 'border-purple-700/80 bg-purple-950/80 text-purple-300',
  },
  'energia metafisica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação do tempo, espaço, alma, ilusões e forças transcendentais.',
    color: 'border-purple-700/80 bg-purple-950/80 text-purple-300',
  },
  'm. organica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação e transmutação da carne, sangue, biomassa, flora, cura e organismos vivos.',
    color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300',
  },
  'materia organica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação e transmutação da carne, sangue, biomassa, flora, cura e organismos vivos.',
    color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300',
  },
  'm. inorganica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos, matéria inanimada.',
    color: 'border-amber-700/80 bg-amber-950/80 text-amber-300',
  },
  'materia inorganica': {
    category: 'Tradições de Hecos',
    description: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos, matéria inanimada.',
    color: 'border-amber-700/80 bg-amber-950/80 text-amber-300',
  },

  // PF2e Official Core Traits
  humanoide: { category: 'Ancestralidade e Herança', description: 'Criaturas humanóides com duas pernas, dois braços e postura bípede.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  comum: { category: 'Raridade', description: 'Geralmente disponível e acessível para qualquer personagem ou contexto regular.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  incomum: { category: 'Raridade', description: 'Algo incomum no mundo de Hecos. Exige acesso narrativo, treinamento específico ou aprovação do Mestre.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-300' },
  raro: { category: 'Raridade', description: 'Muito difícil de encontrar ou aprender. Requer aprovação expressa do GM ou evento de campanha.', color: 'border-blue-700/80 bg-blue-950/80 text-blue-300' },
  unico: { category: 'Raridade', description: 'Existe apenas um exemplar deste item, criatura ou efeito em todo o cosmos.', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  único: { category: 'Raridade', description: 'Existe apenas um exemplar deste item, criatura ou efeito em todo o cosmos.', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },

  // Tamanhos Oficiais PF2e
  minusculo: { category: 'Tamanho', description: 'Criaturas ou objetos que medem menos de 60 centímetros e ocupam um espaço de 75cm ou menos.', color: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  minúsculo: { category: 'Tamanho', description: 'Criaturas ou objetos que medem menos de 60 centímetros e ocupam um espaço de 75cm ou menos.', color: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  tiny: { category: 'Tamanho', description: 'Criaturas ou objetos que medem menos de 60 centímetros e ocupam um espaço de 75cm ou menos.', color: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  pequeno: { category: 'Tamanho', description: 'Criaturas ou objetos que medem entre 60cm e 1,20m e ocupam um espaço de 1,5m (1 quadrado).', color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  small: { category: 'Tamanho', description: 'Criaturas ou objetos que medem entre 60cm e 1,20m e ocupam um espaço de 1,5m (1 quadrado).', color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  medio: { category: 'Tamanho', description: 'Criaturas ou objetos de estatura média (1,20m a 2,40m), ocupando um espaço de 1,5m (1 quadrado).', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  médio: { category: 'Tamanho', description: 'Criaturas ou objetos de estatura média (1,20m a 2,40m), ocupando um espaço de 1,5m (1 quadrado).', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  medium: { category: 'Tamanho', description: 'Criaturas ou objetos de estatura média (1,20m a 2,40m), ocupando um espaço de 1,5m (1 quadrado).', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  grande: { category: 'Tamanho', description: 'Criaturas ou objetos de porte grande (2,40m a 4,80m), ocupando um espaço de 3m x 3m (2x2 quadrados).', color: 'border-amber-700/80 bg-amber-950/80 text-amber-300' },
  large: { category: 'Tamanho', description: 'Criaturas ou objetos de porte grande (2,40m a 4,80m), ocupando um espaço de 3m x 3m (2x2 quadrados).', color: 'border-amber-700/80 bg-amber-950/80 text-amber-300' },
  enorme: { category: 'Tamanho', description: 'Criaturas ou objetos de porte enorme (4,80m a 9,60m), ocupando um espaço de 4,5m x 4,5m (3x3 quadrados).', color: 'border-rose-700/80 bg-rose-950/80 text-rose-300' },
  huge: { category: 'Tamanho', description: 'Criaturas ou objetos de porte enorme (4,80m a 9,60m), ocupando um espaço de 4,5m x 4,5m (3x3 quadrados).', color: 'border-rose-700/80 bg-rose-950/80 text-rose-300' },
  imenso: { category: 'Tamanho', description: 'Criaturas ou estruturas colossais (9,60m ou mais), ocupando um espaço de 6m x 6m ou maior (4x4 quadrados ou mais).', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  gargantuesco: { category: 'Tamanho', description: 'Criaturas ou estruturas colossais (9,60m ou mais), ocupando um espaço de 6m x 6m ou maior (4x4 quadrados ou mais).', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  gargantuan: { category: 'Tamanho', description: 'Criaturas ou estruturas colossais (9,60m ou mais), ocupando um espaço de 6m x 6m ou maior (4x4 quadrados ou mais).', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  fogo: { category: 'Dano e Elementos', description: 'Efeitos com este traço manipulam energia térmica, causam dano por fogo ou pertencem ao plano ígneo.', color: 'border-rose-700/80 bg-rose-950/80 text-rose-300' },
  agua: { category: 'Dano e Elementos', description: 'Manipulação de água, correntes líquidas e pressões aquáticas.', color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  água: { category: 'Dano e Elementos', description: 'Manipulação de água, correntes líquidas e pressões aquáticas.', color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  terra: { category: 'Dano e Elementos', description: 'Magias e poderes ligados a minerais, rochas, areia e solidez telúrica.', color: 'border-amber-800/80 bg-amber-950/70 text-amber-200' },
  ar: { category: 'Dano e Elementos', description: 'Efeitos de ventania, tempestade, vácuo ou gás.', color: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  luz: { category: 'Dano e Elementos', description: 'Efeitos radiantes capazes de dissipar escuridão mágica de nível igual ou menor.', color: 'border-yellow-600/80 bg-yellow-950/80 text-yellow-300' },
  escuridao: { category: 'Dano e Elementos', description: 'Efeitos de penumbra profunda, sombras vivas e supressão de luz.', color: 'border-zinc-800 bg-[#0c0914] text-purple-300' },
  escuridão: { category: 'Dano e Elementos', description: 'Efeitos de penumbra profunda, sombras vivas e supressão de luz.', color: 'border-zinc-800 bg-[#0c0914] text-purple-300' },
  sombrio: { category: 'Dano e Elementos', description: 'Conectado à energia umbrosa e à penumbra perpétua de Hecos.', color: 'border-purple-900/80 bg-purple-950/80 text-purple-200' },
  arcana: { category: 'Perícia Conjuradora', description: 'Perícia de conjuração acadêmica e racional baseada nas leis universais e na lógica do cosmos.', color: 'border-blue-700/80 bg-blue-950/80 text-blue-300' },
  divina: { category: 'Perícia Conjuradora', description: 'Perícia de conjuração devocional canalizada através de divindades, fé e energias cósmicas.', color: 'border-yellow-700/80 bg-yellow-950/80 text-yellow-300' },
  oculta: { category: 'Perícia Conjuradora', description: 'Perícia de conjuração esotérica ligada à mente, alma, mistérios ocultos e realidades insondáveis.', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  primal: { category: 'Perícia Conjuradora', description: 'Perícia de conjuração instintiva conectada às forças da natureza, aos elementos e à vida animal.', color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300' },
  mental: { category: 'Escolas e Magias', description: 'Afeta diretamente a mente, psique ou pensamentos do alvo.', color: 'border-indigo-700/80 bg-indigo-950/80 text-indigo-300' },
  emocao: { category: 'Escolas e Magias', description: 'Altera o estado emocional (medo, coragem, fúria, desespero).', color: 'border-pink-700/80 bg-pink-950/80 text-pink-300' },
  emoção: { category: 'Escolas e Magias', description: 'Altera o estado emocional (medo, coragem, fúria, desespero).', color: 'border-pink-700/80 bg-pink-950/80 text-pink-300' },
  medo: { category: 'Condições', description: 'Efeito mental que pode impor a condição Amedrontado.', color: 'border-rose-800 bg-rose-950 text-rose-300' },
  cura: { category: 'Escolas e Magias', description: 'Restaura Pontos de Vida ou remove aflições de criaturas vivas.', color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300' },
  veneno: { category: 'Condições', description: 'Toxinas, peçonhas e miasmas biológicos ou alquímicos.', color: 'border-emerald-800 bg-emerald-950 text-emerald-400' },
  necromancia: { category: 'Escolas e Magias', description: 'Manipulação das energias da vida, morte e não-vida.', color: 'border-zinc-700 bg-black text-rose-300' },
  evocacao: { category: 'Escolas e Magias', description: 'Manifestação direta de energia elemental e forças brutas.', color: 'border-rose-700 bg-rose-950/70 text-rose-200' },
  evocação: { category: 'Escolas e Magias', description: 'Manifestação direta de energia elemental e forças brutas.', color: 'border-rose-700 bg-rose-950/70 text-rose-200' },
  transmutacao: { category: 'Escolas e Magias', description: 'Alteração da forma física, matéria e propriedades corporais.', color: 'border-cyan-700 bg-cyan-950/70 text-cyan-200' },
  transmutação: { category: 'Escolas e Magias', description: 'Alteração da forma física, matéria e propriedades corporais.', color: 'border-cyan-700 bg-cyan-950/70 text-cyan-200' },
  ilusao: { category: 'Escolas e Magias', description: 'Enganação sensorial visual, sonora ou olfativa.', color: 'border-violet-700 bg-violet-950/70 text-violet-300' },
  ilusão: { category: 'Escolas e Magias', description: 'Enganação sensorial visual, sonora ou olfativa.', color: 'border-violet-700 bg-violet-950/70 text-violet-300' },
  abjuracao: { category: 'Escolas e Magias', description: 'Magias protetivas, barreiras, contrafeitiços e santuários.', color: 'border-blue-700 bg-blue-950/70 text-blue-300' },
  abjuração: { category: 'Escolas e Magias', description: 'Magias protetivas, barreiras, contrafeitiços e santuários.', color: 'border-blue-700 bg-blue-950/70 text-blue-300' },
  adivinhacao: { category: 'Escolas e Magias', description: 'Revelação de segredos, presságios e visão remota.', color: 'border-cyan-600 bg-cyan-950 text-cyan-300' },
  adivinhação: { category: 'Escolas e Magias', description: 'Revelação de segredos, presságios e visão remota.', color: 'border-cyan-600 bg-cyan-950 text-cyan-300' },
  encantamento: { category: 'Escolas e Magias', description: 'Influência mental, comandos imperativos e fascínio.', color: 'border-pink-800 bg-pink-950 text-pink-300' },
  concentracao: { category: 'Ações e Atividades', description: 'Exige foco contínuo; pode ser interrompido por reações com ataque de oportunidade.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-200' },
  concentração: { category: 'Ações e Atividades', description: 'Exige foco contínuo; pode ser interrompido por reações com ataque de oportunidade.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-200' },
  manipular: { category: 'Ações e Atividades', description: 'Movimento físico com as mãos ou corpo; provoca reações contra manipulação.', color: 'border-orange-700/80 bg-orange-950/80 text-orange-200' },
  auditivo: { category: 'Extra', description: 'Depende de som ou audição para surtir efeito total.', color: 'border-teal-700 bg-teal-950 text-teal-300' },
  visual: { category: 'Extra', description: 'Depende da visão da criatura para surtir efeito.', color: 'border-sky-700 bg-sky-950 text-sky-300' },
  linguistico: { category: 'Extra', description: 'O alvo precisa compreender o idioma falado ou transmitido.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  linguístico: { category: 'Extra', description: 'O alvo precisa compreender o idioma falado ou transmitido.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  ataque: { category: 'Ações e Atividades', description: 'Conta e sofre a Penalidade por Ataque Múltiplo (PAM).', color: 'border-rose-700 bg-rose-950 text-rose-300' },
  postura: { category: 'Ações e Atividades', description: 'Assume uma postura marcial ativa até adotar outra ou encerrar combate.', color: 'border-purple-700 bg-purple-950 text-purple-300' },
  golpe: { category: 'Ações e Atividades', description: 'Ataque básico corpo a corpo ou à distância com arma ou ataque desarmado.', color: 'border-red-800 bg-red-950 text-red-300' },
  magico: { category: 'Extra', description: 'Possui natureza sobrenatural e pode ser afetado por dissipar magia.', color: 'border-cyan-700 bg-cyan-950 text-cyan-300' },
  mágico: { category: 'Extra', description: 'Possui natureza sobrenatural e pode ser afetado por dissipar magia.', color: 'border-cyan-700 bg-cyan-950 text-cyan-300' },
};

/**
 * Resolves full info (category, description, color classes) for any given trait.
 */
export function getTraitInfo(traitName: string): {
  displayName: string;
  category: string;
  description: string;
  color: string;
  isTradition: boolean;
} {
  if (!traitName || typeof traitName !== 'string') {
    return {
      displayName: 'Desconhecido',
      category: 'Geral',
      description: 'Sem descrição cadastrada.',
      color: 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]',
      isTradition: false,
    };
  }

  const clean = traitName.trim();
  const normalizedKey = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const exactLower = clean.toLowerCase();

  // 1. Check user-defined custom trait storage first (highest priority)
  const customTraits = HecosStorage.getCustomTraits();
  const custom = customTraits[normalizedKey] || customTraits[exactLower] || customTraits[clean];
  if (custom) {
    const isTrad =
      custom.category === 'Tradições de Hecos' ||
      CANONICAL_TRADITIONS.some((ct) => ct.toLowerCase() === exactLower || ct.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedKey);
    return {
      displayName: clean,
      category: custom.category || 'Mecânica Personalizada',
      description: custom.description || 'Traço customizado do mundo de Hecos.',
      color: custom.color || (isTrad ? 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' : 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]'),
      isTradition: isTrad,
    };
  }

  // 2. Check predefined default descriptions
  const defaultDef = DEFAULT_TRAIT_DESCRIPTIONS[exactLower] || DEFAULT_TRAIT_DESCRIPTIONS[normalizedKey];
  if (defaultDef) {
    return {
      displayName: clean,
      category: defaultDef.category,
      description: defaultDef.description,
      color: defaultDef.color,
      isTradition: defaultDef.category === 'Tradições de Hecos' || CANONICAL_TRADITIONS.some((ct) => ct.toLowerCase() === exactLower),
    };
  }

  // 3. Fallback
  return {
    displayName: clean,
    category: 'Mecânica PF2e / Hecos',
    description: 'Traço de regras ou temática de Hecos.',
    color: 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]',
    isTradition: false,
  };
}

/**
 * Extracts all traits from an entity including traditions, traits, statblock, feats, items, etc.
 */
export function extractEntityAllTraits(ent: HecosEntity): string[] {
  const result = new Set<string>();

  const add = (val: unknown) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
          const clean = item.trim();
          if (!isPseudoTrait(clean)) {
            result.add(clean);
          }
        }
      });
    } else if (typeof val === 'string') {
      val.split(',').forEach((item) => {
        const trimmed = item.trim();
        if (trimmed && !isPseudoTrait(trimmed)) result.add(trimmed);
      });
    }
  };

  // Regular and specialized traits
  add(ent.traits);
  add(ent.statblock?.traits);
  add(ent.spellData?.traits);
  add(ent.featData?.traits);
  if (ent.ancestryData?.traits) add(ent.ancestryData.traits);
  if (ent.itemData?.traits) add(ent.itemData.traits);
  if (ent.perilData?.traits) add(ent.perilData.traits);
  if (ent.classData?.traits) add(ent.classData.traits);

  // Traditions from spells (integrated seamlessly as official traits)
  if (ent.spellData?.traditions) {
    add(ent.spellData.traditions);
  }

  // Rarity treated globally as trait
  if ((ent.statblock as any)?.rarity) add((ent.statblock as any).rarity);
  if (ent.featData?.rarity) add(ent.featData.rarity);
  if (ent.spellData?.rarity) add(ent.spellData.rarity);
  if (ent.itemData?.rarity) add(ent.itemData.rarity);
  if (ent.perilData?.rarity) add(ent.perilData.rarity);
  if (ent.classData?.rarity) add(ent.classData.rarity);

  // Size treated globally as trait
  if ((ent.statblock as any)?.size) add((ent.statblock as any).size);
  if (ent.perilData?.size) add(ent.perilData.size);
  if (ent.ancestryData?.size) add(ent.ancestryData.size);

  return sortTraitsHierarchically(Array.from(result));
}

export const CORE_RARITIES = [
  'comum',
  'incomum',
  'raro',
  'unico',
  'único',
  'common',
  'uncommon',
  'rare',
  'unique'
];

export const CORE_SIZES = [
  'minusculo',
  'minúsculo',
  'tiny',
  'pequeno',
  'small',
  'medio',
  'médio',
  'medium',
  'grande',
  'large',
  'enorme',
  'huge',
  'gigantesco',
  'imenso',
  'gargantuesco',
  'gargantuan',
];

export const CORE_TRADITIONS = [
  'cinetica',
  'cinética',
  'eterea',
  'etérea',
  'biologica',
  'biológica',
  'abiotica',
  'abiótica',
  'omni',
  'arcana',
  'arcane',
  'divina',
  'divine',
  'oculta',
  'occult',
  'primal',
  'e. fisica',
  'e. física',
  'energia fisica',
  'energia física',
  'e. meta',
  'e. metafisica',
  'e. metafísica',
  'energia metafisica',
  'energia metafísica',
  'm. organica',
  'm. orgânica',
  'materia organica',
  'matéria orgânica',
  'm. inorganica',
  'm. inorgânica',
  'materia inorganica',
  'matéria inorgânica',
];

export function isRarityTrait(traitName: string): boolean {
  if (!traitName || typeof traitName !== 'string') return false;
  const clean = traitName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CORE_RARITIES.some(r => r.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === clean)) return true;
  const info = getTraitInfo(traitName);
  return info.category.toLowerCase() === 'raridade' || info.category.toLowerCase() === 'rarity';
}

export function isTraditionTrait(traitName: string): boolean {
  if (!traitName || typeof traitName !== 'string') return false;
  const clean = traitName.trim();
  if (!clean) return false;
  const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CORE_TRADITIONS.some((t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm)) return true;
  const info = getTraitInfo(traitName);
  if (info.isTradition) return true;
  const cat = info.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return (
    cat === 'tradicoes de hecos' ||
    cat === 'tradicao de magia' ||
    cat === 'tradicoes de magia' ||
    cat === 'tradicoes magicas' ||
    cat === 'tradicao magica' ||
    cat === 'tradicoes' ||
    cat === 'tradicao' ||
    cat === 'tradition' ||
    cat === 'traditions'
  );
}

export function isSizeTrait(traitName: string): boolean {
  if (!traitName || typeof traitName !== 'string') return false;
  const clean = traitName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CORE_SIZES.some((s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === clean)) return true;
  const info = getTraitInfo(traitName);
  return info.category.toLowerCase() === 'tamanho' || info.category.toLowerCase() === 'size';
}

/**
 * Returns hierarchy tier for sorting traits:
 * 1: [Raridade]
 * 2: [Tamanho]
 * 3: [Tradição de Magia]
 * 4: [Outros Traits em Ordem Alfabética]
 */
export function getTraitHierarchyTier(traitName: string): number {
  if (isRarityTrait(traitName)) return 1;
  if (isSizeTrait(traitName)) return 2;
  if (isTraditionTrait(traitName)) return 3;
  return 4;
}

/**
 * Sorts any list of traits following the strict canonical hierarchy:
 * [Raridade] -> [Tamanho] -> [Tradição de Magia] -> [Outros Traits em Ordem Alfabética]
 * Strictly deduplicates entries (e.g., 'Medium' and 'Médio', 'Comum' and 'common').
 */
export function sortTraitsHierarchically(
  traits?: (string | undefined | null)[] | string | null,
  options?: {
    rarity?: string;
    size?: string;
    traditions?: string[] | string;
  }
): string[] {
  const map = new Map<string, string>(); // canonical key -> display canonical name

  const add = (t?: unknown) => {
    if (!t || typeof t !== 'string') return;
    const clean = t.trim();
    if (!clean) return;
    if (isPseudoTrait(clean)) return;
    const canonicalName = canonicalizeTraitName(clean);
    const key = getTraitCanonicalKey(canonicalName);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, canonicalName);
    }
  };

  // Add explicit options if provided (Canonicalized)
  if (options?.rarity) add(options.rarity);
  if (options?.size) add(options.size);
  if (options?.traditions) {
    if (Array.isArray(options.traditions)) {
      options.traditions.forEach(add);
    } else if (typeof options.traditions === 'string') {
      options.traditions.split(',').forEach(add);
    }
  }

  // Add all other passed traits (handles array or comma-separated string)
  if (Array.isArray(traits)) {
    traits.forEach(add);
  } else if (typeof traits === 'string') {
    traits.split(',').forEach(add);
  }

  const uniqueTraits = Array.from(map.values());

  return uniqueTraits.sort((a, b) => {
    const tierA = getTraitHierarchyTier(a);
    const tierB = getTraitHierarchyTier(b);

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Within Tier 1 (Rarity): canonical order (Único > Raro > Incomum > Comum)
    if (tierA === 1) {
      const rarityRank = (r: string) => {
        const norm = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm === 'unico' || norm === 'unique') return 1;
        if (norm === 'raro' || norm === 'rare') return 2;
        if (norm === 'incomum' || norm === 'uncommon') return 3;
        return 4; // comum / common
      };
      const diff = rarityRank(a) - rarityRank(b);
      if (diff !== 0) return diff;
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    }

    // Within Tier 2 (Size): minúsculo -> pequeno -> médio -> grande -> enorme -> gigantesco
    if (tierA === 2) {
      const sizeRank = (s: string) => {
        const norm = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm === 'minusculo' || norm === 'tiny') return 1;
        if (norm === 'pequeno' || norm === 'small') return 2;
        if (norm === 'medio' || norm === 'medium') return 3;
        if (norm === 'grande' || norm === 'large') return 4;
        if (norm === 'enorme' || norm === 'huge') return 5;
        return 6; // gigantesco, imenso, gargantuesco, gargantuan
      };
      const diff = sizeRank(a) - sizeRank(b);
      if (diff !== 0) return diff;
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    }

    // Within Tier 3 (Traditions of Magic) and Tier 4 (Other Traits): alphabetical order
    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
  });
}

/**
 * Archives of Nethys (AoN) PF2e Integration Service
 * Base: https://2e.aonprd.com
 */

export interface AoNCategory {
  id: string;
  name: string;
  url: string;
  description: string;
  iconName: string;
}

export const AON_BASE_URL = 'https://2e.aonprd.com';

export const AON_CATEGORIES: AoNCategory[] = [
  {
    id: 'search',
    name: 'Busca Geral',
    url: `${AON_BASE_URL}/Search.aspx`,
    description: 'Pesquisar tudo no banco oficial de Pathfinder 2e',
    iconName: 'Search',
  },
  {
    id: 'actions',
    name: 'Ações Básicas & Especiais',
    url: `${AON_BASE_URL}/Actions.aspx`,
    description: 'Stride, Strike, Grapple, Trip, Cast a Spell, etc.',
    iconName: 'Zap',
  },
  {
    id: 'rules',
    name: 'Regras & Capítulos',
    url: `${AON_BASE_URL}/Rules.aspx`,
    description: 'Player Core, GM Core, Combate, Perícias e Exploração',
    iconName: 'BookOpen',
  },
  {
    id: 'spells',
    name: 'Feitiços & Rituais',
    url: `${AON_BASE_URL}/Spells.aspx`,
    description: 'Todas as magias arcanas, divinas, ocultas e primordiais',
    iconName: 'Sparkles',
  },
  {
    id: 'feats',
    name: 'Talentos (Feats)',
    url: `${AON_BASE_URL}/Feats.aspx`,
    description: 'Talentos de Ancestralidade, Classe, Perícia e Gerais',
    iconName: 'Award',
  },
  {
    id: 'creatures',
    name: 'Monstros & Criaturas',
    url: `${AON_BASE_URL}/Creatures.aspx`,
    description: 'Bestiário completo de monstros e NPCs oficiais',
    iconName: 'Skull',
  },
  {
    id: 'conditions',
    name: 'Condições',
    url: `${AON_BASE_URL}/Conditions.aspx`,
    description: 'Frightened, Drained, Off-Guard, Grabbed, Dying, etc.',
    iconName: 'ShieldAlert',
  },
  {
    id: 'equipment',
    name: 'Equipamento & Itens',
    url: `${AON_BASE_URL}/Equipment.aspx`,
    description: 'Armas, armaduras, runas, consumíveis e artefatos',
    iconName: 'Gem',
  },
  {
    id: 'classes',
    name: 'Classes',
    url: `${AON_BASE_URL}/Classes.aspx`,
    description: 'Classes oficiais do Core e expansões',
    iconName: 'UserCheck',
  },
  {
    id: 'archetypes',
    name: 'Arquétipos',
    url: `${AON_BASE_URL}/Archetypes.aspx`,
    description: 'Multiclasse e arquétipos dedicados',
    iconName: 'Layers',
  },
  {
    id: 'hazards',
    name: 'Perigos & Armadilhas',
    url: `${AON_BASE_URL}/Hazards.aspx`,
    description: 'Armadilhas e perigos ambientais',
    iconName: 'Flame',
  },
];

export const AON_POPULAR_TOPICS = [
  { label: 'Off-Guard (Flanking)', query: 'Off-Guard', category: 'conditions' },
  { label: 'Dying & Wounded', query: 'Dying rules', category: 'rules' },
  { label: 'Grapple (Agarrar)', query: 'Grapple', category: 'actions' },
  { label: 'Trip (Derrubar)', query: 'Trip', category: 'actions' },
  { label: 'Demoralize', query: 'Demoralize', category: 'actions' },
  { label: 'Recall Knowledge', query: 'Recall Knowledge', category: 'actions' },
  { label: 'Multiple Attack Penalty (MAP)', query: 'Multiple Attack Penalty', category: 'rules' },
  { label: 'Treat Wounds (Medicina)', query: 'Treat Wounds', category: 'actions' },
  { label: 'Cover (Cobertura)', query: 'Cover', category: 'rules' },
  { label: 'Stealth & Sneak', query: 'Sneak', category: 'actions' },
  { label: 'Shield Block', query: 'Shield Block', category: 'feats' },
  { label: 'Counteract Rules', query: 'Counteract', category: 'rules' },
];

/**
 * Returns a direct AoN search URL
 */
export function getAoNSearchUrl(query: string, category?: string): string {
  if (!query.trim()) {
    if (category) {
      const found = AON_CATEGORIES.find((c) => c.id === category);
      if (found) return found.url;
    }
    return `${AON_BASE_URL}/Search.aspx`;
  }
  return `${AON_BASE_URL}/Search.aspx?q=${encodeURIComponent(query.trim())}`;
}

/**
 * Opens Archives of Nethys in a new tab
 */
export function openAoNSearch(query: string, category?: string): void {
  const url = getAoNSearchUrl(query, category);
  window.open(url, '_blank', 'noopener,noreferrer');
}

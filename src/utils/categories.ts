import {
  Users,
  User,
  BookMarked,
  Skull,
  Sparkles,
  Gem,
  Compass,
  PawPrint,
  Flower2,
  Shield,
  Dna,
  Swords,
  Layers,
  BookOpen,
  Lock,
  Award,
  Scroll,
  History,
  Map as MapIcon,
  Tag as TagIcon,
  CheckSquare
} from 'lucide-react';
import { EntityCategory } from '../types';

export interface CategoryGroup {
  id: string;
  name: string;
  icon?: any;
  items: CategoryDefinition[];
}

export interface CategoryDefinition {
  id: string;
  name: string;
  categoryKey?: EntityCategory;
  subcategory?: string;
  icon: any;
  color: string; // Unique hex color
  accentColor: string; // Theme slug for Tailwind badges/accents
  badgeBg?: string;
  badgeBorder?: string;
  badgeText?: string;
  description: string;
  isCustomView?: boolean;
  viewType?: 'entities' | 'map' | 'timeline' | 'tags' | 'quests';
  children?: CategoryDefinition[];
  groups?: CategoryGroup[];
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'pc',
    name: 'PC',
    categoryKey: 'pc',
    icon: Users,
    color: '#38bdf8', // Sky Blue / Ciano Vibrante
    accentColor: 'sky',
    badgeBg: 'bg-sky-950/80',
    badgeBorder: 'border-sky-500/60',
    badgeText: 'text-sky-300',
    description: 'Fichas, histórico e evolução dos Personagens dos Jogadores.',
    viewType: 'entities'
  },
  {
    id: 'codex',
    name: 'Codex',
    icon: BookMarked,
    color: '#a78bfa', // Purple / Violeta
    accentColor: 'violet',
    badgeBg: 'bg-violet-950/80',
    badgeBorder: 'border-violet-500/60',
    badgeText: 'text-violet-300',
    description: 'Enciclopédia viva de criaturas, feitiços, itens, locais, povos, regras e história de Hecos.',
    groups: [
      {
        id: 'lore',
        name: 'Lore',
        items: [
          {
            id: 'fauna',
            name: 'Fauna',
            categoryKey: 'fauna',
            subcategory: 'Fauna',
            icon: PawPrint,
            color: '#10b981', // Emerald / Verde Selvagem
            accentColor: 'emerald',
            badgeBg: 'bg-emerald-950/80',
            badgeBorder: 'border-emerald-500/60',
            badgeText: 'text-emerald-300',
            description: 'Animais silvestres, corvos de vidro e bestas do lago.',
            viewType: 'entities'
          },
          {
            id: 'flora',
            name: 'Flora',
            categoryKey: 'flora',
            subcategory: 'Flora',
            icon: Flower2,
            color: '#84cc16', // Lime / Verde Botânico
            accentColor: 'lime',
            badgeBg: 'bg-lime-950/80',
            badgeBorder: 'border-lime-500/60',
            badgeText: 'text-lime-300',
            description: 'Ervas medicinais, fungos luminescentes e plantas carnívoras.',
            viewType: 'entities'
          },
          {
            id: 'locais',
            name: 'Locais',
            categoryKey: 'location',
            subcategory: 'Locais',
            icon: Compass,
            color: '#3b82f6', // Blue / Azul Cartográfico
            accentColor: 'blue',
            badgeBg: 'bg-blue-950/80',
            badgeBorder: 'border-blue-500/60',
            badgeText: 'text-blue-300',
            description: 'Geografia, santuários, cidades de obsidiana e masmorras.',
            viewType: 'entities'
          },
          {
            id: 'npc',
            name: 'NPC',
            categoryKey: 'npc',
            subcategory: 'NPC',
            icon: User,
            color: '#a855f7', // Purple / Roxo Real
            accentColor: 'purple',
            badgeBg: 'bg-purple-950/80',
            badgeBorder: 'border-purple-500/60',
            badgeText: 'text-purple-300',
            description: 'Aliados, vilões, eremitas e contatos no mundo de Hecos.',
            viewType: 'entities'
          },
          {
            id: 'organizacoes',
            name: 'Organizações',
            categoryKey: 'organization',
            subcategory: 'Organizações',
            icon: Shield,
            color: '#d946ef', // Fuchsia / Magenta Nobre
            accentColor: 'fuchsia',
            badgeBg: 'bg-fuchsia-950/80',
            badgeBorder: 'border-fuchsia-500/60',
            badgeText: 'text-fuchsia-300',
            description: 'Guildas, ordens místicas, cultos do sol e governos.',
            viewType: 'entities'
          },
          {
            id: 'timeline',
            name: 'Timeline',
            categoryKey: 'timeline',
            subcategory: 'Timeline',
            icon: History,
            color: '#14b8a6', // Teal / Turquesa Ancestral
            accentColor: 'teal',
            badgeBg: 'bg-teal-950/80',
            badgeBorder: 'border-teal-500/60',
            badgeText: 'text-teal-300',
            description: 'História do mundo, eras cósmicas e cronologia de eventos.',
            viewType: 'timeline'
          }
        ]
      },
      {
        id: 'mecanicas',
        name: 'Mecânicas',
        items: [
          {
            id: 'ancestralidades',
            name: 'Ancestralidades',
            categoryKey: 'ancestry',
            subcategory: 'Ancestralidades',
            icon: Dna,
            color: '#f97316', // Orange / Laranja Étnico
            accentColor: 'orange',
            badgeBg: 'bg-orange-950/80',
            badgeBorder: 'border-orange-500/60',
            badgeText: 'text-orange-300',
            description: 'Povos nativos de Hecos e suas linhagens culturais.',
            viewType: 'entities'
          },
          {
            id: 'arquetipos',
            name: 'Arquétipo / Vocação',
            categoryKey: 'archetype',
            subcategory: 'Arquétipos',
            icon: Layers,
            color: '#8b5cf6', // Violet / Violeta Profundo
            accentColor: 'violet',
            badgeBg: 'bg-violet-950/80',
            badgeBorder: 'border-violet-500/60',
            badgeText: 'text-violet-300',
            description: 'Arquétipos desbloqueados por quests/treinadores e Vocações com progressão linear (Níveis 1, 3, 6, 9, 12, 15, 18).',
            viewType: 'entities'
          },
          {
            id: 'classes',
            name: 'Classes',
            categoryKey: 'class',
            subcategory: 'Classes',
            icon: Swords,
            color: '#6366f1', // Indigo / Índigo Místico
            accentColor: 'indigo',
            badgeBg: 'bg-indigo-950/80',
            badgeBorder: 'border-indigo-500/60',
            badgeText: 'text-indigo-300',
            description: 'Classes adaptadas de Pathfinder 2e e suas disciplinas.',
            viewType: 'entities'
          },
          {
            id: 'feiticos',
            name: 'Feitiços',
            categoryKey: 'spell',
            subcategory: 'Feitiços',
            icon: Sparkles,
            color: '#ec4899', // Pink / Rosa Arcano
            accentColor: 'pink',
            badgeBg: 'bg-pink-950/80',
            badgeBorder: 'border-pink-500/60',
            badgeText: 'text-pink-300',
            description: 'Grimório de magias das tradições Cinética, Etérea, Biológica, Abiótica e Omni.',
            viewType: 'entities'
          },
          {
            id: 'itens',
            name: 'Itens',
            categoryKey: 'item',
            subcategory: 'Itens',
            icon: Gem,
            color: '#f59e0b', // Amber / Âmbar Forjado
            accentColor: 'amber',
            badgeBg: 'bg-amber-950/80',
            badgeBorder: 'border-amber-500/60',
            badgeText: 'text-amber-300',
            description: 'Artefatos do eclipse, armas rúnicas, poções e tesouros.',
            viewType: 'entities'
          },
          {
            id: 'perigos',
            name: 'Perigos',
            categoryKey: 'creature',
            subcategory: 'Perigos',
            icon: Skull,
            color: '#ef4444', // Red / Vermelho Carmesim
            accentColor: 'red',
            badgeBg: 'bg-red-950/80',
            badgeBorder: 'border-red-500/60',
            badgeText: 'text-red-300',
            description: 'Bestiário, monstros, armadilhas, hazards e perigos ambientais de Hecos.',
            viewType: 'entities'
          },
          {
            id: 'quests',
            name: 'Quests',
            categoryKey: 'quest',
            subcategory: 'Quests',
            icon: CheckSquare,
            color: '#eab308', // Gold Yellow / Amarelo Ouro
            accentColor: 'yellow',
            badgeBg: 'bg-yellow-950/80',
            badgeBorder: 'border-yellow-500/60',
            badgeText: 'text-yellow-300',
            description: 'Quadro Kanban de missões ativas, contratos, objetivos e recompensas.',
            viewType: 'quests'
          },
          {
            id: 'regras',
            name: 'Regras',
            categoryKey: 'rule',
            subcategory: 'Regras',
            icon: Scroll,
            color: '#94a3b8', // Slate / Prata
            accentColor: 'slate',
            badgeBg: 'bg-slate-900/80',
            badgeBorder: 'border-slate-500/60',
            badgeText: 'text-slate-300',
            description: 'Regras da casa, sistema de 3 ações e mecânicas de Hecos.',
            viewType: 'entities'
          },
          {
            id: 'talentos',
            name: 'Talentos',
            categoryKey: 'feat',
            subcategory: 'Talentos',
            icon: Award,
            color: '#d97706', // Amber-Dark / Ouro Velho
            accentColor: 'amber',
            badgeBg: 'bg-amber-950/80',
            badgeBorder: 'border-amber-600/60',
            badgeText: 'text-amber-300',
            description: 'Talentos de ancestralidade, classe, perícia e gerais.',
            viewType: 'entities'
          }
        ]
      }
    ],
    // Kept for backwards-compatibility helper methods
    children: [
      {
        id: 'fauna',
        name: 'Fauna',
        categoryKey: 'fauna',
        subcategory: 'Fauna',
        icon: PawPrint,
        color: '#10b981',
        accentColor: 'emerald',
        badgeBg: 'bg-emerald-950/80',
        badgeBorder: 'border-emerald-500/60',
        badgeText: 'text-emerald-300',
        description: 'Animais silvestres, corvos de vidro e bestas do lago.',
        viewType: 'entities'
      },
      {
        id: 'flora',
        name: 'Flora',
        categoryKey: 'flora',
        subcategory: 'Flora',
        icon: Flower2,
        color: '#84cc16',
        accentColor: 'lime',
        badgeBg: 'bg-lime-950/80',
        badgeBorder: 'border-lime-500/60',
        badgeText: 'text-lime-300',
        description: 'Ervas medicinais, fungos luminescentes e plantas carnívoras.',
        viewType: 'entities'
      },
      {
        id: 'locais',
        name: 'Locais',
        categoryKey: 'location',
        subcategory: 'Locais',
        icon: Compass,
        color: '#3b82f6',
        accentColor: 'blue',
        badgeBg: 'bg-blue-950/80',
        badgeBorder: 'border-blue-500/60',
        badgeText: 'text-blue-300',
        description: 'Geografia, santuários, cidades de obsidiana e masmorras.',
        viewType: 'entities'
      },
      {
        id: 'npc',
        name: 'NPC',
        categoryKey: 'npc',
        subcategory: 'NPC',
        icon: User,
        color: '#a855f7',
        accentColor: 'purple',
        badgeBg: 'bg-purple-950/80',
        badgeBorder: 'border-purple-500/60',
        badgeText: 'text-purple-300',
        description: 'Aliados, vilões, eremitas e contatos no mundo de Hecos.',
        viewType: 'entities'
      },
      {
        id: 'organizacoes',
        name: 'Organizações',
        categoryKey: 'organization',
        subcategory: 'Organizações',
        icon: Shield,
        color: '#d946ef',
        accentColor: 'fuchsia',
        badgeBg: 'bg-fuchsia-950/80',
        badgeBorder: 'border-fuchsia-500/60',
        badgeText: 'text-fuchsia-300',
        description: 'Guildas, ordens místicas, cultos do sol e governos.',
        viewType: 'entities'
      },
      {
        id: 'timeline',
        name: 'Timeline',
        categoryKey: 'timeline',
        subcategory: 'Timeline',
        icon: History,
        color: '#14b8a6',
        accentColor: 'teal',
        badgeBg: 'bg-teal-950/80',
        badgeBorder: 'border-teal-500/60',
        badgeText: 'text-teal-300',
        description: 'História do mundo, eras cósmicas e cronologia de eventos.',
        viewType: 'timeline'
      },
      {
        id: 'ancestralidades',
        name: 'Ancestralidades',
        categoryKey: 'ancestry',
        subcategory: 'Ancestralidades',
        icon: Dna,
        color: '#f97316',
        accentColor: 'orange',
        badgeBg: 'bg-orange-950/80',
        badgeBorder: 'border-orange-500/60',
        badgeText: 'text-orange-300',
        description: 'Povos nativos de Hecos e suas linhagens culturais.',
        viewType: 'entities'
      },
      {
        id: 'arquetipos',
        name: 'Arquétipo / Vocação',
        categoryKey: 'archetype',
        subcategory: 'Arquétipos',
        icon: Layers,
        color: '#8b5cf6',
        accentColor: 'violet',
        badgeBg: 'bg-violet-950/80',
        badgeBorder: 'border-violet-500/60',
        badgeText: 'text-violet-300',
        description: 'Arquétipos desbloqueados por quests/treinadores e Vocações com progressão linear (Níveis 1, 3, 6, 9, 12, 15, 18).',
        viewType: 'entities'
      },
      {
        id: 'classes',
        name: 'Classes',
        categoryKey: 'class',
        subcategory: 'Classes',
        icon: Swords,
        color: '#6366f1',
        accentColor: 'indigo',
        badgeBg: 'bg-indigo-950/80',
        badgeBorder: 'border-indigo-500/60',
        badgeText: 'text-indigo-300',
        description: 'Classes adaptadas de Pathfinder 2e e suas disciplinas.',
        viewType: 'entities'
      },
      {
        id: 'feiticos',
        name: 'Feitiços',
        categoryKey: 'spell',
        subcategory: 'Feitiços',
        icon: Sparkles,
        color: '#ec4899',
        accentColor: 'pink',
        badgeBg: 'bg-pink-950/80',
        badgeBorder: 'border-pink-500/60',
        badgeText: 'text-pink-300',
        description: 'Grimório de magias das tradições Cinética, Etérea, Biológica, Abiótica e Omni.',
        viewType: 'entities'
      },
      {
        id: 'itens',
        name: 'Itens',
        categoryKey: 'item',
        subcategory: 'Itens',
        icon: Gem,
        color: '#f59e0b',
        accentColor: 'amber',
        badgeBg: 'bg-amber-950/80',
        badgeBorder: 'border-amber-500/60',
        badgeText: 'text-amber-300',
        description: 'Artefatos do eclipse, armas rúnicas, poções e tesouros.',
        viewType: 'entities'
      },
      {
        id: 'perigos',
        name: 'Perigos',
        categoryKey: 'creature',
        subcategory: 'Perigos',
        icon: Skull,
        color: '#ef4444',
        accentColor: 'red',
        badgeBg: 'bg-red-950/80',
        badgeBorder: 'border-red-500/60',
        badgeText: 'text-red-300',
        description: 'Bestiário, monstros, armadilhas, hazards e perigos ambientais de Hecos.',
        viewType: 'entities'
      },
      {
        id: 'quests',
        name: 'Quests',
        categoryKey: 'quest',
        subcategory: 'Quests',
        icon: CheckSquare,
        color: '#eab308',
        accentColor: 'yellow',
        badgeBg: 'bg-yellow-950/80',
        badgeBorder: 'border-yellow-500/60',
        badgeText: 'text-yellow-300',
        description: 'Quadro Kanban de missões ativas, contratos, objetivos e recompensas.',
        viewType: 'quests'
      },
      {
        id: 'regras',
        name: 'Regras',
        categoryKey: 'rule',
        subcategory: 'Regras',
        icon: Scroll,
        color: '#94a3b8',
        accentColor: 'slate',
        badgeBg: 'bg-slate-900/80',
        badgeBorder: 'border-slate-500/60',
        badgeText: 'text-slate-300',
        description: 'Regras da casa, sistema de 3 ações e mecânicas de Hecos.',
        viewType: 'entities'
      },
      {
        id: 'talentos',
        name: 'Talentos',
        categoryKey: 'feat',
        subcategory: 'Talentos',
        icon: Award,
        color: '#d97706',
        accentColor: 'amber',
        badgeBg: 'bg-amber-950/80',
        badgeBorder: 'border-amber-600/60',
        badgeText: 'text-amber-300',
        description: 'Talentos de ancestralidade, classe, perícia e gerais.',
        viewType: 'entities'
      }
    ]
  },
  {
    id: 'diario',
    name: 'Diário',
    categoryKey: 'session',
    icon: BookOpen,
    color: '#0ea5e9', // Ocean Sky Blue
    accentColor: 'sky',
    badgeBg: 'bg-sky-950/80',
    badgeBorder: 'border-sky-500/60',
    badgeText: 'text-sky-300',
    description: 'Registros cronológicos das sessões, XP, loot e acontecimentos.',
    viewType: 'entities'
  },
  {
    id: 'gm-notes',
    name: 'Notas do GM',
    categoryKey: 'gm_note',
    icon: Lock,
    color: '#e11d48', // Ruby Rose
    accentColor: 'rose',
    badgeBg: 'bg-rose-950/80',
    badgeBorder: 'border-rose-500/60',
    badgeText: 'text-rose-300',
    description: 'Segredos, tramas, tabelas de encontros e revelações protegidas.',
    viewType: 'entities'
  },
  {
    id: 'mapa',
    name: 'Mapa',
    icon: MapIcon,
    color: '#0284c7', // Deep Blue
    accentColor: 'blue',
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-500/60',
    badgeText: 'text-blue-300',
    description: 'Explorador cartográfico interativo de Hecos com pins clicáveis.',
    viewType: 'map'
  },
  {
    id: 'tags',
    name: 'Tags',
    icon: TagIcon,
    color: '#9333ea', // Deep Purple
    accentColor: 'purple',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-500/60',
    badgeText: 'text-purple-300',
    description: 'Navegação por palavras-chave e conexões temáticas.',
    viewType: 'tags'
  }
];

export function getCategoryMeta(keyOrId?: string, subcategory?: string) {
  if (!keyOrId && !subcategory) {
    return {
      name: 'Codex',
      color: '#cb8394',
      accentColor: 'bordo',
      icon: BookMarked,
      description: 'Enciclopédia de Hecos'
    };
  }

  for (const def of CATEGORY_DEFINITIONS) {
    if (def.id === keyOrId || def.categoryKey === keyOrId) return def;
    if (def.children) {
      for (const child of def.children) {
        if (
          child.id === keyOrId ||
          child.categoryKey === keyOrId ||
          (subcategory && child.subcategory === subcategory)
        ) {
          return child;
        }
      }
    }
  }

  // Clean fallback in case raw keys/ids are passed
  const cleaned = (keyOrId || subcategory || 'Entidade')
    .replace(/^menu-/, '')
    .replace(/^codex-/, '');

  const labelMap: Record<string, string> = {
    pc: 'PC',
    npc: 'NPC',
    codex: 'Codex',
    creature: 'Perigos',
    criaturas: 'Perigos',
    peril: 'Perigos',
    perils: 'Perigos',
    perigos: 'Perigos',
    perigo: 'Perigos',
    spell: 'Feitiços',
    feiticos: 'Feitiços',
    item: 'Itens',
    itens: 'Itens',
    location: 'Locais',
    locais: 'Locais',
    fauna: 'Fauna',
    flora: 'Flora',
    organization: 'Organizações',
    organizacoes: 'Organizações',
    ancestry: 'Ancestralidades',
    ancestralidades: 'Ancestralidades',
    class: 'Classes',
    classes: 'Classes',
    archetype: 'Arquétipo / Vocação',
    arquetipos: 'Arquétipo / Vocação',
    arquetipo: 'Arquétipo / Vocação',
    vocacao: 'Arquétipo / Vocação',
    vocação: 'Arquétipo / Vocação',
    vocacoes: 'Arquétipo / Vocação',
    vocações: 'Arquétipo / Vocação',
    vocation: 'Arquétipo / Vocação',
    session: 'Diário',
    diario: 'Diário',
    gm_note: 'Notas do GM',
    'gm-notes': 'Notas do GM',
    feat: 'Talentos',
    talentos: 'Talentos',
    rule: 'Regras',
    regras: 'Regras',
    timeline: 'Timeline',
    map: 'Mapa',
    mapa: 'Mapa',
    tags: 'Tags'
  };

  const colorMap: Record<string, { color: string; accentColor: string; icon: any }> = {
    pc: { color: '#38bdf8', accentColor: 'sky', icon: Users },
    npc: { color: '#a855f7', accentColor: 'purple', icon: User },
    codex: { color: '#a78bfa', accentColor: 'violet', icon: BookMarked },
    creature: { color: '#ef4444', accentColor: 'red', icon: Skull },
    criaturas: { color: '#ef4444', accentColor: 'red', icon: Skull },
    peril: { color: '#ef4444', accentColor: 'red', icon: Skull },
    perils: { color: '#ef4444', accentColor: 'red', icon: Skull },
    perigos: { color: '#ef4444', accentColor: 'red', icon: Skull },
    perigo: { color: '#ef4444', accentColor: 'red', icon: Skull },
    spell: { color: '#ec4899', accentColor: 'pink', icon: Sparkles },
    feiticos: { color: '#ec4899', accentColor: 'pink', icon: Sparkles },
    item: { color: '#f59e0b', accentColor: 'amber', icon: Gem },
    itens: { color: '#f59e0b', accentColor: 'amber', icon: Gem },
    location: { color: '#3b82f6', accentColor: 'blue', icon: Compass },
    locais: { color: '#3b82f6', accentColor: 'blue', icon: Compass },
    fauna: { color: '#10b981', accentColor: 'emerald', icon: PawPrint },
    flora: { color: '#84cc16', accentColor: 'lime', icon: Flower2 },
    organization: { color: '#d946ef', accentColor: 'fuchsia', icon: Shield },
    organizacoes: { color: '#d946ef', accentColor: 'fuchsia', icon: Shield },
    ancestry: { color: '#f97316', accentColor: 'orange', icon: Dna },
    ancestralidades: { color: '#f97316', accentColor: 'orange', icon: Dna },
    class: { color: '#6366f1', accentColor: 'indigo', icon: Swords },
    classes: { color: '#6366f1', accentColor: 'indigo', icon: Swords },
    archetype: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    arquetipos: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    arquetipo: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    vocacao: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    vocação: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    vocacoes: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    vocações: { color: '#8b5cf6', accentColor: 'violet', icon: Layers },
    session: { color: '#0ea5e9', accentColor: 'sky', icon: BookOpen },
    diario: { color: '#0ea5e9', accentColor: 'sky', icon: BookOpen },
    gm_note: { color: '#e11d48', accentColor: 'rose', icon: Lock },
    'gm-notes': { color: '#e11d48', accentColor: 'rose', icon: Lock },
    quest: { color: '#eab308', accentColor: 'yellow', icon: CheckSquare },
    quests: { color: '#eab308', accentColor: 'yellow', icon: CheckSquare },
    missoes: { color: '#eab308', accentColor: 'yellow', icon: CheckSquare },
    feat: { color: '#d97706', accentColor: 'amber', icon: Award },
    talentos: { color: '#d97706', accentColor: 'amber', icon: Award },
    rule: { color: '#94a3b8', accentColor: 'slate', icon: Scroll },
    regras: { color: '#94a3b8', accentColor: 'slate', icon: Scroll },
    timeline: { color: '#14b8a6', accentColor: 'teal', icon: History },
    map: { color: '#0284c7', accentColor: 'blue', icon: MapIcon },
    mapa: { color: '#0284c7', accentColor: 'blue', icon: MapIcon },
    tags: { color: '#9333ea', accentColor: 'purple', icon: TagIcon }
  };

  const name = labelMap[cleaned] || cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const metaStyle = colorMap[cleaned.toLowerCase()] || { color: '#38bdf8', accentColor: 'sky', icon: BookOpen };

  return {
    id: cleaned.toLowerCase(),
    name,
    color: metaStyle.color,
    accentColor: metaStyle.accentColor,
    icon: metaStyle.icon,
    description: ''
  };
}

export function getCategoryTheme(keyOrId?: string, subcategory?: string) {
  const meta = getCategoryMeta(keyOrId, subcategory);
  const color = meta.color;
  const accent = meta.accentColor;

  // Pre-computed Tailwind class sets per category accent
  const themeMap: Record<
    string,
    {
      textAccent: string;
      textHover: string;
      bgAccent: string;
      bgMuted: string;
      borderAccent: string;
      borderHover: string;
      badgeBg: string;
      badgeBorder: string;
      badgeText: string;
      btnBg: string;
      activeTab: string;
      glow: string;
      hoverGlow: string;
      ringColor: string;
    }
  > = {
    sky: {
      textAccent: 'text-sky-400',
      textHover: 'hover:text-sky-300',
      bgAccent: 'bg-sky-500',
      bgMuted: 'bg-sky-950/80',
      borderAccent: 'border-sky-700/60',
      borderHover: 'hover:border-sky-500/80',
      badgeBg: 'bg-sky-950/80',
      badgeBorder: 'border-sky-500/60',
      badgeText: 'text-sky-300',
      btnBg: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-zinc-950',
      activeTab: 'bg-sky-500 text-zinc-950 font-black shadow-md shadow-sky-500/25',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(56,189,248,0.35)]',
      ringColor: 'ring-sky-400/40',
    },
    emerald: {
      textAccent: 'text-emerald-400',
      textHover: 'hover:text-emerald-300',
      bgAccent: 'bg-emerald-500',
      bgMuted: 'bg-emerald-950/80',
      borderAccent: 'border-emerald-700/60',
      borderHover: 'hover:border-emerald-500/80',
      badgeBg: 'bg-emerald-950/80',
      badgeBorder: 'border-emerald-500/60',
      badgeText: 'text-emerald-300',
      btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950',
      activeTab: 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/25',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]',
      ringColor: 'ring-emerald-400/40',
    },
    lime: {
      textAccent: 'text-lime-400',
      textHover: 'hover:text-lime-300',
      bgAccent: 'bg-lime-500',
      bgMuted: 'bg-lime-950/80',
      borderAccent: 'border-lime-700/60',
      borderHover: 'hover:border-lime-500/80',
      badgeBg: 'bg-lime-950/80',
      badgeBorder: 'border-lime-500/60',
      badgeText: 'text-lime-300',
      btnBg: 'bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-zinc-950',
      activeTab: 'bg-lime-500 text-zinc-950 font-black shadow-md shadow-lime-500/25',
      glow: 'shadow-[0_0_20px_rgba(132,204,22,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(132,204,22,0.35)]',
      ringColor: 'ring-lime-400/40',
    },
    blue: {
      textAccent: 'text-blue-400',
      textHover: 'hover:text-blue-300',
      bgAccent: 'bg-blue-500',
      bgMuted: 'bg-blue-950/80',
      borderAccent: 'border-blue-700/60',
      borderHover: 'hover:border-blue-500/80',
      badgeBg: 'bg-blue-950/80',
      badgeBorder: 'border-blue-500/60',
      badgeText: 'text-blue-300',
      btnBg: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-zinc-950',
      activeTab: 'bg-blue-500 text-zinc-950 font-black shadow-md shadow-blue-500/25',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.35)]',
      ringColor: 'ring-blue-400/40',
    },
    purple: {
      textAccent: 'text-purple-400',
      textHover: 'hover:text-purple-300',
      bgAccent: 'bg-purple-500',
      bgMuted: 'bg-purple-950/80',
      borderAccent: 'border-purple-700/60',
      borderHover: 'hover:border-purple-500/80',
      badgeBg: 'bg-purple-950/80',
      badgeBorder: 'border-purple-500/60',
      badgeText: 'text-purple-300',
      btnBg: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-zinc-950',
      activeTab: 'bg-purple-500 text-zinc-950 font-black shadow-md shadow-purple-500/25',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.35)]',
      ringColor: 'ring-purple-400/40',
    },
    fuchsia: {
      textAccent: 'text-fuchsia-400',
      textHover: 'hover:text-fuchsia-300',
      bgAccent: 'bg-fuchsia-500',
      bgMuted: 'bg-fuchsia-950/80',
      borderAccent: 'border-fuchsia-700/60',
      borderHover: 'hover:border-fuchsia-500/80',
      badgeBg: 'bg-fuchsia-950/80',
      badgeBorder: 'border-fuchsia-500/60',
      badgeText: 'text-fuchsia-300',
      btnBg: 'bg-gradient-to-r from-fuchsia-500 to-rose-600 hover:from-fuchsia-400 hover:to-rose-500 text-zinc-950',
      activeTab: 'bg-fuchsia-500 text-zinc-950 font-black shadow-md shadow-fuchsia-500/25',
      glow: 'shadow-[0_0_20px_rgba(217,70,239,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(217,70,239,0.35)]',
      ringColor: 'ring-fuchsia-400/40',
    },
    teal: {
      textAccent: 'text-teal-400',
      textHover: 'hover:text-teal-300',
      bgAccent: 'bg-teal-500',
      bgMuted: 'bg-teal-950/80',
      borderAccent: 'border-teal-700/60',
      borderHover: 'hover:border-teal-500/80',
      badgeBg: 'bg-teal-950/80',
      badgeBorder: 'border-teal-500/60',
      badgeText: 'text-teal-300',
      btnBg: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-zinc-950',
      activeTab: 'bg-teal-500 text-zinc-950 font-black shadow-md shadow-teal-500/25',
      glow: 'shadow-[0_0_20px_rgba(20,184,166,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(20,184,166,0.35)]',
      ringColor: 'ring-teal-400/40',
    },
    orange: {
      textAccent: 'text-orange-400',
      textHover: 'hover:text-orange-300',
      bgAccent: 'bg-orange-500',
      bgMuted: 'bg-orange-950/80',
      borderAccent: 'border-orange-700/60',
      borderHover: 'hover:border-orange-500/80',
      badgeBg: 'bg-orange-950/80',
      badgeBorder: 'border-orange-500/60',
      badgeText: 'text-orange-300',
      btnBg: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-zinc-950',
      activeTab: 'bg-orange-500 text-zinc-950 font-black shadow-md shadow-orange-500/25',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]',
      ringColor: 'ring-orange-400/40',
    },
    indigo: {
      textAccent: 'text-indigo-400',
      textHover: 'hover:text-indigo-300',
      bgAccent: 'bg-indigo-500',
      bgMuted: 'bg-indigo-950/80',
      borderAccent: 'border-indigo-700/60',
      borderHover: 'hover:border-indigo-500/80',
      badgeBg: 'bg-indigo-950/80',
      badgeBorder: 'border-indigo-500/60',
      badgeText: 'text-indigo-300',
      btnBg: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-zinc-950',
      activeTab: 'bg-indigo-500 text-zinc-950 font-black shadow-md shadow-indigo-500/25',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]',
      ringColor: 'ring-indigo-400/40',
    },
    pink: {
      textAccent: 'text-pink-400',
      textHover: 'hover:text-pink-300',
      bgAccent: 'bg-pink-500',
      bgMuted: 'bg-pink-950/80',
      borderAccent: 'border-pink-700/60',
      borderHover: 'hover:border-pink-500/80',
      badgeBg: 'bg-pink-950/80',
      badgeBorder: 'border-pink-500/60',
      badgeText: 'text-pink-300',
      btnBg: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-zinc-950',
      activeTab: 'bg-pink-500 text-zinc-950 font-black shadow-md shadow-pink-500/25',
      glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(236,72,153,0.35)]',
      ringColor: 'ring-pink-400/40',
    },
    amber: {
      textAccent: 'text-amber-400',
      textHover: 'hover:text-amber-300',
      bgAccent: 'bg-amber-500',
      bgMuted: 'bg-amber-950/80',
      borderAccent: 'border-amber-700/60',
      borderHover: 'hover:border-amber-500/80',
      badgeBg: 'bg-amber-950/80',
      badgeBorder: 'border-amber-500/60',
      badgeText: 'text-amber-300',
      btnBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950',
      activeTab: 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/25',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      ringColor: 'ring-amber-400/40',
    },
    red: {
      textAccent: 'text-rose-400',
      textHover: 'hover:text-rose-300',
      bgAccent: 'bg-rose-500',
      bgMuted: 'bg-rose-950/80',
      borderAccent: 'border-rose-700/60',
      borderHover: 'hover:border-rose-500/80',
      badgeBg: 'bg-rose-950/80',
      badgeBorder: 'border-rose-500/60',
      badgeText: 'text-rose-300',
      btnBg: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-zinc-950',
      activeTab: 'bg-rose-500 text-zinc-950 font-black shadow-md shadow-rose-500/25',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.35)]',
      ringColor: 'ring-rose-400/40',
    },
    rose: {
      textAccent: 'text-rose-400',
      textHover: 'hover:text-rose-300',
      bgAccent: 'bg-rose-500',
      bgMuted: 'bg-rose-950/80',
      borderAccent: 'border-rose-700/60',
      borderHover: 'hover:border-rose-500/80',
      badgeBg: 'bg-rose-950/80',
      badgeBorder: 'border-rose-500/60',
      badgeText: 'text-rose-300',
      btnBg: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-zinc-950',
      activeTab: 'bg-rose-500 text-zinc-950 font-black shadow-md shadow-rose-500/25',
      glow: 'shadow-[0_0_20px_rgba(225,29,72,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(225,29,72,0.35)]',
      ringColor: 'ring-rose-400/40',
    },
    yellow: {
      textAccent: 'text-yellow-400',
      textHover: 'hover:text-yellow-300',
      bgAccent: 'bg-yellow-500',
      bgMuted: 'bg-yellow-950/80',
      borderAccent: 'border-yellow-700/60',
      borderHover: 'hover:border-yellow-500/80',
      badgeBg: 'bg-yellow-950/80',
      badgeBorder: 'border-yellow-500/60',
      badgeText: 'text-yellow-300',
      btnBg: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-zinc-950',
      activeTab: 'bg-yellow-500 text-zinc-950 font-black shadow-md shadow-yellow-500/25',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.35)]',
      ringColor: 'ring-yellow-400/40',
    },
    slate: {
      textAccent: 'text-slate-300',
      textHover: 'hover:text-slate-200',
      bgAccent: 'bg-slate-500',
      bgMuted: 'bg-slate-900/80',
      borderAccent: 'border-slate-700/60',
      borderHover: 'hover:border-slate-500/80',
      badgeBg: 'bg-slate-900/80',
      badgeBorder: 'border-slate-500/60',
      badgeText: 'text-slate-300',
      btnBg: 'bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-zinc-100',
      activeTab: 'bg-slate-400 text-zinc-950 font-black shadow-md shadow-slate-400/25',
      glow: 'shadow-[0_0_20px_rgba(148,163,184,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(148,163,184,0.35)]',
      ringColor: 'ring-slate-400/40',
    },
    violet: {
      textAccent: 'text-violet-400',
      textHover: 'hover:text-violet-300',
      bgAccent: 'bg-violet-500',
      bgMuted: 'bg-violet-950/80',
      borderAccent: 'border-violet-700/60',
      borderHover: 'hover:border-violet-500/80',
      badgeBg: 'bg-violet-950/80',
      badgeBorder: 'border-violet-500/60',
      badgeText: 'text-violet-300',
      btnBg: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-zinc-950',
      activeTab: 'bg-violet-500 text-zinc-950 font-black shadow-md shadow-violet-500/25',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]',
      ringColor: 'ring-violet-400/40',
    },
    cyan: {
      textAccent: 'text-cyan-400',
      textHover: 'hover:text-cyan-300',
      bgAccent: 'bg-cyan-500',
      bgMuted: 'bg-cyan-950/80',
      borderAccent: 'border-cyan-700/60',
      borderHover: 'hover:border-cyan-500/80',
      badgeBg: 'bg-cyan-950/80',
      badgeBorder: 'border-cyan-500/60',
      badgeText: 'text-cyan-300',
      btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950',
      activeTab: 'bg-cyan-500 text-zinc-950 font-black shadow-md shadow-cyan-500/25',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]',
      ringColor: 'ring-cyan-400/40',
    }
  };

  const defaultTheme = themeMap.cyan;
  const categoryId = 'id' in meta ? meta.id : keyOrId;
  const theme = themeMap[accent] || (categoryId && themeMap[categoryId]) || defaultTheme;

  return {
    meta,
    color,
    accent,
    ...theme,
  };
}

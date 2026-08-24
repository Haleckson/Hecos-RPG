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
  color: string; // Tailwind color class or hex
  accentColor: string; // 'malva' | 'ciano' | 'bordo'
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
    color: '#74b6c2', // pastel slate-cyan
    accentColor: 'ciano',
    description: 'Fichas, histórico e evolução dos Personagens dos Jogadores.',
    viewType: 'entities'
  },
  {
    id: 'codex',
    name: 'Codex',
    icon: BookMarked,
    color: '#cb8394', // pastel dusty rose / bordô
    accentColor: 'bordo',
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
            color: '#7eb897', // pastel sage
            accentColor: 'bordo',
            description: 'Animais silvestres, corvos de vidro e bestas do lago.',
            viewType: 'entities'
          },
          {
            id: 'flora',
            name: 'Flora',
            categoryKey: 'flora',
            subcategory: 'Flora',
            icon: Flower2,
            color: '#7eb897', // pastel sage
            accentColor: 'malva',
            description: 'Ervas medicinais, fungos luminescentes e plantas carnívoras.',
            viewType: 'entities'
          },
          {
            id: 'locais',
            name: 'Locais',
            categoryKey: 'location',
            subcategory: 'Locais',
            icon: Compass,
            color: '#74b6c2', // pastel slate-cyan
            accentColor: 'ciano',
            description: 'Geografia, santuários, cidades de obsidiana e masmorras.',
            viewType: 'entities'
          },
          {
            id: 'npc',
            name: 'NPC',
            categoryKey: 'npc',
            subcategory: 'NPC',
            icon: User,
            color: '#b19ecc', // pastel wisteria / malva
            accentColor: 'malva',
            description: 'Aliados, vilões, eremitas e contatos no mundo de Hecos.',
            viewType: 'entities'
          },
          {
            id: 'organizacoes',
            name: 'Organizações',
            categoryKey: 'organization',
            subcategory: 'Organizações',
            icon: Shield,
            color: '#cb8394', // pastel dusty rose
            accentColor: 'bordo',
            description: 'Guildas, ordens místicas, cultos do sol e governos.',
            viewType: 'entities'
          },
          {
            id: 'timeline',
            name: 'Timeline',
            categoryKey: 'timeline',
            subcategory: 'Timeline',
            icon: History,
            color: '#b19ecc', // pastel wisteria
            accentColor: 'malva',
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
            color: '#74b6c2', // pastel slate-cyan
            accentColor: 'ciano',
            description: 'Povos nativos de Hecos e suas linhagens culturais.',
            viewType: 'entities'
          },
          {
            id: 'classes',
            name: 'Classes',
            categoryKey: 'class',
            subcategory: 'Classes',
            icon: Swords,
            color: '#b19ecc', // pastel wisteria
            accentColor: 'malva',
            description: 'Classes adaptadas de Pathfinder 2e e suas disciplinas.',
            viewType: 'entities'
          },
          {
            id: 'feiticos',
            name: 'Feitiços',
            categoryKey: 'spell',
            subcategory: 'Feitiços',
            icon: Sparkles,
            color: '#74b6c2', // pastel slate-cyan
            accentColor: 'ciano',
            description: 'Grimório de magias arcanas, divinas, ocultas e primais.',
            viewType: 'entities'
          },
          {
            id: 'itens',
            name: 'Itens',
            categoryKey: 'item',
            subcategory: 'Itens',
            icon: Gem,
            color: '#cca862', // pastel antique gold
            accentColor: 'malva',
            description: 'Artefatos do eclipse, armas rúnicas, poções e tesouros.',
            viewType: 'entities'
          },
          {
            id: 'perigos',
            name: 'Perigos',
            categoryKey: 'creature',
            subcategory: 'Perigos',
            icon: Skull,
            color: '#cb8394', // pastel dusty rose
            accentColor: 'bordo',
            description: 'Bestiário, monstros, armadilhas, hazards e perigos ambientais de Hecos.',
            viewType: 'entities'
          },
          {
            id: 'quests',
            name: 'Quests',
            categoryKey: 'quest',
            subcategory: 'Quests',
            icon: CheckSquare,
            color: '#cca862', // pastel gold
            accentColor: 'malva',
            description: 'Quadro Kanban de missões ativas, contratos, objetivos e recompensas.',
            viewType: 'quests'
          },
          {
            id: 'regras',
            name: 'Regras',
            categoryKey: 'rule',
            subcategory: 'Regras',
            icon: Scroll,
            color: '#74b6c2', // pastel slate-cyan
            accentColor: 'ciano',
            description: 'Regras da casa, sistema de 3 ações e mecânicas de Hecos.',
            viewType: 'entities'
          },
          {
            id: 'talentos',
            name: 'Talentos',
            categoryKey: 'feat',
            subcategory: 'Talentos',
            icon: Award,
            color: '#cca862', // pastel antique gold
            accentColor: 'malva',
            description: 'Talentos de ancestralidade, classe, perícia e gerais.',
            viewType: 'entities'
          },
          {
            id: 'arquetipos',
            name: 'Vocação',
            categoryKey: 'archetype',
            subcategory: 'Vocação',
            icon: Layers,
            color: '#cb8394', // pastel dusty rose
            accentColor: 'bordo',
            description: 'Dedicações, vocações e caminhos de prestígio no cenário.',
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
        color: '#7eb897',
        accentColor: 'bordo',
        description: 'Animais silvestres, corvos de vidro e bestas do lago.',
        viewType: 'entities'
      },
      {
        id: 'flora',
        name: 'Flora',
        categoryKey: 'flora',
        subcategory: 'Flora',
        icon: Flower2,
        color: '#7eb897',
        accentColor: 'malva',
        description: 'Ervas medicinais, fungos luminescentes e plantas carnívoras.',
        viewType: 'entities'
      },
      {
        id: 'locais',
        name: 'Locais',
        categoryKey: 'location',
        subcategory: 'Locais',
        icon: Compass,
        color: '#74b6c2',
        accentColor: 'ciano',
        description: 'Geografia, santuários, cidades de obsidiana e masmorras.',
        viewType: 'entities'
      },
      {
        id: 'npc',
        name: 'NPC',
        categoryKey: 'npc',
        subcategory: 'NPC',
        icon: User,
        color: '#b19ecc',
        accentColor: 'malva',
        description: 'Aliados, vilões, eremitas e contatos no mundo de Hecos.',
        viewType: 'entities'
      },
      {
        id: 'organizacoes',
        name: 'Organizações',
        categoryKey: 'organization',
        subcategory: 'Organizações',
        icon: Shield,
        color: '#cb8394',
        accentColor: 'bordo',
        description: 'Guildas, ordens místicas, cultos do sol e governos.',
        viewType: 'entities'
      },
      {
        id: 'timeline',
        name: 'Timeline',
        categoryKey: 'timeline',
        subcategory: 'Timeline',
        icon: History,
        color: '#b19ecc',
        accentColor: 'malva',
        description: 'História do mundo, eras cósmicas e cronologia de eventos.',
        viewType: 'timeline'
      },
      {
        id: 'ancestralidades',
        name: 'Ancestralidades',
        categoryKey: 'ancestry',
        subcategory: 'Ancestralidades',
        icon: Dna,
        color: '#74b6c2',
        accentColor: 'ciano',
        description: 'Povos nativos de Hecos e suas linhagens culturais.',
        viewType: 'entities'
      },
      {
        id: 'classes',
        name: 'Classes',
        categoryKey: 'class',
        subcategory: 'Classes',
        icon: Swords,
        color: '#b19ecc',
        accentColor: 'malva',
        description: 'Classes adaptadas de Pathfinder 2e e suas disciplinas.',
        viewType: 'entities'
      },
      {
        id: 'feiticos',
        name: 'Feitiços',
        categoryKey: 'spell',
        subcategory: 'Feitiços',
        icon: Sparkles,
        color: '#74b6c2',
        accentColor: 'ciano',
        description: 'Grimório de magias arcanas, divinas, ocultas e primais.',
        viewType: 'entities'
      },
      {
        id: 'itens',
        name: 'Itens',
        categoryKey: 'item',
        subcategory: 'Itens',
        icon: Gem,
        color: '#cca862',
        accentColor: 'malva',
        description: 'Artefatos do eclipse, armas rúnicas, poções e tesouros.',
        viewType: 'entities'
      },
      {
        id: 'perigos',
        name: 'Perigos',
        categoryKey: 'creature',
        subcategory: 'Perigos',
        icon: Skull,
        color: '#cb8394',
        accentColor: 'bordo',
        description: 'Bestiário, monstros, armadilhas, hazards e perigos ambientais de Hecos.',
        viewType: 'entities'
      },
      {
        id: 'quests',
        name: 'Quests',
        categoryKey: 'quest',
        subcategory: 'Quests',
        icon: CheckSquare,
        color: '#cca862',
        accentColor: 'malva',
        description: 'Quadro Kanban de missões ativas, contratos, objetivos e recompensas.',
        viewType: 'quests'
      },
      {
        id: 'regras',
        name: 'Regras',
        categoryKey: 'rule',
        subcategory: 'Regras',
        icon: Scroll,
        color: '#74b6c2',
        accentColor: 'ciano',
        description: 'Regras da casa, sistema de 3 ações e mecânicas de Hecos.',
        viewType: 'entities'
      },
      {
        id: 'talentos',
        name: 'Talentos',
        categoryKey: 'feat',
        subcategory: 'Talentos',
        icon: Award,
        color: '#cca862',
        accentColor: 'malva',
        description: 'Talentos de ancestralidade, classe, perícia e gerais.',
        viewType: 'entities'
      },
      {
        id: 'arquetipos',
        name: 'Vocação',
        categoryKey: 'archetype',
        subcategory: 'Vocação',
        icon: Layers,
        color: '#cb8394',
        accentColor: 'bordo',
        description: 'Dedicações, vocações e caminhos de prestígio no cenário.',
        viewType: 'entities'
      }
    ]
  },
  {
    id: 'diario',
    name: 'Diário',
    categoryKey: 'session',
    icon: BookOpen,
    color: '#74b6c2', // pastel slate-cyan
    accentColor: 'ciano',
    description: 'Registros cronológicos das sessões, XP, loot e acontecimentos.',
    viewType: 'entities'
  },
  {
    id: 'gm-notes',
    name: 'Notas do GM',
    categoryKey: 'gm_note',
    icon: Lock,
    color: '#cb8394', // pastel dusty rose
    accentColor: 'bordo',
    description: 'Segredos, tramas, tabelas de encontros e revelações protegidas.',
    viewType: 'entities'
  },
  {
    id: 'mapa',
    name: 'Mapa',
    icon: MapIcon,
    color: '#74b6c2', // pastel slate-cyan
    accentColor: 'ciano',
    description: 'Explorador cartográfico interativo de Hecos com pins clicáveis.',
    viewType: 'map'
  },
  {
    id: 'tags',
    name: 'Tags',
    icon: TagIcon,
    color: '#b19ecc', // pastel wisteria
    accentColor: 'malva',
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
    archetype: 'Vocação',
    arquetipos: 'Vocação',
    arquetipo: 'Vocação',
    vocacao: 'Vocação',
    vocação: 'Vocação',
    vocacoes: 'Vocação',
    vocações: 'Vocação',
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

  const name = labelMap[cleaned] || cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  return {
    name,
    color: '#74b6c2',
    accentColor: 'ciano',
    icon: BookOpen,
    description: ''
  };
}

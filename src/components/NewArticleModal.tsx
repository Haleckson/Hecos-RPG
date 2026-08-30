import React, { useState, useMemo } from 'react';
import { EntityCategory } from '../types';
import {
  X,
  Search,
  Dna,
  User,
  Users,
  Skull,
  Shield,
  Swords,
  Layers,
  Sparkles,
  Gem,
  Compass,
  Flower2,
  BookOpen,
  Scroll,
  Lock,
  Clock,
  ArrowRight,
  Plus,
  CheckSquare,
  PawPrint,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CategoryOption {
  category: EntityCategory;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  suggestedTags: string[];
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    category: 'pc',
    name: 'PC',
    badge: 'Herói do Grupo',
    description: 'Fichas completas de jogadores, histórico de campanha, habilidades e inventário pessoal.',
    icon: Users,
    color: '#38bdf8', // Sky Blue
    suggestedTags: ['pc', 'jogador', 'heroi'],
  },
  {
    category: 'fauna',
    name: 'Fauna',
    badge: 'Ecossistema',
    description: 'Espécies animais, montarias, predadores e criaturas nativas dos biomas de Hecos.',
    icon: PawPrint,
    color: '#10b981', // Emerald
    suggestedTags: ['fauna', 'animais', 'bioma'],
  },
  {
    category: 'flora',
    name: 'Flora',
    badge: 'Reagentes & Ervas',
    description: 'Plantas curativas, fungos bioluminescentes, venenos naturais e árvores sagradas.',
    icon: Flower2,
    color: '#84cc16', // Lime
    suggestedTags: ['flora', 'alquimia', 'ervas'],
  },
  {
    category: 'location',
    name: 'Locais',
    badge: 'Geografia & Mapa',
    description: 'Cidades, masmorras, ruínas antigas, assentamentos e pontos de interesse do mapa.',
    icon: Compass,
    color: '#3b82f6', // Blue
    suggestedTags: ['local', 'mapa', 'regiao'],
  },
  {
    category: 'npc',
    name: 'NPC',
    badge: 'Narrativa',
    description: 'Mentores, aliados, patronos, nobres e contatos importantes do mestre na história.',
    icon: User,
    color: '#a855f7', // Purple
    suggestedTags: ['npc', 'mestre', 'contato'],
  },
  {
    category: 'organization',
    name: 'Organizações',
    badge: 'Poder & Política',
    description: 'Guildas de ladrões, governos, ordens de cavalaria, seitas e corporações comerciais.',
    icon: Shield,
    color: '#d946ef', // Fuchsia
    suggestedTags: ['faccao', 'politica', 'guilda'],
  },
  {
    category: 'timeline',
    name: 'Timeline',
    badge: 'História & Eras',
    description: 'Eventos históricos, quedas de impérios, tratados e momentos decisivos de Hecos.',
    icon: Clock,
    color: '#14b8a6', // Teal
    suggestedTags: ['timeline', 'historia', 'era'],
  },
  {
    category: 'ancestry',
    name: 'Ancestralidades',
    badge: 'Hecos Pattern',
    description: 'Raças, linhagens, heranças culturais, arsenal tradicional e progressão de talentos por ranks.',
    icon: Dna,
    color: '#f97316', // Orange
    suggestedTags: ['ancestry', 'humanoide'],
  },
  {
    category: 'class',
    name: 'Classes',
    badge: 'Classe Base',
    description: 'Classes principais de Hecos, progressão de nível, dados de vida, perícias e proficiências.',
    icon: Swords,
    color: '#6366f1', // Indigo
    suggestedTags: ['classe', 'combate', 'evolucao'],
  },
  {
    category: 'spell',
    name: 'Feitiços',
    badge: 'Tradições Arcanas',
    description: 'Feitiços arcanos, divinos, ocultos e primais com tempo de conjuração e graus de sucesso.',
    icon: Sparkles,
    color: '#ec4899', // Pink
    suggestedTags: ['magia', 'spell', 'oculto'],
  },
  {
    category: 'item',
    name: 'Itens',
    badge: 'Tesouro & Relíquia',
    description: 'Armas raras, armaduras, consumíveis, artefatos mágicos e itens de sobrevivência.',
    icon: Gem,
    color: '#f59e0b', // Amber
    suggestedTags: ['item', 'equipamento', 'tesouro'],
  },
  {
    category: 'creature',
    name: 'Perigos',
    badge: 'Perigo / Monstro',
    description: 'Monstros, perigos simples ou complexos, assombrações e ameaças de combate com revelação campo a campo.',
    icon: Skull,
    color: '#ef4444', // Red
    suggestedTags: ['perigo', 'monstro', 'combate'],
  },
  {
    category: 'quest',
    name: 'Quests',
    badge: 'Kanban & Contratos',
    description: 'Contratos de aventura, rumores, objetivos em etapas, recompensas e rastreador Kanban de progresso.',
    icon: CheckSquare,
    color: '#eab308', // Gold Yellow
    suggestedTags: ['quest', 'missao', 'contrato'],
  },
  {
    category: 'rule',
    name: 'Regras',
    badge: 'Guia de Jogo',
    description: 'Regras da casa, modificadores de campanha, mecânicas personalizadas e guias de jogo.',
    icon: Scroll,
    color: '#94a3b8', // Slate
    suggestedTags: ['regras', 'sistema', 'hecos'],
  },
  {
    category: 'feat',
    name: 'Talentos',
    badge: 'Mecânica Hecos',
    description: 'Talentos gerais, de ancestralidade, perícia ou talentos adicionais do sistema.',
    icon: Award,
    color: '#d97706', // Amber-Dark
    suggestedTags: ['talento', 'feat'],
  },
  {
    category: 'archetype',
    name: 'Vocação',
    badge: 'Dedicação & Prestígio',
    description: 'Vocações do cenário de Hecos, caminhos arcanos, ordens marciais e dedicações de prestígio.',
    icon: Layers,
    color: '#8b5cf6', // Violet
    suggestedTags: ['vocacao', 'arquetipo', 'dedicacao'],
  },
  {
    category: 'session',
    name: 'Diário',
    badge: 'Crônica da Campanha',
    description: 'Resumos narrativos das sessões, diários de viagem, recompensas e marcos da aventura.',
    icon: BookOpen,
    color: '#0ea5e9', // Ocean Sky
    suggestedTags: ['sessao', 'diario', 'cronica'],
  },
  {
    category: 'gm_note',
    name: 'Notas do GM',
    badge: 'Confidencial (Mestre)',
    description: 'Segredos da trama, planejamento futuro, ganchos e revelações ocultas dos jogadores.',
    icon: Lock,
    color: '#e11d48', // Ruby Rose
    suggestedTags: ['gm-only', 'segredo', 'mestre'],
  },
];

interface NewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (category: EntityCategory, customTitle?: string) => void;
  defaultCategory?: EntityCategory;
}

export const NewArticleModal: React.FC<NewArticleModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return CATEGORY_OPTIONS;
    const term = searchTerm.toLowerCase().trim();
    return CATEGORY_OPTIONS.filter(
      (opt) =>
        opt.name.toLowerCase().includes(term) ||
        opt.description.toLowerCase().includes(term) ||
        opt.badge.toLowerCase().includes(term) ||
        opt.category.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelect = (category: EntityCategory) => {
    onCreate(category, initialTitle.trim() || undefined);
    setInitialTitle('');
    setSearchTerm('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#0c0915] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#120e20] border-b border-zinc-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 text-cyan-300">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                  <span>Criar Novo Artigo no Codex</span>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Seletor de Categoria
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Escolha o tipo de entrada para iniciar com a estrutura correta.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Optional Initial Title Bar */}
          <div className="p-4 bg-black/40 border-b border-zinc-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 shrink-0">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar categorias (ex: PC, Fauna, Perigos, Magia)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-6 relative">
              <input
                type="text"
                value={initialTitle}
                onChange={(e) => setInitialTitle(e.target.value)}
                placeholder="Nome/Título inicial (opcional)..."
                className="w-full px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Categories Grid Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isHovered = hoveredCategory === opt.category;

                return (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => handleSelect(opt.category)}
                    onMouseEnter={() => setHoveredCategory(opt.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      borderColor: isHovered ? opt.color : `${opt.color}35`,
                      backgroundColor: isHovered ? `${opt.color}12` : `${opt.color}06`,
                      boxShadow: isHovered ? `0 0 24px ${opt.color}25` : 'none'
                    }}
                    className="group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all text-left cursor-pointer"
                  >
                    <div
                      style={{
                        backgroundColor: isHovered ? `${opt.color}30` : `${opt.color}18`,
                        borderColor: isHovered ? opt.color : `${opt.color}50`,
                        color: opt.color
                      }}
                      className="p-2.5 rounded-xl border transition-all shrink-0"
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          style={{ color: isHovered ? opt.color : '#f4f4f5' }}
                          className="text-sm font-bold transition-colors truncate"
                        >
                          {opt.name}
                        </h4>
                        <span
                          style={{
                            backgroundColor: `${opt.color}18`,
                            color: opt.color,
                            borderColor: `${opt.color}40`
                          }}
                          className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border shrink-0"
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="self-center pl-1 shrink-0">
                      <ArrowRight
                        style={{ color: opt.color }}
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredOptions.length === 0 && (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <Search className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm">Nenhuma categoria encontrada com "{searchTerm}".</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Limpar busca
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3.5 bg-[#0a0812] border-t border-zinc-800 text-[11px] text-zinc-500 flex flex-wrap items-center justify-between gap-2">
            <span>Você pode alternar ou mover categorias a qualquer momento no editor.</span>
            <span className="font-mono text-zinc-400">Pressione ESC para fechar</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


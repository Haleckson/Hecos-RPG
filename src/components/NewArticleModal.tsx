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
  Zap,
  Sparkles,
  Gem,
  Compass,
  TreePine,
  Flower2,
  Building2,
  BookOpen,
  Scroll,
  Lock,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CategoryOption {
  category: EntityCategory;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorTheme: 'cyan' | 'purple' | 'rose' | 'amber' | 'emerald';
  suggestedTags: string[];
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    category: 'ancestry',
    name: 'Ancestralidade',
    badge: 'PF2e Hecos Pattern',
    description: 'Raças, linhagens, heranças culturais, arsenal tradicional e progressão de talentos por ranks.',
    icon: Dna,
    colorTheme: 'cyan',
    suggestedTags: ['ancestry', 'pf2e', 'humanoide'],
  },
  {
    category: 'pc',
    name: 'Personagem Jogador (PC)',
    badge: 'Herói do Grupo',
    description: 'Fichas completas de jogadores, histórico de campanha, habilidades e inventário pessoal.',
    icon: Users,
    colorTheme: 'cyan',
    suggestedTags: ['pc', 'jogador', 'heroi'],
  },
  {
    category: 'npc',
    name: 'NPC / Contato',
    badge: 'Narrativa',
    description: 'Mentores, aliados, patronos, nobres e contatos importantes do mestre na história.',
    icon: User,
    colorTheme: 'purple',
    suggestedTags: ['npc', 'mestre', 'contato'],
  },
  {
    category: 'creature',
    name: 'Monstro / Criatura',
    badge: 'Ameaça PF2e',
    description: 'Bestas, aberrações, mortos-vivos e chefes de combate com ficha completa de statblock.',
    icon: Skull,
    colorTheme: 'rose',
    suggestedTags: ['monstro', 'pf2e', 'combate'],
  },
  {
    category: 'class',
    name: 'Classe & Arquétipo',
    badge: 'Regras de Evolução',
    description: 'Classes originais de Hecos, caminhos marciais e arquétipos de dedicação.',
    icon: Shield,
    colorTheme: 'purple',
    suggestedTags: ['classe', 'arquetipo', 'pf2e'],
  },
  {
    category: 'feat',
    name: 'Talento (Feat)',
    badge: 'Mecânica PF2e',
    description: 'Talentos gerais, perícias especiais ou talentos adicionais do sistema.',
    icon: Zap,
    colorTheme: 'purple',
    suggestedTags: ['talento', 'feat', 'pf2e'],
  },
  {
    category: 'spell',
    name: 'Magia & Ritual',
    badge: 'Tradições Arcanas',
    description: 'Feitiços arcanos, divinos, ocultos e primais com tempo de conjuração e graus de sucesso.',
    icon: Sparkles,
    colorTheme: 'cyan',
    suggestedTags: ['magia', 'spell', 'oculto'],
  },
  {
    category: 'item',
    name: 'Item & Equipamento',
    badge: 'Tesouro & Relíquia',
    description: 'Armas raras, armaduras, consumíveis, artefatos mágicos e itens de sobrevivência.',
    icon: Gem,
    colorTheme: 'purple',
    suggestedTags: ['item', 'equipamento', 'tesouro'],
  },
  {
    category: 'location',
    name: 'Local / Região',
    badge: 'Geografia & Mapa',
    description: 'Cidades, masmorras, ruínas antigas, assentamentos e pontos de interesse do mapa.',
    icon: Compass,
    colorTheme: 'cyan',
    suggestedTags: ['local', 'mapa', 'regiao'],
  },
  {
    category: 'fauna',
    name: 'Fauna Selvagem',
    badge: 'Ecossistema',
    description: 'Espécies animais, montarias, predadores e criaturas nativas dos biomas de Hecos.',
    icon: TreePine,
    colorTheme: 'rose',
    suggestedTags: ['fauna', 'animais', 'bioma'],
  },
  {
    category: 'flora',
    name: 'Flora & Alquimia',
    badge: 'Reagentes & Ervas',
    description: 'Plantas curativas, fungos bioluminescentes, venenos naturais e árvores sagradas.',
    icon: Flower2,
    colorTheme: 'purple',
    suggestedTags: ['flora', 'alquimia', 'ervas'],
  },
  {
    category: 'organization',
    name: 'Facção & Organização',
    badge: 'Poder & Política',
    description: 'Guildas de ladrões, governos, ordens de cavalaria, seitas e corporações comerciais.',
    icon: Building2,
    colorTheme: 'rose',
    suggestedTags: ['faccao', 'politica', 'guilda'],
  },
  {
    category: 'rule',
    name: 'Regra da Casa / Sistema',
    badge: 'Guia de Jogo',
    description: 'Regras da casa, modificadores de campanha, mecânicas personalizadas e guias de jogo.',
    icon: Scroll,
    colorTheme: 'cyan',
    suggestedTags: ['regras', 'sistema', 'pf2e'],
  },
  {
    category: 'session',
    name: 'Diário de Sessão',
    badge: 'Crônica da Campanha',
    description: 'Resumos narrativos das sessões, diários de viagem, recompensas e marcos da aventura.',
    icon: BookOpen,
    colorTheme: 'purple',
    suggestedTags: ['sessao', 'diario', 'cronica'],
  },
  {
    category: 'gm_note',
    name: 'Nota Secreta do GM',
    badge: 'Confidencial (Mestre)',
    description: 'Segredos da trama, planejamento futuro, ganchos e revelações ocultas dos jogadores.',
    icon: Lock,
    colorTheme: 'rose',
    suggestedTags: ['gm-only', 'segredo', 'mestre'],
  },
  {
    category: 'timeline',
    name: 'Marco da Linha do Tempo',
    badge: 'História & Eras',
    description: 'Eventos históricos, quedas de impérios, tratados e momentos decisivos de Hecos.',
    icon: Clock,
    colorTheme: 'purple',
    suggestedTags: ['timeline', 'historia', 'era'],
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

  const getThemeClasses = (theme: CategoryOption['colorTheme']) => {
    switch (theme) {
      case 'cyan':
        return {
          card: 'border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-b from-[#100f1c] to-[#0a0812] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]',
          badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
          iconBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 group-hover:bg-cyan-900/80 group-hover:border-cyan-400',
          title: 'group-hover:text-cyan-200',
          arrow: 'text-cyan-400 group-hover:translate-x-1',
        };
      case 'purple':
        return {
          card: 'border-purple-500/30 hover:border-purple-400 bg-gradient-to-b from-[#120d1e] to-[#0a0812] hover:shadow-[0_0_25px_rgba(184,119,219,0.2)]',
          badge: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
          iconBg: 'bg-purple-950/60 text-purple-300 border-purple-500/40 group-hover:bg-purple-900/80 group-hover:border-purple-400',
          title: 'group-hover:text-purple-200',
          arrow: 'text-purple-400 group-hover:translate-x-1',
        };
      case 'rose':
      default:
        return {
          card: 'border-rose-500/30 hover:border-rose-400 bg-gradient-to-b from-[#150d18] to-[#0a0812] hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
          iconBg: 'bg-rose-950/60 text-rose-300 border-rose-500/40 group-hover:bg-rose-900/80 group-hover:border-rose-400',
          title: 'group-hover:text-rose-200',
          arrow: 'text-rose-400 group-hover:translate-x-1',
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0915] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#120e20] border-b border-zinc-800 flex items-center justify-between gap-4">
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
          <div className="p-5 bg-black/40 border-b border-zinc-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar categorias (ex: Ancestralidade, Magia, Monstro)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-6 relative">
              <input
                type="text"
                value={initialTitle}
                onChange={(e) => setInitialTitle(e.target.value)}
                placeholder="Nome/Título inicial (opcional)..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Categories Grid Container */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredOptions.map((opt) => {
                const IconComponent = opt.icon;
                const theme = getThemeClasses(opt.colorTheme);

                return (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => handleSelect(opt.category)}
                    className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer ${theme.card}`}
                  >
                    <div className={`p-2.5 rounded-xl border transition-all shrink-0 ${theme.iconBg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-bold text-zinc-100 transition-colors truncate ${theme.title}`}>
                          {opt.name}
                        </h4>
                        <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${theme.badge}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="self-center pl-1 shrink-0">
                      <ArrowRight className={`w-4 h-4 transition-transform ${theme.arrow}`} />
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

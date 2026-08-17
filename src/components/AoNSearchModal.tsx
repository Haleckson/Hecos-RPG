import React, { useState, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
  Award,
  Skull,
  ShieldAlert,
  Gem,
  UserCheck,
  Layers,
  Flame,
  Zap,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AON_BASE_URL,
  AON_CATEGORIES,
  AON_POPULAR_TOPICS,
  getAoNSearchUrl,
  openAoNSearch,
} from '../services/aon';

interface AoNSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AoNSearchModal: React.FC<AoNSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      openAoNSearch(query, selectedCategory !== 'all' ? selectedCategory : undefined);
    } else {
      openAoNSearch('', selectedCategory !== 'all' ? selectedCategory : undefined);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Award':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'Skull':
        return <Skull className="w-4 h-4 text-rose-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'Gem':
        return <Gem className="w-4 h-4 text-blue-400" />;
      case 'UserCheck':
        return <UserCheck className="w-4 h-4 text-indigo-400" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-teal-400" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Search className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-3xl bg-[#0d0a15] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#130e1f] border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Archives of Nethys (PF2e)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    2e.aonprd.com
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Referência oficial de regras, ações, feitiços, monstros e talentos de Pathfinder 2e
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="p-6 border-b border-zinc-800/80 bg-[#09070e]">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar regra, magia, monstro, perícia ou condição (ex: Grapple, Dying, Shield Block)..."
                autoFocus
                className="w-full pl-12 pr-28 py-3.5 bg-black/70 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Buscar AoN</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2">
              <span className="text-[11px] font-semibold text-zinc-500 mr-1">Seção:</span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                Todas as Regras
              </button>
              {AON_CATEGORIES.slice(1, 8).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-purple-950 text-purple-300 border border-purple-600'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </form>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Launch AoN Hubs */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Navegar por Seções Oficiais</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {AON_CATEGORIES.map((cat) => (
                  <a
                    key={cat.id}
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#110e1a] border border-zinc-800/80 hover:border-cyan-500/50 hover:bg-[#151122] transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-black/60 border border-zinc-800 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(cat.iconName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
                          {cat.name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400" />
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Popular Topics and Quick Queries */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Tópicos Rápidos Mais Consultados</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {AON_POPULAR_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => openAoNSearch(topic.query, topic.category)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-zinc-300 hover:text-amber-200 text-xs transition-all cursor-pointer"
                  >
                    <span>{topic.label}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="px-6 py-3 bg-[#110e1a] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Conteúdo oficial provido por Paizo Inc. via Archives of Nethys</span>
            <a
              href={AON_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Abrir 2e.aonprd.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

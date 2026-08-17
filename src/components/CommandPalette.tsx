import React, { useState, useEffect, useRef } from 'react';
import { HecosStorage } from '../services/storage';
import { HecosEntity, EntityCategory } from '../types';
import {
  Search,
  Users,
  User,
  Skull,
  Sparkles,
  Gem,
  Compass,
  BookOpen,
  Lock,
  Scroll,
  History,
  Tag as TagIcon,
  X,
  ArrowRight,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const entities = HecosStorage.getEntities();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Filter entities based on query and category
  const filtered = entities.filter((entity) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'codex' &&
        ['creature', 'spell', 'item', 'location', 'fauna', 'flora', 'organization'].includes(entity.category)) ||
      entity.category === selectedCategory;

    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesText =
      entity.title.toLowerCase().includes(q) ||
      (entity.subtitle && entity.subtitle.toLowerCase().includes(q)) ||
      (entity.summary && entity.summary.toLowerCase().includes(q)) ||
      entity.tags.some((t) => t.toLowerCase().includes(q)) ||
      entity.content.toLowerCase().includes(q);

    return matchesCategory && matchesText;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      onSelectEntity(filtered[selectedIndex].id);
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const getEntityIcon = (cat: EntityCategory) => {
    switch (cat) {
      case 'pc': return <Users className="w-4 h-4 text-cyan-400" />;
      case 'npc': return <User className="w-4 h-4 text-purple-400" />;
      case 'creature': return <Skull className="w-4 h-4 text-rose-500" />;
      case 'spell': return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'item': return <Gem className="w-4 h-4 text-purple-400" />;
      case 'location': return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'gm_note': return <Lock className="w-4 h-4 text-rose-500" />;
      case 'session': return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'rule': return <Scroll className="w-4 h-4 text-purple-400" />;
      case 'timeline': return <History className="w-4 h-4 text-rose-400" />;
      default: return <BookOpen className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl bg-[#0e0c15] border border-zinc-700/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-[#141020]">
              <Search className="w-5 h-5 text-cyan-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar em Hecos (ex: Salgueiro, Devorador, Nível 4, @feitico)..."
                className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-base focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-mono">
                  ESC para sair
                </span>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-[#09080d] border-b border-zinc-800/80 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'Tudo' },
                { id: 'pc', label: 'PCs' },
                { id: 'npc', label: 'NPCs' },
                { id: 'codex', label: 'Codex' },
                { id: 'session', label: 'Diário' },
                { id: 'rule', label: 'Regras' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'gm_note', label: 'Notas GM' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCategory === tab.id
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-900/60">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  Nenhum termo ou artigo encontrado para "{query}".
                </div>
              ) : (
                filtered.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectEntity(item.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-transparent border border-cyan-700/60 text-zinc-100 shadow-md'
                          : 'hover:bg-zinc-900/50 text-zinc-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-lg bg-black/60 border border-zinc-800">
                          {getEntityIcon(item.category)}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {item.category}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-100 truncate">
                              {item.title}
                            </h4>
                          </div>
                          {item.subtitle && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-zinc-800 text-zinc-400"
                          >
                            #{t}
                          </span>
                        ))}
                        <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-zinc-600'} transition-transform`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Quick Keys */}
            <div className="px-4 py-2.5 bg-[#09080d] border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Navegue com ↑ ↓ e pressione Enter</span>
              <span className="text-zinc-400 font-medium">{filtered.length} resultados</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

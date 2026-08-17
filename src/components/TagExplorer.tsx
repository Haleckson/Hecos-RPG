import React, { useState } from 'react';
import { HecosStorage } from '../services/storage';
import { TagInfo, HecosEntity } from '../types';
import { Tag as TagIcon, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface TagExplorerProps {
  onNavigateEntity: (id: string) => void;
  initialSelectedTag?: string;
}

export const TagExplorer: React.FC<TagExplorerProps> = ({
  onNavigateEntity,
  initialSelectedTag,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(initialSelectedTag || null);

  const tags = HecosStorage.getAllTags();
  const allEntities = HecosStorage.getEntities();

  const matchingEntities = selectedTag
    ? allEntities.filter((e) =>
        e.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      )
    : [];

  return (
    <div className="bg-[#09080d] text-zinc-100 rounded-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2.5">
          <TagIcon className="w-6 h-6 text-cyan-400" />
          <span>Explorador de Tags & Conexões</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Navegue por tópicos transversais, elementos de cenário e marcadores de regras.
        </p>
      </div>

      {/* Tag Cloud */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTag === tag.name;
          return (
            <button
              key={tag.name}
              onClick={() => setSelectedTag(isSelected ? null : tag.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-[#120f1b] hover:bg-purple-950/60 text-zinc-300 hover:text-purple-300 border border-zinc-800'
              }`}
            >
              <span>#{tag.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-zinc-900 text-cyan-300' : 'bg-black/60 text-zinc-500'
                }`}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Matching Entities List */}
      {selectedTag && (
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <span>Artigos com a tag</span>
            <span className="text-cyan-400 font-mono">#{selectedTag}</span>
            <span className="text-xs text-zinc-500">({matchingEntities.length} encontrados)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matchingEntities.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigateEntity(item.id)}
                className="flex items-start justify-between p-4 rounded-xl bg-[#110e19] hover:bg-[#181324] border border-zinc-800/80 hover:border-cyan-500/50 text-left transition-all group shadow-md"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-purple-400 font-mono">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 line-clamp-1">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs text-zinc-400 line-clamp-1">{item.subtitle}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-2 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

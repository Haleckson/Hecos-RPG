import React, { useState } from 'react';
import { HecosEntity, TimelineEventAttributes } from '../types';
import { HecosStorage } from '../services/storage';
import { renderContentWithMentions } from './MentionBadge';
import { History, Plus, Calendar, Sparkles, AlertCircle, Bookmark } from 'lucide-react';

interface TimelineViewProps {
  onNavigateEntity: (id: string) => void;
  onNewEntity: (category: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onNavigateEntity, onNewEntity }) => {
  const [selectedImportance, setSelectedImportance] = useState<string>('all');

  const allEntities = HecosStorage.getEntities();
  const timelineEntities = allEntities
    .filter((e) => e.category === 'timeline')
    .sort((a, b) => {
      const orderA = a.timelineData?.order || 0;
      const orderB = b.timelineData?.order || 0;
      return orderA - orderB;
    });

  const filtered = timelineEntities.filter((e) => {
    if (selectedImportance === 'all') return true;
    return e.timelineData?.importance === selectedImportance;
  });

  return (
    <div className="bg-[#09080d] text-zinc-100 rounded-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2.5">
            <History className="w-6 h-6 text-purple-400" />
            <span>Cronologia & Linha do Tempo de Hecos</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            As grandes eras, eclipses ancestrais e marcos históricos que moldaram o cenário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Importance filters */}
          <div className="flex items-center bg-black/60 rounded-lg p-0.5 border border-zinc-800 text-xs">
            {[
              { id: 'all', label: 'Todas Eras' },
              { id: 'cosmic', label: 'Cósmicos' },
              { id: 'major', label: 'Maiores' },
              { id: 'minor', label: 'Locais' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedImportance(f.id)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  selectedImportance === f.id
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNewEntity('timeline')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(184,119,219,0.3)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Evento Histórico</span>
          </button>
        </div>
      </div>

      {/* Vertical Timeline Graph */}
      <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-purple-500 before:to-rose-600">
        {filtered.map((item, idx) => {
          const imp = item.timelineData?.importance || 'major';
          const badgeColor =
            imp === 'cosmic'
              ? 'bg-rose-950/80 text-rose-300 border-rose-700'
              : imp === 'major'
              ? 'bg-purple-950/80 text-purple-300 border-purple-700'
              : 'bg-cyan-950/80 text-cyan-300 border-cyan-700';

          return (
            <div key={item.id} className="relative group">
              {/* Node dot on timeline */}
              <div
                className={`absolute -left-6 sm:-left-10 top-1.5 w-4 h-4 rounded-full border-2 border-[#09080d] ${
                  imp === 'cosmic'
                    ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                    : imp === 'major'
                    ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]'
                    : 'bg-cyan-400 shadow-[0_0_10px_#06b6d4]'
                }`}
              />

              {/* Event Box */}
              <div
                onClick={() => onNavigateEntity(item.id)}
                className="p-5 rounded-2xl bg-[#110e19] border border-zinc-800/80 hover:border-purple-500/50 transition-all cursor-pointer shadow-lg space-y-2 group-hover:bg-[#161222]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-black/60 border border-zinc-800">
                      {item.timelineData?.year || 'Data Desconhecida'}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      {item.timelineData?.era || 'Era Primordial'}
                    </span>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                    {imp.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {renderContentWithMentions(item.content, onNavigateEntity)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

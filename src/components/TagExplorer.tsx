import React, { useState } from 'react';
import { HecosStorage } from '../services/storage';
import { TagInfo, HecosEntity } from '../types';
import { Tag as TagIcon, ArrowRight, Shield, Award, Sparkles, Filter, Plus, Edit2, Trash2 } from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { TraitModal } from './TraitModal';
import { TagModal } from './TagModal';

interface TagExplorerProps {
  onNavigateEntity: (id: string) => void;
  initialSelectedTag?: string;
  isGmMode?: boolean;
}

// Helper function to safely extract traits regardless of whether they are arrays or comma-separated strings
function extractEntityTraits(ent: HecosEntity): string[] {
  const result = new Set<string>();

  const add = (val: unknown) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
          result.add(item.trim());
        }
      });
    } else if (typeof val === 'string') {
      val.split(',').forEach((item) => {
        const trimmed = item.trim();
        if (trimmed) result.add(trimmed);
      });
    }
  };

  add(ent.traits);
  add(ent.statblock?.traits);
  add(ent.spellData?.traits);
  add(ent.featData?.traits);
  if (ent.ancestryData?.traits) add(ent.ancestryData.traits);
  if (ent.itemData?.traits) add(ent.itemData.traits);
  if (ent.perilData?.traits) add(ent.perilData.traits);

  // Raridade tratada globalmente como Traço PF2e
  if (ent.featData?.rarity) add(ent.featData.rarity);
  if (ent.spellData?.rarity) add(ent.spellData.rarity);
  if (ent.itemData?.rarity) add(ent.itemData.rarity);
  if (ent.perilData?.rarity) add(ent.perilData.rarity);
  if (ent.classData?.rarity) add(ent.classData.rarity);

  return Array.from(result);
}

export const TagExplorer: React.FC<TagExplorerProps> = ({
  onNavigateEntity,
  initialSelectedTag,
  isGmMode,
}) => {
  const [activeTab, setActiveTab] = useState<'tags' | 'traits'>('tags');
  const [selectedTag, setSelectedTag] = useState<string | null>(initialSelectedTag || null);
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);

  // Modals state
  const [traitModalOpen, setTraitModalOpen] = useState(false);
  const [editingTraitName, setEditingTraitName] = useState<string | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = Boolean(isGmMode || currentUser?.role === 'gm');

  const allEntities = HecosStorage.getEntities();
  // Filter entities according to user permissions
  const accessibleEntities = allEntities.filter((e) =>
    HecosStorage.canUserAccessItem(e, currentUser)
  );

  // Compute dynamic tags based on accessible entities
  const tagCounts: Record<string, number> = {};
  // Compute dynamic traits from entity.traits, statblock traits, spell traits, feat traits
  const traitCounts: Record<string, number> = {};

  accessibleEntities.forEach((ent) => {
    (ent.tags || []).forEach((t) => {
      const clean = typeof t === 'string' ? t.trim() : '';
      if (clean) {
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      }
    });

    // Traits collection
    const entTraits = extractEntityTraits(ent);
    entTraits.forEach((tr) => {
      if (tr) {
        traitCounts[tr] = (traitCounts[tr] || 0) + 1;
      }
    });
  });

  const tags: TagInfo[] = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const traits: TagInfo[] = Object.entries(traitCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const matchingEntities =
    activeTab === 'tags'
      ? selectedTag
        ? accessibleEntities.filter((e) =>
            (e.tags || []).some(
              (t) => typeof t === 'string' && t.toLowerCase() === selectedTag.toLowerCase()
            )
          )
        : []
      : selectedTrait
      ? accessibleEntities.filter((e) => {
          const list = extractEntityTraits(e);
          return list.some((tr) => tr.toLowerCase() === selectedTrait.toLowerCase());
        })
      : [];

  const tagFolderPerm = HecosStorage.getFolderPermission('tags');

  return (
    <div key={refreshKey} className="bg-[#09080d] text-zinc-100 rounded-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2.5">
              <TagIcon className="w-6 h-6 text-cyan-400" />
              <span>Explorador de Tags & Traços (Traits)</span>
            </h2>
            {isActualGm && (
              <VisibilityBadgeMenu
                visibility={tagFolderPerm.visibility}
                allowedUserIds={tagFolderPerm.allowedUserIds}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setFolderPermission('tags', newVis, newAllowed);
                }}
              />
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Navegue por tópicos de narrativa (Tags) e palavras-chave de regras oficiais PF2e (Traços).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher: Tags vs Traits */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#120e1e] border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tags'
                  ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Tags ({tags.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('traits')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'traits'
                  ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Traços PF2e ({traits.length})</span>
            </button>
          </div>

          {/* Action buttons for GM: New Trait */}
          {activeTab === 'traits' && (
            <button
              type="button"
              onClick={() => {
                setEditingTraitName(null);
                setTraitModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 text-amber-300 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Traço</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Content */}
      {activeTab === 'tags' ? (
        tags.length === 0 ? (
          <div className="p-8 text-center bg-[#110e19] rounded-xl border border-zinc-800 text-zinc-400 text-xs">
            Nenhuma tag encontrada nos artigos autorizados para o seu perfil.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag.name;
              return (
                <div
                  key={tag.name}
                  className={`inline-flex items-center rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                      : 'bg-[#120f1b] hover:bg-purple-950/60 text-zinc-300 hover:text-purple-300 border-zinc-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
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

                  {/* Edit / Delete Tag Icon for GM */}
                  {isActualGm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTagName(tag.name);
                        setTagModalOpen(true);
                      }}
                      className="pr-2 pl-1 py-1 text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Gerenciar Tag"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : traits.length === 0 ? (
        <div className="p-8 text-center bg-[#110e19] rounded-xl border border-zinc-800 text-zinc-400 text-xs">
          Nenhum traço de mecânica PF2e registrado nos artigos ainda.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {traits.map((tr) => {
            const isSelected = selectedTrait === tr.name;
            return (
              <div
                key={tr.name}
                className={`inline-flex items-center rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                    : 'bg-[#161122] hover:bg-amber-950/40 text-amber-200 hover:text-amber-100 border-amber-900/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTrait(isSelected ? null : tr.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wide uppercase cursor-pointer"
                >
                  <span>{tr.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-zinc-900 text-amber-300' : 'bg-black/60 text-amber-400/70'
                    }`}
                  >
                    {tr.count}
                  </span>
                </button>

                {/* Edit / Delete Trait button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTraitName(tr.name);
                    setTraitModalOpen(true);
                  }}
                  className="pr-2 pl-1 py-1 text-amber-400/70 hover:text-amber-100 transition-colors cursor-pointer"
                  title="Editar ou Excluir Traço"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Matching Entities List */}
      {(selectedTag || selectedTrait) && (
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <span>Artigos correspondentes a</span>
              <span className={`font-mono ${activeTab === 'tags' ? 'text-cyan-400' : 'text-amber-400'}`}>
                {activeTab === 'tags' ? `#${selectedTag}` : `[tr:${selectedTrait}]`}
              </span>
              <span className="text-xs text-zinc-500">({matchingEntities.length} encontrados)</span>
            </h3>

            <div className="flex items-center gap-3">
              {selectedTrait && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTraitName(selectedTrait);
                    setTraitModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar/Excluir este Traço</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedTrait(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
              >
                Limpar filtro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matchingEntities.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigateEntity(item.id)}
                className="flex items-start justify-between p-4 rounded-xl bg-[#110e19] hover:bg-[#181324] border border-zinc-800/80 hover:border-cyan-500/50 text-left transition-all group shadow-md cursor-pointer"
              >
                <div className="space-y-1 min-w-0 pr-2">
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
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trait Management Modal */}
      <TraitModal
        isOpen={traitModalOpen}
        onClose={() => setTraitModalOpen(false)}
        traitName={editingTraitName}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Tag Management Modal */}
      <TagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        tagName={editingTagName}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

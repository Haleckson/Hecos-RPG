import React, { useState, useEffect } from 'react';
import { HecosEntity, TimelineYear, TimelineEra } from '../types';
import { X, Sparkles, Flame, Globe, Clock, Image, Lock, Unlock, Eye, Tag, FileText, Calendar, Check, Trash2, AtSign } from 'lucide-react';
import { RobustRichTextEditor } from './RobustRichTextEditor';

interface TimelineEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: HecosEntity) => void;
  onDelete?: (entryId: string) => void;
  presetYearId?: string;
  allYears: TimelineYear[];
  allEras: TimelineEra[];
  editingEntry?: HecosEntity | null;
}

const IMPORTANCE_OPTIONS = [
  {
    id: 'cosmic',
    label: 'Cósmico / Divino',
    icon: Flame,
    color: '#f43f5e',
    desc: 'Cataclismos, criação de mundos e intervenção dos deuses'
  },
  {
    id: 'major',
    label: 'Marco Maior',
    icon: Globe,
    color: '#a855f7',
    desc: 'Guerras continentais, quedas de impérios e fundações'
  },
  {
    id: 'minor',
    label: 'Evento Local',
    icon: Clock,
    color: '#06b6d4',
    desc: 'Acontecimentos regionais, alianças e cismas'
  },
  {
    id: 'session',
    label: 'Sessão de Jogo',
    icon: Sparkles,
    color: '#f59e0b',
    desc: 'Acontecimentos vivenciados pelo grupo de jogadores'
  },
] as const;

export const TimelineEntryModal: React.FC<TimelineEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  presetYearId,
  allYears,
  allEras,
  editingEntry,
}) => {
  const [title, setTitle] = useState('');
  const [dayMonth, setDayMonth] = useState('');
  const [selectedYearId, setSelectedYearId] = useState<string>(presetYearId || '');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState<'cosmic' | 'major' | 'minor' | 'session'>('major');
  const [coverImage, setCoverImage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSecret, setIsSecret] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title || '');
      setDayMonth(editingEntry.timelineData?.dayMonth || '');
      setSelectedYearId(editingEntry.timelineData?.yearId || editingEntry.timelineData?.dateId || presetYearId || (allYears[0]?.id ?? ''));
      setSummary(editingEntry.summary || '');
      setContent(editingEntry.content || '');
      setImportance(editingEntry.timelineData?.importance || 'major');
      setCoverImage(editingEntry.coverImage || '');
      setTags(editingEntry.tags || []);
      setIsSecret(editingEntry.isSecret ?? false);
    } else {
      setTitle('');
      setDayMonth('dia 14/03');
      setSelectedYearId(presetYearId || (allYears[0]?.id ?? ''));
      setSummary('');
      setContent('### Descrição do Acontecimento Histórico\nEscreva os detalhes deste marco temporal.\n\nUse @ para linkar entidades como @salgueiro-do-eclipse, @org-circulo-carmim ou @npc-vane-o-eremita!');
      setImportance('major');
      setCoverImage('');
      setTags(['Timeline', 'História']);
      setIsSecret(false);
    }
    setShowConfirmDelete(false);
  }, [editingEntry, presetYearId, isOpen, allYears]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  const selectedYear = allYears.find((y) => y.id === selectedYearId);
  const selectedEra = allEras.find((e) => e.id === selectedYear?.eraId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentYear = allYears.find((y) => y.id === selectedYearId);
    const currentEra = allEras.find((e) => e.id === currentYear?.eraId);

    const updatedEntity: HecosEntity = {
      id: editingEntry?.id || `timeline-${Date.now()}`,
      slug: editingEntry?.slug || `timeline-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: title.trim(),
      subtitle: `${currentYear?.title || 'História'} • ${dayMonth || 'Registro'}`,
      category: 'timeline',
      tags: tags.length > 0 ? tags : ['Timeline'],
      summary: summary.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      content: content.trim(),
      isSecret,
      icon: 'Calendar',
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timelineData: {
        eraId: currentEra?.id,
        yearId: currentYear?.id,
        dateId: currentYear?.id,
        dayMonth: dayMonth.trim() || undefined,
        era: currentEra?.title,
        year: currentYear?.title,
        order: editingEntry?.timelineData?.order ?? 1,
        importance,
        relatedEntityIds: editingEntry?.timelineData?.relatedEntityIds || [],
      }
    };

    onSave(updatedEntity);
    onClose();
  };

  const handleDelete = () => {
    if (editingEntry && onDelete) {
      onDelete(editingEntry.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#0c0a14] border border-zinc-800/90 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 shadow-inner">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {editingEntry ? 'Editar Entrada da Linha do Tempo' : 'Nova Entrada na Timeline'}
              </h2>
              <p className="text-xs text-zinc-400">
                {selectedEra?.title ? `${selectedEra.title} ➔ ` : ''}
                {selectedYear?.title ? selectedYear.title : 'Selecione o Ano'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Year and Day/Month row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Year selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Ano da Timeline <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
              >
                {allEras.map((era) => {
                  const eraYears = allYears.filter((y) => y.eraId === era.id);
                  if (eraYears.length === 0) return null;
                  return (
                    <optgroup key={era.id} label={era.title}>
                      {eraYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.title} {year.description ? `(${year.description})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* Day / Month */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Data / Dia / Mês <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ex: dia 14/03, dia 28/05 ou 15 de Solaris"
                value={dayMonth}
                onChange={(e) => setDayMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm font-medium"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Título da Entrada <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ex: O Sacrifício da Lua de Prata ou A Queda da Fortaleza"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm font-semibold"
            />
          </div>

          {/* Importance level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Nível de Importância Histórica
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IMPORTANCE_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = importance === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setImportance(opt.id as any)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-white/80 bg-zinc-800/90 shadow-md ring-1 ring-white/40'
                        : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <IconComponent className="w-4 h-4" style={{ color: opt.color }} />
                      <span className="text-xs font-semibold text-zinc-200">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Resumo Breve do Artigo
            </label>
            <textarea
              rows={2}
              placeholder="Resumo de 1 a 2 frases para leitura rápida na timeline..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm resize-y"
            />
          </div>

          {/* Robust Markdown Editor with Instant @ Mention Indexing */}
          <div>
            <RobustRichTextEditor
              label="Conteúdo do Artigo & Menções"
              description="Digite @ para pesquisar e linkar qualquer NPC, magia, item, localidade ou artigo do site"
              value={content}
              onChange={setContent}
              placeholder="Descreva este evento histórico em detalhes... Digite @ para indexar e referenciar NPCs, feitiços, itens, facções ou locais."
              minHeight="240px"
              showToolbar={true}
              showPreviewToggle={true}
              excludeEntityId={editingEntry?.id}
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-zinc-400" />
              URL da Imagem de Capa (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm"
            />
          </div>

          {/* Tags & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Tags input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="ex: Batalha, Divindade, Lore..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 text-[10px]"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                {isSecret ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Visibilidade
              </label>
              <button
                type="button"
                onClick={() => setIsSecret(!isSecret)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
                  isSecret
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                    : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSecret ? (
                    <Lock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-xs font-medium">
                    {isSecret ? 'Apenas Mestre (Secreto GM)' : 'Público para Jogadores'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">Clique para alternar</span>
              </button>
            </div>
          </div>

          {/* Delete section if editing */}
          {editingEntry && onDelete && (
            <div className="pt-2 border-t border-zinc-800/80">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir esta Entrada
                </button>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 animate-in fade-in">
                  <p className="text-xs text-rose-300">
                    Tem certeza de que deseja excluir permanentemente esta entrada da timeline?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-900/40 transition-all"
            >
              <Check className="w-4 h-4" />
              {editingEntry ? 'Salvar Alterações' : 'Criar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

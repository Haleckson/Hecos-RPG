import React, { useState } from 'react';
import { YouTubeAmbianceTrack } from '../types';
import { HecosStorage } from '../services/storage';
import {
  Music,
  Play,
  Pause,
  Plus,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Disc3,
  Flame,
  Moon,
  Sparkles,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';

interface MusicJukeboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicJukebox: React.FC<MusicJukeboxProps> = ({ isOpen, onClose }) => {
  const [tracks, setTracks] = useState<YouTubeAmbianceTrack[]>(HecosStorage.getTracks());
  const [activeTrack, setActiveTrack] = useState<YouTubeAmbianceTrack | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<YouTubeAmbianceTrack | null>(null);

  // Add track form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<YouTubeAmbianceTrack['category']>('ambient');

  const handleDeleteTrack = (e: React.MouseEvent, track: YouTubeAmbianceTrack) => {
    e.stopPropagation();
    setTrackToDelete(track);
  };

  const confirmDeleteTrack = () => {
    if (!trackToDelete) return;
    const track = trackToDelete;
    HecosStorage.deleteTrack(track.id);
    const updated = tracks.filter((t) => t.id !== track.id);
    setTracks(updated);
    if (activeTrack?.id === track.id) {
      setActiveTrack(updated[0] || null);
      if (updated.length === 0) setIsPlaying(false);
    }
    setTrackToDelete(null);
  };

  const extractVideoId = (urlOrId: string) => {
    if (!urlOrId) return '';
    const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : urlOrId.trim();
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const vidId = extractVideoId(newUrl);
    if (!newTitle.trim() || !vidId) return;

    const track: YouTubeAmbianceTrack = {
      id: 'yt-' + Date.now(),
      title: newTitle.trim(),
      url: newUrl.trim(),
      videoId: vidId,
      category: newCategory,
    };

    const updated = [...tracks, track];
    setTracks(updated);
    HecosStorage.saveTracks(updated);
    setActiveTrack(track);
    setIsPlaying(true);
    setShowAddForm(false);
    setNewTitle('');
    setNewUrl('');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'combat': return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'ambient': return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'tavern': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'eerie': return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      default: return 'bg-zinc-900 text-zinc-300 border-zinc-800';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl bg-[#0e0c15] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#141020] border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-400 animate-pulse">
                  <Disc3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-100">
                    Jukebox & Ambiência de Hecos
                  </h3>
                  <p className="text-xs text-zinc-400">Trilhas sonoras sincronizadas via YouTube API</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Active YouTube Player */}
            {activeTrack && isPlaying && (
              <div className="relative bg-black w-full aspect-video border-b border-zinc-800 overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeTrack.videoId}?autoplay=1&loop=1&playlist=${activeTrack.videoId}&controls=1`}
                  title={activeTrack.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {/* Player Controls Bar */}
            {activeTrack && (
              <div className="flex items-center justify-between px-5 py-3 bg-[#110d1a] border-b border-zinc-800">
                <div className="truncate pr-3">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Tocando Agora</span>
                  <h4 className="text-xs font-bold text-zinc-100 truncate">{activeTrack.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition-all shadow-md"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pausar' : 'Tocar'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Trilhas Disponíveis ({tracks.length})
                </span>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Trilha</span>
                </button>
              </div>

              {/* Add form */}
              {showAddForm && (
                <form onSubmit={handleAddTrack} className="p-3 rounded-xl bg-black/60 border border-zinc-700/80 space-y-2.5 mb-3">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Título da Trilha</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Combate do Zênite Rubro"
                      className="w-full px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">URL ou ID do YouTube</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
                    >
                      <option value="ambient">Ambiência / Mistério</option>
                      <option value="combat">Combate / Batalha</option>
                      <option value="tavern">Taverna / Roleplay</option>
                      <option value="eerie">Horror Cósmico</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-2.5 py-1 text-xs rounded bg-zinc-800 text-zinc-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-bold rounded bg-cyan-500 text-zinc-950"
                    >
                      Salvar Trilha
                    </button>
                  </div>
                </form>
              )}

              {tracks.map((track) => {
                const isActive = activeTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      setActiveTrack(track);
                      setIsPlaying(true);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-md'
                        : 'bg-[#110e19] hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-black/60 border border-zinc-800 text-rose-400 shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-zinc-100 truncate">{track.title}</h4>
                        {track.description && (
                          <p className="text-[11px] text-zinc-400 truncate">{track.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getCategoryBadge(track.category)}`}>
                        {track.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrack(e, track)}
                        className="p-1.5 rounded-lg hover:bg-rose-950/80 text-zinc-500 hover:text-rose-400 border border-transparent hover:border-rose-900 transition-colors"
                        title={`Excluir trilha ${track.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Track deletion confirm modal */}
      <ConfirmModal
        isOpen={!!trackToDelete}
        title="Remover Trilha Sonora"
        message={`Tem certeza de que deseja remover a trilha "${trackToDelete?.title}" da Jukebox de Hecos?\n\nEsta ação removerá a música da sua lista.`}
        confirmLabel="Remover Trilha"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteTrack}
        onCancel={() => setTrackToDelete(null)}
      />
    </AnimatePresence>
  );
};

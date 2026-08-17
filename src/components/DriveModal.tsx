import React, { useState } from 'react';
import { GoogleDriveResource } from '../types';
import { HecosStorage } from '../services/storage';
import {
  FolderKanban,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  X,
  Trash2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriveModal: React.FC<DriveModalProps> = ({ isOpen, onClose }) => {
  const [resources, setResources] = useState<GoogleDriveResource[]>(HecosStorage.getDriveResources());
  const [resourceToDelete, setResourceToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<GoogleDriveResource['type']>('sheet');
  const [desc, setDesc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const newRes: GoogleDriveResource = {
      id: 'drive-' + Date.now(),
      title: title.trim(),
      url: url.trim(),
      type,
      description: desc.trim()
    };

    const updated = [...resources, newRes];
    setResources(updated);
    HecosStorage.saveDriveResources(updated);
    setShowAdd(false);
    setTitle('');
    setUrl('');
    setDesc('');
  };

  const handleDelete = (id: string, itemTitle?: string) => {
    const name = itemTitle || 'este recurso';
    setResourceToDelete({ id, title: name });
  };

  const confirmDeleteResource = () => {
    if (!resourceToDelete) return;
    const { id } = resourceToDelete;
    HecosStorage.deleteDriveResource(id);
    const updated = resources.filter((r) => r.id !== id);
    setResources(updated);
    setResourceToDelete(null);
  };

  const getIcon = (t: string) => {
    switch (t) {
      case 'sheet': return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'folder': return <Folder className="w-4 h-4 text-amber-400" />;
      case 'doc': return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
      default: return <FolderKanban className="w-4 h-4 text-zinc-400" />;
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
            className="w-full max-w-xl bg-[#0e0c15] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-[#101420] border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-100">
                    Recursos & Arquivos no Google Drive
                  </h3>
                  <p className="text-xs text-zinc-400">Fichas compartilhadas, planilhas e pastas da mesa</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">
                  Arquivos Vinculados ({resources.length})
                </span>
                <button
                  onClick={() => setShowAdd(!showAdd)}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vincular Documento</span>
                </button>
              </div>

              {showAdd && (
                <form onSubmit={handleAdd} className="p-3.5 rounded-xl bg-black/60 border border-zinc-700 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Nome do Documento / Ficha</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Ficha do Guerreiro Umbralis"
                      className="w-full px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Link do Google Drive (Compartilhado)</label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Tipo de Recurso</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
                    >
                      <option value="sheet">Planilha de Ficha / Loot (Sheets)</option>
                      <option value="doc">Documento de Texto (Docs)</option>
                      <option value="folder">Pasta de Campanha (Drive)</option>
                      <option value="pdf">Livro de Regras / PDF</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="px-2.5 py-1 text-xs rounded bg-zinc-800 text-zinc-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-bold rounded bg-cyan-500 text-zinc-950"
                    >
                      Salvar Vínculo
                    </button>
                  </div>
                </form>
              )}

              {resources.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#110e19] border border-zinc-800 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-black/60 border border-zinc-800">
                      {getIcon(item.type)}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-zinc-100 truncate">{item.title}</h4>
                      {item.description && (
                        <p className="text-[11px] text-zinc-400 truncate">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 text-xs font-semibold"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 rounded-lg hover:bg-rose-950 text-zinc-500 hover:text-rose-400"
                      title="Excluir Recurso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Drive resource delete confirm modal */}
      <ConfirmModal
        isOpen={!!resourceToDelete}
        title="Remover Recurso do Drive"
        message={`Tem certeza de que deseja remover o recurso "${resourceToDelete?.title}" do Google Drive de Hecos?\n\nEsta ação removerá o link da sua lista.`}
        confirmLabel="Remover Recurso"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteResource}
        onCancel={() => setResourceToDelete(null)}
      />
    </AnimatePresence>
  );
};

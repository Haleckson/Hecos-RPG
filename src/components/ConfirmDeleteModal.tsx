import React from 'react';
import { Trash2, AlertTriangle, X, Undo2, ShieldAlert } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  entityTitle?: string;
  itemType?: string;
  isPermanent?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  entityTitle,
  itemType = 'Artigo',
  isPermanent = false,
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  const displayName = itemName || entityTitle || 'este item';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0e0b16] border border-rose-900/60 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(225,29,72,0.25)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-rose-950/80 to-[#120e1d] border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950 border border-rose-600/50 text-rose-400">
              {isPermanent ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-200">
                {title || (isPermanent ? 'Excluir Permanentemente' : 'Mover para a Lixeira')}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">Confirmação de Ação</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
            <div className="text-[11px] uppercase font-mono tracking-wider text-zinc-400">
              {itemType}:
            </div>
            <div className="text-sm font-bold text-amber-200 break-words">{displayName}</div>
          </div>

          <div className="text-xs leading-relaxed text-zinc-300">
            {isPermanent ? (
              <p className="text-rose-300/90 font-medium">
                ⚠️ <strong className="text-rose-200">Atenção:</strong> Esta ação é irreversível. O artigo será apagado permanentemente do banco de dados e de todos os registros.
              </p>
            ) : (
              <p>
                Tem certeza que deseja remover este artigo? Ele será enviado para a{' '}
                <strong className="text-amber-300">Lixeira</strong>, onde poderá ser restaurado a qualquer momento ou excluído permanentemente pelo Mestre.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#090710] border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg cursor-pointer ${
              isPermanent
                ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-900/30'
                : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-zinc-950 shadow-amber-900/30'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel || (isPermanent ? 'Excluir Definitivamente' : 'Mover para Lixeira')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

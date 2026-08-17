import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Excluir Definitivamente',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="confirm-modal-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={onCancel}
        >
          <motion.div
            id="confirm-modal-content"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#100c19] border border-rose-600/40 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.25)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#171024] border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-950/90 border border-rose-700/60 text-rose-400">
                  {variant === 'danger' ? (
                    <Trash2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <h3 className="text-base font-bold text-zinc-100">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 text-sm text-zinc-300 leading-relaxed whitespace-pre-line space-y-3">
              <p>{message}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#140e20] border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

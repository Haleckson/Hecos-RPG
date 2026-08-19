import React, { useState, useEffect } from 'react';
import { HecosStorage } from '../services/storage';
import { HecosUser } from '../types';
import {
  Lock,
  User as UserIcon,
  KeyRound,
  ShieldCheck,
  LogOut,
  AlertCircle,
  X,
  Users,
  CheckCircle2
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserManagement?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenUserManagement
}) => {
  const [currentUser, setCurrentUser] = useState<HecosUser | null>(HecosStorage.getCurrentUser());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = HecosStorage.subscribeUser((u) => {
      setCurrentUser(u);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const result = HecosStorage.login(username, password);
    if (!result.success) {
      setError(result.error || 'Erro ao realizar login');
      return;
    }

    setSuccessMsg(`Bem-vindo, ${result.user?.name || result.user?.username}!`);
    setTimeout(() => {
      onClose();
      setUsername('');
      setPassword('');
      setSuccessMsg(null);
    }, 600);
  };

  const handleLogout = () => {
    HecosStorage.logout();
    setSuccessMsg('Você saiu da sua conta.');
    setTimeout(() => {
      setSuccessMsg(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0f0b18] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-[#170e24] to-[#0d0a14]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/50 text-purple-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Acesso & Autenticação
              </h2>
              <p className="text-xs text-zinc-400">
                Entre como GM ou Jogador para acessar conteúdos exclusivos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Current User Card if Logged In */}
          {currentUser ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#1b1329] to-[#120c1c] border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-lg ${
                    currentUser.role === 'gm'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                  }`}>
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                      {currentUser.name}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        currentUser.role === 'gm'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {currentUser.role === 'gm' ? 'Narrador / GM' : 'Jogador'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">@{currentUser.username}</div>
                  </div>
                </div>
              </div>

              {currentUser.role === 'gm' && onOpenUserManagement && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUserManagement();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  Gerenciar Jogadores & Permissões
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-600/50 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Desconectar (Sair para Modo Visitante)
              </button>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário ou jogador"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-100 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Informe sua senha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-100 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Entrar no Sistema
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

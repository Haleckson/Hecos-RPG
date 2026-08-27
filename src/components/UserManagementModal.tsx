import React, { useState, useEffect } from 'react';
import { HecosStorage, INITIAL_ADMIN_USER } from '../services/storage';
import { HecosUser } from '../types';
import {
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  Shield,
  User,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Edit2
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const [users, setUsers] = useState<HecosUser[]>(HecosStorage.getUsers());
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = HecosStorage.subscribeUsersList(setUsers);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanUsername = username.trim();
    const cleanName = name.trim() || cleanUsername;
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError('Informe o nome de usuário para login.');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      setError(`O nome de usuário "${cleanUsername}" já existe.`);
      return;
    }

    const newPlayer: HecosUser = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      username: cleanUsername,
      password: cleanPassword,
      role: 'player',
      createdAt: new Date().toISOString()
    };

    HecosStorage.saveUser(newPlayer);
    setName('');
    setUsername('');
    setPassword('');
    setSuccess(`Jogador "${cleanName}" criado com sucesso!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeletePlayer = (user: HecosUser) => {
    if (user.username === INITIAL_ADMIN_USER.username || user.role === 'gm') {
      alert('Não é possível excluir o Administrador Geral (GM).');
      return;
    }
    if (confirm(`Tem certeza que deseja remover o jogador "${user.name}" (@${user.username})?`)) {
      HecosStorage.deleteUser(user.id);
    }
  };

  const handleSavePassword = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    target.password = newPassword.trim();
    HecosStorage.saveUser(target);
    setEditingUserId(null);
    setNewPassword('');
    setSuccess(`Senha do usuário "${target.name}" atualizada.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0f0b18] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-[#1b0f2e] via-[#100b1d] to-[#0d0914] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Gerenciamento de Jogadores & Acesso
              </h2>
              <p className="text-xs text-zinc-400">
                Cadastre jogadores para liberar visualização seletiva de pastas e artigos
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Form: Create New Player */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-purple-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-purple-400" />
              Criar Novo Jogador
            </div>

            <form onSubmit={handleCreatePlayer} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">Nome de Exibição / Personagem</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel (Ladino)"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">Usuário de Login *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: gabriel"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">Senha do Jogador</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: 123456"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md cursor-pointer transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Cadastrar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* List of Registered Users */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                Usuários Cadastrados ({users.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                O GM pode conceder acesso seletivo a qualquer um desses usuários
              </span>
            </div>

            <div className="space-y-2">
              {users.map((user) => {
                const isGM = user.role === 'gm';
                const isMasterAdmin = user.username === INITIAL_ADMIN_USER.username;
                const isEditing = editingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isGM
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${
                          isGM
                            ? 'bg-amber-900/60 text-amber-300 border-amber-500/50'
                            : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                        }`}
                      >
                        {user?.name && user.name[0] ? user.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                          {user.name}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                              isGM
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            }`}
                          >
                            {isGM ? 'Narrador / GM' : 'Jogador'}
                          </span>
                          {isMasterAdmin && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-700/50">
                              Mestre Geral
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                          <span>Login: <strong className="text-zinc-300">@{user.username}</strong></span>
                          <span>•</span>
                          <span>Senha: <strong className="text-zinc-300">{user.password || '(sem senha)'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nova senha"
                            className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-700 text-xs w-28 text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePassword(user.id)}
                            className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Salvar senha"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setNewPassword(user.password || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition-all"
                          title="Alterar Senha"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                          Alterar Senha
                        </button>
                      )}

                      {!isMasterAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(user)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 hover:text-rose-100 transition-all"
                          title="Excluir Jogador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-[#0c0814] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

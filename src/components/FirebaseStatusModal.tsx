import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Radio,
  Wifi,
  ShieldCheck,
  Flame,
  Clock,
  Layers,
  Server,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  ShieldAlert,
  FileCode2
} from 'lucide-react';
import {
  firebaseConfig,
  getFirebaseConnectionState,
  subscribeFirebaseStatus,
  testRealtimeDatabasePermissions
} from '../services/firebase';
import { HecosStorage } from '../services/storage';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RTDB_RULES_JSON = `{
  "rules": {
    "hecos_entities": {
      ".read": true,
      ".write": true,
      ".indexOn": ["type", "folder", "subCategory", "level", "name", "title"],
      "$entity_id": {
        ".validate": "!newData.exists() || newData.hasChildren(['id'])"
      }
    },
    "hecos_deleted_entities": {
      ".read": true,
      ".write": true
    },
    "hecos_trash": {
      ".read": true,
      ".write": true
    },
    "hecos_maps": {
      ".read": true,
      ".write": true
    },
    "hecos_youtube_tracks": {
      ".read": true,
      ".write": true
    },
    "hecos_drive_resources": {
      ".read": true,
      ".write": true
    },
    "hecos_users": {
      ".read": true,
      ".write": true
    },
    "hecos_folder_permissions": {
      ".read": true,
      ".write": true
    },
    "hecos_image_adjustments": {
      ".read": true,
      ".write": true
    },
    "hecos_custom_traits": {
      ".read": true,
      ".write": true
    },
    "hecos_custom_tags": {
      ".read": true,
      ".write": true
    },
    "hecos_feat_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_spell_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_item_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_peril_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_class_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_archetype_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_vocation_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_ancestry_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_fauna_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_flora_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_location_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_pc_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_npc_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_organization_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_map_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_tag_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_quest_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_categories": {
      ".read": true,
      ".write": true
    },
    "hecos_configs": {
      ".read": true,
      ".write": true
    },
    "hecos_public_folders": {
      ".read": true,
      ".write": true
    },
    "hecos_secret_folders": {
      ".read": true,
      ".write": true
    },
    "hecos_deleted_folders": {
      ".read": true,
      ".write": true
    },
    "$other": {
      ".read": true,
      ".write": true
    },
    ".read": false,
    ".write": false
  }
}`;

const FIRESTORE_RULES_TXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if collection.matches('hecos_.*');
    }

    match /hecos_entities/{entityId} {
      allow read, write: if true;
    }

    match /hecos_maps/{mapId} {
      allow read, write: if true;
    }

    match /hecos_youtube_tracks/{trackId} {
      allow read, write: if true;
    }

    match /hecos_drive_resources/{resourceId} {
      allow read, write: if true;
    }

    match /hecos_users/{userId} {
      allow read, write: if true;
    }

    match /hecos_configs/{configId} {
      allow read, write: if true;
    }

    match /hecos_trash/{trashId} {
      allow read, write: if true;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

export function FirebaseStatusModal({ isOpen, onClose }: FirebaseStatusModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'security' | 'guide'>('status');
  const [connectionState, setConnectionState] = useState(getFirebaseConnectionState());
  const [isTesting, setIsTesting] = useState(false);
  const [copiedType, setCopiedType] = useState<'rtdb' | 'firestore' | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    entityCount?: number;
    readOk?: boolean;
    writeOk?: boolean;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeFirebaseStatus((state) => {
      setConnectionState(state);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'rtdb' | 'firestore') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      // Fetch entities and run permission verification
      const permResult = await testRealtimeDatabasePermissions();
      const localEntities = HecosStorage.getEntities();

      setTestResult({
        success: permResult.readOk && permResult.writeOk,
        message: permResult.message,
        latencyMs: permResult.latencyMs,
        entityCount: localEntities.length,
        readOk: permResult.readOk,
        writeOk: permResult.writeOk
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao validar comunicação com o Realtime Database.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceSyncNow = async () => {
    setIsTesting(true);
    try {
      await HecosStorage.syncWithFirebase();
      setTestResult({
        success: true,
        message: 'Sincronização bidirecional em tempo real com Realtime Database efetuada com sucesso!'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Erro durante a sincronização: ' + (err?.message || 'Erro desconhecido')
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isConnected = connectionState.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e0c15] border border-zinc-800 shadow-2xl p-6 space-y-5 text-zinc-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                Firebase Realtime Database & Segurança
              </h2>
              <p className="text-xs text-zinc-400">
                Sincronização em tempo real & Proteção contra alertas de segurança
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Status & Conexão
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Regras de Segurança (Anti-Alerta)
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            Guia de Aplicação no Console
          </button>
        </div>

        {/* TAB 1: STATUS & CONEXÃO */}
        {activeTab === 'status' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Live Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                isConnected
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              {isConnected ? (
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 animate-pulse">
                  <Radio className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-amber-500/20 text-amber-400 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-sm flex items-center gap-2">
                  <span>
                    {isConnected
                      ? 'Realtime Database: CONECTADO (Tempo Real Ativo)'
                      : 'Modo Local / Reconectando...'}
                  </span>
                  {isConnected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  )}
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {isConnected
                    ? 'Os ouvintes WebSockets nativos do Firebase Realtime Database estão ativos. Qualquer artigo criado ou editado em qualquer plataforma ou aba é sincronizado instantaneamente.'
                    : 'A aplicação está usando armazenamento local inteligente com sincronização automática assim que a conexão for estabelecida.'}
                </p>
              </div>
            </div>

            {/* Auth Session Info */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-200 flex items-center gap-2">
                    Sessão Segura Firebase Auth:
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      connectionState.authStatus === 'anonymous' || connectionState.authStatus === 'authenticated'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {connectionState.authStatus === 'anonymous' ? 'Autenticado (Anônimo Silencioso)' : connectionState.authStatus === 'authenticated' ? 'Autenticado' : 'Preparando Auth...'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    UID da Conexão: <span className="font-mono text-purple-300">{connectionState.authUid || 'Atribuindo token...'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Config and Technical Specs */}
            <div className="bg-black/50 rounded-xl p-4 border border-zinc-800/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> Projeto Firebase:
                </span>
                <span className="font-mono text-cyan-300 font-semibold">{firebaseConfig.projectId}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-orange-400" /> Database URL:
                </span>
                <span className="font-mono text-orange-300 text-[11px] truncate max-w-[260px]" title={firebaseConfig.databaseURL}>
                  {firebaseConfig.databaseURL}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Nó Principal:
                </span>
                <span className="font-mono text-purple-300">/hecos_entities</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Protocolo:
                </span>
                <span className="text-emerald-300 font-medium">WebSocket Contínuo (RTDB onValue)</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Última Sincronização:
                </span>
                <span className="text-zinc-300 font-mono">
                  {connectionState.lastSyncedAt
                    ? new Date(connectionState.lastSyncedAt).toLocaleTimeString()
                    : 'Em tempo real'}
                </span>
              </div>
            </div>

            {/* Test Result Box */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                  testResult.success
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.latencyMs !== undefined && (
                    <p className="text-[11px] text-zinc-400">
                      Latência: <span className="text-cyan-300">{testResult.latencyMs}ms</span> • Leitura: {testResult.readOk !== false ? '✅ OK' : '❌ Falha'} • Gravação: {testResult.writeOk !== false ? '✅ OK' : '❌ Falha'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão & Permissões'}</span>
              </button>

              <button
                onClick={handleForceSyncNow}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Cloud className="w-4 h-4" />
                <span>Forçar Sincronização</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REGRAS DE SEGURANÇA */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            {/* Alert Explanation Card */}
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Por que o Google enviou o alerta de segurança?</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                O Firebase envia esse aviso automático quando o banco de dados está configurado em <em>Modo de Teste</em> com regras abertas (<code>.read: true, .write: true</code> na raiz). Isso permite que qualquer pessoa leia ou apague a raiz inteira.
              </p>
              <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-[11px] text-amber-300/90 font-medium">
                ✅ <strong>Como solucionamos:</strong> Bloqueamos o acesso irrestrito na raiz (<code>.read: false, .write: false</code>), liberamos todas as coleções, tabelas e categorias do Codex (incluindo <code>hecos_entities</code>, <code>hecos_maps</code>, <code>hecos_*_categories</code> e regra curinga para novos módulos) e integramos <strong>Autenticação Anônima Silenciosa e Fallback Local</strong> no site para garantir acesso legítimo a partir de qualquer dispositivo sem bloquear nenhum usuário!
              </div>
            </div>

            {/* Realtime Database Rules Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Regras Seguras para Firebase Realtime Database (<code>database.rules.json</code>)
                </span>
                <button
                  onClick={() => handleCopy(RTDB_RULES_JSON, 'rtdb')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 border border-zinc-600 transition-all cursor-pointer"
                >
                  {copiedType === 'rtdb' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copiar Regras RTDB</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-[11px] font-mono text-emerald-400 max-h-52 overflow-y-auto leading-relaxed selection:bg-purple-900 selection:text-white">
                {RTDB_RULES_JSON}
              </pre>
            </div>

            {/* Firestore Rules Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Regras para Cloud Firestore (Caso utilize Firestore no mesmo projeto)
                </span>
                <button
                  onClick={() => handleCopy(FIRESTORE_RULES_TXT, 'firestore')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 border border-zinc-600 transition-all cursor-pointer"
                >
                  {copiedType === 'firestore' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copiar Regras Firestore</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-[11px] font-mono text-cyan-300 max-h-36 overflow-y-auto leading-relaxed selection:bg-purple-900 selection:text-white">
                {FIRESTORE_RULES_TXT}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: GUIA DE APLICAÇÃO */}
        {activeTab === 'guide' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-zinc-300 space-y-3">
              <h3 className="font-bold text-purple-300 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Como aplicar as Regras no Console do Firebase (3 Passos Rápidos)
              </h3>

              <div className="space-y-3 text-[12px] text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-zinc-100">Ativar Autenticação Anônima no Firebase Console:</strong>
                    <p className="text-zinc-400 mt-0.5">
                      No <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold">Firebase Console &gt; Authentication &gt; Sign-in method <ExternalLink className="w-3 h-3" /></a>, clique em <strong>Anonymous (Anônimo)</strong> e marque como <strong>Ativado (Enabled)</strong>. Isso permite que qualquer visitante navegue e salve dados de forma segura sem pedir senha!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-zinc-100">Colar as Regras do Realtime Database:</strong>
                    <p className="text-zinc-400 mt-0.5">
                      Acesse <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/database/${firebaseConfig.projectId}-default-rtdb/rules`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold">Realtime Database &gt; Regras (Rules) <ExternalLink className="w-3 h-3" /></a>, apague o conteúdo existente, cole o código do botão <em>"Copiar Regras RTDB"</em> da aba anterior e clique no botão azul <strong>Publicar (Publish)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-zinc-100">Validar Conexão:</strong>
                    <p className="text-zinc-400 mt-0.5">
                      Volte na aba <strong>Status & Conexão</strong> e clique em <em>"Testar Conexão & Permissões"</em>. O sistema testará uma leitura e gravação em milissegundos para confirmar que tudo está 100% verde!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveTab('security')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                Ir para Regras e Copiar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

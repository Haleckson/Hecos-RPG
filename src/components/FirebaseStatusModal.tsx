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
  Layers
} from 'lucide-react';
import {
  firebaseConfig,
  getFirebaseConnectionState,
  subscribeFirebaseStatus,
  loadEntitiesFromFirebase,
  syncEntityToFirebase,
  FirebaseConnectionStatus
} from '../services/firebase';
import { HecosStorage } from '../services/storage';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FirebaseStatusModal({ isOpen, onClose }: FirebaseStatusModalProps) {
  const [connectionState, setConnectionState] = useState(getFirebaseConnectionState());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    entityCount?: number;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeFirebaseStatus((state) => {
      setConnectionState(state);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      // 1. Attempt to fetch entities from Firestore
      const remoteEntities = await loadEntitiesFromFirebase();
      const latency = Math.round(performance.now() - start);

      const localEntities = HecosStorage.getEntities();
      setTestResult({
        success: true,
        message: 'Conexão e persistência com Firebase Firestore validadas com sucesso!',
        latencyMs: latency,
        entityCount: remoteEntities ? remoteEntities.length : localEntities.length
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao comunicar com o servidor Firestore.'
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
        message: 'Sincronização bidirecional em tempo real efetuada com sucesso!'
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
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0e0c15] border border-zinc-800 shadow-2xl p-6 space-y-6 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                Status do Firebase & Persistência
              </h2>
              <p className="text-xs text-zinc-400">
                Diagnóstico de conexão em tempo real (Firestore & Local-First)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  ? 'Persistência em Tempo Real: ATIVA'
                  : 'Modo Offline / Local-First Ativo'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </div>
            <p className="text-zinc-300 leading-relaxed">
              {isConnected
                ? 'Os ouvintes (listeners onSnapshot) do Firestore estão ativos. Qualquer alteração feita em qualquer aba ou dispositivo é refletida instantaneamente.'
                : 'A aplicação está funcionando no modo seguro local-first com cache no navegador (localStorage).'}
            </p>
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
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Coleção Principal:
            </span>
            <span className="font-mono text-purple-300">hecos_entities</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Protocolo de Sincronia:
            </span>
            <span className="text-emerald-300 font-medium">onSnapshot (WebSockets / Long-Polling)</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Última Sincronização:
            </span>
            <span className="text-zinc-300 font-mono">
              {connectionState.lastSyncedAt
                ? new Date(connectionState.lastSyncedAt).toLocaleTimeString()
                : 'Recente'}
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
                  Latência de resposta: <span className="text-cyan-300">{testResult.latencyMs}ms</span>
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
            <span>{isTesting ? 'Testando...' : 'Testar Conexão Direta'}</span>
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
    </div>
  );
}

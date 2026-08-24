import React, { useState, useRef } from 'react';
import {
  Shield,
  Sword,
  Wand2,
  Sparkles,
  Scroll,
  Skull,
  Flame,
  Feather,
  Crown,
  Compass,
  Book,
  Eye,
  Heart,
  Castle,
  Gem,
  TreePine,
  Music,
  Star,
  MapPin,
  Zap,
  Crosshair,
  Sun,
  Moon,
  Droplets,
  Wind,
  Mountain,
  Anchor,
  Axe,
  Bell,
  Ghost,
  Key,
  Lock,
  Target,
  Dna,
  Bot,
  Footprints,
  Flag,
  Landmark,
  FlaskConical,
  Scale,
  Swords,
  Hammer,
  Clock,
  Coins,
  Search,
  X,
  Image as ImageIcon,
  Check,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { EntityIcon } from './EntityIcon';
import { uploadToImgBB } from '../services/imgbb';

interface IconPickerProps {
  value?: string;
  onChange: (newIcon: string) => void;
  category?: string;
  label?: string;
}

const RPG_ICONS = [
  { name: 'Dna', label: 'DNA / Ancestralidade', icon: Dna },
  { name: 'Crown', label: 'Coroa / Classe', icon: Crown },
  { name: 'Shield', label: 'Escudo / Proteção', icon: Shield },
  { name: 'Sword', label: 'Espada / Marcial', icon: Sword },
  { name: 'Swords', label: 'Espadas Cruzadas', icon: Swords },
  { name: 'Wand2', label: 'Varinha / Magia', icon: Wand2 },
  { name: 'Sparkles', label: 'Brilho / Arcano', icon: Sparkles },
  { name: 'Scroll', label: 'Pergaminho / Lore', icon: Scroll },
  { name: 'Book', label: 'Livro / Tomo', icon: Book },
  { name: 'Skull', label: 'Crânio / Perigo / Morte', icon: Skull },
  { name: 'Flame', label: 'Fogo / Elemental', icon: Flame },
  { name: 'Droplets', label: 'Água / Fluido', icon: Droplets },
  { name: 'Wind', label: 'Vento / Ar', icon: Wind },
  { name: 'Mountain', label: 'Montanha / Terra', icon: Mountain },
  { name: 'Sun', label: 'Sol / Luz', icon: Sun },
  { name: 'Moon', label: 'Lua / Sombra', icon: Moon },
  { name: 'Eye', label: 'Olho / Visão', icon: Eye },
  { name: 'Heart', label: 'Coração / Vida', icon: Heart },
  { name: 'Feather', label: 'Pena / Leveza', icon: Feather },
  { name: 'Castle', label: 'Castelo / Fortaleza', icon: Castle },
  { name: 'Landmark', label: 'Monumento / Cidade', icon: Landmark },
  { name: 'MapPin', label: 'Local / Ponto', icon: MapPin },
  { name: 'Compass', label: 'Bússola / Viagem', icon: Compass },
  { name: 'Flag', label: 'Bandeira / Facção', icon: Flag },
  { name: 'Target', label: 'Alvo / Missão', icon: Target },
  { name: 'Gem', label: 'Gema / Tesouro', icon: Gem },
  { name: 'Coins', label: 'Moedas / Ouro', icon: Coins },
  { name: 'FlaskConical', label: 'Poção / Alquimia', icon: FlaskConical },
  { name: 'Scale', label: 'Balança / Regra / Lei', icon: Scale },
  { name: 'Hammer', label: 'Martelo / Forja', icon: Hammer },
  { name: 'Axe', label: 'Machado / Bárbaro', icon: Axe },
  { name: 'TreePine', label: 'Árvore / Natureza / Flora', icon: TreePine },
  { name: 'Footprints', label: 'Pegadas / Fauna / Rastros', icon: Footprints },
  { name: 'Ghost', label: 'Fantasma / Espírito', icon: Ghost },
  { name: 'Zap', label: 'Relâmpago / Energia', icon: Zap },
  { name: 'Crosshair', label: 'Mira / Foco', icon: Crosshair },
  { name: 'Key', label: 'Chave / Segredo', icon: Key },
  { name: 'Lock', label: 'Cadeado / Protegido', icon: Lock },
  { name: 'Music', label: 'Música / Bardo', icon: Music },
  { name: 'Star', label: 'Estrela / Destino', icon: Star },
  { name: 'Clock', label: 'Relógio / Linha do Tempo', icon: Clock },
  { name: 'Anchor', label: 'Âncora / Marítimo', icon: Anchor },
  { name: 'Bell', label: 'Sino / Alerta', icon: Bell },
];

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  category,
  label = 'Ícone do Artigo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState(
    value && (value.startsWith('http') || value.startsWith('data:')) ? value : ''
  );
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredIcons = RPG_ICONS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setCustomUrl('');
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecione uma imagem válida (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadToImgBB(file, `icon_${Date.now()}`);
      if (res.success && res.url) {
        onChange(res.url);
        setCustomUrl(res.url);
        setIsOpen(false);
      } else {
        setUploadError(res.error || 'Erro ao enviar para o ImgBB.');
      }
    } catch (err: any) {
      setUploadError('Falha no upload para o ImgBB.');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-zinc-900 border border-zinc-700/80 hover:border-cyan-500/60 text-zinc-200 transition-all cursor-pointer shadow-sm group"
          title="Clique para escolher ou enviar um ícone para o artigo"
        >
          <div className="w-6 h-6 rounded-md bg-[#18112b] border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform overflow-hidden">
            <EntityIcon icon={value} category={category} className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <span className="text-xs font-medium text-zinc-300 group-hover:text-cyan-200">
            {value ? (value.startsWith('http') ? 'Ícone Personalizado' : value) : 'Escolher Ícone'}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-zinc-800 transition-colors cursor-pointer"
            title="Remover ícone personalizado (usar padrão)"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-84 max-w-[92vw] p-3.5 rounded-2xl bg-[#0e0a17] border border-cyan-500/50 shadow-2xl z-50 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200">{label}</span>
              <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    activeTab === 'presets' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Ícones RPG
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    activeTab === 'upload' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Upload ImgBB
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    activeTab === 'url' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  URL Direta
                </button>
              </div>
            </div>

            {activeTab === 'presets' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar ícone (ex: espada, escudo, fogo)..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {filteredIcons.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = value === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleSelectIcon(item.name)}
                        title={item.label}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md scale-105'
                            : 'bg-black/40 border-zinc-800/80 hover:bg-zinc-800 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileInputChange}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/20'
                      : 'border-zinc-700/80 hover:border-cyan-500 bg-black/40 hover:bg-zinc-900/60'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      <span className="text-xs text-zinc-300 font-medium">Enviando para ImgBB...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-300">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-200">
                        Clique ou arraste imagem para upload
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        PNG, JPG, WEBP, SVG direto no ImgBB
                      </span>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/70 border border-rose-800 text-[11px] text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'url' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>URL Direta da Imagem / Ícone</span>
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://i.ibb.co/... ou link web"
                    className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                {customUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-zinc-800">
                    <img
                      src={customUrl}
                      alt="Prévia"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-lg border border-cyan-500/40"
                    />
                    <span className="text-xs text-zinc-300 truncate">Prévia do Ícone</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!customUrl.trim()}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Imagem como Ícone</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

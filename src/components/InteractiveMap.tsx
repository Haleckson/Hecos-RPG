import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { InteractiveMapData, MapPin, HecosEntity, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { uploadToImgBB, downloadImage, slugify } from '../services/imgbb';
import {
  Compass,
  MapPin as PinIcon,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Layers,
  Settings,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  Skull,
  Landmark,
  TreePine,
  Eye,
  EyeOff,
  X,
  Edit3,
  Trash2,
  Lock,
  Sparkles,
  Flame,
  Grid,
  Crosshair,
  Upload,
  FolderPlus,
  Check,
  Navigation,
  Users,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { renderContentWithMentions } from './MentionBadge';
import { ConfirmModal } from './ConfirmModal';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { ImageUploadInput } from './ImageUploadInput';
import { FolderManagerModal } from './FolderManagerModal';

interface InteractiveMapProps {
  onNavigateEntity: (entityId: string) => void;
  isGmMode?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onNavigateEntity, isGmMode }) => {
  const [maps, setMaps] = useState<InteractiveMapData[]>(() => HecosStorage.getMaps());
  const [selectedMapId, setSelectedMapId] = useState<string>(() => (maps && maps.length > 0 ? maps[0]?.id : 'map-hecos-geral') || 'map-hecos-geral');

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = Boolean(isGmMode || currentUser?.role === 'gm');
  const allUsers = HecosStorage.getUsers();
  const playerUsers = allUsers.filter((u) => u.role === 'player');

  const currentMap = useMemo(() => {
    return (
      maps.find((m) => m.id === selectedMapId) ||
      (maps && maps.length > 0 ? maps[0] : null) || {
        id: 'map-hecos-geral',
        title: 'Hecos: A Bacia do Eclipse',
        description: 'Mapa Geral do Continente Sombrio e Ermos',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2400&q=85',
        pins: [],
      }
    );
  }, [maps, selectedMapId]);

  // Selected Pin for sidebar viewing
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map modes & filters
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [newPinCoord, setNewPinCoord] = useState<{ x: number; y: number } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDanger, setFilterDanger] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGMSecrets, setShowGMSecrets] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredPin, setHoveredPin] = useState<MapPin | null>(null);
  const [mouseMapPos, setMouseMapPos] = useState<{ x: number; y: number } | null>(null);

  // Modals state
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<MapPin | null>(null);
  const [pinToDelete, setPinToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingMap, setIsDeletingMap] = useState(false);

  // Pin Form State (For creation / editing)
  const [pinTitle, setPinTitle] = useState('');
  const [pinSubtitle, setPinSubtitle] = useState('');
  const [pinCategory, setPinCategory] = useState<MapPin['category']>('landmark');
  const [pinDanger, setPinDanger] = useState<NonNullable<MapPin['dangerLevel']>>('Moderado');
  const [pinColor, setPinColor] = useState('#00f0ff');
  const [pinDesc, setPinDesc] = useState('');
  const [pinLinkedEntity, setPinLinkedEntity] = useState('');
  const [pinVisibility, setPinVisibility] = useState<ItemVisibility>('all');
  const [pinAllowedUsers, setPinAllowedUsers] = useState<string[]>([]);
  const [pinGMNotes, setPinGMNotes] = useState('');
  const [pinRegion, setPinRegion] = useState('');

  // Map Settings Form State
  const [editMapTitle, setEditMapTitle] = useState(currentMap.title);
  const [editMapDesc, setEditMapDesc] = useState(currentMap.description);
  const [editMapUrl, setEditMapUrl] = useState(currentMap.imageUrl);
  const [isUploadingMapImage, setIsUploadingMapImage] = useState(false);
  const [mapImageUploadMsg, setMapImageUploadMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);
  const allEntities = HecosStorage.getEntities();

  // Synchronize map settings state when map changes
  useEffect(() => {
    setEditMapTitle(currentMap.title);
    setEditMapDesc(currentMap.description);
    setEditMapUrl(currentMap.imageUrl);
  }, [currentMap]);

  const selectedPin = useMemo(() => {
    return currentMap.pins.find((p) => p.id === selectedPinId) || null;
  }, [currentMap.pins, selectedPinId]);

  // Filter pins based on user permissions and search
  const visiblePins = useMemo(() => {
    return currentMap.pins.filter((pin) => {
      if (!HecosStorage.canUserAccess(pin.visibility, pin.allowedUserIds, currentUser, pin.isSecret)) {
        return false;
      }
      if (isActualGm && !showGMSecrets && (pin.visibility === 'gm' || pin.isSecret)) return false;
      if (filterCategory !== 'all' && pin.category !== filterCategory) return false;
      if (filterDanger !== 'all' && pin.dangerLevel !== filterDanger) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = pin.title.toLowerCase().includes(q);
        const matchDesc = pin.description.toLowerCase().includes(q);
        const matchRegion = pin.region?.toLowerCase().includes(q);
        const matchTags = pin.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchRegion && !matchTags) return false;
      }
      return true;
    });
  }, [currentMap.pins, showGMSecrets, filterCategory, filterDanger, searchQuery, isActualGm, currentUser]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.35), 3.5));
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(zoomDelta);
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAddingPin) return;
    // Only primary button (left click) or middle click
    if (e.button !== 0 && e.button !== 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mapImageRef.current) return;

    // Track percentage coordinate for cursor
    const rect = mapImageRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      if (px >= 0 && px <= 100 && py >= 0 && py <= 100) {
        setMouseMapPos({ x: Math.round(px * 10) / 10, y: Math.round(py * 10) / 10 });
      } else {
        setMouseMapPos(null);
      }
    }

    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on map to place new pin
  const handleMapClick = (e: React.MouseEvent) => {
    if (!isAddingPin || !mapImageRef.current) return;

    const rect = mapImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      const coord = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
      setNewPinCoord(coord);
      // Reset form
      setPinTitle('');
      setPinSubtitle('');
      setPinCategory('landmark');
      setPinDanger('Moderado');
      setPinColor('#00f0ff');
      setPinDesc('');
      setPinLinkedEntity('');
      setPinVisibility('all');
      setPinAllowedUsers([]);
      setPinGMNotes('');
      setPinRegion('');
      setEditingPin(null);
    }
  };

  // Save new or edited pin
  const handleSavePin = () => {
    if (!pinTitle.trim()) return;

    const coord = editingPin ? { x: editingPin.x, y: editingPin.y } : newPinCoord;
    if (!coord) return;

    const pinData: MapPin = {
      id: editingPin?.id || 'pin-' + Date.now(),
      x: coord.x,
      y: coord.y,
      title: pinTitle.trim(),
      subtitle: pinSubtitle.trim() || undefined,
      category: pinCategory,
      dangerLevel: pinDanger,
      color: pinColor,
      description: pinDesc.trim(),
      linkedEntityId: pinLinkedEntity || undefined,
      isSecret: pinVisibility === 'gm',
      visibility: pinVisibility,
      allowedUserIds: pinAllowedUsers,
      gmNotes: pinGMNotes.trim() || undefined,
      region: pinRegion.trim() || undefined,
    };

    let updatedPins: MapPin[];
    if (editingPin) {
      updatedPins = (currentMap.pins || []).map((p) => (p.id === editingPin.id ? pinData : p));
    } else {
      updatedPins = [...(currentMap.pins || []), pinData];
    }

    const updatedMap: InteractiveMapData = {
      ...currentMap,
      pins: updatedPins,
    };

    saveMapChanges(updatedMap);
    setIsAddingPin(false);
    setNewPinCoord(null);
    setEditingPin(null);
    setSelectedPinId(pinData.id);
  };

  const handleDeletePin = (pinId: string) => {
    const pin = currentMap.pins.find((p) => p.id === pinId);
    const pinName = pin ? `"${pin.title}"` : 'este marcador';
    setPinToDelete({ id: pinId, title: pinName });
  };

  const confirmDeletePin = () => {
    if (!pinToDelete) return;
    const pinId = pinToDelete.id;
    const updatedMap: InteractiveMapData = {
      ...currentMap,
      pins: currentMap.pins.filter((p) => p.id !== pinId),
    };
    saveMapChanges(updatedMap);
    if (selectedPinId === pinId) setSelectedPinId(null);
    if (editingPin?.id === pinId) setEditingPin(null);
    setPinToDelete(null);
  };

  const handleDeleteMap = () => {
    if (maps.length <= 1) {
      return;
    }
    setIsDeletingMap(true);
  };

  const confirmDeleteMap = () => {
    HecosStorage.deleteMap(currentMap.id);
    const remainingMaps = maps.filter((m) => m.id !== currentMap.id);
    setMaps(remainingMaps);
    setSelectedMapId(remainingMaps[0]?.id || '');
    setShowMapSettings(false);
    setIsDeletingMap(false);
  };

  const handleStartEditPin = (pin: MapPin) => {
    setEditingPin(pin);
    setPinTitle(pin.title);
    setPinSubtitle(pin.subtitle || '');
    setPinCategory(pin.category);
    setPinDanger(pin.dangerLevel || 'Moderado');
    setPinColor(pin.color || '#00f0ff');
    setPinDesc(pin.description);
    setPinLinkedEntity(pin.linkedEntityId || '');
    setPinVisibility(pin.visibility || (pin.isSecret ? 'gm' : 'all'));
    setPinAllowedUsers(pin.allowedUserIds || []);
    setPinGMNotes(pin.gmNotes || '');
    setPinRegion(pin.region || '');
    setNewPinCoord({ x: pin.x, y: pin.y });
  };

  const centerOnPin = (pin: MapPin) => {
    // Center camera on pin's coordinates
    setSelectedPinId(pin.id);
    setScale(1.5);
    // Rough offset calculation
    const offsetX = (50 - pin.x) * 10;
    const offsetY = (50 - pin.y) * 6;
    setPan({ x: offsetX, y: offsetY });
  };

  const saveMapChanges = (updatedMap: InteractiveMapData) => {
    const updatedMaps = maps.map((m) => (m.id === updatedMap.id ? updatedMap : m));
    if (!updatedMaps.some((m) => m.id === updatedMap.id)) {
      updatedMaps.push(updatedMap);
    }
    setMaps(updatedMaps);
    HecosStorage.saveMaps(updatedMaps);
  };

  const handleSaveMapSettings = () => {
    const updatedMap: InteractiveMapData = {
      ...currentMap,
      title: editMapTitle.trim() || 'Mapa de Hecos',
      description: editMapDesc.trim() || 'Mapa do Cenário',
      imageUrl: editMapUrl.trim() || currentMap.imageUrl,
    };
    saveMapChanges(updatedMap);
    setShowMapSettings(false);
  };

  const handleCreateNewMap = () => {
    const newId = 'map-' + Date.now();
    const newMap: InteractiveMapData = {
      id: newId,
      title: 'Novo Mapa de Hecos',
      description: 'Região inexplorada do cenário',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85',
      pins: [],
    };
    const updatedMaps = [...maps, newMap];
    setMaps(updatedMaps);
    HecosStorage.saveMaps(updatedMaps);
    setSelectedMapId(newId);
    setShowMapSettings(true);
  };

  // Image Upload via ImgBB or Local File
  const handleMapImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMapImage(true);
    setMapImageUploadMsg('Carregando imagem em alta resolução...');

    try {
      // First attempt ImgBB if key is configured, else fallback to Base64 Data URL
      const res = await uploadToImgBB(file, {
        category: 'mapa',
        entityName: currentMap?.title || editMapTitle || 'mapa-hecos',
        role: 'mapa',
        originalFilename: file.name
      });
      if (res.success && res.url) {
        setEditMapUrl(res.url);
        setMapImageUploadMsg('Imagem enviada com sucesso para ImgBB!');
      } else {
        // Fallback to local DataURL so user can immediately see high-res image
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setEditMapUrl(event.target.result as string);
            setMapImageUploadMsg('Imagem local carregada com sucesso!');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // Fallback to Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditMapUrl(event.target.result as string);
          setMapImageUploadMsg('Imagem local carregada em alta resolução!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingMapImage(false);
      setTimeout(() => setMapImageUploadMsg(null), 4000);
    }
  };

  const getPinIcon = (cat: string) => {
    switch (cat) {
      case 'city':
      case 'settlement':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'dungeon':
      case 'ruins':
        return <Skull className="w-3.5 h-3.5" />;
      case 'landmark':
      case 'temple':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'nature':
        return <TreePine className="w-3.5 h-3.5" />;
      case 'hazard':
        return <Flame className="w-3.5 h-3.5" />;
      case 'faction':
        return <Compass className="w-3.5 h-3.5" />;
      default:
        return <PinIcon className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      city: 'Cidade / Forte',
      settlement: 'Assentamento / Vila',
      dungeon: 'Masmorra / Covil',
      ruins: 'Ruínas Antigas',
      landmark: 'Marco / Monumento',
      temple: 'Templo / Santuário',
      nature: 'Bioma / Floresta',
      poi: 'Ponto de Interesse',
      hazard: 'Perigo / Anomalia',
      faction: 'Base de Facção',
    };
    return map[cat] || cat;
  };

  const getDangerBadge = (danger?: string) => {
    switch (danger) {
      case 'Seguro':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
      case 'Baixo':
        return 'bg-teal-950/80 text-teal-300 border-teal-700';
      case 'Moderado':
        return 'bg-amber-950/80 text-amber-300 border-amber-700';
      case 'Perigoso':
        return 'bg-orange-950/80 text-orange-300 border-orange-700';
      case 'Extremo':
      case 'Mortal':
        return 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div
      className={`relative flex flex-col w-full h-full bg-[#050408] rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Map HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#0d0a16]/95 backdrop-blur-md border-b border-zinc-800/80 z-20">
        {/* Left: Map Title & Map Selector */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Compass className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMapId}
                onChange={(e) => {
                  setSelectedMapId(e.target.value);
                  setSelectedPinId(null);
                  resetView();
                }}
                className="bg-transparent text-sm sm:text-base font-extrabold text-zinc-100 hover:text-cyan-300 focus:outline-none cursor-pointer border-b border-dashed border-zinc-700"
              >
                {maps.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#110e1a] text-zinc-200">
                    {m.title}
                  </option>
                ))}
              </select>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                {visiblePins.length} marcos
              </span>
              {isActualGm && (
                <VisibilityBadgeMenu
                  visibility={HecosStorage.getFolderPermission('mapa').visibility}
                  allowedUserIds={HecosStorage.getFolderPermission('mapa').allowedUserIds}
                  onChange={(newVis, newAllowed) => {
                    HecosStorage.setFolderPermission('mapa', newVis, newAllowed);
                  }}
                />
              )}
            </div>
            <p className="text-xs text-zinc-400 line-clamp-1">{currentMap.description}</p>
          </div>
        </div>

        {/* Center/Right HUD Controls: Search, Filters, New Pin, Settings */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar marco no mapa..."
              className="w-36 sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Layer / Category Filter */}
          <div className="flex items-center bg-black/60 rounded-lg p-0.5 border border-zinc-800 text-xs">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#110e1a]">Todas Camadas</option>
              <option value="city" className="bg-[#110e1a]">Cidades & Fortes</option>
              <option value="settlement" className="bg-[#110e1a]">Assentamentos</option>
              <option value="dungeon" className="bg-[#110e1a]">Masmorras & Covis</option>
              <option value="ruins" className="bg-[#110e1a]">Ruínas</option>
              <option value="landmark" className="bg-[#110e1a]">Marcos & Monumentos</option>
              <option value="temple" className="bg-[#110e1a]">Templos & Altares</option>
              <option value="nature" className="bg-[#110e1a]">Natureza & Ermos</option>
              <option value="hazard" className="bg-[#110e1a]">Perigos & Anomalias</option>
              <option value="faction" className="bg-[#110e1a]">Facções</option>
            </select>
          </div>

          {/* GM Secret Toggle */}
          <button
            onClick={() => setShowGMSecrets(!showGMSecrets)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              showGMSecrets
                ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={showGMSecrets ? 'Segredos do GM Visíveis' : 'Segredos do GM Ocultos'}
          >
            {showGMSecrets ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">GM</span>
          </button>

          {/* Gerenciar Pastas button */}
          {isActualGm && (
            <button
              onClick={() => setIsFolderManagerOpen(true)}
              className="p-1.5 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Gerenciar Pastas e Categorias de Mapas"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Gerenciar Pastas</span>
            </button>
          )}

          {/* Map Settings button */}
          <button
            onClick={() => setShowMapSettings(true)}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-cyan-300 transition-colors"
            title="Configurações do Mapa & Trocar Imagem"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Add Pin Action Button */}
          <button
            onClick={() => {
              setIsAddingPin(!isAddingPin);
              setNewPinCoord(null);
              setEditingPin(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAddingPin
                ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingPin ? 'Cancelar' : 'Novo Marcador'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport & Interactive Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapClick}
        className={`relative flex-1 w-full h-full overflow-hidden bg-[#030205] cursor-${
          isAddingPin ? 'crosshair' : isDragging ? 'grabbing' : 'grab'
        } flex items-center justify-center`}
      >
        {/* Banner notification when in Pin Placement Mode */}
        {isAddingPin && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-bold backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-bounce flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Clique em qualquer ponto do mapa para fixar o novo marco de Hecos</span>
          </div>
        )}

        {/* Transformable Canvas with Pan and Zoom */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
          className="relative inline-block select-none shadow-[0_0_100px_rgba(0,0,0,0.9)]"
        >
          {/* High-Resolution Map Image */}
          <div className="relative rounded-2xl overflow-hidden border border-purple-950/50">
            <img
              ref={mapImageRef}
              src={currentMap.imageUrl}
              alt={currentMap.title}
              draggable={false}
              referrerPolicy="no-referrer"
              className="max-w-none w-[1400px] h-[880px] object-cover filter contrast-110 brightness-95"
            />

            {/* Atmosphere overlay layers */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(184,119,219,0.12),transparent_70%)] pointer-events-none" />

            {/* Grid Overlay Option */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage: `linear-gradient(to right, #4FEFEF 1px, transparent 1px), linear-gradient(to bottom, #4FEFEF 1px, transparent 1px)`,
                  backgroundSize: '70px 70px',
                }}
              />
            )}

            {/* Interactive Pins on Map */}
            {visiblePins.map((pin) => {
              const isSelected = selectedPinId === pin.id;
              const isHovered = hoveredPin?.id === pin.id;

              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPinId(pin.id);
                  }}
                  onMouseEnter={() => setHoveredPin(pin)}
                  onMouseLeave={() => setHoveredPin(null)}
                  style={{ top: `${pin.y}%`, left: `${pin.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer focus:outline-none"
                >
                  {/* Glowing Radar Pulse on selected */}
                  {isSelected && (
                    <span
                      style={{ borderColor: pin.color || '#00f0ff' }}
                      className="absolute -inset-2 rounded-full border-2 animate-ping opacity-60 pointer-events-none"
                    />
                  )}

                  {/* Pin Icon Bubble */}
                  <div
                    style={{
                      backgroundColor: pin.color || '#00f0ff',
                      boxShadow: `0 0 16px ${pin.color || '#00f0ff'}80`,
                    }}
                    className={`p-2.5 rounded-full text-zinc-950 border-2 border-white/90 transform transition-all duration-200 ${
                      isSelected
                        ? 'scale-140 ring-4 ring-cyan-400/80 shadow-2xl'
                        : 'group-hover:scale-125'
                    }`}
                  >
                    {getPinIcon(pin.category)}
                  </div>

                  {/* Hover Tooltip Label */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-xl bg-[#0e0c15]/95 border border-zinc-700/80 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-30 min-w-36">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">
                        {getCategoryLabel(pin.category)}
                      </span>
                      {pin.dangerLevel && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ml-auto ${getDangerBadge(
                            pin.dangerLevel
                          )}`}
                        >
                          {pin.dangerLevel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-100 mt-0.5 whitespace-nowrap">
                      {pin.title}
                    </div>
                    {pin.subtitle && (
                      <div className="text-[10px] text-zinc-400 whitespace-nowrap">
                        {pin.subtitle}
                      </div>
                    )}
                    {pin.linkedEntityId && (
                      <div className="text-[9px] text-cyan-300 mt-1 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Artigo do Codex vinculado</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* New Pin Coordinate Indicator Marker */}
            {newPinCoord && (
              <div
                style={{ top: `${newPinCoord.y}%`, left: `${newPinCoord.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-rose-500 text-white animate-pulse shadow-[0_0_25px_#f43f5e] border-2 border-white"
              >
                <PinIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* Selected Pin Details Side Drawer (World Anvil / Obsidian Map Style) */}
        <AnimatePresence>
          {selectedPin && !newPinCoord && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 top-4 bottom-4 z-40 w-96 max-w-[92vw] bg-[#0f0c18]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Header with category and close */}
                <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: `${selectedPin.color || '#00f0ff'}20`, color: selectedPin.color || '#00f0ff', borderColor: `${selectedPin.color || '#00f0ff'}60` }}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      >
                        {getCategoryLabel(selectedPin.category)}
                      </span>
                      {isActualGm ? (
                        <VisibilityBadgeMenu
                          visibility={selectedPin.visibility || (selectedPin.isSecret ? 'gm' : 'all')}
                          allowedUserIds={selectedPin.allowedUserIds || []}
                          isSecret={selectedPin.isSecret}
                          onChange={(newVis, newAllowed) => {
                            const updatedPins = (currentMap.pins || []).map((p) =>
                              p.id === selectedPin.id
                                ? { ...p, visibility: newVis, allowedUserIds: newAllowed, isSecret: newVis === 'gm' }
                                : p
                            );
                            saveMapChanges({ ...currentMap, pins: updatedPins });
                          }}
                        />
                      ) : (
                        selectedPin.isSecret && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>GM Secret</span>
                          </span>
                        )
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold text-zinc-100 mt-1.5 leading-snug">
                      {selectedPin.title}
                    </h3>
                    {selectedPin.subtitle && (
                      <p className="text-xs text-zinc-400">{selectedPin.subtitle}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPinId(null)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Threat / Coordinates info bar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedPin.dangerLevel && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                        Nível de Ameaça
                      </span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded border text-[11px] font-bold ${getDangerBadge(
                          selectedPin.dangerLevel
                        )}`}
                      >
                        {selectedPin.dangerLevel}
                      </span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Coordenadas
                    </span>
                    <span className="font-mono text-xs text-cyan-300 font-bold">
                      X: {selectedPin.x}% • Y: {selectedPin.y}%
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Descrição do Marco
                  </h4>
                  <div className="p-3 rounded-xl bg-black/50 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedPin.description
                      ? renderContentWithMentions(selectedPin.description, onNavigateEntity)
                      : 'Nenhuma descrição detalhada informada.'}
                  </div>
                </div>

                {/* GM Secret Notes */}
                {selectedPin.gmNotes && showGMSecrets && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Segredos Confidenciais do Mestre (GM):</span>
                    </div>
                    <p className="text-rose-200/90 leading-relaxed">{selectedPin.gmNotes}</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-2">
                {/* Hyperlink to full Codex Article */}
                {selectedPin.linkedEntityId && (
                  <button
                    onClick={() => onNavigateEntity(selectedPin.linkedEntityId!)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-900 to-cyan-800 hover:from-cyan-800 hover:to-cyan-700 border border-cyan-500/60 text-cyan-100 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>Abrir Artigo Completo no Codex</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => centerOnPin(selectedPin)}
                    className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1"
                    title="Centralizar câmera"
                  >
                    <Navigation className="w-3 h-3 text-cyan-400" />
                    <span>Focar</span>
                  </button>
                  <button
                    onClick={() => handleStartEditPin(selectedPin)}
                    className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3 h-3 text-purple-400" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeletePin(selectedPin.id)}
                    className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-rose-950 text-rose-300 text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bottom HUD Controls */}
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-[#100d1b]/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-2xl">
          <button
            onClick={() => handleZoom(0.25)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
            title="Aproximar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
            title="Afastar (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
            title="Redefinir Posição (100%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-0.5" />
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
            title="Alternar Grade de Coordenadas"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {currentMap?.imageUrl && (
            <button
              onClick={() => downloadImage(currentMap.imageUrl, `mapa-${slugify(currentMap.title || 'mapa')}-mapa.webp`)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
              title="Baixar Imagem do Mapa (.webp)"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Left Coordinate / Status Indicator */}
        <div className="absolute bottom-4 left-4 z-30 px-3 py-1.5 rounded-lg bg-[#0e0c15]/90 border border-zinc-800 text-[11px] font-mono text-zinc-400 backdrop-blur-sm pointer-events-none flex items-center gap-3 shadow-lg">
          <span>Zoom: {Math.round(scale * 100)}%</span>
          {mouseMapPos && (
            <span>
              Pos: X {mouseMapPos.x}% • Y {mouseMapPos.y}%
            </span>
          )}
        </div>
      </div>

      {/* Pin Creation & Editing Modal */}
      {newPinCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#110e1c] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <PinIcon className="w-5 h-5 text-cyan-400" />
                <span>
                  {editingPin ? 'Editar Marcador de Hecos' : 'Adicionar Novo Marcador ao Mapa'}
                </span>
              </h3>
              <button
                onClick={() => {
                  setNewPinCoord(null);
                  setEditingPin(null);
                  setIsAddingPin(false);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Título do Marco / Local
                </label>
                <input
                  type="text"
                  value={pinTitle}
                  onChange={(e) => setPinTitle(e.target.value)}
                  placeholder="Ex: Templo dos Sussurros, Fortaleza Obsidiana..."
                  autoFocus
                  className="w-full px-3 py-2 text-sm bg-black/60 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Subtítulo / Região
                  </label>
                  <input
                    type="text"
                    value={pinSubtitle}
                    onChange={(e) => setPinSubtitle(e.target.value)}
                    placeholder="Ex: Ermos do Norte • Nível 4"
                    className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Categoria do Local
                  </label>
                  <select
                    value={pinCategory}
                    onChange={(e) => setPinCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-700 rounded-lg text-cyan-300"
                  >
                    <option value="city">Cidade / Forte</option>
                    <option value="settlement">Assentamento / Vila</option>
                    <option value="dungeon">Masmorra / Covil</option>
                    <option value="ruins">Ruínas Antigas</option>
                    <option value="landmark">Marco / Monumento</option>
                    <option value="temple">Templo / Santuário</option>
                    <option value="nature">Bioma / Ermo</option>
                    <option value="hazard">Perigo / Anomalia</option>
                    <option value="faction">Base de Facção</option>
                    <option value="poi">Ponto de Interesse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nível de Ameaça (Perigo)
                  </label>
                  <select
                    value={pinDanger}
                    onChange={(e) => setPinDanger(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200"
                  >
                    <option value="Seguro">Seguro</option>
                    <option value="Baixo">Baixo</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Perigoso">Perigoso</option>
                    <option value="Extremo">Extremo</option>
                    <option value="Mortal">Mortal</option>
                    <option value="Desconhecido">Desconhecido</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Cor do Marcador
                  </label>
                  <div className="flex items-center gap-2">
                    {['#00f0ff', '#b877db', '#be123c', '#f59e0b', '#10b981', '#6366f1'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPinColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          pinColor === c ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Linked Entity Hyperlink Dropdown */}
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Vincular a Artigo do Codex (Hiperlink)
                </label>
                <select
                  value={pinLinkedEntity}
                  onChange={(e) => setPinLinkedEntity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-lg text-cyan-200"
                >
                  <option value="">(Nenhum artigo vinculado)</option>
                  {allEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title} ({ent.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Descrição & Detalhes do Local
                </label>
                <textarea
                  value={pinDesc}
                  onChange={(e) => setPinDesc(e.target.value)}
                  placeholder="História, geografia, perigos conhecidos ou NPCs presentes..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
                />
              </div>

              {/* Visibility & GM Notes Section */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-700/60 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Permissão de Visualização</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPinVisibility('all')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        pinVisibility === 'all'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Todos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinVisibility('gm')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        pinVisibility === 'gm'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-600 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>Apenas GM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinVisibility('custom')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        pinVisibility === 'custom'
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-600 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span>Personalizado</span>
                    </button>
                  </div>
                </div>

                {/* Custom Players selection */}
                {pinVisibility === 'custom' && (
                  <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                      Jogadores com acesso ao marcador:
                    </label>
                    {playerUsers.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic">Nenhum jogador cadastrado no sistema.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto pr-1">
                        {playerUsers.map((u) => {
                          const isChecked = pinAllowedUsers.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPinAllowedUsers([...pinAllowedUsers, u.id]);
                                  } else {
                                    setPinAllowedUsers(pinAllowedUsers.filter((id) => id !== u.id));
                                  }
                                }}
                                className="rounded border-zinc-700 text-indigo-600 bg-zinc-900"
                              />
                              <span className="truncate">{u.name || u.username}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* GM Secret Note */}
                <div className="pt-2 border-t border-zinc-800 space-y-1">
                  <label className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Notas Confidenciais do GM</span>
                  </label>
                  <textarea
                    value={pinGMNotes}
                    onChange={(e) => setPinGMNotes(e.target.value)}
                    placeholder="Notas confidenciais sobre armadilhas, segredos ou tesouros..."
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-black/80 border border-rose-900/60 rounded-lg text-rose-200 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  setNewPinCoord(null);
                  setEditingPin(null);
                  setIsAddingPin(false);
                }}
                className="px-4 py-2 text-xs rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePin}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                {editingPin ? 'Atualizar Marcador' : 'Fixar no Mapa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Settings & High-Res Image Configuration Modal */}
      {showMapSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#110e1c] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span>Configurações & Imagem do Mapa</span>
              </h3>
              <button
                onClick={() => setShowMapSettings(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nome do Mapa
                </label>
                <input
                  type="text"
                  value={editMapTitle}
                  onChange={(e) => setEditMapTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/60 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Descrição Curta
                </label>
                <input
                  type="text"
                  value={editMapDesc}
                  onChange={(e) => setEditMapDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Map Image URL & File Upload with ImageUploadInput */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
                <ImageUploadInput
                  value={editMapUrl}
                  onChange={setEditMapUrl}
                  label="Imagem do Mapa em Alta Resolução"
                  placeholder="https://... ou faça upload direto para o ImgBB"
                  showPreview={true}
                  category="mapa"
                  entityName={currentMap?.title || editMapTitle || 'mapa-hecos'}
                  role="mapa"
                />
              </div>

              {/* Map Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleCreateNewMap}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-700 text-purple-300 text-xs font-medium hover:bg-purple-900 transition-colors flex items-center gap-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Criar Novo Mapa</span>
                </button>

                {maps.length > 1 && (
                  <button
                    onClick={handleDeleteMap}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium hover:bg-rose-900 transition-colors flex items-center gap-1.5"
                    title="Excluir este mapa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Mapa</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowMapSettings(false)}
                className="px-4 py-2 text-xs rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Fechar
              </button>
              <button
                onClick={handleSaveMapSettings}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!pinToDelete}
        title="Excluir Marcador do Mapa"
        message={`Tem certeza de que deseja remover ${pinToDelete?.title} deste mapa de Hecos?\n\nEsta ação removerá o ponto de interesse permanentemente.`}
        confirmLabel="Excluir Marcador"
        cancelLabel="Cancelar"
        onConfirm={confirmDeletePin}
        onCancel={() => setPinToDelete(null)}
      />

      <ConfirmModal
        isOpen={isDeletingMap}
        title="Excluir Mapa de Hecos"
        message={`Tem certeza de que deseja excluir o mapa "${currentMap.title}" e todos os seus marcadores?\n\nEsta ação não poderá ser desfeita.`}
        confirmLabel="Excluir Mapa"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteMap}
        onCancel={() => setIsDeletingMap(false)}
      />

      {/* Universal Folder Manager Modal for Maps */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          onClose={() => setIsFolderManagerOpen(false)}
          scope="map"
          categories={[
            { id: 'all', name: 'Todos os Mapas' },
            { id: 'regional', name: 'Mapas Regionais' },
            { id: 'cities', name: 'Cidades & Assentamentos' },
            { id: 'dungeons', name: 'Masmorras & Covis' },
            { id: 'battlemaps', name: 'Mapas Táticos de Batalha' }
          ]}
          entities={[]}
          themeColor="cyan"
          onRefresh={() => setMaps(HecosStorage.getMaps())}
        />
      )}
    </div>
  );
};

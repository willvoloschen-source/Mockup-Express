/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Box,
  Image as ImageIcon,
  Wand2,
  Layers,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Shirt,
  Move,
  Maximize,
  RotateCcw,
  ArrowRight,
  Package,
  Menu,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Sliders,
  CreditCard,
  Zap,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Copy,
  Palette,
  MapPin,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './components/Button';
import { FileUploader } from './components/FileUploader';
import { generateMockup, generateAsset } from './services/geminiService';
import { Asset, GeneratedMockup, AppView, LoadingState, PlacedLayer, RealismSettings } from './types';
import { DEFAULT_PRODUCTS, DEFAULT_LOGOS } from './presetAssets';
import { getBoxMappingProfile, BoxMappingProfile, MappedBoxArea } from './boxMappingRules';
import { useApiKey } from './hooks/useApiKey';
import ApiKeyDialog from './components/ApiKeyDialog';

// --- Navegação Lateral / Abas ---

const NavButton = ({
  icon,
  label,
  active,
  onClick,
  number,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  number?: number;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg transition-colors group text-left ${
      active
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
    }`}
  >
    <span className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
      {icon}
    </span>
    <span className="text-sm tracking-tight flex-1 whitespace-nowrap truncate">{label}</span>
    {number !== undefined && (
      <span
        className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md min-w-[1.25rem] text-center ${
          active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
        }`}
      >
        {number}
      </span>
    )}
  </button>
);

// --- Stepper do Fluxo do Estúdio ---

const WorkflowStepper = ({
  currentView,
  onViewChange,
}: {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}) => {
  const steps = [
    { id: 'assets', label: '1. Ativos & Modelos', number: 1 },
    { id: 'studio', label: '2. Estúdio & Montagem', number: 2 },
    { id: 'gallery', label: '3. Galeria & Download', number: 3 },
  ];

  const viewOrder = ['assets', 'studio', 'gallery'];
  const currentIndex = viewOrder.indexOf(currentView);
  const progress = Math.max(0, (currentIndex / (steps.length - 1)) * 100);

  return (
    <div className="w-full max-w-xl mx-auto mb-8 hidden md:block">
      <div className="relative">
        {/* Linha de Fundo */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 rounded-full"></div>

        {/* Linha de Progresso Ativa */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>

        <div className="relative flex justify-between w-full">
          {steps.map((step, index) => {
            const isCompleted = currentIndex > index;
            const isCurrent = currentIndex === index;

            return (
              <button
                key={step.id}
                onClick={() => onViewChange(step.id as AppView)}
                className="group flex flex-col items-center focus:outline-none relative z-10 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-mono font-bold transition-all bg-white ${
                    isCurrent
                      ? 'border-indigo-600 text-indigo-600 shadow-sm ring-4 ring-indigo-50'
                      : isCompleted
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.number}
                </div>
                <span
                  className={`mt-2 text-xs tracking-tight transition-colors whitespace-nowrap ${
                    isCurrent
                      ? 'text-indigo-600 font-semibold'
                      : isCompleted
                      ? 'text-slate-700 font-medium'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Componente da Seção de Ativos ---

const AssetSection = ({
  title,
  icon,
  type,
  assets,
  onAdd,
  onRemove,
  validateApiKey,
  onApiError,
}: {
  title: string;
  icon: React.ReactNode;
  type: 'logo' | 'product';
  assets: Asset[];
  onAdd: (a: Asset) => void;
  onRemove: (id: string) => void;
  validateApiKey: () => Promise<boolean>;
  onApiError: (e: any) => void;
}) => {
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;

    if (!(await validateApiKey())) return;

    setIsGenerating(true);
    try {
      const b64 = await generateAsset(genPrompt, type);
      onAdd({
        id: Math.random().toString(36).substring(2, 9),
        type,
        name: genPrompt.slice(0, 30),
        data: b64,
        mimeType: 'image/png',
      });
      setGenPrompt('');
    } catch (e: any) {
      console.error(e);
      onApiError(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <span className="text-indigo-600">{icon}</span>
          {title}
        </h2>
        <span className="text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
          {assets.length} {assets.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Grade de Ativos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 overflow-y-auto max-h-[360px] pr-1">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="relative group aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-200 p-2 flex flex-col items-center justify-center hover:border-indigo-300 transition-colors"
          >
            <img src={asset.data} className="w-full h-full object-contain" alt={asset.name} />
            <div className="absolute inset-x-0 bottom-0 bg-slate-900/75 backdrop-blur-xs p-1 text-[10px] text-white font-medium truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
              {asset.name}
            </div>
            <button
              onClick={() => onRemove(asset.id)}
              className="absolute top-1.5 right-1.5 p-1 bg-white text-rose-600 border border-slate-200 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 shadow-xs transition-opacity"
              title="Remover"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="col-span-2 sm:col-span-3 flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <p className="text-xs">Nenhum item adicionado</p>
          </div>
        )}
      </div>

      {/* Área de Criação / Upload */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-3">
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carregar Arquivo
          </button>
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'generate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gerar com IA
          </button>
        </div>

        {mode === 'upload' ? (
          <FileUploader
            label={`Carregar ${type === 'product' ? 'Foto de Produto' : 'Logo ou Estampa'}`}
            onFileSelect={(f) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                onAdd({
                  id: Math.random().toString(36).substring(2, 9),
                  type,
                  name: f.name.replace(/\.[^/.]+$/, ''),
                  data: e.target?.result as string,
                  mimeType: f.type || 'image/png',
                });
              };
              reader.readAsDataURL(f);
            }}
          />
        ) : (
          <div className="space-y-2.5">
            <textarea
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder={
                type === 'product'
                  ? 'Ex: Garrafa térmica preta fosca em estúdio fotográfico...'
                  : 'Ex: Logo minimalista moderno de café com traço fino...'
              }
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none h-20"
            />
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!genPrompt.trim()}
              size="sm"
              className="w-full"
              icon={<Sparkles size={14} />}
            >
              Criar {type === 'product' ? 'Produto' : 'Logo'} com IA
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Componente Principal: App ---

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Inicializa com as fotos e logos profissionais geradas
  const [assets, setAssets] = useState<Asset[]>([
    ...DEFAULT_PRODUCTS,
    ...DEFAULT_LOGOS,
  ]);

  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([
    {
      id: 'demo-mockup-1',
      imageUrl: '/assets/aistudio/Caixa_Milk_2068d026.jpeg',
      prompt: 'Caixa Milk personalizada tema Safári Baby para lembrancinha de festa infantil',
      createdAt: Date.now() - 3600000 * 1,
      productName: 'Caixa Milk (Papelaria Personalizada)',
    },
    {
      id: 'demo-mockup-2',
      imageUrl: '/assets/aistudio/Caixa_Canudo_1a2e18f7.jpeg',
      prompt: 'Caixa Canudo com suporte e tema Jardim Encantado com laço de cetim',
      createdAt: Date.now() - 3600000 * 3,
      productName: 'Caixa Canudo (Lembrancinha)',
    },
    {
      id: 'demo-mockup-3',
      imageUrl: '/assets/aistudio/Caixa_Piramide_bdc1cd76.jpeg',
      prompt: 'Caixa Pirâmide / Cone com aplique de nuvem e estrelas em relevo',
      createdAt: Date.now() - 3600000 * 6,
      productName: 'Caixa Pirâmide com Topo',
    },
    {
      id: 'demo-mockup-4',
      imageUrl: '/assets/aistudio/Caixa_Cora__o_ef6be667.jpeg',
      prompt: 'Caixa Coração com alça rendada e tema delicado para doces finos',
      createdAt: Date.now() - 3600000 * 9,
      productName: 'Caixa Coração com Alça',
    },
  ]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<GeneratedMockup | null>(null);

  // Filtro de categoria no catálogo
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'embalagens' | 'vestuario' | 'acessorios'>('todos');

  // Estados do Estúdio (inicializa na Caixa Milk com a arte dos personagens e auto-ajuste inteligente)
  const [selectedProductId, setSelectedProductId] = useState<string | null>('prod-caixa-milk');
  const [placedLogos, setPlacedLogos] = useState<PlacedLayer[]>([
    {
      uid: 'init-layer-1',
      assetId: 'logo-patrulha-canina',
      x: 50,
      y: 55,
      scale: 1.25,
      rotation: 0,
    },
  ]);
  const [selectedLayerUid, setSelectedLayerUid] = useState<string | null>('init-layer-1');
  const [prompt, setPrompt] = useState(
    'Auto-ajuste inteligente: se for um desenho, centralize perfeitamente na face da caixa e sugira cores harmônicas extraídas da própria arte para preencher os cantos vazios e abas.'
  );
  const [loading, setLoading] = useState<LoadingState>({ isGenerating: false, message: '' });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasViewMode, setCanvasViewMode] = useState<'assembled' | 'dieline'>('assembled');
  const [showMapGuide, setShowMapGuide] = useState(true);
  const [showMapRulesModal, setShowMapRulesModal] = useState(false);
  const currentBoxProfile = getBoxMappingProfile(selectedProductId);

  // Estados do Motor de Fotorrealismo (Skill de Imagem)
  const [isRealismEngineActive, setIsRealismEngineActive] = useState<boolean>(true);
  const [realismSettings, setRealismSettings] = useState<RealismSettings>({
    paperFinish: 'offset-180g',
    dimensionalStyle: 'layer-3d-foam',
    lightingStyle: 'studio-softbox',
    environmentScene: 'clean-cyclorama',
    accessories: {
      satinRibbon: true,
      paperStraw: true,
      rhinestones: false,
    },
  });
  const [realismTab, setRealismTab] = useState<'paper' | '3d' | 'light' | 'scene' | 'acc'>('paper');

  const applyRealismPreset = (preset: 'scrap-luxo' | 'estudio-clean' | 'festa-real' | 'kraft-rustico') => {
    setIsRealismEngineActive(true);
    if (preset === 'scrap-luxo') {
      setRealismSettings({
        paperFinish: 'offset-180g',
        dimensionalStyle: 'layer-3d-foam',
        lightingStyle: 'studio-softbox',
        environmentScene: 'clean-cyclorama',
        accessories: { satinRibbon: true, paperStraw: true, rhinestones: true },
      });
      setPrompt(
        'Fotorrealismo Scrapfesta Luxo 3D: auto-ajuste da ilustração centralizada na caixa em papel offset 180g fosco, com aplique 3D em camadas elevadas por fita banana (sombra projetada realística), laço de cetim impecável e cores harmônicas complementando os cantos vazios.'
      );
    } else if (preset === 'estudio-clean') {
      setRealismSettings({
        paperFinish: 'offset-180g',
        dimensionalStyle: 'white-border-scrap',
        lightingStyle: 'studio-softbox',
        environmentScene: 'clean-cyclorama',
        accessories: { satinRibbon: false, paperStraw: false, rhinestones: false },
      });
      setPrompt(
        'Catálogo Comercial Fotorrealista: iluminação de estúdio comercial com softbox 3 pontos, sombra de contato realista no solo (ambient occlusion), arte com borda de corte 1mm perfeitamente integrada à face da caixa.'
      );
    } else if (preset === 'festa-real') {
      setRealismSettings({
        paperFinish: 'glossy-photographic',
        dimensionalStyle: 'layer-3d-foam',
        lightingStyle: 'warm-party',
        environmentScene: 'party-table-bokeh',
        accessories: { satinRibbon: true, paperStraw: true, rhinestones: false },
      });
      setPrompt(
        'Fotografia de Mesa de Festa: iluminação calorosa aconchegante, mesa com docinhos delicadamente desfocados em bokeh f/2.8 ao fundo, papel fotográfico com cores vivas e laço com brilho acetinado natural.'
      );
    } else if (preset === 'kraft-rustico') {
      setRealismSettings({
        paperFinish: 'matte-kraft',
        dimensionalStyle: 'layer-3d-foam',
        lightingStyle: 'natural-window',
        environmentScene: 'wood-craft-table',
        accessories: { satinRibbon: false, paperStraw: true, rhinestones: false },
      });
      setPrompt(
        'Estilo Kraft Rústico Artesanal: papel kraft 200g com fibras naturais de madeira, luz suave de janela lateral matinal sobre bancada de madeira limpa, aplique artesanal e toque acolhedor.'
      );
    }
  };

  // Atribuição de Camada a uma Área Mapeada pelo Método MAP
  const assignLayerToArea = (layerUid: string, area: MappedBoxArea) => {
    setPlacedLogos((prev) =>
      prev.map((l) => {
        if (l.uid !== layerUid) return l;
        return {
          ...l,
          x: area.x,
          y: area.y,
          scale: area.recommendedScale,
          rotation: 0,
          targetAreaId: area.id,
          targetAreaCode: area.code,
        };
      })
    );
    setSelectedLayerUid(layerUid);
    setPrompt(
      `Mapa confirmado (Método MAP): Área ${area.code} (${area.name}) com arte auto-ajustada, cores harmônicas preenchendo cantos vazios e preservação técnica dos vincos e dobras do papel.`
    );
  };

  // Gerenciamento de Chave API
  const { showApiKeyDialog, setShowApiKeyDialog, validateApiKey, handleApiKeyDialogContinue } = useApiKey();

  // Tratamento de Erros da API
  const handleApiError = (error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    let shouldOpenDialog = false;

    if (
      errorMessage.includes('Requested entity was not found') ||
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('PERMISSION_DENIED') ||
      errorMessage.includes('403')
    ) {
      console.warn('Problema de Chave de API ou Permissão:', errorMessage);
      shouldOpenDialog = true;
    }

    if (shouldOpenDialog) {
      setShowApiKeyDialog(true);
    } else {
      alert(`Falha na operação: ${errorMessage}`);
    }
  };

  // Drag & Drop no Canvas do Estúdio
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<{
    uid: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  // Upload Direto e Referência de Arquivos no Estúdio
  const studioFileInputRef = useRef<HTMLInputElement>(null);

  const duplicateLayer = (uid: string) => {
    const existing = placedLogos.find((l) => l.uid === uid);
    if (!existing) return;
    const newUid = Math.random().toString(36).substring(2, 9);
    const duplicated: PlacedLayer = {
      ...existing,
      uid: newUid,
      x: Math.min(85, existing.x + 6),
      y: Math.min(85, existing.y + 6),
    };
    setPlacedLogos((prev) => [...prev, duplicated]);
    setSelectedLayerUid(newUid);
  };

  const autoFitLayer = (uid: string, mode: 'face' | 'full' | 'center' | 'top' | 'bottom') => {
    setPlacedLogos((prev) =>
      prev.map((l) => {
        if (l.uid !== uid) return l;
        if (mode === 'center') {
          return { ...l, x: 50, y: 55, rotation: 0 };
        } else if (mode === 'top') {
          // Posiciona na aba superior / topo da caixa
          return { ...l, x: 50, y: 22, scale: 0.9, rotation: 0 };
        } else if (mode === 'bottom') {
          // Posiciona no rodapé / base frontal
          return { ...l, x: 50, y: 78, scale: 0.9, rotation: 0 };
        } else if (mode === 'face') {
          // Ajusta à face frontal da caixa com proporção equilibrada
          return { ...l, x: 50, y: 55, scale: 1.45, rotation: 0 };
        } else {
          // Preenchimento total de margem a margem (full bleed)
          return { ...l, x: 50, y: 55, scale: 1.85, rotation: 0 };
        }
      })
    );
  };

  const handleStudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newAsset: Asset = {
          id: Math.random().toString(36).substring(2, 9),
          type: 'logo',
          name: file.name.replace(/\.[^/.]+$/, ''),
          data: uploadEvent.target?.result as string,
          mimeType: file.type || 'image/png',
          category: 'logos',
        };
        setAssets((prev) => [newAsset, ...prev]);
        addLogoToCanvas(newAsset.id);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const addLogoToCanvas = (assetId: string) => {
    const newUid = Math.random().toString(36).substring(2, 9);
    const newLayer: PlacedLayer = {
      uid: newUid,
      assetId,
      x: 50,
      y: 52,
      scale: 1.2,
      rotation: 0,
    };
    setPlacedLogos((prev) => [...prev, newLayer]);
    setSelectedLayerUid(newUid);
  };

  const removeLogoFromCanvas = (uid: string, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setPlacedLogos((prev) => prev.filter((l) => l.uid !== uid));
    if (selectedLayerUid === uid) {
      setSelectedLayerUid(null);
    }
  };

  const handleStart = (clientX: number, clientY: number, layer: PlacedLayer) => {
    setSelectedLayerUid(layer.uid);
    setDraggedItem({
      uid: layer.uid,
      startX: clientX,
      startY: clientY,
      initX: layer.x,
      initY: layer.y,
    });
  };

  const handleMouseDown = (e: React.MouseEvent, layer: PlacedLayer) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX, e.clientY, layer);
  };

  const handleTouchStart = (e: React.TouchEvent, layer: PlacedLayer) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, layer);
  };

  const handleWheel = (e: React.WheelEvent, layerId: string) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setPlacedLogos((prev) =>
      prev.map((l) => {
        if (l.uid !== layerId) return l;
        const newScale = Math.max(0.2, Math.min(3.0, Number((l.scale + delta).toFixed(2))));
        return { ...l, scale: newScale };
      })
    );
  };

  // Movimentação global do drag
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!draggedItem || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = clientX - draggedItem.startX;
      const deltaY = clientY - draggedItem.startY;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      setPlacedLogos((prev) =>
        prev.map((l) => {
          if (l.uid !== draggedItem.uid) return l;
          return {
            ...l,
            x: Math.max(5, Math.min(95, draggedItem.initX + deltaXPercent)),
            y: Math.max(5, Math.min(95, draggedItem.initY + deltaYPercent)),
          };
        })
      );
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setDraggedItem(null);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (draggedItem) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setDraggedItem(null);
    };

    if (draggedItem) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [draggedItem]);

  // Ação de Geração com IA
  const handleGenerate = async () => {
    const product = assets.find((a) => a.id === selectedProductId);
    if (!product) {
      alert('Por favor, selecione um produto base para o mockup.');
      return;
    }

    const layers = placedLogos
      .map((layer) => {
        const asset = assets.find((a) => a.id === layer.assetId);
        return asset ? { asset, placement: layer } : null;
      })
      .filter(Boolean) as { asset: Asset; placement: PlacedLayer }[];

    if (layers.length === 0) {
      alert('Por favor, adicione pelo menos uma logo ou estampa sobre o produto.');
      return;
    }

    if (!(await validateApiKey())) {
      return;
    }

    const currentPrompt = prompt || 'Renderizar com iluminação suave de estúdio e dobras naturais.';

    setLoading({ isGenerating: true, message: isRealismEngineActive ? 'Aplicando motor de fotorrealismo, física do papel e sombras de estúdio...' : 'Processando geometria e adaptando sombras de estúdio...' });
    try {
      const resultImage = await generateMockup(
        product,
        layers,
        currentPrompt,
        isRealismEngineActive ? realismSettings : undefined
      );

      const newMockup: GeneratedMockup = {
        id: Math.random().toString(36).substring(2, 9),
        imageUrl: resultImage,
        prompt: currentPrompt,
        createdAt: Date.now(),
        layers: placedLogos,
        productId: selectedProductId,
        productName: product.name,
        realism: isRealismEngineActive ? realismSettings : undefined,
      };

      setGeneratedMockups((prev) => [newMockup, ...prev]);
      setView('gallery');
    } catch (e: any) {
      console.error(e);
      handleApiError(e);
    } finally {
      setLoading({ isGenerating: false, message: '' });
    }
  };

  const activeLayer = placedLogos.find((l) => l.uid === selectedLayerUid) || placedLogos[0];

  const quickPromptTags = [
    '✨ Scrapfesta 3D Luxo com fita banana e laço de cetim',
    '📦 Papel offset 180g fosco com cores harmônicas nos cantos',
    '📸 Macro 85mm f/4.0 com iluminação softbox 3 pontos',
    '🎨 Auto-ajustar desenho e sugerir cores da arte para abas',
    '🎂 Fotografia em mesa de aniversário com bokeh suave f/2.8',
    '🌿 Papel Kraft rústico 200g com luz natural de janela',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Dialog da Chave de API */}
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

      {/* Barra de Navegação Lateral (Desktop) */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex flex-col shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200 flex items-center px-5 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Package size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 tracking-tight leading-none">Mockup Express</h1>
            <p className="text-[11px] text-slate-500 font-medium">SaaS Studio IA</p>
          </div>
        </div>

        {/* Menu Principal */}
        <div className="p-3 space-y-1 flex-1">
          <NavButton
            icon={<Layout size={18} />}
            label="Visão Geral"
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
          <NavButton
            icon={<Box size={18} />}
            label="Biblioteca de Ativos"
            active={view === 'assets'}
            number={1}
            onClick={() => setView('assets')}
          />
          <NavButton
            icon={<Wand2 size={18} />}
            label="Estúdio de Mockups"
            active={view === 'studio'}
            number={2}
            onClick={() => setView('studio')}
          />
          <NavButton
            icon={<ImageIcon size={18} />}
            label="Galeria de Renderizações"
            active={view === 'gallery'}
            number={3}
            onClick={() => setView('gallery')}
          />
          <NavButton
            icon={<CreditCard size={18} />}
            label="Planos & Créditos"
            active={view === 'pricing'}
            onClick={() => setView('pricing')}
          />
        </div>

        {/* Card de Assinatura no Rodapé da Barra Lateral */}
        <div className="p-3 border-t border-slate-200">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-800">Plano Pro</span>
              <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Ativo
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-indigo-600 h-full rounded-full w-3/5"></div>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              <strong className="text-slate-800 font-mono">25</strong> de 50 mockups este mês
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs justify-center"
              onClick={() => setView('pricing')}
            >
              Gerenciar Assinatura
            </Button>
          </div>
        </div>
      </aside>

      {/* Top Bar Móvel */}
      <div className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white">
            <Package size={16} />
          </div>
          <span className="font-bold text-sm text-slate-900">Mockup Express</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900"
          aria-label="Abrir Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Dropdown Menu Móvel */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-white p-4 animate-fade-in flex flex-col border-b border-slate-200">
          <div className="space-y-1">
            <NavButton
              icon={<Layout size={18} />}
              label="Visão Geral"
              active={view === 'dashboard'}
              onClick={() => {
                setView('dashboard');
                setIsMobileMenuOpen(false);
              }}
            />
            <NavButton
              icon={<Box size={18} />}
              label="Biblioteca de Ativos"
              active={view === 'assets'}
              number={1}
              onClick={() => {
                setView('assets');
                setIsMobileMenuOpen(false);
              }}
            />
            <NavButton
              icon={<Wand2 size={18} />}
              label="Estúdio de Mockups"
              active={view === 'studio'}
              number={2}
              onClick={() => {
                setView('studio');
                setIsMobileMenuOpen(false);
              }}
            />
            <NavButton
              icon={<ImageIcon size={18} />}
              label="Galeria de Renderizações"
              active={view === 'gallery'}
              number={3}
              onClick={() => {
                setView('gallery');
                setIsMobileMenuOpen(false);
              }}
            />
            <NavButton
              icon={<CreditCard size={18} />}
              label="Planos & Créditos"
              active={view === 'pricing'}
              onClick={() => {
                setView('pricing');
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Lightbox do Mockup em Tela Cheia */}
      {selectedMockup && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedMockup(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">
                  {selectedMockup.productName || 'Mockup de Produto'}
                </h3>
                <p className="text-xs text-slate-500">
                  Criado em {new Date(selectedMockup.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedMockup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative aspect-square sm:aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden p-4">
              <img
                src={selectedMockup.imageUrl}
                alt="Visualização do Mockup"
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-600 truncate max-w-md">
                <strong>Instrução:</strong> {selectedMockup.prompt || 'Renderização padrão'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMockup(null);
                    setView('studio');
                  }}
                >
                  Abrir no Estúdio
                </Button>
                <a href={selectedMockup.imageUrl} download={`mockup-${selectedMockup.id}.png`}>
                  <Button size="sm" icon={<Download size={15} />}>
                    Baixar PNG
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Educativo: Regras Técnicas do Método MAP */}
      {showMapRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Regras de Áreas Mapeadas (Método MAP)</h3>
                  <p className="text-[11px] text-slate-500">Mapeamento Geométrico para Personalização de Papelaria</p>
                </div>
              </div>
              <button
                onClick={() => setShowMapRulesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  Regra Central do Método MAP
                </h4>
                <p className="text-indigo-900 leading-relaxed text-[11px]">
                  "Reconheça os espaços geométricos, atribua identificadores estáveis (A, B, C), confirme o mapa de composição e nunca distorça as linhas e vincos do molde original."
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Áreas Identificadas no Modelo Atual ({currentBoxProfile.productName}):
                </h4>
                <div className="space-y-1.5">
                  {currentBoxProfile.areas.map((area) => (
                    <div
                      key={area.id}
                      className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start gap-2.5"
                    >
                      <span
                        className={`w-5 h-5 rounded text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${area.badgeBg}`}
                      >
                        {area.code}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {area.name} <span className="text-slate-400 font-normal">({area.roleLabel})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{area.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">Preservação Técnica & Não-Distorção:</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  {currentBoxProfile.technicalPreservation.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                <strong>Sangria e Cantos Vazios:</strong> Cantos e abas sem arte direta são preenchidos automaticamente com cores e degradês harmônicos extraídos da própria paleta do personagem.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" onClick={() => setShowMapRulesModal(false)}>
                Entendi, fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto relative flex flex-col min-w-0">
        {/* Top Header Contract (3 Zonas) */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-8 px-6 md:px-8">
          {/* Zona 1: Trilha de Navegação */}
          <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap shrink-0">
            <span>Mockup Express</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold capitalize">
              {view === 'dashboard'
                ? 'Visão Geral'
                : view === 'assets'
                ? 'Biblioteca de Ativos'
                : view === 'studio'
                ? 'Estúdio de Criação'
                : view === 'gallery'
                ? 'Galeria de Mockups'
                : 'Planos & Créditos'}
            </span>
          </div>

          {/* Zona 2: Links Rápidos */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
            <button
              onClick={() => setView('dashboard')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 ${
                view === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Início
            </button>
            <button
              onClick={() => setView('assets')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 ${
                view === 'assets' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Modelos Base
            </button>
            <button
              onClick={() => setView('studio')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 ${
                view === 'studio' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Estúdio
            </button>
            <button
              onClick={() => setView('gallery')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 ${
                view === 'gallery' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Galeria
            </button>
          </nav>

          {/* Zona 3: Ação Primária & Créditos */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
              <Sparkles size={13} className="text-indigo-600" />
              <span>25 créditos</span>
            </span>
            <Button
              size="sm"
              onClick={() => setView('studio')}
              icon={<Wand2 size={14} />}
            >
              Novo Mockup
            </Button>
          </div>
        </header>

        {/* Container das Telas */}
        <div className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
          {/* ======================================================== */}
          {/* TELA: DASHBOARD / VISÃO GERAL */}
          {/* ======================================================== */}
          {view === 'dashboard' && (
            <div className="animate-fade-in space-y-8">
              {/* Hero Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
                <div className="max-w-2xl relative z-10">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md mb-4 border border-indigo-100">
                    <Sparkles size={13} />
                    <span>Estúdio de Fotografia Virtual com IA</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    Mockups de produtos realistas sem fotógrafo ou estúdio físico.
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                    Selecione suas peças de vestuário ou brindes, aplique sua arte com precisão de malha e gere
                    imagens comerciais com dobras, iluminação volumétrica e sombras perfeitas.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => setView('studio')}
                      icon={<ArrowRight size={16} />}
                    >
                      Criar Mockup Agora
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => setView('assets')}
                      icon={<FolderOpen size={16} />}
                    >
                      Ver Biblioteca de Modelos
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tiras de Métricas do SaaS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Mockups Criados', value: '142', unit: 'imagens' },
                  { label: 'Tempo de Render', value: '2.4s', unit: 'médio' },
                  { label: 'Modelos Prontos', value: '5', unit: 'produtos base' },
                  { label: 'Resolução de Saída', value: '4K', unit: 'Ultra HD' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{stat.value}</span>
                      <span className="text-xs text-slate-500">{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modelos Fotográficos Prontos */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Modelos Prontos para Uso</h3>
                    <p className="text-xs text-slate-500">
                      Fotografias de alta resolução prontas para receber sua estampa ou tema personalizado.
                    </p>
                  </div>

                  {/* Filtros de Categoria */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                    {[
                      { id: 'todos', label: 'Todos (9)' },
                      { id: 'embalagens', label: 'Caixas de Festa (4)' },
                      { id: 'vestuario', label: 'Vestuário (3)' },
                      { id: 'acessorios', label: 'Brindes (2)' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {DEFAULT_PRODUCTS.filter((p) => selectedCategory === 'todos' || p.category === selectedCategory).map((prod) => (
                    <div
                      key={prod.id}
                      className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden p-3 flex items-center justify-center">
                        <img
                          src={prod.data}
                          alt={prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 border-t border-slate-100 flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600">
                            {prod.category === 'embalagens' ? 'Caixa de Festa' : prod.category === 'vestuario' ? 'Vestuário' : 'Brinde'}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">{prod.name}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full text-xs justify-center"
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setView('studio');
                          }}
                        >
                          Usar Modelo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diferenciais da Plataforma */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {[
                  {
                    icon: <Box className="text-indigo-600" size={20} />,
                    title: 'Mapeamento Tridimensional',
                    desc: 'A IA calcula as curvas e vincos do tecido para que sua logo dobre de forma natural e fotorrealista.',
                  },
                  {
                    icon: <Wand2 className="text-indigo-600" size={20} />,
                    title: 'Iluminação & Sombras de Estúdio',
                    desc: 'Sem recortes artificiais: luzes e sombras do produto são aplicadas sobre a arte como em uma foto real.',
                  },
                  {
                    icon: <Download className="text-indigo-600" size={20} />,
                    title: 'Exportação para E-commerce',
                    desc: 'Gere fotos de catálogo em formato PNG cristalino prontas para Shopify, Mercado Livre e redes sociais.',
                  },
                ].map((feat, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                      {feat.icon}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{feat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Rodapé SaaS */}
              <footer className="pt-8 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  © 2026 Mockup Express SAAS. As marcas e arquivos carregados pertencem aos seus respectivos proprietários.
                  Geração de imagens alimentada por modelos multimodais de inteligência artificial.
                </p>
              </footer>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELA: ATIVOS / BIBLIOTECA */}
          {/* ======================================================== */}
          {view === 'assets' && (
            <div className="animate-fade-in space-y-6">
              <WorkflowStepper currentView="assets" onViewChange={setView} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seção de Produtos */}
                <AssetSection
                  title="Produtos Base para Mockup"
                  icon={<Box size={18} />}
                  type="product"
                  assets={assets.filter((a) => a.type === 'product')}
                  onAdd={(a) => setAssets((prev) => [...prev, a])}
                  onRemove={(id) => setAssets((prev) => prev.filter((a) => a.id !== id))}
                  validateApiKey={validateApiKey}
                  onApiError={handleApiError}
                />

                {/* Seção de Logos e Estampas */}
                <AssetSection
                  title="Logos, Marcas & Estampas"
                  icon={<Layers size={18} />}
                  type="logo"
                  assets={assets.filter((a) => a.type === 'logo')}
                  onAdd={(a) => setAssets((prev) => [...prev, a])}
                  onRemove={(id) => setAssets((prev) => prev.filter((a) => a.id !== id))}
                  validateApiKey={validateApiKey}
                  onApiError={handleApiError}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Dica: Logos em PNG com fundo transparente ou SVG garantem o melhor resultado no mockup.
                </p>
                <Button
                  onClick={() => setView('studio')}
                  disabled={assets.filter((a) => a.type === 'product').length === 0}
                  icon={<ArrowRight size={16} />}
                >
                  Continuar para o Estúdio
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELA: ESTÚDIO DE CRIAÇÃO */}
          {/* ======================================================== */}
          {view === 'studio' && (
            <div className="animate-fade-in flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)]">
              {/* Coluna Esquerda: Painel de Controle */}
              <div className="w-full lg:w-96 flex flex-col gap-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs overflow-y-auto shrink-0">
                {/* Passo 1: Selecionar Produto */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      1. Escolha o Produto Base
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {assets.filter((a) => a.type === 'product').length} modelos
                    </span>
                  </div>

                  {/* Nome do Produto Selecionado */}
                  <div className="mb-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1 truncate">
                    {assets.find((a) => a.id === selectedProductId)?.name || 'Nenhum produto selecionado'}
                  </div>

                  {/* Filtro Rápido no Estúdio */}
                  <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-0.5 scrollbar-hide text-[11px]">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'embalagens', label: 'Caixas de Festa' },
                      { id: 'vestuario', label: 'Vestuário' },
                      { id: 'acessorios', label: 'Brindes' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {assets
                      .filter((a) => a.type === 'product' && (selectedCategory === 'todos' || a.category === selectedCategory))
                      .map((prod) => {
                        const isSelected = selectedProductId === prod.id;
                        return (
                          <div
                            key={prod.id}
                            onClick={() => setSelectedProductId(prod.id)}
                            className={`group relative aspect-square rounded-lg border-2 cursor-pointer p-1 transition-all bg-white flex items-center justify-center ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-100'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                            title={prod.name}
                          >
                            <img src={prod.data} className="w-full h-full object-contain" alt={prod.name} />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Passo 2: Adicionar Logos e Imagens ao Canvas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        2. Estampas & Imagens
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Insira uma ou várias imagens no mesmo mockup.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => studioFileInputRef.current?.click()}
                      icon={<Plus size={13} />}
                      className="text-xs py-1 px-2.5"
                    >
                      Carregar Imagem
                    </Button>
                  </div>

                  <input
                    type="file"
                    ref={studioFileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleStudioUpload}
                  />

                  {/* Lista de Camadas no Mockup (Múltiplas Imagens) */}
                  {placedLogos.length > 0 && (
                    <div className="mb-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Imagens na Caixa ({placedLogos.length}):
                        </span>
                        <span className="text-[10px] text-slate-400">Clique para selecionar</span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {placedLogos.map((layer, idx) => {
                          const asset = assets.find((a) => a.id === layer.assetId);
                          const isSelected = selectedLayerUid === layer.uid;
                          return (
                            <button
                              key={layer.uid}
                              type="button"
                              onClick={() => setSelectedLayerUid(layer.uid)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all shrink-0 ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100 font-semibold'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <img src={asset?.data} className="w-3.5 h-3.5 object-contain rounded" alt="" />
                              <span className="truncate max-w-[85px]">{asset?.name || `Imagem ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grid de Imagens da Biblioteca */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {assets
                      .filter((a) => a.type === 'logo')
                      .map((logo) => {
                        const countOnCanvas = placedLogos.filter((l) => l.assetId === logo.id).length;
                        return (
                          <div
                            key={logo.id}
                            onClick={() => addLogoToCanvas(logo.id)}
                            className="relative aspect-square rounded-lg border border-slate-200 hover:border-indigo-400 bg-slate-50 cursor-pointer p-1.5 transition-colors flex items-center justify-center group"
                            title={`Adicionar ${logo.name}`}
                          >
                            <img src={logo.data} className="w-full h-full object-contain" alt={logo.name} />
                            {countOnCanvas > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                                {countOnCanvas}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Controles de Camada Ativa */}
                  {activeLayer && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Ajuste da Imagem Ativa</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateLayer(activeLayer.uid)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                            title="Adicionar outra cópia desta imagem"
                          >
                            <Copy size={11} /> Duplicar
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => removeLogoFromCanvas(activeLayer.uid)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                          >
                            <Trash2 size={11} /> Remover
                          </button>
                        </div>
                      </div>

                      {/* Regras de Áreas Mapeadas (Método MAP) */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                            <MapPin size={11} className="text-indigo-600" />
                            Áreas Mapeadas da Caixa (Método MAP):
                          </span>
                          <span className="text-[10px] text-indigo-600 font-semibold">
                            {currentBoxProfile.areas.length} áreas
                          </span>
                        </div>

                        {/* Grid de Áreas Geométricas Mapeadas do Modelo */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {currentBoxProfile.areas.map((area) => {
                            const isAssigned =
                              activeLayer.targetAreaId === area.id ||
                              activeLayer.targetAreaCode === area.code;
                            return (
                              <button
                                key={area.id}
                                type="button"
                                onClick={() => assignLayerToArea(activeLayer.uid, area)}
                                className={`flex items-center gap-1.5 p-1.5 rounded-md border text-left text-[11px] transition-all cursor-pointer ${
                                  isAssigned
                                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-indigo-200 shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                                title={area.description}
                              >
                                <span
                                  className={`w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${area.badgeBg}`}
                                >
                                  {area.code}
                                </span>
                                <span className="truncate">{area.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slider de Escala Manual */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>Escala Fina da Imagem</span>
                          <span className="font-mono">{Math.round(activeLayer.scale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={activeLayer.scale}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPlacedLogos((prev) =>
                              prev.map((l) => (l.uid === activeLayer.uid ? { ...l, scale: val } : l))
                            );
                          }}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Botão de Giro & Centralizar */}
                      <div className="flex items-center justify-between pt-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[11px] py-0.5 px-2 text-slate-600"
                          onClick={() => autoFitLayer(activeLayer.uid, 'center')}
                        >
                          🎯 Centralizar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[11px] py-0.5 px-2 text-slate-600"
                          onClick={() => {
                            setPlacedLogos((prev) =>
                              prev.map((l) =>
                                l.uid === activeLayer.uid ? { ...l, rotation: (l.rotation + 90) % 360 } : l
                              )
                            );
                          }}
                          icon={<RotateCcw size={12} />}
                        >
                          Girar 90°
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Passo 3: Motor de Fotorrealismo & Acabamentos Físicos (Skill de Imagem) */}
                <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600 shrink-0" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        3. Fotorrealismo & Física do Papel
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRealismEngineActive(!isRealismEngineActive)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        isRealismEngineActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Ativar/desativar diretrizes avançadas de física de materiais e iluminação de estúdio"
                    >
                      {isRealismEngineActive ? '✨ Fotorrealismo: Ativo' : 'Desativado'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    Simula com precisão a textura do papel offset 180g fosco, vincos de corte físicos, relevo scrapfesta com fita banana (1.5mm) e sombras de estúdio.
                  </p>

                  {/* Presets Rápidos de Fotorrealismo */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-700 block">Presets Rápidos de Estúdio:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyRealismPreset('scrap-luxo')}
                        className={`text-left p-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          realismSettings.dimensionalStyle === 'layer-3d-foam' && realismSettings.paperFinish === 'offset-180g'
                            ? 'border-indigo-600 bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <span>🌟</span>
                          <span>Scrapfesta 3D Luxo</span>
                        </div>
                        <div className="text-[9px] text-slate-500 line-clamp-1">Offset 180g + Fita Banana + Laço</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyRealismPreset('estudio-clean')}
                        className={`text-left p-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          realismSettings.dimensionalStyle === 'white-border-scrap' && realismSettings.environmentScene === 'clean-cyclorama'
                            ? 'border-indigo-600 bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <span>📸</span>
                          <span>Catálogo Clean</span>
                        </div>
                        <div className="text-[9px] text-slate-500 line-clamp-1">Fundo infinito + Softbox 3P</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyRealismPreset('festa-real')}
                        className={`text-left p-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          realismSettings.environmentScene === 'party-table-bokeh'
                            ? 'border-indigo-600 bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <span>🎂</span>
                          <span>Mesa de Festa Real</span>
                        </div>
                        <div className="text-[9px] text-slate-500 line-clamp-1">Bokeh f/2.8 + Luz Quente 3200K</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyRealismPreset('kraft-rustico')}
                        className={`text-left p-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          realismSettings.paperFinish === 'matte-kraft'
                            ? 'border-indigo-600 bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <span>🌿</span>
                          <span>Kraft Rústico Chic</span>
                        </div>
                        <div className="text-[9px] text-slate-500 line-clamp-1">Kraft 200g + Luz de Janela</div>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Aba de Configurações Físicas Detalhadas */}
                  {isRealismEngineActive && (
                    <div className="pt-1 space-y-2 border-t border-indigo-100">
                      <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                        {[
                          { id: 'paper', label: '📄 Papel' },
                          { id: '3d', label: '✂️ Efeito 3D' },
                          { id: 'light', label: '💡 Luz & Cena' },
                          { id: 'acc', label: '🎀 Adornos' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setRealismTab(tab.id as any)}
                            className={`flex-1 py-1 px-1.5 rounded-md font-semibold transition-all cursor-pointer text-center ${
                              realismTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab 1: Tipo de Papel */}
                      {realismTab === 'paper' && (
                        <div className="space-y-1">
                          {[
                            {
                              id: 'offset-180g',
                              title: 'Offset 180g Fosco (Padrão)',
                              desc: 'Toque aveludado, textura de celulose natural, sem brilho plástico reflexivo.',
                            },
                            {
                              id: 'glossy-photographic',
                              title: 'Fotográfico Glossy 230g',
                              desc: 'Cores de alta saturação e reflexos especulares suaves nas curvaturas.',
                            },
                            {
                              id: 'matte-kraft',
                              title: 'Kraft Rústico 200g',
                              desc: 'Fibras rústicas naturais de madeira com tom terroso acolhedor.',
                            },
                            {
                              id: 'textured-linen',
                              title: 'Telado / Linho Nobre 180g',
                              desc: 'Textura táctil suave tipo casca de ovo/tecido para papelaria fina.',
                            },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setRealismSettings((prev) => ({ ...prev, paperFinish: item.id as any }))}
                              className={`w-full text-left p-1.5 rounded-md border text-[10px] transition-all cursor-pointer ${
                                realismSettings.paperFinish === item.id
                                  ? 'border-indigo-600 bg-white font-semibold text-indigo-950 shadow-xs'
                                  : 'border-slate-200 bg-white/60 hover:bg-white text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">{item.title}</span>
                                {realismSettings.paperFinish === item.id && (
                                  <Check size={11} className="text-indigo-600" />
                                )}
                              </div>
                              <p className="text-[9px] text-slate-500 leading-snug">{item.desc}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tab 2: Relevo 3D / Scrapfesta */}
                      {realismTab === '3d' && (
                        <div className="space-y-1">
                          {[
                            {
                              id: 'layer-3d-foam',
                              title: 'Aplique 3D em Camadas (Fita Banana 1.5mm)',
                              desc: 'Projeta sombra real na caixa, dando volumetria e profundidade de scrapfesta.',
                            },
                            {
                              id: 'white-border-scrap',
                              title: 'Camada Dupla com Borda Branca (1mm)',
                              desc: 'Recorte eletrônico perfeito com contorno branco de 1mm ao redor da arte.',
                            },
                            {
                              id: 'direct-print',
                              title: 'Impressão Direta na Caixa (Flat)',
                              desc: 'Impressão plana uniforme sobre as faces, acompanhando vincos e dobras.',
                            },
                            {
                              id: 'shaker-glitter',
                              title: 'Efeito Shaker Luxo com Visor',
                              desc: 'Visor frontal transparente com lantejoulas e glitter holográfico.',
                            },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setRealismSettings((prev) => ({ ...prev, dimensionalStyle: item.id as any }))}
                              className={`w-full text-left p-1.5 rounded-md border text-[10px] transition-all cursor-pointer ${
                                realismSettings.dimensionalStyle === item.id
                                  ? 'border-indigo-600 bg-white font-semibold text-indigo-950 shadow-xs'
                                  : 'border-slate-200 bg-white/60 hover:bg-white text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">{item.title}</span>
                                {realismSettings.dimensionalStyle === item.id && (
                                  <Check size={11} className="text-indigo-600" />
                                )}
                              </div>
                              <p className="text-[9px] text-slate-500 leading-snug">{item.desc}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tab 3: Luz & Cena */}
                      {realismTab === 'light' && (
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-700 block mb-1">Iluminação de Estúdio:</span>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { id: 'studio-softbox', label: 'Softbox 3 Pontos' },
                                { id: 'natural-window', label: 'Luz de Janela' },
                                { id: 'warm-party', label: 'Quente Festa (3200K)' },
                                { id: 'dramatic-rim', label: 'Luz de Contorno' },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setRealismSettings((prev) => ({ ...prev, lightingStyle: item.id as any }))}
                                  className={`p-1.5 rounded border text-[10px] font-medium text-left transition-all ${
                                    realismSettings.lightingStyle === item.id
                                      ? 'border-indigo-600 bg-white text-indigo-900 font-bold'
                                      : 'border-slate-200 bg-white/60 text-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-700 block mb-1">Cenário / Ambientação:</span>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { id: 'clean-cyclorama', label: 'Fundo Infinito Limpo' },
                                { id: 'party-table-bokeh', label: 'Mesa de Festa (Bokeh)' },
                                { id: 'wood-craft-table', label: 'Madeira Artesanal' },
                                { id: 'atelier-decor', label: 'Ateliê de Scrap' },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setRealismSettings((prev) => ({ ...prev, environmentScene: item.id as any }))}
                                  className={`p-1.5 rounded border text-[10px] font-medium text-left transition-all ${
                                    realismSettings.environmentScene === item.id
                                      ? 'border-indigo-600 bg-white text-indigo-900 font-bold'
                                      : 'border-slate-200 bg-white/60 text-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 4: Adornos & Acessórios Físicos */}
                      {realismTab === 'acc' && (
                        <div className="space-y-1">
                          {[
                            {
                              key: 'satinRibbon',
                              title: 'Laço de Cetim Luxuoso',
                              desc: 'Nó clássico com acabamento acetinado no fechamento superior da caixa.',
                            },
                            {
                              key: 'paperStraw',
                              title: 'Canudo de Papel Listrado',
                              desc: 'Ideal para Caixa Canudo e modelos com topo decorativo coordenado.',
                            },
                            {
                              key: 'rhinestones',
                              title: 'Pontos de Luz / Strass',
                              desc: 'Pequenos cristais brilhantes aplicados nas bordas do recorte scrap.',
                            },
                          ].map((item) => {
                            const isChecked = (realismSettings.accessories as any)[item.key];
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() =>
                                  setRealismSettings((prev) => ({
                                    ...prev,
                                    accessories: {
                                      ...prev.accessories,
                                      [item.key]: !isChecked,
                                    },
                                  }))
                                }
                                className={`w-full text-left p-1.5 rounded-md border text-[10px] transition-all cursor-pointer flex items-start gap-2 ${
                                  isChecked
                                    ? 'border-indigo-600 bg-white font-medium text-indigo-950'
                                    : 'border-slate-200 bg-white/60 text-slate-700'
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                    isChecked
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check size={10} strokeWidth={3} />}
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold">{item.title}</div>
                                  <div className="text-[9px] text-slate-500 leading-snug">{item.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Passo 4: Auto-Ajuste & Sugestão de Cores (Método MAP) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      4. Auto-Ajuste & Sugestão de Cores (MAP)
                    </h3>
                  </div>

                  {/* Modos Rápidos de Auto-Ajuste da IA */}
                  <div className="space-y-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPrompt(
                          'Auto-ajuste inteligente: observar a imagem, se for um desenho/ilustração centralizar na caixa e sugerir cores harmônicas da própria arte para preencher e colorir os cantos vazios e abas, sem deixar espaços em branco.'
                        )
                      }
                      className="w-full text-left p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/80 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-indigo-600 shrink-0" />
                          Auto-Ajustar Desenho & Sugerir Cores
                        </span>
                        <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-semibold shrink-0">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700/90 mt-1 leading-snug">
                        Centraliza o desenho na face da caixa e completa os cantos, bordas e abas vazias com cores harmônicas extraídas da arte.
                      </p>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPrompt(
                            'Auto-ajuste no tamanho da caixa: redimensionar a arte para cobrir perfeitamente toda a face da embalagem de ponta a ponta, respeitando as linhas de vinco e dobras do papel.'
                          )
                        }
                        className="text-left p-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-700 transition-colors"
                      >
                        📐 Preencher Toda a Face
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPrompt(
                            'Aplique 3D em camadas de scrapfesta com fita banana (personagens em relevo destacado) e fundo com paleta harmônica do tema.'
                          )
                        }
                        className="text-left p-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-700 transition-colors"
                      >
                        ✂️ Aplique 3D / Scrap
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPrompt(
                          `Composição de múltiplas imagens (${placedLogos.length} imagens): compor harmonicamente todas as imagens enviadas sobre a embalagem, integrando personagens na face frontal e apliques secundários nas abas superiores em papel offset 180g fosco.`
                        )
                      }
                      className="w-full text-left p-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-700 transition-colors"
                    >
                      🎨 Compor Todas as {placedLogos.length} Imagens na Embalagem
                    </button>
                  </div>

                  {/* Sugestão de Cores para Cantos e Fundo */}
                  <div className="mb-2.5">
                    <span className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Sugerir Cor Específica para os Cantos & Fundo:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[10px]">
                      {[
                        { label: '✨ Auto IA (Da Arte)', val: 'cores harmônicas extraídas da própria ilustração' },
                        { label: 'Azul Céu', val: 'fundo e cantos em tom azul bebê harmônico' },
                        { label: 'Rosa Bebê', val: 'fundo e cantos em tom rosa delicado harmônico' },
                        { label: 'Amarelo Sol', val: 'fundo e cantos em tom amarelo pastel quente' },
                        { label: 'Verde Menta', val: 'fundo e cantos em tom verde menta suave' },
                        { label: 'Lilás Candy', val: 'fundo e cantos em tom lilás delicado' },
                        { label: 'Kraft Rústico', val: 'fundo e cantos em tom papel kraft artesanal' },
                        { label: 'Branco Limpo', val: 'fundo e cantos brancos preservando a caixa original' },
                      ].map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (c.label.includes('Auto')) {
                              setPrompt(
                                'Auto-ajuste inteligente: se for um desenho, centralize perfeitamente na face da caixa e sugira cores harmônicas extraídas da própria arte para preencher os cantos vazios e abas.'
                              );
                            } else {
                              setPrompt((prev) => `${prev.trim()} - preencher cantos vazios e abas da caixa com ${c.val}.`);
                            }
                          }}
                          className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 whitespace-nowrap shrink-0 transition-colors font-medium"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card de Regras e Preservação do Método MAP */}
                  <div className="mb-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={11} className="text-indigo-600" />
                        Regras de Preservação ({currentBoxProfile.productName}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMapRulesModal(true)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Regras MAP
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-600 space-y-0.5 mb-2">
                      {currentBoxProfile.technicalPreservation.slice(0, 2).map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <Check size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{rule}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrompt(
                          `Mapa confirmado (Método MAP): Área A centralizada com desenho, cores harmônicas da própria arte preenchendo cantos vazios e abas (Área D), com preservação rigorosa de vincos e dobras do papel offset 180g.`
                        )
                      }
                      className="w-full py-1.5 px-2 bg-indigo-600 text-white rounded-md text-[10px] font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> CONFIRMAR MAPA DE COMPOSIÇÃO
                    </button>
                  </div>

                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-20 mb-2 leading-relaxed"
                    placeholder="Instruções para a IA (ex: auto-ajuste de desenho, cores nos cantos, vincos)..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />

                  {/* Tags Rápidas */}
                  <div className="flex flex-wrap gap-1">
                    {quickPromptTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPrompt(tag)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botão Primário de Render */}
                <Button
                  onClick={handleGenerate}
                  isLoading={loading.isGenerating}
                  disabled={!selectedProductId || placedLogos.length === 0}
                  size="lg"
                  className="w-full mt-auto"
                  icon={<Wand2 size={16} />}
                >
                  Renderizar Mockup com IA
                </Button>
              </div>

              {/* Coluna Direita: Canvas de Montagem Interativo */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col relative">
                {/* Barra de Ferramentas do Canvas */}
                <div className="h-11 border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 bg-white">
                  <div className="flex items-center gap-2">
                    {/* Switcher entre Foto 3D e Molde Aberto do PDF */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCanvasViewMode('assembled')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          canvasViewMode === 'assembled'
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📦 Foto 3D Montada
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasViewMode('dieline')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          canvasViewMode === 'dieline'
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={`Exibe o gabarito oficial de corte e vinco aberto (Pág. ${currentBoxProfile.pdfPage} do PDF)`}
                      >
                        📐 Molde Aberto (PDF Pág. {currentBoxProfile.pdfPage})
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Botão de Toggle do Guia de Áreas Mapeadas (Método MAP) */}
                    <button
                      type="button"
                      onClick={() => setShowMapGuide(!showMapGuide)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        showMapGuide
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Exibir ou ocultar o mapa geométrico de áreas da caixa (Método MAP)"
                    >
                      <MapPin size={12} />
                      <span>{showMapGuide ? 'Guia MAP: Ativo' : 'Guia MAP: Oculto'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapRulesModal(true)}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                      title="Ver Regras Técnicas do Método MAP"
                    >
                      <Info size={14} />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

                    <button
                      onClick={() => setCanvasZoom((z) => Math.max(0.7, z - 0.1))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Diminuir Zoom"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="font-mono text-[11px] px-1 text-slate-600">
                      {Math.round(canvasZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setCanvasZoom((z) => Math.min(1.5, z + 0.1))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Aumentar Zoom"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      onClick={() => setCanvasZoom(1)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 text-[11px] ml-1 font-medium cursor-pointer"
                      title="Resetar Zoom"
                    >
                      100%
                    </button>
                  </div>
                </div>

                {/* Área da Tela / Canvas */}
                <div className="flex-1 studio-canvas-bg flex items-center justify-center p-4 relative select-none overflow-hidden min-h-[420px]">
                  {/* Floating Status Pill */}
                  <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs px-3 py-1.5 rounded-full text-[11px] text-slate-700 flex items-center gap-2 pointer-events-auto">
                      <Sparkles size={13} className="text-indigo-600 shrink-0" />
                      <span>
                        <strong className="text-slate-900">Método MAP:</strong>{' '}
                        {canvasViewMode === 'assembled' ? 'Vista 3D Montada' : `Gabarito Aberto (Pág. ${currentBoxProfile.pdfPage})`} · {placedLogos.length} {placedLogos.length === 1 ? 'arte' : 'artes'}.
                      </span>
                    </div>

                    {isRealismEngineActive && (
                      <div className="bg-amber-50/95 backdrop-blur-xs border border-amber-200 shadow-xs px-3 py-1.5 rounded-full text-[11px] text-amber-900 font-semibold flex items-center gap-1.5 pointer-events-auto">
                        <span className="text-xs">✨</span>
                        <span>
                          Fotorrealismo: {
                            realismSettings.paperFinish === 'offset-180g' ? 'Offset 180g Fosco' :
                            realismSettings.paperFinish === 'glossy-photographic' ? 'Glossy 230g' :
                            realismSettings.paperFinish === 'matte-kraft' ? 'Kraft Rústico 200g' : 'Telado Linho'
                          } · {
                            realismSettings.dimensionalStyle === 'layer-3d-foam' ? 'Scrap 3D (Fita Banana)' :
                            realismSettings.dimensionalStyle === 'white-border-scrap' ? 'Borda Branca 1mm' :
                            realismSettings.dimensionalStyle === 'direct-print' ? 'Impressão Direta' : 'Shaker Glitter'
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Overlay de Carregamento */}
                  {loading.isGenerating && (
                    <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Renderizando Mockup com IA</h4>
                      <p className="text-xs text-slate-500 font-mono animate-pulse">{loading.message}</p>
                    </div>
                  )}

                  {selectedProductId ? (
                    <div
                      ref={canvasRef}
                      style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}
                      className="relative w-full max-w-[460px] aspect-[4/5] sm:aspect-square flex items-center justify-center transition-transform duration-100"
                    >
                      {/* Foto Base ou Gabarito Aberto do PDF */}
                      {canvasViewMode === 'assembled' ? (
                        <img
                          src={assets.find((a) => a.id === selectedProductId)?.data}
                          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
                          alt="Produto Base Montado"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-white rounded-xl p-2 border border-slate-200 shadow-xs flex items-center justify-center">
                          <img
                            src={currentBoxProfile.dielineImage}
                            className="w-full h-full object-contain pointer-events-none select-none"
                            alt={currentBoxProfile.pdfPageTitle}
                            draggable={false}
                          />
                        </div>
                      )}

                      {/* Áreas Geométricas Mapeadas do Método MAP (Overlay Interativo) */}
                      {showMapGuide &&
                        currentBoxProfile.areas.map((area) => (
                          <div
                            key={area.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeLayer) {
                                assignLayerToArea(activeLayer.uid, area);
                              }
                            }}
                            className={`absolute cursor-pointer border-2 border-dashed transition-all rounded-lg flex flex-col items-center justify-start p-1 pointer-events-auto ${area.borderColor} hover:bg-white/30 hover:scale-[1.01]`}
                            style={{
                              left: `${area.x}%`,
                              top: `${area.y}%`,
                              width: `${area.width}%`,
                              height: `${area.height}%`,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: 'rgba(255, 255, 255, 0.12)',
                              zIndex: 10,
                            }}
                            title={`Clique para posicionar a estampa ativa na Área ${area.code} (${area.name})`}
                          >
                            <div className="flex items-center gap-1 bg-white/95 px-1.5 py-0.5 rounded shadow-xs text-[9px] font-bold text-slate-800">
                              <span
                                className={`w-3.5 h-3.5 rounded text-white text-[9px] font-bold flex items-center justify-center shrink-0 ${area.badgeBg}`}
                              >
                                {area.code}
                              </span>
                              <span className="truncate max-w-[110px]">{area.name}</span>
                            </div>
                          </div>
                        ))}

                      {/* Camadas de Estampa sobrepostas */}
                      {placedLogos.map((layer) => {
                        const logoAsset = assets.find((a) => a.id === layer.assetId);
                        if (!logoAsset) return null;
                        const isSelected = selectedLayerUid === layer.uid;
                        const isDraggingThis = draggedItem?.uid === layer.uid;

                        return (
                          <div
                            key={layer.uid}
                            className={`absolute cursor-move select-none ${
                              isDraggingThis ? 'z-40 opacity-80' : isSelected ? 'z-30' : 'z-20'
                            }`}
                            style={{
                              left: `${layer.x}%`,
                              top: `${layer.y}%`,
                              transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                              width: '24%',
                              aspectRatio: '1/1',
                            }}
                            onMouseDown={(e) => handleMouseDown(e, layer)}
                            onTouchStart={(e) => handleTouchStart(e, layer)}
                            onWheel={(e) => handleWheel(e, layer.uid)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLayerUid(layer.uid);
                            }}
                          >
                            {/* Moldura Indicadora de Seleção */}
                            <div
                              className={`absolute -inset-2 rounded-lg border-2 pointer-events-none transition-all ${
                                isSelected
                                  ? 'border-indigo-600 border-dashed bg-indigo-50/10'
                                  : 'border-transparent hover:border-indigo-300'
                              }`}
                            ></div>

                            {/* Botão de Exclusão da Camada */}
                            {isSelected && (
                              <button
                                onClick={(e) => removeLogoFromCanvas(layer.uid, e)}
                                onTouchEnd={(e) => removeLogoFromCanvas(layer.uid, e)}
                                className="absolute -top-3 -right-3 bg-white text-rose-600 border border-slate-200 rounded-full p-1 shadow-md hover:bg-rose-50 z-50 cursor-pointer"
                                title="Excluir estampa"
                              >
                                <X size={12} strokeWidth={2.5} />
                              </button>
                            )}

                            {/* Imagem da Estampa */}
                            <img
                              src={logoAsset.data}
                              className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
                              draggable={false}
                              alt="Estampa"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 p-8">
                      <Shirt size={48} className="mx-auto mb-3 opacity-30 text-slate-400" />
                      <p className="text-sm font-medium">Selecione um produto base para iniciar o estúdio</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELA: GALERIA DE MOCKUPS */}
          {/* ======================================================== */}
          {view === 'gallery' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Galeria de Renderizações</h2>
                  <p className="text-xs text-slate-500">
                    Histórico de mockups gerados com inteligência artificial prontos para download.
                  </p>
                </div>
                <Button
                  onClick={() => setView('studio')}
                  icon={<Plus size={15} />}
                >
                  Novo Mockup
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedMockups.map((mockup) => (
                  <div
                    key={mockup.id}
                    className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={mockup.imageUrl}
                        className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300"
                        alt={mockup.prompt || 'Mockup Gerado'}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Maximize size={14} />}
                          onClick={() => setSelectedMockup(mockup)}
                        >
                          Visualizar
                        </Button>
                        <a href={mockup.imageUrl} download={`mockup-${mockup.id}.png`}>
                          <Button size="sm" icon={<Download size={14} />}>
                            Baixar
                          </Button>
                        </a>
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>{new Date(mockup.createdAt).toLocaleDateString('pt-BR')}</span>
                          {mockup.productName && <span className="font-medium text-slate-600">{mockup.productName}</span>}
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {mockup.prompt || 'Mockup fotorrealista de produto'}
                        </p>
                        {mockup.realism && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                              ✨ {mockup.realism.paperFinish === 'offset-180g' ? 'Offset 180g Fosco' : mockup.realism.paperFinish}
                            </span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-medium">
                              {mockup.realism.dimensionalStyle === 'layer-3d-foam' ? 'Scrap 3D (Fita Banana)' : 'Recorte com Borda'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          Concluído (4K)
                        </span>
                        <a
                          href={mockup.imageUrl}
                          download={`mockup-${mockup.id}.png`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          <Download size={13} /> Salvar Arquivo
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {generatedMockups.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-xl p-8">
                    <ImageIcon size={44} className="mx-auto mb-3 text-slate-300" />
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">Nenhum mockup gerado ainda</h3>
                    <p className="text-xs text-slate-500 mb-5">
                      Crie seu primeiro mockup selecionando um produto e aplicando sua logo no Estúdio.
                    </p>
                    <Button onClick={() => setView('studio')}>Ir para o Estúdio</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELA: PLANOS & CRÉDITOS SAAS */}
          {/* ======================================================== */}
          {view === 'pricing' && (
            <div className="animate-fade-in space-y-8 max-w-4xl mx-auto py-4">
              <div className="text-center max-w-lg mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Planos Flexíveis para o seu Negócio
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Escolha o pacote ideal para sua marca, estamparia ou agência de e-commerce.
                </p>

                {/* Ciclo de Cobrança */}
                <div className="inline-flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg mt-6">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Anual (20% OFF)
                  </button>
                </div>
              </div>

              {/* Cards de Preço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Iniciante',
                    desc: 'Para criadores e pequenas lojas testando designs.',
                    price: billingCycle === 'monthly' ? 'R$ 29' : 'R$ 24',
                    credits: '30 mockups/mês',
                    features: ['Exportação HD (1080p)', 'Modelos básicos de vestuário', 'Suporte por e-mail'],
                    highlighted: false,
                    cta: 'Começar com Iniciante',
                  },
                  {
                    name: 'Profissional',
                    desc: 'Para marcas de moda, estamparias e dropshipping.',
                    price: billingCycle === 'monthly' ? 'R$ 79' : 'R$ 64',
                    credits: '120 mockups/mês',
                    features: [
                      'Exportação Ultra HD (4K)',
                      'Acesso a todos os produtos',
                      'Renderização prioritária com IA',
                      'Uso comercial irrestrito',
                    ],
                    highlighted: true,
                    cta: 'Plano Atual (Ativo)',
                  },
                  {
                    name: 'Agência & Estúdio',
                    desc: 'Para agências que produzem catálogos em grande volume.',
                    price: billingCycle === 'monthly' ? 'R$ 199' : 'R$ 159',
                    credits: '500 mockups/mês',
                    features: [
                      'Exportações ilimitadas 4K',
                      'Treinamento de peças personalizadas',
                      'Multi-usuários na equipe',
                      'Suporte VIP via WhatsApp',
                    ],
                    highlighted: false,
                    cta: 'Falar com Especialista',
                  },
                ].map((plan, idx) => (
                  <div
                    key={idx}
                    className={`bg-white rounded-xl p-6 flex flex-col justify-between transition-all ${
                      plan.highlighted
                        ? 'border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 relative'
                        : 'border border-slate-200 shadow-xs'
                    }`}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold tracking-wide uppercase px-3 py-0.5 rounded-full shadow-xs">
                        Mais Popular
                      </span>
                    )}

                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>

                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-extrabold text-slate-900 font-mono">{plan.price}</span>
                        <span className="text-xs text-slate-500">/mês</span>
                      </div>
                      <p className="text-xs text-indigo-700 font-semibold mb-6 font-mono">{plan.credits}</p>

                      <ul className="space-y-2.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-4">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      variant={plan.highlighted ? 'primary' : 'secondary'}
                      className="w-full text-xs justify-center"
                      onClick={() => alert(`Plano ${plan.name} selecionado!`)}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Garantia */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center gap-4 max-w-xl mx-auto">
                <ShieldCheck size={28} className="text-indigo-600 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Garantia incondicional de 7 dias:</strong> Teste qualquer plano e,
                  se não ficar 100% satisfeito com o realismo dos mockups gerados, devolvemos seu dinheiro integralmente.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
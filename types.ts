/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Asset {
  id: string;
  type: 'logo' | 'product';
  name: string;
  data: string; // Data URL or asset path
  mimeType: string;
  category?: 'vestuario' | 'acessorios' | 'embalagens' | 'logos';
}

export interface PlacedLayer {
  uid: string; // unique instance id
  assetId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number; // 0.2 to 3.0
  rotation: number; // in degrees
  targetAreaId?: string; // id da área mapeada (ex: 'area-a', 'area-b')
  targetAreaCode?: string; // código da área mapeada (ex: 'A', 'B')
}

export interface RealismSettings {
  paperFinish: 'offset-180g' | 'glossy-photographic' | 'matte-kraft' | 'textured-linen';
  dimensionalStyle: 'layer-3d-foam' | 'white-border-scrap' | 'direct-print' | 'shaker-glitter';
  lightingStyle: 'studio-softbox' | 'natural-window' | 'warm-party' | 'dramatic-rim';
  environmentScene: 'clean-cyclorama' | 'party-table-bokeh' | 'wood-craft-table' | 'atelier-decor';
  accessories: {
    satinRibbon: boolean;
    paperStraw: boolean;
    rhinestones: boolean;
  };
}

export interface GeneratedMockup {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: number;
  layers?: PlacedLayer[]; // Store layout used
  productId?: string;
  productName?: string;
  realism?: RealismSettings;
}

export type AppView = 'dashboard' | 'assets' | 'studio' | 'gallery' | 'pricing';

export interface LoadingState {
  isGenerating: boolean;
  message: string;
}

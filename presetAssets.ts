/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Asset } from './types';

// Helper SVG generator for crisp transparent brand marks & party themes
const createSvgThemeDataUrl = (
  title: string,
  subtitle: string,
  iconType: 'safari' | 'jardim' | 'astronauta' | 'festa' | 'badge' | 'minimal' | 'wave'
): string => {
  let iconSvg = '';
  let titleColor = '#0F172A';
  let subtitleColor = '#64748B';

  if (iconType === 'safari') {
    // Safari / Lion Theme
    iconSvg = `
      <circle cx="150" cy="85" r="46" fill="#FDE047" opacity="0.25" />
      <circle cx="150" cy="85" r="32" fill="#F59E0B" />
      <circle cx="138" cy="80" r="4" fill="#1E293B" />
      <circle cx="162" cy="80" r="4" fill="#1E293B" />
      <path d="M145 92 Q150 97 155 92" stroke="#1E293B" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M122 55 Q135 68 126 80" stroke="#D97706" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M178 55 Q165 68 174 80" stroke="#D97706" stroke-width="5" fill="none" stroke-linecap="round" />
    `;
    titleColor = '#78350F';
    subtitleColor = '#B45309';
  } else if (iconType === 'jardim') {
    // Jardim Encantado / Butterfly
    iconSvg = `
      <path d="M150 85 Q125 55 115 75 Q115 95 150 90 Q185 95 185 75 Q175 55 150 85 Z" fill="#F472B6" opacity="0.9" />
      <path d="M150 90 Q130 115 125 105 Q120 95 150 90 Q180 95 175 105 Q170 115 150 90 Z" fill="#EC4899" />
      <line x1="150" y1="65" x2="150" y2="105" stroke="#831843" stroke-width="4" stroke-linecap="round" />
      <circle cx="145" cy="62" r="2.5" fill="#831843" />
      <circle cx="155" cy="62" r="2.5" fill="#831843" />
    `;
    titleColor = '#831843';
    subtitleColor = '#BE185D';
  } else if (iconType === 'astronauta') {
    // Espaço / Foguete
    iconSvg = `
      <path d="M150 50 C138 65 136 95 138 108 L162 108 C164 95 162 65 150 50 Z" fill="#3B82F6" />
      <circle cx="150" cy="78" r="7" fill="#EFF6FF" />
      <path d="M136 90 L122 105 L136 104 Z" fill="#EF4444" />
      <path d="M164 90 L178 105 L164 104 Z" fill="#EF4444" />
      <polygon points="144,108 156,108 150,122" fill="#F59E0B" />
    `;
    titleColor = '#1E3A8A';
    subtitleColor = '#2563EB';
  } else if (iconType === 'festa') {
    // Parabéns / Coroa ou Estrela
    iconSvg = `
      <path d="M125 100 L132 65 L150 85 L168 65 L175 100 Z" fill="#FBBF24" stroke="#D97706" stroke-width="3" stroke-linejoin="round" />
      <circle cx="132" cy="62" r="3.5" fill="#DC2626" />
      <circle cx="150" cy="80" r="3.5" fill="#2563EB" />
      <circle cx="168" cy="62" r="3.5" fill="#059669" />
    `;
    titleColor = '#B45309';
    subtitleColor = '#D97706';
  } else if (iconType === 'badge') {
    iconSvg = `
      <path d="M150 48 L188 70 L188 114 L150 136 L112 114 L112 70 Z" fill="none" stroke="#0F172A" stroke-width="7" />
      <text x="150" y="98" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#4F46E5" text-anchor="middle">94</text>
    `;
  } else if (iconType === 'minimal') {
    iconSvg = `
      <rect x="115" y="55" width="70" height="70" rx="16" fill="none" stroke="#0F172A" stroke-width="8" />
      <circle cx="150" cy="90" r="16" fill="#0F172A" />
    `;
  } else {
    iconSvg = `
      <path d="M110 95 Q130 70 150 95 T190 95" fill="none" stroke="#0F172A" stroke-width="9" stroke-linecap="round" />
      <circle cx="150" cy="65" r="10" fill="#4F46E5" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="600" height="480">
      ${iconSvg}
      <text x="150" y="172" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" letter-spacing="2" fill="${titleColor}" text-anchor="middle">${title}</text>
      <text x="150" y="198" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" letter-spacing="3" fill="${subtitleColor}" text-anchor="middle">${subtitle}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const DEFAULT_PRODUCTS: Asset[] = [
  // --- As 4 Caixas de Papelaria Personalizada enviadas pelo usuário ---
  {
    id: 'prod-caixa-milk',
    type: 'product',
    name: 'Caixa Milk (Papelaria Personalizada)',
    data: '/assets/aistudio/Caixa_Milk_2068d026.jpeg',
    mimeType: 'image/jpeg',
    category: 'embalagens',
  },
  {
    id: 'prod-caixa-canudo',
    type: 'product',
    name: 'Caixa Canudo (Lembrancinha de Festa)',
    data: '/assets/aistudio/Caixa_Canudo_1a2e18f7.jpeg',
    mimeType: 'image/jpeg',
    category: 'embalagens',
  },
  {
    id: 'prod-caixa-piramide',
    type: 'product',
    name: 'Caixa Pirâmide / Cone com Topo',
    data: '/assets/aistudio/Caixa_Piramide_bdc1cd76.jpeg',
    mimeType: 'image/jpeg',
    category: 'embalagens',
  },
  {
    id: 'prod-caixa-coracao',
    type: 'product',
    name: 'Caixa Coração / Alça Rendada',
    data: '/assets/aistudio/Caixa_Cora__o_ef6be667.jpeg',
    mimeType: 'image/jpeg',
    category: 'embalagens',
  },
  {
    id: 'prod-sacolinha',
    type: 'product',
    name: 'Sacolinha de Festa com Fole & Alça (Kit Molde Pág. 1)',
    data: '/assets/aistudio/molde_pagina_1.png',
    mimeType: 'image/png',
    category: 'embalagens',
  },

  // --- Modelos Adicionais de Vestuário e Brindes ---
  {
    id: 'prod-tshirt-white',
    type: 'product',
    name: 'Camiseta Algodão Premium (Branca)',
    data: '/src/assets/images/mockup_white_tshirt_1792847246402.jpg',
    mimeType: 'image/jpeg',
    category: 'vestuario',
  },
  {
    id: 'prod-hoodie-heather',
    type: 'product',
    name: 'Moletom Streetwear Oversized (Mescla)',
    data: '/src/assets/images/mockup_hoodie_heather_1792847246774.jpg',
    mimeType: 'image/jpeg',
    category: 'vestuario',
  },
  {
    id: 'prod-ceramic-mug',
    type: 'product',
    name: 'Caneca Cerâmica Fosca (Branca)',
    data: '/src/assets/images/mockup_ceramic_mug_1792847247680.jpg',
    mimeType: 'image/jpeg',
    category: 'acessorios',
  },
  {
    id: 'prod-tote-bag',
    type: 'product',
    name: 'Ecobag Canvas 100% Algodão Cru',
    data: '/src/assets/images/mockup_tote_bag_1792847249506.jpg',
    mimeType: 'image/jpeg',
    category: 'acessorios',
  },
  {
    id: 'prod-trucker-cap',
    type: 'product',
    name: 'Boné Clássico 6 Gomos (Off-White)',
    data: '/src/assets/images/mockup_trucker_cap_1792847248853.jpg',
    mimeType: 'image/jpeg',
    category: 'vestuario',
  },
];

export const DEFAULT_LOGOS: Asset[] = [
  // --- Desenho / Ilustração Enviado pelo Usuário ---
  {
    id: 'logo-patrulha-canina',
    type: 'logo',
    name: 'Patrulha Canina (Desenho / Personagens)',
    data: '/assets/aistudio/image_ddb483e8.png',
    mimeType: 'image/png',
    category: 'logos',
  },
  // --- Temas de Papelaria & Festas ---
  {
    id: 'logo-safari-baby',
    type: 'logo',
    name: 'Tema Safári Baby',
    data: createSvgThemeDataUrl('SAFÁRI BABY', 'FESTA INFANTIL', 'safari'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },
  {
    id: 'logo-jardim-encantado',
    type: 'logo',
    name: 'Jardim Encantado',
    data: createSvgThemeDataUrl('JARDIM ENCANTADO', 'FLORES & BORBOLETAS', 'jardim'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },
  {
    id: 'logo-astronauta',
    type: 'logo',
    name: 'Pequeno Astronauta',
    data: createSvgThemeDataUrl('ASTRONAUTA', 'VIAGEM ESTELAR', 'astronauta'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },
  {
    id: 'logo-parabens-festa',
    type: 'logo',
    name: 'Parabéns / 1 Aninho',
    data: createSvgThemeDataUrl('PARABÉNS', 'MEU 1º ANINHO', 'festa'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },

  // --- Logos e Marcas Modernas ---
  {
    id: 'logo-studio-94',
    type: 'logo',
    name: 'Studio 94 Apparel',
    data: createSvgThemeDataUrl('STUDIO 94', 'URBAN STREETWEAR', 'badge'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },
  {
    id: 'logo-aurora-lab',
    type: 'logo',
    name: 'Aurora Minimal Studio',
    data: createSvgThemeDataUrl('AURORA', 'DESIGN & ESSENCE', 'minimal'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },
  {
    id: 'logo-origem-brasil',
    type: 'logo',
    name: 'Origem Café Especial',
    data: createSvgThemeDataUrl('ORIGEM', 'CAFÉS ESPECIAIS', 'wave'),
    mimeType: 'image/svg+xml',
    category: 'logos',
  },
];

/**
 * Converte qualquer URL ou DataURL em formato base64 compatível com o Gemini.
 */
export async function ensureDataUrl(urlOrData: string): Promise<string> {
  if (urlOrData.startsWith('data:')) {
    // If it's SVG data URI, render to PNG canvas to pass clean raster bytes to Gemini
    if (urlOrData.startsWith('data:image/svg+xml')) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 600;
          canvas.height = img.height || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(urlOrData);
          }
        };
        img.onerror = () => resolve(urlOrData);
        img.src = urlOrData;
      });
    }
    return urlOrData;
  }

  // Se for path local ou URL estática
  const response = await fetch(urlOrData);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

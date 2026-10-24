/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Modality } from "../genaiProxy";
import { Asset, PlacedLayer, RealismSettings } from "../types";
import { ensureDataUrl } from "../presetAssets";
import { getBoxMappingProfile } from "../boxMappingRules";

/**
 * Builds professional photorealistic instructions for packaging, paper physics,
 * scrapfesta 3D dimensional layering, and studio lighting.
 */
export const buildRealismPromptDirectives = (realism?: RealismSettings): string => {
  if (!realism) {
    return `
DIRETRIZES DE FOTORREALISMO INDUSTRIAL & FOTOGRAFIA DE PRODUTO:
- ESTILO: Fotografia comercial de catálogo profissional (lente macro 85mm f/4.0), hiper-realista, profundidade de campo sutil, sem aspecto de vetor 2D ou colagem artificial.
- TEXTURA DO PAPEL: Papel Offset Fosco 180g com micro-textura tátil suave, fibras naturais de celulose visíveis ao zoom, vincos físicos e linhas de corte com micro-sombras tridimensionais autênticas.
- EFEITO SCRAPFESTA 3D: Aplique em camadas sobrepostas com fita banana (espuma de 1.5mm) gerando sombra projetada suave, realista e destacada da face da caixa.
- ILUMINAÇÃO & SOMBRAS: Iluminação de estúdio comercial com softbox difuso, luz de contorno destacando dobras e arestas, e sombra de contato no solo (ambient occlusion) perfeitamente aterrada na mesa.`;
  }

  const paperMap: Record<string, string> = {
    'offset-180g': 'Papel Offset 180g fosco de alta gramatura, toque aveludado fosco sem brilho plástico, acabamento artesanal nobre de scrapfesta, textura suave de celulose natural.',
    'glossy-photographic': 'Papel Fotográfico Glossy 230g de alto brilho, com reflexos especulares sutis de luz de estúdio e cores saturadas ultra-vívidas.',
    'matte-kraft': 'Papel Kraft Rústico Natural 200g com textura rica de fibras orgânicas de madeira, tom terroso elegante e impressão integrada ao substrato rústico chic.',
    'textured-linen': 'Papel Telado / Linho Color Plus 180g com textura táctil refinada estilo casca de ovo/linho nobre, acabamento de alta costura em papelaria.',
  };

  const dimensionalMap: Record<string, string> = {
    'layer-3d-foam': 'EFEITO SCRAPFESTA 3D COM FITA BANANA (1.5mm): O desenho e os personagens são apliques recortados a laser/silhouette e montados em relevo com fita banana de espuma de 1.5mm, projetando sombra suave e volumetria real sobre o corpo da caixa.',
    'white-border-scrap': 'EFEITO CAMADA DUPLA COM BORDA BRANCA DE CORTE (1mm): Aplique dimensional com silhueta perfeita e borda branca de destaque de 1mm ao redor de todo o personagem, montado em relevo tridimensional sobreposto.',
    'direct-print': 'IMPRESSÃO GRÁFICA DIRETA NA CAIXA: A arte é impressa diretamente nas faces da embalagem, moldando-se perfeitamente aos vincos e dobras do papel.',
    'shaker-glitter': 'EFEITO SHAKER LUXO: Caixa com moldura 3D frontal contendo visor transparente em acetato cristal com lantejoulas e glitter holográfico solto no interior.',
  };

  const lightingMap: Record<string, string> = {
    'studio-softbox': 'Iluminação de estúdio profissional 3 pontos (Key light softbox 45°, fill light difuso e rim light quente nas bordas superiores e vincos da caixa).',
    'natural-window': 'Luz natural suave de janela lateral matinal, gerando sombras longas e difusas com atmosfera quente e aconchegante.',
    'warm-party': 'Iluminação aconchegante de mesa de festa infantil (3200K quente), destacando as cores vivas e o clima comemorativo.',
    'dramatic-rim': 'Iluminação de alto contraste com luz de recorte refinada (rim light) que acentua cada vinco, dobra geométrica e relevo do aplique 3D.',
  };

  const sceneMap: Record<string, string> = {
    'clean-cyclorama': 'Fundo infinito de estúdio fotográfico limpo em degradê suave off-white / cinza neutro, com sombra de oclusão de contato realista no solo (mesa).',
    'party-table-bokeh': 'Mesa decorada de festa infantil suave ao fundo, com confeitos e docinhos sutilmente desfocados (bokeh fotográfico cremoso f/2.8).',
    'wood-craft-table': 'Tampo de madeira artesanal clara e limpa de ateliê de festas, com textura rústica chic e iluminação límpida.',
    'atelier-decor': 'Mesa de ateliê de papelaria fina com fitas de cetim e adornos delicadamente desfocados na composição de fundo.',
  };

  const accs: string[] = [];
  if (realism.accessories.satinRibbon) {
    accs.push('Laço de cetim luxuoso no fechamento superior da embalagem, com nó perfeito, fitas onduladas e brilho acetinado natural.');
  }
  if (realism.accessories.paperStraw) {
    accs.push('Canudo de papel decorado e listrado coordenado nas cores da paleta, inserido no orifício próprio da embalagem com acabamento impecável.');
  }
  if (realism.accessories.rhinestones) {
    accs.push('Aplicação de delicados pontos de luz / mini strass nas extremidades da arte ou no centro do laço.');
  }

  return `
DIRETRIZES DE FOTORREALISMO & FÍSICA DOS MATERIAIS:
- TIPO DE PAPEL & TOQUE: ${paperMap[realism.paperFinish] || paperMap['offset-180g']}
- DIMENSIONALIDADE & RELEVO: ${dimensionalMap[realism.dimensionalStyle] || dimensionalMap['layer-3d-foam']}
- ILUMINAÇÃO DE CENA: ${lightingMap[realism.lightingStyle] || lightingMap['studio-softbox']}
- AMBIENTAÇÃO / CENÁRIO: ${sceneMap[realism.environmentScene] || sceneMap['clean-cyclorama']}
${accs.length > 0 ? `- ACESSÓRIOS & ADORNOS REAIS:\n  * ${accs.join('\n  * ')}` : ''}
- DETALHES ÓPTICOS: Fotografia de produto com lente 85mm macro em f/4.0. Foco nítido na arte frontal (Área A). Textura realista com fibras visíveis do papel, vincos com micro-deformação natural de prensa mecânica, sem aparência de render 3D básico ou montagem 2D.`;
};

/**
 * Helper to strip the data URL prefix (e.g. "data:image/png;base64,")
 */
const getBase64Data = (dataUrl: string): { data: string; mimeType: string } => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // Fallback if raw base64
  return { mimeType: 'image/png', data: dataUrl };
};

/**
 * Generates a product mockup by compositing multiple logos onto a product image
 * utilizing the geometric Método MAP specification and photorealistic papercraft physics.
 */
export const generateMockup = async (
  product: Asset,
  layers: { asset: Asset; placement: PlacedLayer }[],
  instruction: string,
  realism?: RealismSettings
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: "server-side" });
    const model = 'gemini-3-pro-image-preview';

    // 1. Prepare Product Base
    const productDataUrl = await ensureDataUrl(product.data);
    const productParsed = getBase64Data(productDataUrl);
    const boxProfile = getBoxMappingProfile(product.id);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: productParsed.mimeType || product.mimeType || 'image/jpeg',
          data: productParsed.data,
        },
      },
    ];

    // 2. Prepare All Logos & Mapped Areas
    let layoutHints = "";
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index];
      const logoDataUrl = await ensureDataUrl(layer.asset.data);
      const logoParsed = getBase64Data(logoDataUrl);

      parts.push({
        inlineData: {
          mimeType: logoParsed.mimeType || layer.asset.mimeType || 'image/png',
          data: logoParsed.data,
        },
      });

      const assignedArea = boxProfile.areas.find(
        (a) => a.id === layer.placement.targetAreaId || a.code === layer.placement.targetAreaCode
      );
      const areaInfo = assignedArea
        ? `[Área ${assignedArea.code}: ${assignedArea.name} - ${assignedArea.roleLabel}]`
        : `[Posição personalizada: x=${Math.round(layer.placement.x)}%, y=${Math.round(layer.placement.y)}%]`;

      layoutHints += `\n- Imagem/Estampa ${index + 1} ("${layer.asset.name}"): Alocar na ${areaInfo}. Escala: ${layer.placement.scale}, Giro: ${layer.placement.rotation}°.`;
    }

    const technicalRules = boxProfile.technicalPreservation
      .map((r, i) => `   ${i + 1}. ${r}`)
      .join('\n');

    const realismDirectives = buildRealismPromptDirectives(realism);

    // 3. Add Instructions based on Método MAP & Fotorrealismo
    const finalPrompt = `
INSTRUÇÕES DE COMPOSIÇÃO:
Instruções do Usuário: ${instruction || "Renderize o mockup com auto-ajuste e acabamento hiper-realista de scrapfesta."}

MODELO DE EMBALAGEM: ${boxProfile.productName}
MATERIAL BASE: ${boxProfile.paperType}

MAPA DE COMPOSIÇÃO GEOMÉTRICA (Regras do Método MAP - ${layers.length} imagens):
${layoutHints}

DIRETRIZES TÉCNICAS E PRESERVAÇÃO DO MOLDE:
${technicalRules}

${realismDirectives}

REGRAS DE OURO DE COMPOSIÇÃO & AUTO-AJUSTE (MÉTODO MAP):
1. RECONHECIMENTO & AUTO-AJUSTE DA ÁREA A (Face Frontal):
   - Se a imagem principal for um desenho, personagem ou ilustração isolada (ex: Patrulha Canina, bichinhos de safari, tema infantil): centralize-a harmonicamente no corpo da caixa (Área A).
   - PREENCHIMENTO DOS CANTOS E ABAS (Área D): Observe atentamente a paleta de cores predominante na própria arte. Estenda e aplique cores harmônicas complementares (ou a cor solicitada pelo usuário) nos cantos, laterais, bordas e abas vazias, criando um visual contínuo e profissional de papelaria personalizada, sem deixar áreas brancas desnecessárias.
   - Se for uma estampa corrida / papel digital: faça o auto-ajuste milimétrico cobrindo toda a face de ponta a ponta, alinhando aos vincos do molde.

2. PRESERVAÇÃO TÉCNICA E NÃO-DEFORMAÇÃO:
   - Respeite fielmente as linhas de dobra, vincos, colagem e encaixes do molde físico real da embalagem.
   - Elementos vitais (rostos dos personagens, nomes, idades) NUNCA devem ser cortados, escondidos ou divididos por vincos profundos.

3. MÚLTIPLAS IMAGENS & HIERARQUIA VISUAL:
   - Componha todas as ${layers.length} imagens enviadas de forma coordenada: ilustração principal na face frontal, textos/nomes/idades na aba superior ou faixa, mantendo proporção e contraste nítido.

4. FOTORREALISMO & PRODUTO FÍSICO REAL:
   - O resultado DEVE parecer uma fotografia de estúdio de um produto real montado fisicamente sobre uma mesa, NÃO uma ilustração digital ou imagem recortada.
   - Sombra de contato no solo, reflexos e difusão de luz consistentes no papel.

Retorne APENAS a imagem final resultante.
    `;

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Nenhuma imagem gerada retornada pelo modelo.");
  } catch (error) {
    console.error("Falha ao gerar mockup:", error);
    throw error;
  }
};

/**
 * Generates a new logo or product base from scratch using text.
 */
export const generateAsset = async (prompt: string, type: 'logo' | 'product'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: "server-side" });
    const model = 'gemini-3-pro-image-preview';

    const enhancedPrompt = type === 'logo'
      ? `A high-quality, professional vector-style logo design or graphic print of ${prompt}. Clean graphic isolated on pure white background, flat aesthetic, modern branding.`
      : `Professional commercial studio product photography of a single ${prompt}. High-end product catalog style, isolated on clean pure white background, front view, ultra sharp focus.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Nenhum ativo gerado retornado.");
  } catch (error) {
    console.error("Falha ao gerar ativo:", error);
    throw error;
  }
};

/**
 * Takes a raw AR composite and makes it photorealistic.
 */
export const generateRealtimeComposite = async (
  compositeImageBase64: string,
  prompt: string = "Transforme em uma foto realista de estúdio comercial"
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: "server-side" });
    const model = 'gemini-3-pro-image-preview';

    const parsed = getBase64Data(compositeImageBase64);

    const parts = [
      {
        inlineData: {
          mimeType: parsed.mimeType || 'image/png',
          data: parsed.data,
        },
      },
      {
        text: `Composição preliminar. Tarefa: ${prompt}.
        Renderize o objeto sobreposto de forma natural na cena.
        Combine iluminação, sombras, reflexos e perspectiva do produto.
        Retorne APENAS a imagem final resultante.`,
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Nenhuma imagem gerada retornada.");
  } catch (error) {
    console.error("Falha na composição:", error);
    throw error;
  }
};
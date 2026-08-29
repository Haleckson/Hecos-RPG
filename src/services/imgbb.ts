// ImgBB API service with WebP 100% conversion, semantic renaming, key rotation, and download utilities
const DEFAULT_IMGBB_API_KEYS = [
  "f4cba49a81562f048b7dd2331aac4380",
  "4d60ed3d3e4f0ec0577795eaf2eb2384",
  "ac1f14417cb2fc3388f2d071871b53e9",
  "879c8465e668705b5a27e1c1d2b4ce03"
];

const CUSTOM_KEY_STORAGE_KEY = 'hecos_custom_imgbb_key';

let currentKeyIndex = 0;

export interface SemanticNamingOptions {
  category?: string;       // e.g. 'ancestralidade', 'classe', 'perigo', 'criatura', 'mapa', 'talento', 'artigo'
  entityName?: string;     // e.g. 'pirmadim', 'guerreiro', 'lobo-sombrio'
  role?: string;           // e.g. 'capa', 'icone', 'album', 'token', 'arte', 'ilustracao'
  index?: number | string; // e.g. 1 -> '01', 2 -> '02'
  originalFilename?: string;
}

export interface ImgBBUploadResult {
  success: boolean;
  url?: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  error?: string;
  fileName?: string;           // Semantic filename, e.g. 'ancestralidade-pirmadin-capa.webp'
  wasConvertedToWebP?: boolean; // true if converted, false if already WebP
  originalType?: string;
}

export function getCustomImgBBKey(): string {
  try {
    return localStorage.getItem(CUSTOM_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setCustomImgBBKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(CUSTOM_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(CUSTOM_KEY_STORAGE_KEY);
    }
  } catch {
    // LocalStorage fallback
  }
}

/**
 * Normalizes text to a clean URL-friendly slug:
 * Lowercases, strips accents/diacritics, and replaces non-alphanumeric chars with hyphens.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (e.g. Pirmadím -> Pirmadim, Anão -> Anao)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')     // replace spaces & special chars with hyphen
    .replace(/^-+|-+$/g, '');        // remove leading & trailing hyphens
}

/**
 * Generates a semantic image filename following the standard:
 * {category}-{entityName}-{role}[-{index}].webp
 *
 * Examples:
 * - ancestralidade-pirmadin-capa.webp
 * - ancestralidade-pirmadin-icone.webp
 * - ancestralidade-pirmadin-album-01.webp
 * - classe-guerreiro-capa.webp
 * - criatura-lobo-token.webp
 */
export function generateSemanticImageName(options?: SemanticNamingOptions | string): string {
  if (!options) {
    return `imagem-${Date.now()}.webp`;
  }

  if (typeof options === 'string') {
    let clean = slugify(options);
    if (!clean) clean = `imagem-${Date.now()}`;
    return clean.endsWith('.webp') ? clean : `${clean}.webp`;
  }

  const { category, entityName, role, index, originalFilename } = options;

  const cleanCategory = slugify(category || '') || 'imagem';

  let cleanEntity = slugify(entityName || '');
  if (!cleanEntity && originalFilename) {
    cleanEntity = slugify(originalFilename.replace(/\.[^/.]+$/, ''));
  }
  if (!cleanEntity) {
    cleanEntity = 'geral';
  }

  let cleanRole = slugify(role || '');
  if (!cleanRole) {
    cleanRole = 'arte';
  }

  // Format index (e.g. 1 -> '01')
  let indexStr = '';
  if (index !== undefined && index !== null && index !== '') {
    const num = typeof index === 'number' ? index : parseInt(String(index), 10);
    if (!isNaN(num)) {
      indexStr = String(num).padStart(2, '0');
    } else {
      indexStr = slugify(String(index));
    }
  }

  const parts = [cleanCategory, cleanEntity, cleanRole];
  if (indexStr) {
    parts.push(indexStr);
  }

  return `${parts.filter(Boolean).join('-')}.webp`;
}

/**
 * Checks if an image file, blob, or base64 string is already in WebP format.
 * Checks mime-type, filename extension, data URL prefix, or WebP RIFF magic bytes.
 */
export async function isWebPImage(source: File | Blob | string): Promise<boolean> {
  if (typeof source === 'string') {
    if (source.startsWith('data:image/webp')) return true;
    if (source.split('?')[0].toLowerCase().endsWith('.webp')) return true;
    return false;
  }

  if (source.type === 'image/webp') {
    return true;
  }

  if (source instanceof File && source.name.toLowerCase().endsWith('.webp')) {
    return true;
  }

  // Inspect first 12 bytes for RIFF...WEBP signature
  try {
    const headerBuffer = await source.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);
    const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    return isRiff && isWebp;
  } catch {
    return false;
  }
}

/**
 * Converts any image source to WebP with 100% quality (quality: 1.0) using HTML5 Canvas.
 * Preserves transparency and dimensions.
 */
export async function convertImageToWebP(
  source: File | Blob | string,
  targetFileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      cleanup();
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Não foi possível obter o contexto 2D do Canvas');
        }

        // Draw image onto canvas (alpha transparency is preserved)
        ctx.drawImage(img, 0, 0);

        // Convert to WebP at 100% quality (1.0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], targetFileName, { type: 'image/webp' });
              resolve(file);
            } else {
              // Fallback: create WebP file with original if browser canvas.toBlob fails
              if (source instanceof File) {
                resolve(source);
              } else if (source instanceof Blob) {
                resolve(new File([source], targetFileName, { type: source.type || 'image/webp' }));
              } else {
                reject(new Error('Erro ao gerar arquivo WebP a partir do Canvas'));
              }
            }
          },
          'image/webp',
          1.0 // 100% quality as requested
        );
      } catch (err) {
        if (source instanceof File) {
          resolve(source);
        } else {
          reject(err);
        }
      }
    };

    img.onerror = (err) => {
      cleanup();
      console.warn('Falha ao carregar imagem para conversão WebP, usando original como fallback:', err);
      if (source instanceof File) {
        resolve(source);
      } else {
        reject(new Error('Não foi possível carregar a imagem para conversão'));
      }
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
  });
}

/**
 * Ensures the image is in WebP format:
 * - If already WebP: skips conversion!
 * - If not WebP: converts to WebP with 100% quality.
 * Returns the final File object and whether conversion took place.
 */
export async function ensureWebPImage(
  source: File | Blob | string,
  targetFileName: string
): Promise<{ file: File; wasConverted: boolean }> {
  const alreadyWebP = await isWebPImage(source);

  if (alreadyWebP) {
    // Skip conversion! Just ensure correct filename & mime type
    if (source instanceof File) {
      const file = new File([source], targetFileName, { type: 'image/webp' });
      return { file, wasConverted: false };
    }
    if (source instanceof Blob) {
      const file = new File([source], targetFileName, { type: 'image/webp' });
      return { file, wasConverted: false };
    }
    if (typeof source === 'string' && source.startsWith('data:image/webp;base64,')) {
      const blob = await (await fetch(source)).blob();
      const file = new File([blob], targetFileName, { type: 'image/webp' });
      return { file, wasConverted: false };
    }
  }

  // Not WebP: convert to WebP at 100% quality
  const convertedFile = await convertImageToWebP(source, targetFileName);
  return { file: convertedFile, wasConverted: true };
}

/**
 * Uploads an image to ImgBB:
 * 1. Generates semantic filename (e.g. ancestralidade-pirmadin-capa.webp)
 * 2. Checks if format is WebP. If not, converts to WebP 100% (skips if already WebP)
 * 3. Uploads to ImgBB with rotating API keys
 */
export async function uploadToImgBB(
  imageFileOrBase64: File | Blob | string,
  namingOrName?: SemanticNamingOptions | string
): Promise<ImgBBUploadResult> {
  const customKey = getCustomImgBBKey();
  const keysToTry: string[] = customKey
    ? [customKey, ...DEFAULT_IMGBB_API_KEYS]
    : [...DEFAULT_IMGBB_API_KEYS];

  // 1. Determine semantic filename
  const originalFilename =
    imageFileOrBase64 instanceof File ? imageFileOrBase64.name : undefined;

  let semanticOptions: SemanticNamingOptions | string;
  if (namingOrName) {
    if (typeof namingOrName === 'object') {
      semanticOptions = {
        ...namingOrName,
        originalFilename: namingOrName.originalFilename || originalFilename
      };
    } else {
      semanticOptions = namingOrName;
    }
  } else {
    semanticOptions = {
      category: 'imagem',
      entityName: originalFilename ? originalFilename.replace(/\.[^/.]+$/, '') : 'anexo',
      role: 'arte',
      originalFilename
    };
  }

  const semanticFileName = generateSemanticImageName(semanticOptions);
  const cleanNameForImgBB = semanticFileName.replace(/\.webp$/i, '');

  // 2. Ensure WebP format (analyze and convert to 100% webp if not already webp)
  let fileToUpload: File;
  let wasConverted = false;

  try {
    const webpResult = await ensureWebPImage(imageFileOrBase64, semanticFileName);
    fileToUpload = webpResult.file;
    wasConverted = webpResult.wasConverted;
  } catch (err: any) {
    console.warn('Erro ao processar/converter imagem para WebP, tentando envio direto:', err);
    if (imageFileOrBase64 instanceof File) {
      fileToUpload = imageFileOrBase64;
    } else if (imageFileOrBase64 instanceof Blob) {
      fileToUpload = new File([imageFileOrBase64], semanticFileName, { type: imageFileOrBase64.type });
    } else {
      // Fallback data url to blob
      const res = await fetch(imageFileOrBase64);
      const blob = await res.blob();
      fileToUpload = new File([blob], semanticFileName, { type: blob.type });
    }
  }

  let lastError = '';

  // 3. Upload to ImgBB with rotating API keys
  for (let i = 0; i < keysToTry.length; i++) {
    const keyIndex = (currentKeyIndex + i) % keysToTry.length;
    const apiKey = keysToTry[keyIndex];

    try {
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('name', cleanNameForImgBB);
      formData.append('image', fileToUpload, semanticFileName);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data && data.success) {
        currentKeyIndex = keyIndex; // Keep the working key index
        return {
          success: true,
          url: data.data.url,
          displayUrl: data.data.display_url,
          thumbUrl: data.data.thumb?.url || data.data.display_url,
          deleteUrl: data.data.delete_url,
          fileName: semanticFileName,
          wasConvertedToWebP: wasConverted,
        };
      } else {
        const errMsg = data.error?.message || 'Chave de API inválida ou limite atingido';
        lastError = errMsg;
        console.warn(`ImgBB upload falhou com a chave ${apiKey.slice(0, 6)}...:`, errMsg);
      }
    } catch (err: any) {
      lastError = err?.message || 'Erro de conexão com o servidor ImgBB';
      console.warn(`Erro de rede ao conectar com ImgBB:`, err);
    }
  }

  return {
    success: false,
    fileName: semanticFileName,
    wasConvertedToWebP: wasConverted,
    error: lastError || 'Não foi possível fazer upload para o ImgBB após tentar todas as chaves. Tente novamente ou use uma URL externa.'
  };
}

export interface MultiUploadProgress {
  completed: number;
  total: number;
  currentFileName?: string;
  results: { file: File | Blob | string; name?: string; result: ImgBBUploadResult }[];
}

export interface MultiUploadItem {
  file: File | Blob | string;
  name?: string;
  semantic?: SemanticNamingOptions;
}

/**
 * Uploads multiple images to ImgBB sequentially with WebP check/conversion and semantic naming.
 */
export async function uploadMultipleToImgBB(
  items: (File | MultiUploadItem)[],
  onProgress?: (progress: MultiUploadProgress) => void
): Promise<{ file: File | Blob | string; name?: string; result: ImgBBUploadResult }[]> {
  const results: { file: File | Blob | string; name?: string; result: ImgBBUploadResult }[] = [];
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const rawItem = items[i];
    const item: MultiUploadItem =
      rawItem instanceof File || typeof rawItem === 'string' || rawItem instanceof Blob
        ? { file: rawItem }
        : rawItem;

    const file = item.file;
    const defaultName =
      file instanceof File
        ? file.name.replace(/\.[^/.]+$/, '')
        : `imagem-${i + 1}`;

    const currentFileName = item.name || defaultName;

    if (onProgress) {
      onProgress({
        completed: i,
        total,
        currentFileName,
        results: [...results],
      });
    }

    try {
      const semanticOpts: SemanticNamingOptions = item.semantic || {
        originalFilename: file instanceof File ? file.name : undefined,
        index: i + 1,
        entityName: item.name || defaultName
      };

      const res = await uploadToImgBB(file, semanticOpts);
      results.push({
        file,
        name: item.name || res.fileName,
        result: res,
      });
    } catch (err: any) {
      results.push({
        file,
        name: item.name,
        result: {
          success: false,
          error: err?.message || 'Falha ao enviar imagem',
        },
      });
    }

    if (onProgress) {
      onProgress({
        completed: i + 1,
        total,
        currentFileName,
        results: [...results],
      });
    }
  }

  return results;
}

/**
 * Downloads an image to the user's computer with a designated semantic filename.
 * Supports cross-origin ImgBB images via Blob fetching and anchor download triggers.
 */
export async function downloadImage(
  imageUrlOrBlob: string | Blob,
  defaultFilename: string = 'imagem.webp'
): Promise<void> {
  const cleanFilename = defaultFilename.toLowerCase().endsWith('.webp')
    ? defaultFilename
    : `${defaultFilename.replace(/\.[^/.]+$/, '')}.webp`;

  try {
    let blob: Blob;

    if (typeof imageUrlOrBlob === 'string') {
      if (imageUrlOrBlob.startsWith('data:') || imageUrlOrBlob.startsWith('blob:')) {
        const res = await fetch(imageUrlOrBlob);
        blob = await res.blob();
      } else {
        // Fetch via CORS to force true file download
        try {
          const response = await fetch(imageUrlOrBlob, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          blob = await response.blob();
        } catch {
          // Fallback: If CORS blocks direct fetch, trigger standard anchor click
          const link = document.createElement('a');
          link.href = imageUrlOrBlob;
          link.download = cleanFilename;
          link.target = '_blank';
          link.rel = 'noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }
    } else {
      blob = imageUrlOrBlob;
    }

    // Create object URL from blob
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  } catch (err) {
    console.error('Erro ao baixar imagem:', err);
    if (typeof imageUrlOrBlob === 'string') {
      window.open(imageUrlOrBlob, '_blank');
    }
  }
}

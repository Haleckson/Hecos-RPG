// ImgBB API service with rotation of provided user keys and custom key override
const DEFAULT_IMGBB_API_KEYS = [
  "f4cba49a81562f048b7dd2331aac4380",
  "4d60ed3d3e4f0ec0577795eaf2eb2384",
  "ac1f14417cb2fc3388f2d071871b53e9",
  "879c8465e668705b5a27e1c1d2b4ce03"
];

const CUSTOM_KEY_STORAGE_KEY = 'hecos_custom_imgbb_key';

let currentKeyIndex = 0;

export interface ImgBBUploadResult {
  success: boolean;
  url?: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  error?: string;
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
 * Uploads an image file or base64 string to ImgBB
 */
export async function uploadToImgBB(imageFileOrBase64: File | string, name?: string): Promise<ImgBBUploadResult> {
  const customKey = getCustomImgBBKey();
  const keysToTry: string[] = customKey
    ? [customKey, ...DEFAULT_IMGBB_API_KEYS]
    : [...DEFAULT_IMGBB_API_KEYS];

  let lastError = '';

  for (let i = 0; i < keysToTry.length; i++) {
    const keyIndex = (currentKeyIndex + i) % keysToTry.length;
    const apiKey = keysToTry[keyIndex];

    try {
      const formData = new FormData();
      formData.append('key', apiKey);
      if (name) formData.append('name', name);

      if (typeof imageFileOrBase64 === 'string') {
        // Remove base64 header if present for direct upload
        const cleanBase64 = imageFileOrBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        formData.append('image', cleanBase64);
      } else {
        formData.append('image', imageFileOrBase64);
      }

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
    error: lastError || 'Não foi possível fazer upload para o ImgBB após tentar todas as chaves. Tente novamente ou use uma URL externa.'
  };
}

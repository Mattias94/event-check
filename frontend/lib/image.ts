/** Tamanho máximo do arquivo selecionado (20 MB — fotos de celular/câmera). */
export const MAX_UPLOAD_FILE_SIZE = 20 * 1024 * 1024

/**
 * Alvo após otimização (~3 MB binário → ~4 MB em base64).
 * Mantém margem para o limite de payload da Vercel (4,5 MB).
 */
const TARGET_MAX_BYTES = 3 * 1024 * 1024

/** Resolução máxima inicial (preserva nitidez em telas retina). */
const MAX_DIMENSION = 2560

const MIN_DIMENSION = 1280

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

function getOutputMime(): 'image/webp' | 'image/jpeg' {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('image/webp') ? 'image/webp' : 'image/jpeg'
}

function renderToCanvas(
  bitmap: ImageBitmap,
  maxDimension: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / bitmap.width, maxDimension / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível processar a imagem.')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)

  return canvas
}

function encodeWithQuality(
  canvas: HTMLCanvasElement,
  mime: 'image/webp' | 'image/jpeg',
  quality: number,
): string {
  return canvas.toDataURL(mime, quality)
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const mime = getOutputMime()

  try {
    let maxDimension = MAX_DIMENSION

    while (maxDimension >= MIN_DIMENSION) {
      const canvas = renderToCanvas(bitmap, maxDimension)

      let quality = 0.92
      let dataUrl = encodeWithQuality(canvas, mime, quality)

      if (estimateDataUrlBytes(dataUrl) <= TARGET_MAX_BYTES) {
        return dataUrl
      }

      while (estimateDataUrlBytes(dataUrl) > TARGET_MAX_BYTES && quality > 0.8) {
        quality -= 0.03
        dataUrl = encodeWithQuality(canvas, mime, quality)
      }

      if (estimateDataUrlBytes(dataUrl) <= TARGET_MAX_BYTES) {
        return dataUrl
      }

      maxDimension = Math.round(maxDimension * 0.85)
    }

    throw new Error(
      'Imagem muito grande mesmo após otimização. Tente uma foto com resolução menor.',
    )
  } finally {
    bitmap.close()
  }
}

export function formatMaxUploadSize(): string {
  return `${MAX_UPLOAD_FILE_SIZE / (1024 * 1024)} MB`
}

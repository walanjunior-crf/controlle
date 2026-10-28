/**
 * Foto de perfil: abre a imagem do aparelho, recorta um quadrado e reduz para um
 * JPEG pequeno (256×256, ~60 KB) guardado como data URL no IndexedDB.
 */

export const PHOTO_SIZE = 256
export const PHOTO_MAX_BYTES = 60 * 1024
/** lado máximo da cópia de trabalho usada na prévia e no recorte */
const WORK_MAX = 1280

/** Ajuste do recorte: zoom ≥ 1 e posição de -1 (borda esquerda/topo) a 1 (direita/baixo). */
export interface CropAdjust {
  zoom: number
  x: number
  y: number
}

export interface CropRect {
  sx: number
  sy: number
  size: number
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Maior quadrado centralizado numa imagem w×h. */
export function centerCropRect(w: number, h: number): CropRect {
  return cropRect(w, h, { zoom: 1, x: 0, y: 0 })
}

/** Quadrado de recorte com zoom e posição (o ajuste da prévia). */
export function cropRect(w: number, h: number, adjust: CropAdjust): CropRect {
  const zoom = Math.max(1, Number.isFinite(adjust.zoom) ? adjust.zoom : 1)
  const size = Math.min(w, h) / zoom
  const x = clamp(adjust.x || 0, -1, 1)
  const y = clamp(adjust.y || 0, -1, 1)
  return {
    sx: ((w - size) / 2) * (1 + x),
    sy: ((h - size) / 2) * (1 + y),
    size,
  }
}

/** Tamanho aproximado, em bytes, do conteúdo de uma data URL base64. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length
  return Math.floor((b64 * 3) / 4)
}

/** Imagem já decodificada (orientação corrigida), pronta para prévia e recorte. */
export interface LoadedPhoto {
  canvas: HTMLCanvasElement
  width: number
  height: number
  /** URL para a prévia (object URL; chame dispose ao terminar) */
  url: string
  dispose: () => void
}

const DECODE_ERROR =
  'Não consegui abrir esta imagem. Se for HEIC, escolha a foto pela galeria do iPhone ou salve como JPEG e tente de novo.'

function isHeic(file: File) {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number; close?: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* cai para <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('vazia')
    // o navegador já aplica a orientação EXIF em <img> (image-orientation: from-image)
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    c.getContext('2d')?.drawImage(img, 0, 0)
    return c
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Decodifica o arquivo numa cópia de trabalho (até 1280 px). Lança erro em pt-BR se não der. */
export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (file.type && !file.type.startsWith('image/') && !isHeic(file)) {
    throw new Error('Escolha um arquivo de imagem (JPEG, PNG ou HEIC).')
  }
  let source: Awaited<ReturnType<typeof decode>>
  try {
    source = await decode(file)
  } catch {
    throw new Error(DECODE_ERROR)
  }
  const scale = Math.min(1, WORK_MAX / Math.max(source.width, source.height))
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(DECODE_ERROR)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  source.close?.()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error(DECODE_ERROR)
  const url = URL.createObjectURL(blob)
  return { canvas, width, height, url, dispose: () => URL.revokeObjectURL(url) }
}

/** Recorta e exporta 256×256 JPEG (qualidade 0,85, baixando até caber em ~60 KB). */
export function cropPhoto(photo: Pick<LoadedPhoto, 'canvas' | 'width' | 'height'>, adjust: CropAdjust = { zoom: 1, x: 0, y: 0 }): string {
  const { sx, sy, size } = cropRect(photo.width, photo.height, adjust)
  const out = document.createElement('canvas')
  out.width = PHOTO_SIZE
  out.height = PHOTO_SIZE
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Não foi possível preparar a foto neste navegador.')
  ctx.imageSmoothingQuality = 'high'
  // fundo branco: PNG com transparência não vira preto no JPEG
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE)
  ctx.drawImage(photo.canvas, sx, sy, size, size, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
  let quality = 0.85
  let url = out.toDataURL('image/jpeg', quality)
  while (dataUrlBytes(url) > PHOTO_MAX_BYTES && quality > 0.45) {
    quality -= 0.1
    url = out.toDataURL('image/jpeg', quality)
  }
  return url
}

/** Atalho: abre o arquivo e recorta (centro, ou com o ajuste dado). */
export async function processPhoto(file: File, adjust?: CropAdjust): Promise<string> {
  const photo = await loadPhoto(file)
  try {
    return cropPhoto(photo, adjust)
  } finally {
    photo.dispose()
  }
}

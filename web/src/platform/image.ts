/**
 * Reduz uma foto para enviar (lado maior até `max` px, JPEG). Fotos de celular
 * passam de 3 MB; reduzidas ficam por volta de 150–300 KB.
 */
export async function shrinkPhoto(file: Blob, max = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sem canvas')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality))
  if (!blob) throw new Error('não deu para reduzir a foto')
  return blob
}

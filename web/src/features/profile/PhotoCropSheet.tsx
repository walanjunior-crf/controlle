import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { cropPhoto, loadPhoto, type CropAdjust, type LoadedPhoto } from './photo'
import './profile.css'

const START: CropAdjust = { zoom: 1, x: 0, y: 0 }
const MAX_ZOOM = 3
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

interface PhotoCropSheetProps {
  file: File | null
  onCancel: () => void
  onDone: (dataUrl: string) => void
}

/** Prévia redonda com arrastar para posicionar e zoom; o recorte final segue o ajuste. */
export function PhotoCropSheet({ file, onCancel, onDone }: PhotoCropSheetProps) {
  const toast = useToast()
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null)
  const [adjust, setAdjust] = useState<CropAdjust>(START)
  const [busy, setBusy] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const [d, setD] = useState(240)
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!file) return
    let alive = true
    let loaded: LoadedPhoto | null = null
    setAdjust(START)
    setPhoto(null)
    loadPhoto(file)
      .then((p) => {
        loaded = p
        if (alive) setPhoto(p)
        else p.dispose()
      })
      .catch((e: unknown) => {
        if (!alive) return
        toast.show(e instanceof Error ? e.message : 'Não consegui abrir esta imagem.')
        cancelRef.current()
      })
    return () => {
      alive = false
      loaded?.dispose()
    }
  }, [file, toast])

  useLayoutEffect(() => {
    const el = frame.current
    if (el) setD(el.getBoundingClientRect().width || 240)
  }, [photo])

  // geometria da prévia (mesma regra de cropRect)
  const base = photo ? Math.min(photo.width, photo.height) : 1
  const scale = (d / base) * adjust.zoom
  const dispW = photo ? photo.width * scale : d
  const dispH = photo ? photo.height * scale : d
  const maxTx = (dispW - d) / 2
  const maxTy = (dispH - d) / 2
  const tx = -adjust.x * maxTx
  const ty = -adjust.y * maxTy

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, x: adjust.x, y: adjust.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = drag.current
    if (!s) return
    const dx = e.clientX - s.px
    const dy = e.clientY - s.py
    setAdjust((a) => ({
      ...a,
      x: maxTx > 0 ? clamp(s.x - dx / maxTx, -1, 1) : 0,
      y: maxTy > 0 ? clamp(s.y - dy / maxTy, -1, 1) : 0,
    }))
  }
  const onPointerUp = () => {
    drag.current = null
  }
  const nudge = (e: React.KeyboardEvent) => {
    const step = 0.08
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = map[e.key]
    if (!m) return
    e.preventDefault()
    setAdjust((a) => ({ ...a, x: clamp(a.x + m[0], -1, 1), y: clamp(a.y + m[1], -1, 1) }))
  }

  const use = () => {
    if (!photo) return
    setBusy(true)
    try {
      onDone(cropPhoto(photo, adjust))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Não foi possível usar esta foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={file !== null}
      onClose={onCancel}
      title="Ajustar foto"
      footer={
        <div className="crop-actions">
          <button type="button" className="btn btn-ghost btn-grow" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-grow" onClick={use} disabled={!photo || busy}>
            Usar foto
          </button>
        </div>
      }
    >
      <div className="crop">
        <div
          ref={frame}
          className={`crop-frame${photo ? '' : ' is-loading'}`}
          role="group"
          aria-label="Prévia da foto. Arraste ou use as setas para posicionar."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={nudge}
          onWheel={(e) => setAdjust((a) => ({ ...a, zoom: clamp(a.zoom - e.deltaY * 0.002, 1, MAX_ZOOM) }))}
        >
          {photo && (
            <img
              src={photo.url}
              alt=""
              draggable={false}
              style={{ width: dispW, height: dispH, transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px)` }}
            />
          )}
        </div>
        <label className="crop-zoom">
          <span className="field-label">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={adjust.zoom}
            disabled={!photo}
            onChange={(e) => setAdjust((a) => ({ ...a, zoom: Number(e.target.value) }))}
          />
        </label>
        <p className="field-hint crop-hint">Arraste a foto para centralizar o rosto.</p>
      </div>
    </Sheet>
  )
}

/**
 * Fluxo completo de foto: inputs escondidos (galeria e câmera) + folha de ajuste.
 * Renderize `elements` em algum lugar da tela e chame openGallery/openCamera num toque.
 */
export function usePhotoFlow(onPhoto: (dataUrl: string) => void): {
  openGallery: () => void
  openCamera: () => void
  elements: ReactNode
} {
  const gallery = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) setFile(f)
  }

  const elements = (
    <>
      <input ref={gallery} type="file" accept="image/*" className="visually-hidden-input" tabIndex={-1} aria-hidden="true" onChange={pick} />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="user"
        className="visually-hidden-input"
        tabIndex={-1}
        aria-hidden="true"
        onChange={pick}
      />
      <PhotoCropSheet
        file={file}
        onCancel={() => setFile(null)}
        onDone={(url) => {
          setFile(null)
          onPhoto(url)
        }}
      />
    </>
  )

  return {
    openGallery: () => gallery.current?.click(),
    openCamera: () => camera.current?.click(),
    elements,
  }
}

import { useCallback, useEffect, useState } from 'react'

/** Evento não padronizado (Chrome/Edge/Android). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
  interface Navigator {
    /** Safari iOS: true quando aberto pela Tela de Início. */
    standalone?: boolean
  }
}

/** true quando o app roda instalado (tela de início), não numa aba do navegador. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  } catch {
    /* ignore */
  }
  return navigator.standalone === true
}

/** Para mostrar as instruções de instalação certas. */
export function platformHint(): 'ios-safari' | 'ios-other' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  if (ios) {
    // Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS) e apps com navegador embutido
    const other = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\//.test(ua)
    return other ? 'ios-other' : 'ios-safari'
  }
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/** Captura o beforeinstallprompt para oferecer um botão "Instalar" (Android/desktop). */
export function useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<void> } {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const prompt = useCallback(async () => {
    if (!deferred) return
    try {
      await deferred.prompt()
      await deferred.userChoice
    } finally {
      // O evento só pode ser usado uma vez.
      setDeferred(null)
    }
  }, [deferred])

  return { canPrompt: deferred !== null, prompt }
}

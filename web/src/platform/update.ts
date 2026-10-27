import { useRegisterSW } from 'virtual:pwa-register/react'

const HOUR = 60 * 60 * 1000

/**
 * Avisa quando há uma nova versão do app (registerType 'prompt').
 * Verifica atualização a cada hora enquanto o app está aberto.
 */
export function useUpdateAvailable(): { needRefresh: boolean; update: () => void } {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      setInterval(async () => {
        if (registration.installing || !navigator.onLine) return
        try {
          // Só pede o SW novo se o servidor responder (evita erro offline).
          const resp = await fetch(swUrl, { cache: 'no-store', headers: { cache: 'no-store' } })
          if (resp.status === 200) await registration.update()
        } catch {
          /* offline */
        }
      }, HOUR)
    },
  })

  return {
    needRefresh,
    update: () => {
      void updateServiceWorker(true)
    },
  }
}

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_SETTINGS, type Settings } from '../domain/types'

/** Configurações atuais (DEFAULT_SETTINGS enquanto carrega ou se nunca foram salvas). */
export function useSettings(): Settings {
  return useLiveQuery(async () => (await db.settings.get('settings')) ?? DEFAULT_SETTINGS, [], DEFAULT_SETTINGS)
}

/** Igual a useSettings, mas `undefined` até a primeira leitura terminar (para decidir rotas). */
export function useSettingsLoaded(): Settings | undefined {
  return useLiveQuery(async () => (await db.settings.get('settings')) ?? DEFAULT_SETTINGS, [])
}

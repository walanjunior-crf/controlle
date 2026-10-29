/**
 * Folha de contato do avatar (revisão visual).
 *
 *   npx tsx scripts/avatar-sheet.ts --out /tmp/sheet --cols hat=nenhum,bone,cartola [--rows species|moods] [--set fur=#E08A3C,bg=#336633] [--size 120] [--lite]
 *
 * Gera <out>.html e <out>.png: linhas = bichos (ou humores), colunas = valores do campo.
 */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { DEFAULT_AVATAR, SPECIES, SPECIES_FUR } from '../src/features/profile/avatarParts'
import { MOODS, renderAvatar } from '../src/avatar'
import type { Mood } from '../src/avatar'

const args = process.argv.slice(2)
const opt = (k: string) => {
  const i = args.indexOf(`--${k}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = opt('out') ?? '/tmp/avatar-sheet'
const size = Number(opt('size') ?? 120)
const lite = args.includes('--lite')
const set: Record<string, string> = {}
for (const kv of (opt('set') ?? '').split(',').filter(Boolean)) {
  const [k, v] = kv.split('=')
  set[k] = v
}
const [colKey, colVals] = (opt('cols') ?? 'mood=neutral').split('=')
const cols = colVals.split(/[,|]/)
const rowsKind = opt('rows') ?? 'species'

const rows: { label: string; cfg: Record<string, string>; mood?: Mood }[] =
  rowsKind === 'moods'
    ? MOODS.map((m) => ({ label: m, cfg: {}, mood: m }))
    : SPECIES.map((s) => ({ label: s.label, cfg: { species: s.id, fur: SPECIES_FUR[s.id] } }))

const cell = (cfg: Record<string, string>, mood?: Mood) =>
  `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${renderAvatar({ ...DEFAULT_AVATAR, ...cfg } as never, { mood, detail: lite ? 'lite' : 'full' })}</svg>`

const html =
  `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:10px;background:#fff;font:12px system-ui"><table style="border-collapse:collapse"><tr><th></th>${cols.map((c) => `<th>${colKey}=${c}</th>`).join('')}</tr>` +
  rows
    .map((r) => {
      const tds = cols.map((v) => {
        const cfg = { ...r.cfg, ...set }
        const mood = colKey === 'mood' ? (v as Mood) : r.mood
        if (colKey !== 'mood') cfg[colKey] = v
        return `<td style="padding:3px">${cell(cfg, mood)}</td>`
      })
      return `<tr><th style="text-align:right;padding-right:6px">${r.label}</th>${tds.join('')}</tr>`
    })
    .join('') +
  `</table></body>`
writeFileSync(`${out}.html`, html)

const { chromium } = await import(pathToFileURL('/home/claude/.npm-global/lib/node_modules/playwright/index.mjs').href)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })
const p = await b.newPage({ viewport: { width: 200 + cols.length * (size + 8), height: 400 }, deviceScaleFactor: 1 })
await p.goto(pathToFileURL(`${out}.html`).href)
await p.screenshot({ path: `${out}.png`, fullPage: true })
await b.close()
console.log(`${out}.png`)

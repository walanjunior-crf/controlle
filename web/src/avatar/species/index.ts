import type { SpeciesDef } from '../types'
import cachorro from './cachorro'
import coelho from './coelho'
import dinossauro from './dinossauro'
import gato from './gato'
import raposa from './raposa'
import rato from './rato'
import tubarao from './tubarao'
import urso from './urso'

/** Bichos no traço papel (ids do catálogo). */
export const SPECIES_DEFS: Record<string, SpeciesDef> = {
  gato,
  cachorro,
  raposa,
  urso,
  coelho,
  rato,
  dinossauro,
  tubarao,
}

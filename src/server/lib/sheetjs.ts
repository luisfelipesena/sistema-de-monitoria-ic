import * as XLSXModule from 'xlsx'
// @ts-ignore
import * as codepages from 'xlsx/dist/cpexcel.full.mjs'

const XLSX = (XLSXModule as any).default || XLSXModule
if (typeof (XLSX as any).set_cptable === 'function') {
  ;(XLSX as any).set_cptable(codepages)
}

export { XLSX }

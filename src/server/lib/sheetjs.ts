import * as XLSX from 'xlsx'
import * as codepages from 'xlsx/dist/cpexcel.full.mjs'

XLSX.set_cptable(codepages)

export { XLSX }

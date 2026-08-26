import * as XLSX from 'xlsx'

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const codepages = require('xlsx/dist/cpexcel.full.mjs')
  XLSX.set_cptable(codepages)
} catch {
  // In test environment, cpexcel may not load correctly - XLSX still works for basic operations
}

export { XLSX }

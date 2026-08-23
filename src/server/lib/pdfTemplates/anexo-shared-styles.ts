import { StyleSheet } from '@react-pdf/renderer'

export const anexoStyles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 36,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.25,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    width: '100%',
  },
  headerLogo: {
    width: 45,
    height: 55,
  },
  headerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
    lineHeight: 1.25,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  sectionHeaderRow: {
    backgroundColor: '#BFBFBF',
    borderStyle: 'solid',
    borderColor: '#000',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  sectionHeaderText: {
    fontWeight: 'bold',
    fontSize: 9.5,
  },
  row: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderColor: '#000',
    borderBottomWidth: 1,
  },
  cellFull: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderStyle: 'solid',
    borderColor: '#000',
    borderRightWidth: 1,
  },
  cell: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderStyle: 'solid',
    borderColor: '#000',
    borderRightWidth: 1,
  },
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    width: '100%',
    marginTop: 45,
  },
  signatureCaption: {
    fontSize: 8.5,
    marginTop: 2,
    textAlign: 'center',
  },
  paragraph: {
    marginTop: 10,
    textAlign: 'justify',
    lineHeight: 1.35,
  },
  clausulaListItem: {
    marginTop: 6,
    textAlign: 'justify',
    lineHeight: 1.35,
  },
  strongLabel: {
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 1.3,
  },
  inlineValue: {
    fontWeight: 'normal',
  },
  signatureImage: {
    position: 'absolute',
    width: 130,
    height: 40,
  },
})

function parseSafeDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null
  let d: Date
  if (typeof date === 'string') {
    if (date.includes('/')) {
      const parts = date.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        const fullYear = year.length === 2 ? `20${year}` : year
        d = new Date(Date.UTC(parseInt(fullYear), parseInt(month) - 1, parseInt(day)))
      } else {
        d = new Date(date)
      }
    } else {
      d = new Date(date)
    }
  } else if (typeof date === 'number') {
    d = new Date(date)
  } else {
    d = date
  }
  return isNaN(d.getTime()) ? null : d
}

export function formatDateBR(date: Date | string | number | null | undefined): string {
  const d = parseSafeDate(date)
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(d)
}

export function formatDateLongBR(date: Date | string | number | null | undefined): string {
  const d = parseSafeDate(date)
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

export function formatDateFullBR(date: Date | string | number | null | undefined): string {
  const d = parseSafeDate(date)
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

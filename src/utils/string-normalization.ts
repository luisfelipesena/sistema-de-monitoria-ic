/**
 * Utility functions for string normalization and matching
 * Used primarily for professor name matching during import
 */

/**
 * Normalizes a string for matching purposes:
 * - Removes diacritics (accents)
 * - Converts to lowercase
 * - Trims whitespace
 * - Normalizes multiple spaces to single space
 *
 * @example normalizeForMatch("José André") // "jose andre"
 * @example normalizeForMatch("  GUSTAVO  Silva ") // "gustavo silva"
 */
export function normalizeForMatch(str: string): string {
  return (
    str
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: Standard Unicode diacritic removal pattern
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
  )
}

/**
 * Checks if a search name matches a full name using multiple strategies:
 * 1. Exact match (highest priority)
 * 2. First name match (search term equals first word of full name)
 * 3. Prefix match (full name starts with search term)
 *
 * Uses normalized comparison (no accents, case-insensitive)
 *
 * @example matchProfessorByFirstName("Professor Demo", "Professor Demo") // true (exact)
 * @example matchProfessorByFirstName("Gustavo", "Gustavo Silva Santos") // true (first name)
 * @example matchProfessorByFirstName("José", "Jose Andre Silva") // true (first name)
 * @example matchProfessorByFirstName("Gustavo Silva", "Gustavo Silva Santos") // true (prefix)
 * @example matchProfessorByFirstName("Silva", "Gustavo Silva") // false
 */
export function matchProfessorByFirstName(searchName: string, fullName: string): boolean {
  const normalizedSearch = normalizeForMatch(searchName)
  const normalizedFull = normalizeForMatch(fullName)

  // Empty search should not match
  if (!normalizedSearch) return false

  // 1. Exact match (highest priority - covers cases like "Professor Demo" = "Professor Demo")
  if (normalizedFull === normalizedSearch) return true

  // 2. Match exact first word (e.g., "Gustavo" matches "Gustavo Silva Santos")
  const firstWordFull = normalizedFull.split(' ')[0]
  if (firstWordFull === normalizedSearch) return true

  // 3. Prefix match (e.g., "Gustavo Silva" matches "Gustavo Silva Santos")
  if (normalizedFull.startsWith(`${normalizedSearch} `)) return true

  return false
}

/**
 * Finds all professors from a list that match the given name
 * Returns matches sorted alphabetically by full name
 */
export function findMatchingProfessors<T extends { nomeCompleto: string }>(searchName: string, professors: T[]): T[] {
  return professors
    .filter((p) => matchProfessorByFirstName(searchName, p.nomeCompleto))
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))
}

/**
 * Sanitizes a title by:
 * - Trimming whitespace
 * - Collapsing multiple spaces into one
 * - Capitalizing first letter of each word (except common prepositions)
 */
export function sanitizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\t+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .split(' ')
    .map((word) => {
      const lowerWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'a', 'o', 'com', 'por', 'na', 'no']
      const upperWord = word.toUpperCase()
      if (word === upperWord && word.length <= 4) return word
      if (lowerWords.includes(word.toLowerCase())) return word.toLowerCase()
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Sanitizes a discipline code
 */
export function sanitizeDisciplineCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Sanitizes a SIAPE number (removes non-digits)
 */
export function sanitizeSiape(siape: string): string {
  return siape.trim().replace(/\D/g, '')
}

/**
 * Sanitizes a name for use in filenames:
 * - Removes accents/diacritics
 * - Converts to uppercase
 * - Replaces spaces with underscores
 * - Removes special characters (keeps only alphanumeric and underscores)
 *
 * @example sanitizeForFilename("José André Silva") // "JOSE_ANDRE_SILVA"
 * @example sanitizeForFilename("Maria da Silva") // "MARIA_DA_SILVA"
 */
export function sanitizeForFilename(name: string): string {
  return (
    name
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: Standard Unicode diacritic removal pattern
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toUpperCase()
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^A-Z0-9_]/g, '') // Remove special characters, keep only alphanumeric and underscores
  )
}

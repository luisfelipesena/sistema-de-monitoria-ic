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
 * Checks if a search name matches the beginning of a full name
 * Uses normalized comparison (no accents, case-insensitive)
 *
 * @example matchProfessorByFirstName("Gustavo", "Gustavo Silva Santos") // true
 * @example matchProfessorByFirstName("José", "Jose Andre Silva") // true
 * @example matchProfessorByFirstName("Silva", "Gustavo Silva") // false
 */
export function matchProfessorByFirstName(searchName: string, fullName: string): boolean {
  const normalizedSearch = normalizeForMatch(searchName)
  const normalizedFull = normalizeForMatch(fullName)

  // Empty search should not match
  if (!normalizedSearch) return false

  // Match exact first word or full name starts with search term
  const firstWordFull = normalizedFull.split(' ')[0]
  return firstWordFull === normalizedSearch || normalizedFull.startsWith(`${normalizedSearch} `)
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

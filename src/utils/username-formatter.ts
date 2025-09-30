/**
 * Utility functions for formatting usernames from UFBA CAS system
 */

/**
 * Converts a username like "luis.sena" to "Luis Sena"
 * @param username - The username from UFBA CAS (e.g., "luis.sena", "joao.leahy")
 * @returns Formatted name with proper capitalization (e.g., "Luis Sena", "João Leahy")
 */
export function formatUsernameToDisplayName(username: string): string {
  if (!username || typeof username !== 'string') {
    return ''
  }

  return username
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Converts a username to title case while preserving special characters
 * Handles cases like "joao.leahy" -> "João Leahy"
 * @param username - The username from UFBA CAS
 * @returns Formatted name with proper capitalization and special characters
 */
export function formatUsernameToProperName(username: string): string {
  if (!username || typeof username !== 'string') {
    return ''
  }

  const nameParts = username.split('.')

  return nameParts
    .map((part) => {
      // Handle common Portuguese name patterns
      const formatted = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()

      // Handle common Portuguese names with special characters
      const nameMap: Record<string, string> = {
        joao: 'João',
        jose: 'José',
        antonio: 'Antônio',
        carlos: 'Carlos',
        paulo: 'Paulo',
        ana: 'Ana',
        maria: 'Maria',
        pedro: 'Pedro',
        andre: 'André',
        luis: 'Luís',
        caio: 'Caio',
        felipe: 'Felipe',
        viana: 'Viana',
        leahy: 'Leahy',
        sena: 'Sena',
      }

      return nameMap[part.toLowerCase()] || formatted
    })
    .join(' ')
}

/**
 * Gets the first name from a username
 * @param username - The username from UFBA CAS
 * @returns The first name with proper capitalization
 */
export function getFirstNameFromUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return ''
  }

  const firstName = username.split('.')[0]
  return formatUsernameToProperName(firstName)
}

/**
 * Creates initials from a username
 * @param username - The username from UFBA CAS
 * @returns Initials (e.g., "luis.sena" -> "LS")
 */
export function getUserInitials(username: string): string {
  if (!username || typeof username !== 'string') {
    return ''
  }

  return username
    .split('.')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export const emailToUsername = (email: string): string => {
  const at = email.indexOf("@");
  return email.slice(0, at);
};


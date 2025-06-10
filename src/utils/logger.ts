// Simple logger utility
export const logger = {
  info: (message: string, data?: any) => {
    console.log(message, data)
  },
  error: (message: string, data?: any) => {
    console.error(message, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data)
  },
  debug: (message: string, data?: any) => {
    console.debug(message, data)
  },
  child: (context: Record<string, any>) => {
    return {
      info: (message: string, data?: any) => {
        console.log(`[${context.context || 'default'}] ${message}`, data)
      },
      error: (message: string, data?: any) => {
        console.error(`[${context.context || 'default'}] ${message}`, data)
      },
      warn: (message: string, data?: any) => {
        console.warn(`[${context.context || 'default'}] ${message}`, data)
      },
      debug: (message: string, data?: any) => {
        console.debug(`[${context.context || 'default'}] ${message}`, data)
      }
    }
  }
}
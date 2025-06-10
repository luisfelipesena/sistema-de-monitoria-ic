import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { type ReactElement } from "react"

/**
 * Renders a React-PDF component to a buffer.
 * @param doc - The React-PDF component (e.g., <Document>...</Document>) to render.
 * @returns A promise that resolves with the PDF buffer.
 */
export async function generatePdfBuffer(doc: ReactElement<DocumentProps>): Promise<Buffer> {
  const buffer = await renderToBuffer(doc)
  return buffer
} 
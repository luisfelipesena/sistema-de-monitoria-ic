"use client"

import { PDFViewer } from "@react-pdf/renderer"
import type { ReactElement } from "react"

interface PDFViewerWrapperProps {
  children: ReactElement
  width?: string
  height?: string
  showToolbar?: boolean
}

export function PDFViewerWrapper({ children, ...props }: PDFViewerWrapperProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PDFViewer {...props}>{children as any}</PDFViewer>
}

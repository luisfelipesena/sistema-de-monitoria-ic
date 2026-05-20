"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    SwaggerUIBundle: any
    SwaggerUIStandalonePreset: any
  }
}

export default function ApiDocsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadSwaggerUI = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.type = "text/css"
        cssLink.href = "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css"
        document.head.appendChild(cssLink)

        const bundleScript = document.createElement("script")
        bundleScript.src = "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"
        bundleScript.async = true

        const presetScript = document.createElement("script")
        presetScript.src = "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"
        presetScript.async = true

        document.head.appendChild(bundleScript)
        document.head.appendChild(presetScript)

        await new Promise((resolve, reject) => {
          let bundleLoaded = false
          let presetLoaded = false

          const checkLoaded = () => {
            if (bundleLoaded && presetLoaded) {
              resolve(undefined)
            }
          }

          bundleScript.onload = () => {
            bundleLoaded = true
            checkLoaded()
          }

          presetScript.onload = () => {
            presetLoaded = true
            checkLoaded()
          }

          bundleScript.onerror = reject
          presetScript.onerror = reject

          setTimeout(() => {
            reject(new Error("Scripts loading timeout"))
          }, 10000)
        })

        if (containerRef.current && window.SwaggerUIBundle) {
          window.SwaggerUIBundle({
            url: `${window.location.origin}/api/openapi-spec`,
            dom_id: "#swagger-ui-container",
            deepLinking: true,
            presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
            plugins: [window.SwaggerUIBundle.plugins.DownloadUrl],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            filter: true,
            persistAuthorization: true,
          })

          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error loading Swagger UI:", err)
        setError(err instanceof Error ? err.message : "Failed to load API documentation")
        setIsLoading(false)
      }
    }

    loadSwaggerUI()

    return () => {
      const existingCss = document.querySelector('link[href*="swagger-ui.css"]')
      const existingBundle = document.querySelector('script[src*="swagger-ui-bundle.js"]')
      const existingPreset = document.querySelector('script[src*="swagger-ui-standalone-preset.js"]')

      if (existingCss) existingCss.remove()
      if (existingBundle) existingBundle.remove()
      if (existingPreset) existingPreset.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
              <p className="mt-2 text-lg text-gray-600">Interactive documentation for the Sistema de Monitoria API</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/api/openapi-spec"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View OpenAPI Spec
              </a>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to App
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading API documentation...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading documentation</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2">Try refreshing the page or check the console for more details.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          <div
            id="swagger-ui-container"
            ref={containerRef}
            className={`min-h-[600px] ${isLoading || error ? "hidden" : ""}`}
          />
        </div>
      </div>
    </div>
  )
}

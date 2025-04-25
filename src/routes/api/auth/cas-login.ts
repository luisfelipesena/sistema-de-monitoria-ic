'use client';

import { env } from '@/utils/env'; // Assuming env config is centralized
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/auth/cas-login')({
  GET: async () => {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    // Use CLIENT_URL as the base for the callback
    const clientUrl = env.CLIENT_URL

    if (!casServerUrlPrefix || !clientUrl) {
      console.error(
        'CAS_SERVER_URL_PREFIX or CLIENT_URL environment variables are not set.',
      )
      // Return a standard error response for API routes
      return new Response(
        'Required CAS configuration environment variables are missing.',
        { status: 500 },
      )
    }

    const serviceUrl = `${clientUrl}/api/auth/cas-callback`
    const redirectUrl = `${casServerUrlPrefix}/login?service=${encodeURIComponent(serviceUrl)}`

    console.log(`Redirecting to CAS: ${redirectUrl}`)

    // Return a standard Response object for redirection
    return new Response(null, {
      status: 302, // Found (redirect)
      headers: {
        Location: redirectUrl,
      },
    })
  },
}) 
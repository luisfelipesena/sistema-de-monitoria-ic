'use client';

import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router';

// This layout is for routes under /auth/
// It redirects authenticated users away from auth pages (like login/callback)

export const Route = createFileRoute('/auth/_layout')({
  component: AuthLayoutComponent,
  // Add a loader or beforeLoad to check auth status server-side or client-side
  // before rendering the component for better UX and security.
  beforeLoad: async ({ context, location }) => {
    // context isn't readily available here in the basic setup
    // We rely on the component check for now, but a loader is better.
    // See TanStack Router docs for loaders: https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes
    console.log(
      `AuthLayout beforeLoad: Checking if already authenticated for ${location.pathname}`,
    );
    // Cannot access useAuth here directly, component check is needed.

    // --- ADD Check here --- Let's try fetching /api/auth/me
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        // User IS authenticated, redirect away from auth pages
        console.log(
          'AuthLayout beforeLoad: Already authenticated, redirecting to /home',
        );
        throw redirect({ to: '/home', replace: true });
      }
      // If 401 or other error, user is NOT authenticated, proceed normally
      console.log(
        `AuthLayout beforeLoad: Not authenticated (status ${res.status}), proceeding.`,
      );
    } catch (error) {
      if (error instanceof Error && 'isRedirect' in error && error.isRedirect) {
        throw error; // Re-throw redirects
      }
      // If fetch itself fails, proceed (might be server issue, let page render)
      console.error(
        'AuthLayout beforeLoad: Error checking auth status, proceeding anyway:',
        error,
      );
    }
  },
});

function AuthLayoutComponent() {
  // const { isAuthenticated, isLoading } = useAuth(); // REMOVED useAuth call

  // console.log('AuthLayoutComponent Render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // REMOVED all checks/redirects based on useAuth from component render
  // // Option 1: Show loading state (preferred)
  // if (isLoading) {
  //   return <div>Verificando autenticação...</div>; // Or a proper spinner
  // }
  //
  // // Option 2: Redirect if authenticated (runs after loading is false)
  // if (isAuthenticated) {
  //   console.log(
  //     'AuthLayoutComponent: Authenticated, redirecting to /home',
  //   );
  //   // Using redirect function from TanStack Router is preferred over <Navigate>
  //   // Note: This might flash the auth layout briefly. Using beforeLoad/loader is better.
  //   throw redirect({ to: '/home', replace: true });
  // }

  // Render the auth pages (Outlet will render e.g., cas-callback)
  // This component now just provides the common header/frame for auth pages
  return (
    <div>
      <header className="p-4 border-b">
        <Link to="/" className="font-bold">
          Sistema de Monitoria IC (Auth Layout)
        </Link>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}

'use client';

// import { Sidebar } from '@/components/layout/Sidebar'; // TODO: Migrate or create Sidebar
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router';

// This is the protected layout for /home and its children

export const Route = createFileRoute('/home/_layout')({
  component: HomeLayoutComponent,
  // --- Authentication Guard ---
  beforeLoad: async ({ context, location }) => {
    // context.auth is not available in this basic setup. We need to fetch user status.
    // This approach requires an API call on every protected route load.
    // A better approach might involve passing auth state through context
    // or using server-side loaders if possible with Vinxi setup.
    console.log(
      `HomeLayout beforeLoad: Checking auth for ${location.pathname}`,
    );

    try {
      // Call the /api/auth/me endpoint directly
      const res = await fetch('/api/auth/me');
      console.log('HomeLayout beforeLoad: /api/auth/me status:', res.status);

      if (!res.ok) {
        if (res.status === 401) {
          console.log(
            'HomeLayout beforeLoad: Not authenticated (401), redirecting to /',
          );
          throw redirect({
            to: '/', // Redirect to landing page
            search: {
              // Optional: redirect back to the original page after login
              // redirect: location.href,
            },
          });
        }
        // Handle other errors (e.g., server error)
        console.error(`HomeLayout beforeLoad: API error ${res.status}`);
        // Maybe redirect to an error page or landing page
        throw redirect({ to: '/' });
      }

      // If response is OK (2xx), user is authenticated, proceed to load the component.
      // Optionally parse the user data if needed by child routes via context?
      // const userData = await res.json();
      console.log('HomeLayout beforeLoad: Authenticated, proceeding.');
      // return { authUser: userData.user }; // Can pass data down if needed
    } catch (error) {
      // Catch fetch errors or redirect errors
      if (error instanceof Error && 'isRedirect' in error && error.isRedirect) {
        throw error; // Re-throw redirects
      }
      console.error('HomeLayout beforeLoad: Error checking auth:', error);
      // Redirect to landing on any other error during auth check
      throw redirect({ to: '/' });
    }
  },
});

function HomeLayoutComponent() {
  // useAuth can still be used here for convenience (e.g., display user info, logout button)
  // const { user, signOut } = useAuth(); // REMOVED useAuth call from layout component

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Placeholder Sidebar */}
      <aside className="flex flex-col w-64 p-4 bg-white shadow-md">
        <h2 className="mb-6 text-xl font-bold">Dashboard</h2>
        <nav className="flex-grow">
          <Link
            to="/home"
            className="block px-3 py-2 rounded hover:bg-gray-200"
            activeProps={{ className: 'font-bold bg-gray-200' }}
          >
            Visão Geral
          </Link>
          <Link
            to="/home/projects"
            className="block px-3 py-2 rounded hover:bg-gray-200"
            activeProps={{ className: 'font-bold bg-gray-200' }}
          >
            Projetos
          </Link>
          <Link
            to="/home/profile"
            className="block px-3 py-2 rounded hover:bg-gray-200"
            activeProps={{ className: 'font-bold bg-gray-200' }}
          >
            Perfil
          </Link>
          <Link
            to="/home/settings"
            className="block px-3 py-2 rounded hover:bg-gray-200"
            activeProps={{ className: 'font-bold bg-gray-200' }}
          >
            Configurações
          </Link>
        </nav>
        <div className="mt-auto">
          {/* REMOVED User info and Logout button - Add to a Header or specific pages later */}
          {/* {user && (
            <div className="mb-4 text-sm">
              Logado como: {user.username} ({user.role})
            </div>
          )} */}
          {/* <button
            onClick={signOut}
            className="w-full px-3 py-2 text-left text-red-600 rounded hover:bg-red-100"
          >
            Sair
          </button> */}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

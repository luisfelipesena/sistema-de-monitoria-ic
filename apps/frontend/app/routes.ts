import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

// Documentação: https://reactrouter.com/start/framework/routing
export default [
  // Public routes
  index('routes/landing/index.tsx'),
  layout('routes/auth/layout.tsx', [
    route('auth/sign-in', 'routes/auth/sign-in.tsx'),
    route('auth/sign-up', 'routes/auth/sign-up.tsx'),
  ]),

  // Protected routes
  route('home', 'components/route-guard.tsx', [
    index('./routes/home/index.tsx'),
    route('profile', './routes/home/profile.tsx'),
    route('projects', './routes/home/projects.tsx'),
    route('settings', './routes/home/settings.tsx'),
  ]),
] satisfies RouteConfig;

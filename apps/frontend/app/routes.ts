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
    route('auth/cas-callback', 'routes/auth/cas-callback.tsx'),
  ]),

  // Protected routes
  route('home', 'components/auth/route-guard.tsx', [
    layout('routes/home/layout.tsx', [
      index('./routes/home/index.tsx'),
      route('profile', './routes/home/profile.tsx'),
      route('projects', './routes/home/projects.tsx'),
      route('settings', './routes/home/settings.tsx'),
    ]),
  ]),
] satisfies RouteConfig;

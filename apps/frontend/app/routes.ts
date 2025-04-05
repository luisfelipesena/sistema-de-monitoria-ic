import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Documentação: https://reactrouter.com/start/framework/routing
export default [
  index('routes/home/index.tsx'),
  route('/auth/sign-in', 'routes/auth/sign-in.tsx'),
  route('/auth/sign-up', 'routes/auth/sign-up.tsx'),
] satisfies RouteConfig;

import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from './routers/router';

export const trpc = createTRPCReact<AppRouter>();

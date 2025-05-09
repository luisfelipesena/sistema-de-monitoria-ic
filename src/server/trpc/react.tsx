import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '../routes/router';

export const trpc = createTRPCReact<AppRouter>();
export const useTRPC = trpc.useContext;

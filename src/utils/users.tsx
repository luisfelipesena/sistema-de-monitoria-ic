import { env } from '@/utils/env';
import { queryOptions } from '@tanstack/react-query';
import axios from 'redaxios';
export type User = {
  id: number;
  name: string;
  email: string;
};

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: () =>
      axios
        .get<Array<User>>(env.SERVER_URL + '/users')
        .then((r) => r.data)
        .catch(() => {
          throw new Error('Failed to fetch users');
        }),
  });

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: () =>
      axios
        .get<User>(env.SERVER_URL + '/users/' + id)
        .then((r) => r.data)
        .catch(() => {
          throw new Error('Failed to fetch user');
        }),
  });

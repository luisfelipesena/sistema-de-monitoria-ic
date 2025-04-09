import { hash, verify, type Options } from '@node-rs/argon2';

const options: Options = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, options);
};

export const verifyPassword = async (
  hashed: string,
  plain: string,
): Promise<boolean> => {
  return verify(hashed, plain, options);
};

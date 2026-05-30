import * as argon2 from 'argon2';

export const passwordUtils = {
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  },

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
};

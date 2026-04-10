import crypto from 'crypto';
import { getSession } from './index.js';

export const User = {
  async findByEmail(email) {
    const session = getSession();
    try {
      const result = await session.run('MATCH (u:User {email: $email}) RETURN u', { email });
      if (result.records.length === 0) return null;
      return result.records[0].get('u').properties;
    } finally {
      await session.close();
    }
  },

  async create(user) {
    const session = getSession();
    try {
      const data = {
        id: crypto.randomUUID(),
        email: user.email,
        password: user.password,
        createdAt: new Date().toISOString()
      };

      const result = await session.run(`
        CREATE (u:User {
          id: $id,
          email: $email,
          password: $password,
          createdAt: $createdAt
        })
        RETURN u
      `, data);
      
      return result.records[0].get('u').properties;
    } finally {
      await session.close();
    }
  }
};

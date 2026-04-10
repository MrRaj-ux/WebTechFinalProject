import crypto from 'crypto';
import { getSession } from './index.js';

function formatCartItem(props) {
  return {
    ...props,
    quantity: typeof props.quantity === 'object' && props.quantity !== null ? props.quantity.toNumber() : Number(props.quantity),
    
    // Instance method shim for .save()
    async save() {
      const session = getSession();
      try {
        await session.run(`
          MATCH (c:CartItem {id: $id})
          SET c.quantity = $quantity,
              c.deliveryOptionId = $deliveryOptionId,
              c.updatedAt = $updatedAt
        `, {
          id: this.id,
          quantity: this.quantity,
          deliveryOptionId: this.deliveryOptionId,
          updatedAt: new Date().toISOString()
        });
      } finally {
        await session.close();
      }
    },

    // Instance method shim for .destroy()
    async destroy() {
      const session = getSession();
      try {
        await session.run('MATCH (c:CartItem {id: $id}) DELETE c', { id: this.id });
      } finally {
        await session.close();
      }
    },
    
    toJSON() {
      const clone = { ...this };
      delete clone.save;
      delete clone.destroy;
      delete clone.toJSON;
      return clone;
    }
  };
}

export const CartItem = {
  async findAll() {
    const session = getSession();
    try {
      const result = await session.run('MATCH (c:CartItem) RETURN c ORDER BY c.createdAt ASC');
      return result.records.map(r => formatCartItem(r.get('c').properties));
    } finally {
      await session.close();
    }
  },

  async findOne(options) {
    const session = getSession();
    try {
      const whereClause = options?.where || {};
      const keys = Object.keys(whereClause);
      if (keys.length === 0) return null;
      
      const matchConditions = keys.map(k => `c.${k} = $${k}`).join(' AND ');
      const result = await session.run(`MATCH (c:CartItem) WHERE ${matchConditions} RETURN c LIMIT 1`, whereClause);
      
      if (result.records.length === 0) return null;
      return formatCartItem(result.records[0].get('c').properties);
    } finally {
      await session.close();
    }
  },

  async create(data) {
    const session = getSession();
    try {
      const newItem = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await session.run(`
        CREATE (c:CartItem)
        SET c = $newItem
      `, { newItem });

      return formatCartItem(newItem);
    } finally {
      await session.close();
    }
  },
  
  async destroy(options) {
    const session = getSession();
    try {
      const keys = Object.keys(options?.where || {});
      if (keys.length === 0) {
        await session.run('MATCH (c:CartItem) DELETE c');
      } else {
        const matchConditions = keys.map(k => `c.${k} = $${k}`).join(' AND ');
        await session.run(`MATCH (c:CartItem) WHERE ${matchConditions} DELETE c`, options.where);
      }
    } finally {
      await session.close();
    }
  },

  async bulkCreate(items) {
    const session = getSession();
    try {
      const data = items.map(i => ({
        ...i,
        id: crypto.randomUUID(),
        createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: i.updatedAt ? new Date(i.updatedAt).toISOString() : new Date().toISOString()
      }));

      await session.run(`
        UNWIND $items AS i
        CREATE (c:CartItem)
        SET c = i
      `, { items: data });
    } finally {
      await session.close();
    }
  }
};

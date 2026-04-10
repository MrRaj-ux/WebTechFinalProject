import crypto from 'crypto';
import { getSession } from './index.js';

function formatOrder(props) {
  let products = props.products;
  try { if (typeof products === 'string') products = JSON.parse(products); } catch (e) {}

  return {
    ...props,
    products,
    orderTimeMs: typeof props.orderTimeMs === 'object' && props.orderTimeMs !== null ? props.orderTimeMs.toNumber() : Number(props.orderTimeMs),
    totalCostCents: typeof props.totalCostCents === 'object' && props.totalCostCents !== null ? props.totalCostCents.toNumber() : Number(props.totalCostCents),
    toJSON() {
      const clone = { ...this };
      delete clone.toJSON;
      return clone;
    }
  };
}

export const Order = {
  unscoped() {
    return this;
  },

  async findAll(options) {
    const session = getSession();
    try {
      let orderBy = 'o.createdAt ASC';
      if (options?.order && options.order.length > 0) {
        const [field, direction] = options.order[0];
        orderBy = `o.${field} ${direction}`;
      }

      const result = await session.run(`MATCH (o:Order) RETURN o ORDER BY ${orderBy}`);
      return result.records.map(record => formatOrder(record.get('o').properties));
    } finally {
      await session.close();
    }
  },

  async findByPk(id) {
    const session = getSession();
    try {
      const result = await session.run('MATCH (o:Order {id: $id}) RETURN o', { id });
      if (result.records.length === 0) return null;
      return formatOrder(result.records[0].get('o').properties);
    } finally {
      await session.close();
    }
  },

  async create(data) {
    const session = getSession();
    try {
      const newOrder = {
        ...data,
        id: data.id || crypto.randomUUID(),
        products: JSON.stringify(data.products || []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await session.run(`
        CREATE (o:Order)
        SET o = $newOrder
      `, { newOrder });

      return formatOrder(newOrder);
    } finally {
      await session.close();
    }
  },

  async bulkCreate(orders) {
    const session = getSession();
    try {
      const data = orders.map(o => ({
        ...o,
        id: o.id || crypto.randomUUID(),
        products: JSON.stringify(o.products || []),
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString()
      }));

      await session.run(`
        UNWIND $orders AS o
        MERGE (ord:Order {id: o.id})
        SET ord += o
      `, { orders: data });
    } finally {
      await session.close();
    }
  }
};

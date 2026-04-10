import crypto from 'crypto';
import { getSession } from './index.js';

function formatProduct(props) {
  let rating = props.rating;
  try { if (typeof rating === 'string') rating = JSON.parse(rating); } catch (e) {}

  let keywords = props.keywords || [];
  if (typeof keywords === 'string') keywords = keywords.split(',');

  return {
    ...props,
    rating,
    keywords,
    priceCents: typeof props.priceCents === 'object' && props.priceCents !== null ? props.priceCents.toNumber() : Number(props.priceCents),
    toJSON() {
      const clone = { ...this };
      delete clone.toJSON;
      return clone;
    }
  };
}

export const Product = {
  async findAll() {
    const session = getSession();
    try {
      const result = await session.run('MATCH (p:Product) RETURN p ORDER BY p.createdAt ASC');
      return result.records.map(record => formatProduct(record.get('p').properties));
    } finally {
      await session.close();
    }
  },

  async findByPk(id) {
    const session = getSession();
    try {
      const result = await session.run('MATCH (p:Product {id: $id}) RETURN p', { id });
      if (result.records.length === 0) return null;
      return formatProduct(result.records[0].get('p').properties);
    } finally {
      await session.close();
    }
  },

  async count() {
    const session = getSession();
    try {
      const result = await session.run('MATCH (p:Product) RETURN count(p) as count');
      return result.records[0].get('count').toNumber();
    } finally {
      await session.close();
    }
  },

  async bulkCreate(products) {
    const session = getSession();
    try {
      const data = products.map(p => ({
        ...p,
        id: p.id || crypto.randomUUID(),
        rating: JSON.stringify(p.rating),
        keywords: Array.isArray(p.keywords) ? p.keywords.join(',') : p.keywords,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
      }));

      await session.run(`
        UNWIND $products AS p
        MERGE (prod:Product {id: p.id})
        SET prod += p
      `, { products: data });
    } finally {
      await session.close();
    }
  }
};

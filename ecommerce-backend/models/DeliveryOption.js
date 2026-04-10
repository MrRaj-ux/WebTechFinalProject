import { getSession } from './index.js';

function formatDeliveryOption(props) {
  return {
    ...props,
    deliveryDays: typeof props.deliveryDays === 'object' && props.deliveryDays !== null ? props.deliveryDays.toNumber() : Number(props.deliveryDays),
    priceCents: typeof props.priceCents === 'object' && props.priceCents !== null ? props.priceCents.toNumber() : Number(props.priceCents),
    toJSON() {
      const clone = { ...this };
      delete clone.toJSON;
      return clone;
    }
  };
}

export const DeliveryOption = {
  async findAll() {
    const session = getSession();
    try {
      const result = await session.run('MATCH (d:DeliveryOption) RETURN d ORDER BY d.createdAt ASC');
      return result.records.map(record => formatDeliveryOption(record.get('d').properties));
    } finally {
      await session.close();
    }
  },

  async findByPk(id) {
    const session = getSession();
    try {
      const result = await session.run('MATCH (d:DeliveryOption {id: $id}) RETURN d', { id });
      if (result.records.length === 0) return null;
      return formatDeliveryOption(result.records[0].get('d').properties);
    } finally {
      await session.close();
    }
  },

  async bulkCreate(options) {
    const session = getSession();
    try {
      const data = options.map(o => ({
        ...o,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString()
      }));

      await session.run(`
        UNWIND $options AS o
        MERGE (opt:DeliveryOption {id: o.id})
        SET opt += o
      `, { options: data });
    } finally {
      await session.close();
    }
  }
};

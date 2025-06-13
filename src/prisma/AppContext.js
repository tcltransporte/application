/*
import { PrismaClient } from '@prisma/client';

function interpolateQuery(query, params) {
  let interpolated = query;

  if (!Array.isArray(params)) {
    try {
      params = JSON.parse(params);
    } catch {
      params = [];
    }
  }

  params.forEach((param, index) => {
    const placeholder = `@P${index + 1}`;
    let value = param;

    if (Array.isArray(value)) {
      const arrValues = value.map(v => {
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (v === null || v === undefined) return 'NULL';
        if (v instanceof Date) return `'${v.toISOString()}'`;
        if (typeof v === 'boolean') return v ? '1' : '0';
        return v.toString();
      });
      value = '(' + arrValues.join(', ') + ')';
    } else {
      if (typeof value === 'string') value = `'${value.replace(/'/g, "''")}'`;
      else if (value === null || value === undefined) value = 'NULL';
      else if (value instanceof Date) value = `'${value.toISOString()}'`;
      else if (typeof value === 'boolean') value = value ? '1' : '0';
      else value = value.toString();
    }

    interpolated = interpolated.split(placeholder).join(value);
  });

  return interpolated;
}

export class AppContext extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'error'],
    });

    this.$on('query', (e) => {
      console.log('Prisma Query:', interpolateQuery(e.query, e.params));
      console.log('Duration:', e.duration + 'ms');
    });
  }
}
*/
import { config } from 'dotenv';

config({});

interface IENV {
  DEBUG?: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  NSQ_URL: string;
  PORT: number | string;
  EVENT_STORE_URL?: string;
  AGGREGATOR_URL?: string;
}

export const ENV: IENV = process.env as any;

export const getENV = <T>(name: string, defaultValue?: T): string | T => {
  const value = process.env[name] || defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment varialbe '${name}'`);
  }

  return value;
};

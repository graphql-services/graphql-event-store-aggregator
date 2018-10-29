import { config } from 'dotenv';

config({});

interface IENV {
  DEBUG?: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  NSQ_URL: string;
  PORT: number | string;
  EVENT_STORE_URL?: string;
}

export const ENV: IENV = process.env as any;

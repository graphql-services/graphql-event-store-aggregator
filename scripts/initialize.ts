import 'cross-fetch/polyfill';

import { ENV } from '../src/env';

if (!ENV.EVENT_STORE_URL) {
  throw new Error(`Environment variable 'EVENT_STORE_URL' missing`);
}

// implement fetch and import to POST http://localhost/events

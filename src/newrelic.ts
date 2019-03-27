process.env.NEW_RELIC_NO_CONFIG_FILE = 'true';

if (process.env.NEW_RELIC_LICENSE_KEY && !process.env.NEW_RELIC_APP_NAME) {
  throw new Error(`Missing environment variable 'NEW_RELIC_APP_NAME'`);
}

if (process.env.NEW_RELIC_LICENSE_KEY) require('newrelic');

const getEnv = (key: string, defaultValue?: string) => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}


export const DB_HOST = getEnv('DB_HOST');
export const DB_USER = getEnv('DB_USER');
export const DB_PASSWORD = getEnv('DB_PASSWORD');
export const DB_NAME = getEnv('DB_NAME');
export const DB_PORT = parseInt(getEnv('DB_PORT', '3306'), 10);
export const STRIPE_SECRET_KEY = getEnv('STRIPE_SECRET_KEY');
export const EMAIL_USER = getEnv('EMAIL_USER');
export const EMAIL_PASS = getEnv('EMAIL_PASS');

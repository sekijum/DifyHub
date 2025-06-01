import * as Payjp from 'payjp';

const payjpSecretKey = process.env.PAYJP_SECRET_KEY;

if (!payjpSecretKey) {
  throw new Error('PAYJP_SECRET_KEY environment variable is required');
}

const payjp = Payjp(payjpSecretKey);

export { payjp };

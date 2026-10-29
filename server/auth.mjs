import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function passwordHash(password) {
  const salt = randomBytes(24).toString('hex');
  const hash = Buffer.from(await scrypt(password, salt, 64)).toString('hex');
  return { salt, hash };
}
export async function verifyPassword(password, account) {
  if (!account || typeof password !== 'string' || password.length > 128) return false;
  const hash = Buffer.from(await scrypt(password, account.salt, 64));
  const expected = Buffer.from(account.hash, 'hex');
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
export class Sessions {
  constructor() { this.values = new Map(); }
  create(username) {
    this.prune();
    const token = randomBytes(32).toString('hex');
    const value = { username, csrf: randomBytes(24).toString('hex'), expires: Date.now() + 12 * 60 * 60 * 1000 };
    this.values.set(this.key(token), value);
    return { token, ...value };
  }
  key(token) { return createHash('sha256').update(token).digest('hex'); }
  get(token) {
    if (!token) return null;
    const value = this.values.get(this.key(token));
    if (!value || value.expires < Date.now()) { this.remove(token); return null; }
    return value;
  }
  remove(token) { if (token) this.values.delete(this.key(token)); }
  prune() { for (const [key, value] of this.values) if (value.expires < Date.now()) this.values.delete(key); }
  clear() { this.values.clear(); }
}

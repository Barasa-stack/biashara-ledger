import crypto from 'crypto';

const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(str: string): Buffer {
  const cleaned = str.replace(/[^A-Za-z2-7]/g, '').toUpperCase();
  const bits: number[] = [];
  for (const ch of cleaned) {
    const idx = base32Chars.indexOf(ch);
    if (idx >= 0) {
      for (let b = 4; b >= 0; b--) {
        bits.push((idx >> b) & 1);
      }
    }
  }
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i + b];
    }
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

export function generateTOTPSecret(): string {
  const buf = crypto.randomBytes(20);
  return base32Encode(buf);
}

export function getTOTPToken(secret: string): string {
  const decoded = base32Decode(secret);
  const time = Math.floor(Date.now() / 30000);
  const counter = Buffer.alloc(8);
  counter.writeBigInt64BE(BigInt(time));
  const hmac = crypto.createHmac('sha1', decoded).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

export function verifyTOTP(token: string, secret: string): boolean {
  const time = Math.floor(Date.now() / 30000);
  for (let i = -1; i <= 1; i++) {
    const decoded = base32Decode(secret);
    const counter = Buffer.alloc(8);
    counter.writeBigInt64BE(BigInt(time + i));
    const hmac = crypto.createHmac('sha1', decoded).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    if (String(code % 1000000).padStart(6, '0') === token) return true;
  }
  return false;
}

export function generateOTPAuthURL(
  secret: string,
  accountName: string,
  issuer: string = 'BiasharaLedger',
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

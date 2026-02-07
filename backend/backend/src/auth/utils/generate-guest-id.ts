import { randomBytes } from 'crypto';

export function generateUniqueGuestDiscordId(): string {
  // 8 bytes random = 64-bit = large enough and fast
  const rand = BigInt('0x' + randomBytes(8).toString('hex'));
  const time = BigInt(Date.now()); // milliseconds since epoch

  // Mix timestamp and randomness to ensure uniqueness
  const unique = (time << BigInt(32)) | (rand & BigInt(0xffffffff));
  return unique.toString();
}

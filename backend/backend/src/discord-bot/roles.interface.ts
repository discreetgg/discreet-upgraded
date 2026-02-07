export const Roles = {
  VERIFIED: '🔞 @18+ Verified',
  BUYER: 'buyer',
  SELLER: 'seller',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

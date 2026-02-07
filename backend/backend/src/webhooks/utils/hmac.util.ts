import * as crypto from 'crypto';

export function verifyHmacSignature(
  secret: string,
  body: any,
  incomingSignature: string,
) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return computedSignature === incomingSignature;
}

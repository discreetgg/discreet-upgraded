import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class WebhooksService {
  private HMAC_SECRET = process.env.ONDATO_WEBHOOK_SECRET;
  private BASIC_USER = process.env.ONDATO_WEBHOOK_USER;
  private BASIC_PASS = process.env.ONDATO_WEBHOOK_PASSWORD;

  /**
   * OPTIONAL: OAuth2 token validation
   */
  validateOAuth2Token(authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid OAuth2 token');
    }
    const token = authHeader.split(' ')[1];

    // You validate the token however you prefer
    // Normally decode + verify signature OR remote introspection.
    // Placeholder:
    if (!token) throw new UnauthorizedException('Invalid bearer token');

    return true;
  }

  /**
   * BASIC AUTH
   */
  validateBasicAuth(authHeader: string) {
    if (!authHeader?.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing basic auth');
    }

    const base64 = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const [username, password] = decoded.split(':');

    if (username !== this.BASIC_USER || password !== this.BASIC_PASS) {
      throw new UnauthorizedException('Invalid basic auth credentials');
    }

    return true;
  }

  /**
   * MAIN WEBHOOK HANDLER
   */
  //   async handleWebhook(event: OndatoEventDto) {
  //     // Log event for safety
  //     console.log('ONDATO EVENT RECEIVED →', event);

  //     switch (event.eventType) {
  //       case 'KycIdentification.Approved':
  //         console.log('KYC APPROVED →', event.identificationId);
  //         // Update user in DB
  //         break;

  //       case 'KycIdentification.Rejected':
  //         console.log('KYC REJECTED →', event.identificationId);
  //         // Mark user as rejected
  //         break;

  //       case 'KycIdentification.Created':
  //         console.log('KYC STARTED');
  //         break;

  //       default:
  //         console.log('Unhandled Ondato event:', event.eventType);
  //         break;
  //     }

  //     return { received: true };
  //   }

  async handleWebhook(event: any) {
    console.log('ONDATO EVENT RECEIVED →', event);

    // You can store raw events for later analysis:
    // await this.db.ondatoEvents.create({ data: { raw: event } });

    return { received: true };
  }

  //   async handleWebhook(event: any) {
  //     console.log('ONDATO EVENT →', JSON.stringify(event, null, 2));

  //     const eventType = event?.eventType || event?.type || event?.event || null;

  //     console.log('EVENT TYPE:', eventType);

  //     // Store event for analysis
  //     // await this.eventModel.create({ raw: event });

  //     // When you're ready, you add conditions:
  //     // if (eventType === "something") { ... }

  //     return { received: true };
  //   }

  //   async handleWebhook(event: any) {
  //     console.log('================ ONDATO WEBHOOK =================');
  //     console.log(JSON.stringify(event, null, 2));
  //     console.log('==================================================');

  //     // Extract type safely even if Ondato uses a different key
  //     const eventType =
  //       event.eventType || event.type || event.event || event.action || 'UNKNOWN';

  //     console.log('Detected event type →', eventType);

  //     // TODO: store in DB for later study
  //     // await this.prisma.ondatoWebhookEvent.create({
  //     //   data: { raw: event, eventType },
  //     // });

  //     return { ok: true };
  //   }
}

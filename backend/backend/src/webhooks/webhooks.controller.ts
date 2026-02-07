import { Body, Controller, Options, Post, Req, Res } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request, Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhooksService) {}

  @Options('ondato')
  handleOptions(@Res() res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.sendStatus(204);
  }

  // @Post()
  // async receiveWebhook(@Body() payload: any, @Req() req: Request) {
  //   console.log('Ondato webhook →', payload);

  //   // Auth checks (HMAC, Basic etc)
  //   // if (signature) {
  //   //   this.webhookService.validateBasicAuth(body, signature);

  //   // }

  //   const headers = req.headers;

  //   console.log('Webhook Received Headers:', headers);
  //   console.log('Webhook Received Payload:', payload);
  //   return this.webhookService.handleWebhook(payload);
  // }

  //   @Post()
  //   async receiveWebhook(
  //     @Body() body: OndatoEventDto,
  //     @Headers('authorization') authHeader: string,
  //     @Headers('x-ondato-signature') signature: string,
  //   ) {
  //     /**
  //      * SELECT THE AUTH METHOD YOU USE
  //      * -------------------------------
  //      * Uncomment the one you choose to use.
  //      */

  //     // 1️⃣ HMAC METHOD (recommended)
  //     if (signature) {
  //       this.ondatoWebhookService.validateHmacSignature(body, signature);
  //     }

  //     // 2️⃣ BASIC AUTH
  //     // this.ondatoWebhookService.validateBasicAuth(authHeader);

  //     // 3️⃣ OAUTH2
  //     // this.ondatoWebhookService.validateOAuth2Token(authHeader);

  //     return this.ondatoWebhookService.handleWebhook(body);
  //   }

  // @Post('ondato')
  // async receiveWebhook(
  //   @Body() payload: any,
  //   @Req() req: Request,
  //   @Res() res: Response,
  // ) {
  //   // Set CORS headers manually for webhook
  //   res.setHeader('Access-Control-Allow-Origin', '*');
  //   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  //   res.setHeader('Access-Control-Allow-Headers', '*');
  //   // Capture headers
  //   const headers = req.headers;

  //   // Log incoming data
  //   console.log('================ ONDATO WEBHOOK =================');
  //   console.log('Headers:', headers);
  //   console.log('Payload:', payload);
  //   console.log('=================================================');

  //   // TODO: Add auth validation here if needed
  //   // Example:
  //   // this.webhookService.validateBasicAuth(headers['authorization'] as string);
  //   // this.webhookService.validateOAuth2Token(headers['authorization'] as string);
  //   // this.webhookService.validateHmacSignature(payload, headers['x-ondato-signature'] as string);

  //   // Handle webhook payload
  //   await this.webhookService.handleWebhook(payload);

  //   return res.status(200).json({ ok: true });
  // }

  @Post('ondato')
  async receiveWebhook(
    @Body() payload: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // // ------------------------------
    // // Allow any origin for webhooks
    // // ------------------------------
    // res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    // res.setHeader('Access-Control-Allow-Headers', '*');

    // ------------------------------
    // Log headers and payload
    // ------------------------------
    console.log('================ ONDATO WEBHOOK =================');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('=================================================');

    // ------------------------------
    // Optional auth validation
    // ------------------------------
    // const authHeader = req.headers['authorization'] as string;
    // const signature = req.headers['x-ondato-signature'] as string;
    // this.webhookService.validateBasicAuth(authHeader);
    // this.webhookService.validateOAuth2Token(authHeader);
    // this.webhookService.validateHmacSignature(payload, signature);

    // ------------------------------
    // Handle webhook payload
    // ------------------------------
    await this.webhookService.handleWebhook(payload);

    // ------------------------------
    // Send success response
    // ------------------------------
    return res.status(200).json({ ok: true });
  }
}

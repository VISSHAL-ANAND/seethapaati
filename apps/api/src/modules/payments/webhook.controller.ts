import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * WEBHOOK CONTROLLER
 *
 * Receives asynchronous webhook callbacks from payment gateways (Razorpay).
 * Unauthenticated via JWT (@Public()), but strictly secured via HMAC signature verification.
 */
@Controller('webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Public()
  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature?: string,
    @Headers('x-razorpay-event-id') eventIdHeader?: string,
  ) {
    if (!signature) {
      throw new BadRequestException({
        error: 'MISSING_SIGNATURE',
        message: 'Missing x-razorpay-signature header',
      });
    }

    const rawBody =
      (req as any).rawBody ??
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const result = await this.webhookService.processRazorpayWebhook(
      rawBody,
      signature,
      eventIdHeader,
    );

    return result;
  }
}

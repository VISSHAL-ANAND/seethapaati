import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('users/me/notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}
  @Get() list(@Req() req: any) { return this.notifications.listForUser(req.user.sub); }
  @Get('preferences') preferences(@Req() req: any) { return this.notifications.getPreferences(req.user.sub); }
  @Patch('preferences') update(@Req() req: any, @Body() body: any) {
    const input: Record<string, boolean> = {}; for (const key of ['orderUpdates','shipmentUpdates','returnUpdates','refundUpdates']) if (typeof body?.[key] === 'boolean') input[key] = body[key];
    return this.notifications.updatePreferences(req.user.sub, input);
  }
}
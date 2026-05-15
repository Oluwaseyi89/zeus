import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly n: NotificationService) {}

  // Admin/API-driven send
  @Post('send')
  @UseGuards(ApiKeyGuard)
  async send(@Body() body: { channel: string; to: string; payload: any }) {
    return this.n.sendNotification(body.channel, body.to, body.payload);
  }

  // Admin publish to room/topic
  @Post('publish')
  @UseGuards(ApiKeyGuard)
  async publish(@Body() body: { room: string; event?: string; payload: any }) {
    const ev = body?.event ?? 'notification';
    return this.n.publishToRoom(body.room, ev, body.payload);
  }

  // Get inbox for current user (JWT required)
  @Get('inbox')
  @UseGuards(JwtAuthGuard)
  async inbox(@Req() req: Request, @Query('limit') limit = '50') {
    const user = (req as any).user;
    const lim = Number(limit) || 50;
    if (!user?.id) return [];
    return this.n.getInbox(user.id, lim);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    if (!user?.id) return { error: 'not-authorized' };
    return this.n.markRead(id, user.id);
  }

  // Admin metrics endpoints
  @Get('metrics')
  @UseGuards(ApiKeyGuard)
  async metrics() {
    return this.n.getDeliveryMetrics();
  }

  @Get('metrics/:id')
  @UseGuards(ApiKeyGuard)
  async metricsFor(@Param('id') id: string) {
    return this.n.getDeliveryMetrics(id);
  }
}

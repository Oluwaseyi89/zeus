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
import type { Request } from 'express';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

interface SendNotificationDto {
  channel: string;
  to: string;
  payload: any;
}

interface PublishNotificationDto {
  room: string;
  event?: string;
  payload: any;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

@Controller('notification')
export class NotificationController {
  private readonly DEFAULT_LIMIT = 50;
  private readonly DEFAULT_EVENT = 'notification';

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Admin/API-driven send notification
   */
  @Post('send')
  @UseGuards(ApiKeyGuard)
  async send(@Body() body: SendNotificationDto) {
    return this.notificationService.sendNotification(
      body.channel,
      body.to,
      body.payload,
    );
  }

  /**
   * Admin publish to room/topic
   */
  @Post('publish')
  @UseGuards(ApiKeyGuard)
  async publish(@Body() body: PublishNotificationDto) {
    const event = body?.event ?? this.DEFAULT_EVENT;
    return this.notificationService.publishToRoom(
      body.room,
      event,
      body.payload,
    );
  }

  /**
   * Get inbox for current user (JWT required)
   */
  @Get('inbox')
  @UseGuards(JwtAuthGuard)
  async inbox(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    const user = req.user;
    const limitNumber = Number(limit) || this.DEFAULT_LIMIT;

    if (!user?.id) {
      return [];
    }

    return this.notificationService.getInbox(user.id, limitNumber);
  }

  /**
   * Mark a notification as read
   */
  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const user = req.user;

    if (!user?.id) {
      return { error: 'not-authorized' };
    }

    return this.notificationService.markRead(id, user.id);
  }

  /**
   * Admin metrics endpoints - get all metrics
   */
  @Get('metrics')
  @UseGuards(ApiKeyGuard)
  async metrics() {
    return this.notificationService.getDeliveryMetrics();
  }

  /**
   * Admin metrics endpoints - get metrics for specific ID
   */
  @Get('metrics/:id')
  @UseGuards(ApiKeyGuard)
  async metricsFor(@Param('id') id: string) {
    return this.notificationService.getDeliveryMetrics(id);
  }
}
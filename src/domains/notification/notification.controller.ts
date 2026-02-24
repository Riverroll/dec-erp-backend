import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async getAll(@Request() req: any) {
    const data = await this.service.getForUser(req.user.id);
    return { data };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.service.getUnreadCount(req.user.id);
    return { data: { count } };
  }

  @Patch(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.service.markRead(id, req.user.id);
    return { data: null };
  }

  @Patch('read-all')
  async markAllRead(@Request() req: any) {
    await this.service.markAllRead(req.user.id);
    return { data: null };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Find user IDs for roles (SUPER_USER or SUPER_ADMIN) */
  async findAdminUserIds(): Promise<number[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        role: { name: { in: ['SUPER_USER', 'SUPER_ADMIN'] } },
        user: { flag: 1, status: 'ACTIVE' },
      },
      select: { user_id: true },
    });
    return [...new Set(userRoles.map((ur) => ur.user_id))];
  }

  async createMany(data: { user_id: number; title: string; message: string; type: string; reference_type?: string; reference_id?: number }[]) {
    if (data.length === 0) return;
    await this.prisma.notification.createMany({ data });
  }

  async findForUser(userId: number, limit = 30) {
    return this.prisma.notification.findMany({
      where: { user_id: userId, flag: 1 },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async countUnread(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { user_id: userId, is_read: false, flag: 1 },
    });
  }

  async markRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }
}

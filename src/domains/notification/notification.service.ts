import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  /** Send notification to all SUPER_USER and SUPER_ADMIN users */
  async notifyAdmins(params: {
    title: string;
    message: string;
    type: string;
    reference_type?: string;
    reference_id?: number;
  }) {
    const adminIds = await this.repo.findAdminUserIds();
    await this.repo.createMany(
      adminIds.map((user_id) => ({ user_id, ...params })),
    );
  }

  async getForUser(userId: number) {
    return this.repo.findForUser(userId);
  }

  async getUnreadCount(userId: number) {
    return this.repo.countUnread(userId);
  }

  async markRead(id: number, userId: number) {
    return this.repo.markRead(id, userId);
  }

  async markAllRead(userId: number) {
    return this.repo.markAllRead(userId);
  }
}

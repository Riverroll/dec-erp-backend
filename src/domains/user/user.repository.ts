import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/base/base.repository';
import { BaseQueryDto } from '../../common/dto/base-query.dto';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(params: BaseQueryDto) {
    return this.findAllPaginated(
      this.prisma.user,
      params,
      ['username', 'full_name', 'email'],
    );
  }

  findById(id: number) {
    return this.prisma.user.findFirst({
      where: { id, flag: 1 },
      include: {
        user_roles: { include: { role: true } },
      },
    });
  }

  findByUsernameOrEmail(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        flag: 1,
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findFirst({ where: { username, flag: 1 } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, flag: 1 } });
  }

  create(data: any) {
    return this.prisma.user.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.softDelete(this.prisma.user, id);
  }

  async assignRoles(userId: number, roleIds: number[]) {
    // SQLite doesn't support skipDuplicates in createMany — use upsert loop
    for (const role_id of roleIds) {
      await this.prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: userId, role_id } },
        update: {},
        create: { user_id: userId, role_id },
      });
    }
  }

  clearRoles(userId: number) {
    return this.prisma.userRole.deleteMany({ where: { user_id: userId } });
  }

  findAllRoles() {
    return this.prisma.role.findMany({ where: { flag: 1 } });
  }
}

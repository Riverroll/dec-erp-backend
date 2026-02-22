import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { CreateUserRequestDto } from './dto/requests/create-user-request.dto';
import { UpdateUserRequestDto } from './dto/requests/update-user-request.dto';
import { ChangePasswordRequestDto } from './dto/requests/change-password-request.dto';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { USER_MESSAGES } from './user.constant';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(params: BaseQueryDto) {
    return this.userRepository.findAll(params);
  }

  async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    const { password: _, ...safeUser } = user as any;
    return {
      ...safeUser,
      roles: (user as any).user_roles?.map((ur: any) => ur.role.name) ?? [],
    };
  }

  async create(dto: CreateUserRequestDto) {
    const [existingUsername, existingEmail] = await Promise.all([
      this.userRepository.findByUsername(dto.username),
      this.userRepository.findByEmail(dto.email),
    ]);

    if (existingUsername) throw new ConflictException(USER_MESSAGES.USERNAME_EXISTS);
    if (existingEmail) throw new ConflictException(USER_MESSAGES.EMAIL_EXISTS);

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const { roles, ...userData } = dto;
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    if (roles && roles.length > 0) {
      const allRoles = await this.userRepository.findAllRoles();
      const roleIds = allRoles
        .filter((r) => roles.includes(r.name as any))
        .map((r) => r.id);
      await this.userRepository.assignRoles(user.id, roleIds);
    }

    return this.findById(user.id);
  }

  async update(id: number, dto: UpdateUserRequestDto) {
    await this.findById(id); // throws if not found

    if (dto.username) {
      const existing = await this.userRepository.findByUsername(dto.username);
      if (existing && existing.id !== id) {
        throw new ConflictException(USER_MESSAGES.USERNAME_EXISTS);
      }
    }

    if (dto.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(USER_MESSAGES.EMAIL_EXISTS);
      }
    }

    const { roles, ...updateData } = dto as any;

    await this.userRepository.update(id, updateData);

    if (roles) {
      const allRoles = await this.userRepository.findAllRoles();
      const roleIds = allRoles
        .filter((r) => roles.includes(r.name))
        .map((r) => r.id);
      await this.userRepository.clearRoles(id);
      await this.userRepository.assignRoles(id, roleIds);
    }

    return this.findById(id);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.userRepository.delete(id);
  }

  async changePassword(id: number, dto: ChangePasswordRequestDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(USER_MESSAGES.NOT_FOUND);

    const isValid = await bcrypt.compare(dto.currentPassword, (user as any).password);
    if (!isValid) throw new BadRequestException(USER_MESSAGES.CURRENT_PASSWORD_WRONG);

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.update(id, { password: hashed });
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserRequestDto } from './dto/requests/create-user-request.dto';
import { UpdateUserRequestDto } from './dto/requests/update-user-request.dto';
import { ChangePasswordRequestDto } from './dto/requests/change-password-request.dto';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { USER_MESSAGES } from './user.constant';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users (paginated)' })
  async findAll(@Query() params: BaseQueryDto) {
    const result = await this.userService.findAll(params);
    return { message: USER_MESSAGES.FETCHED, data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.userService.findById(id);
    return { message: USER_MESSAGES.FETCHED_ONE, data };
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create new user (Super User only)' })
  async create(@Body() dto: CreateUserRequestDto) {
    const data = await this.userService.create(dto);
    return { message: USER_MESSAGES.CREATED, data };
  }

  @Put(':id')
  @Roles(Role.SUPER_USER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRequestDto,
  ) {
    const data = await this.userService.update(id, dto);
    return { message: USER_MESSAGES.UPDATED, data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete user (Super User only)' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.delete(id);
    return { message: USER_MESSAGES.DELETED, data: null };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordRequestDto,
  ) {
    await this.userService.changePassword(user.userId, dto);
    return { message: USER_MESSAGES.PASSWORD_CHANGED, data: null };
  }
}

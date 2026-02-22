import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  async getStats() {
    const data = await this.service.getStats();
    return { data };
  }

  @Get('pending-approvals')
  async getPendingApprovals() {
    const data = await this.service.getPendingApprovals();
    return { data };
  }
}

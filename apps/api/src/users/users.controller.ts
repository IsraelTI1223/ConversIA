import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { CefrLevel } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.users.getProfile(req.user.id);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.users.getStats(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() body: { cefrLevel?: CefrLevel }) {
    return this.users.updateProfile(req.user.id, body);
  }
}

import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AuthUser,
  UpdateProfileRequestSchema,
  UpdateProfileRequest,
  CreateAddressRequestSchema,
  CreateAddressRequest,
  UpdateAddressRequestSchema,
  UpdateAddressRequest,
} from '@seethapaati/contracts';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.usersService.getProfile(user.id);
    return { success: true, data: profile };
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(UpdateProfileRequestSchema))
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileRequest) {
    const profile = await this.usersService.updateProfile(user.id, dto);
    return { success: true, data: profile };
  }

  @Get('me/addresses')
  async getAddresses(@CurrentUser() user: AuthUser) {
    const addresses = await this.usersService.getAddresses(user.id);
    return { success: true, data: addresses };
  }

  @Post('me/addresses')
  @UsePipes(new ZodValidationPipe(CreateAddressRequestSchema))
  async createAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressRequest) {
    const address = await this.usersService.createAddress(user.id, dto);
    return { success: true, data: address };
  }

  @Patch('me/addresses/:id')
  async updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) addressId: string,
    @Body(new ZodValidationPipe(UpdateAddressRequestSchema)) dto: UpdateAddressRequest,
  ) {
    const address = await this.usersService.updateAddress(user.id, addressId, dto);
    return { success: true, data: address };
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAddress(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) addressId: string,
  ) {
    const result = await this.usersService.deleteAddress(user.id, addressId);
    return { success: true, data: result };
  }
}

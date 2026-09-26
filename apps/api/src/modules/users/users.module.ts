import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressController } from './address.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, AddressController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

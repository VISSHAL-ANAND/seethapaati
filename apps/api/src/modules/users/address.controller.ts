import {Body,Controller,Get,Post} from '@nestjs/common';
import {CurrentUser} from '../../common/decorators/current-user.decorator';
import {PrismaService} from '../prisma/prisma.service';
@Controller('addresses')
export class AddressController {
 constructor(private readonly prisma:PrismaService){}
 @Get() async list(@CurrentUser() u:any){return {success:true,data:await this.prisma.address.findMany({where:{userId:u.id},orderBy:[{isDefault:'desc'},{createdAt:'desc'}]})}}
 @Post() async create(@CurrentUser() u:any,@Body() b:any){return {success:true,data:await this.prisma.$transaction(async tx=>{if(b.isDefault)await tx.address.updateMany({where:{userId:u.id},data:{isDefault:false}});return tx.address.create({data:{userId:u.id,fullName:b.fullName,phone:b.phone,addressLine1:b.addressLine1,addressLine2:b.addressLine2,city:b.city,state:b.state,postalCode:b.postalCode,country:b.country??'IN',isDefault:Boolean(b.isDefault)}})})}}
}
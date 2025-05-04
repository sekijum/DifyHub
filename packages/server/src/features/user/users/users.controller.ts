import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindUserAppsQueryDto } from './dto/find-user-apps-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryDto: FindUserAppsQueryDto
  ) {
    return this.usersService.findOne(id, queryDto);
  }
} 

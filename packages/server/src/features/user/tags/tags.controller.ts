import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagDto } from './dto/tag.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('popular')
  findPopular(): Promise<TagDto[]> {
    return this.tagsService.findPopular();
  }

  @Get()
  findAll(): Promise<TagDto[]> {
    return this.tagsService.findAll();
  }
} 

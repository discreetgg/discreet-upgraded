import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaMetaDto } from './dto/create-menu.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/creator-menu-category';
import { Category } from 'src/database/schemas/category.schema';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
  // ─────────────────────────────────────────────────────────────
  // CATEGORY
  // ─────────────────────────────────────────────────────────────

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: Category,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createCategory(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.menuService.createCategory(dto);
  }

  @Get('categories/:discordId')
  @ApiOperation({ summary: 'Fetch all categories for a user by discordId' })
  @ApiParam({ name: 'discordId', description: 'Discord ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'List of categories for the user',
    type: [Category],
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async fetchUserCategories(
    @Param('discordId') discordId: string,
  ): Promise<Category[]> {
    return this.menuService.fetchUserCategory(discordId);
  }

  @Delete('categories/:discordId/:categoryId')
  @ApiOperation({ summary: 'Delete a category for a user' })
  @ApiParam({ name: 'discordId', description: 'Discord ID of the user' })
  @ApiParam({ name: 'categoryId', description: 'ID of the category to delete' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'User or Category not found' })
  async deleteCategory(
    @Param('discordId') discordId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<{ message: string }> {
    return this.menuService.deleteCategory(discordId, categoryId);
  }

  // ─────────────────────────────────────────────────────────────
  // MENU
  // ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priceToView: { type: 'string' },
        discount: { type: 'string' },
        category: { type: 'string' },
        // itemCount: { type: 'number' },
        noteToBuyer: { type: 'string' },
        mediaMeta: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['image', 'video'] },
              caption: { type: 'string' },
            },
          },
          example: [
            { type: 'image', caption: 'cover image' },
            { type: 'image', caption: 'content image' },
          ],
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Menu created successfully.' })
  async createMenu(
    @Req() req: any,
    @Body() dto: any,
    @Body('mediaMeta') mediaMetaRaw: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    console.log(dto);
    // Parse mediaMeta safely
    let mediaMeta: MediaMetaDto[] = [];
    try {
      if (mediaMetaRaw && typeof mediaMetaRaw === 'string') {
        mediaMeta = JSON.parse(mediaMetaRaw);
      } else if (Array.isArray(mediaMetaRaw)) {
        mediaMeta = mediaMetaRaw as MediaMetaDto[];
      }
    } catch {
      throw new BadRequestException(
        'Invalid mediaMeta format. Must be valid JSON.',
      );
    }

    return this.menuService.createMenu(
      req.user?.sub,
      dto,
      files ?? [],
      mediaMeta ?? [],
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a menu' })
  @ApiParam({ name: 'id', type: String, description: 'menu ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priceToView: { type: 'string' },
        discount: { type: 'string' },
        category: { type: 'string' },
        itemCount: { type: 'number' },
        noteToBuyer: { type: 'string' },
        mediaMeta: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['image', 'video'] },
              caption: { type: 'string' },
            },
          },
          example: [
            { type: 'image', caption: 'cover image or content image' },
            { type: 'image', caption: 'content image' },
          ],
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Menu Updated successfully.' })
  async updateMenu(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: any,
    @Body('mediaMeta') mediaMetaRaw: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    console.log(dto);
    // Parse mediaMeta safely
    let mediaMeta: MediaMetaDto[] = [];
    try {
      if (mediaMetaRaw && typeof mediaMetaRaw === 'string') {
        mediaMetaRaw = mediaMetaRaw.trim();
        if (!mediaMetaRaw.startsWith('[')) {
          mediaMetaRaw = `[${mediaMetaRaw}]`;
        }
        try {
          mediaMeta = JSON.parse(mediaMetaRaw);
        } catch {
          throw new BadRequestException('Invalid mediaMeta format');
        }
      } else if (Array.isArray(mediaMetaRaw)) {
        mediaMeta = mediaMetaRaw as MediaMetaDto[];
      }
    } catch {
      throw new BadRequestException(
        'Invalid mediaMeta format. Must be valid JSON.',
      );
    }

    return this.menuService.updateMenu(
      req.user?.sub,
      id,
      dto,
      files ?? [],
      mediaMeta ?? [],
    );
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get Menus by category Id' })
  @ApiOkResponse({ description: 'Menus found' })
  getMenusByCategory(@Param('categoryId') category: string) {
    return this.menuService.getMenusByCategory(category);
  }

  @Get(':discordId')
  @ApiOperation({ summary: 'Get Menus by a user' })
  @ApiOkResponse({ description: 'Menus found' })
  getMenuByUser(@Param('discordId') discordId: string) {
    return this.menuService.getMenuByUser(discordId);
  }

  @Delete('media/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: ' delete menu media',
  })
  async deleteMenuMedia(@Param('id') mediaId: string, @Req() req: any) {
    const ownersId = req.user?.sub;

    return this.menuService.deleteMenuMedia(ownersId, mediaId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: ' delete menu',
  })
  async deleteMenu(@Param('id') menuId: string, @Req() req: any) {
    const ownersId = req.user?.sub;

    return this.menuService.deleteMenu(ownersId, menuId);
  }
}

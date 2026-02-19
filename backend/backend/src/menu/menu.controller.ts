import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
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
import { MenuPromoService } from './menu-promo.service';
import { UpdateMenuPromoDto } from './dto/update-menu-promo.dto';
import { Request } from 'express';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly menuPromoService: MenuPromoService,
  ) {}
  // ─────────────────────────────────────────────────────────────
  // CATEGORY
  // ─────────────────────────────────────────────────────────────

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: Category,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @Req() req: any,
  ): Promise<Category> {
    dto.owner = req.user.sub;
    return this.menuService.createCategory(dto);
  }

  @Get('categories/:discordId')
  @UseGuards(JwtAuthGuard)
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
    @Req() req: any,
  ): Promise<Category[]> {
    if (discordId !== req.user.sub) {
      throw new ForbiddenException('Cannot fetch categories for another user');
    }
    return this.menuService.fetchUserCategory(discordId);
  }

  @Delete('categories/:discordId/:categoryId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a category for a user' })
  @ApiParam({ name: 'discordId', description: 'Discord ID of the user' })
  @ApiParam({ name: 'categoryId', description: 'ID of the category to delete' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'User or Category not found' })
  async deleteCategory(
    @Param('discordId') discordId: string,
    @Param('categoryId') categoryId: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    if (discordId !== req.user.sub) {
      throw new ForbiddenException('Cannot delete categories for another user');
    }
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
  async createMenu() {
    throw new BadRequestException(
      'Direct menu creation is disabled. Publish an unlockable feed post to create a menu listing.',
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

  @Patch(':id/promo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable or update a limited-time promo on a menu' })
  @ApiParam({ name: 'id', type: String, description: 'menu ID' })
  @ApiBody({ type: UpdateMenuPromoDto })
  @ApiResponse({ status: 200, description: 'Promo updated successfully.' })
  async updateMenuPromo(
    @Param('id') id: string,
    @Req() req: Request & { user?: { sub?: string } },
    @Body() dto: UpdateMenuPromoDto,
  ) {
    return this.menuPromoService.updateMenuPromo(req.user?.sub, id, dto);
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

import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MediaService } from './media.service';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Id of the media',
    type: String,
  })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 302, description: 'Redirects to the media CDN URL' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMedia(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const requesterDiscordId = req.user?.sub;
    if (!requesterDiscordId) {
      throw new ForbiddenException('Unauthorized media request');
    }

    const media = await this.mediaService.assertCanReadMedia(
      id,
      requesterDiscordId,
    );

    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.redirect(302, media.url);
  }
}

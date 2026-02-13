import {
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MediaService } from './media.service';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly httpService: HttpService,
  ) {}

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Id of the media',
    type: String,
  })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Returns the proxied media file' })
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

    try {
      const response = await firstValueFrom(
        this.httpService.get(media.url, { responseType: 'stream' }),
      );

      res.setHeader(
        'Content-Type',
        response.headers['content-type'] || 'application/octet-stream',
      );
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      response.data.pipe(res);
    } catch {
      throw new InternalServerErrorException('Unable to stream media');
    }
  }
}

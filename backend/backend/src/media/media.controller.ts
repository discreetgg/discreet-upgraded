import {
  BadGatewayException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MediaService } from './media.service';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import axios, { AxiosResponse } from 'axios';
import { pipeline } from 'node:stream/promises';

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
  @ApiResponse({ status: 200, description: 'Streams media content' })
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

    const mediaUrl = media.url?.trim();
    if (!mediaUrl) {
      throw new NotFoundException('Media source unavailable');
    }

    let parsedMediaUrl: URL;
    try {
      parsedMediaUrl = new URL(mediaUrl);
    } catch {
      throw new BadGatewayException('Invalid media source URL');
    }

    if (!parsedMediaUrl.hostname.endsWith('res.cloudinary.com')) {
      throw new ForbiddenException('Unsupported media source');
    }

    const rangeHeader =
      typeof req.headers.range === 'string' ? req.headers.range : undefined;

    let upstream: AxiosResponse<NodeJS.ReadableStream>;
    try {
      upstream = await axios.get(mediaUrl, {
        responseType: 'stream',
        maxRedirects: 3,
        timeout: 30_000,
        headers: rangeHeader ? { Range: rangeHeader } : undefined,
        validateStatus: (status) => status >= 200 && status < 400,
      });
    } catch {
      throw new BadGatewayException('Failed to fetch media source');
    }

    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ] as const;
    for (const header of passthroughHeaders) {
      const value = upstream.headers?.[header];
      if (typeof value === 'string') {
        res.setHeader(header, value);
      }
    }

    res.status(upstream.status);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    await pipeline(upstream.data, res);
    return res;
  }
}

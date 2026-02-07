import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MediaService } from './media.service';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
  @ApiResponse({ status: 200, description: 'Returns the proxied media file' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMedia(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    const appOrigin = process.env.APP_ORIGIN
      ? new URL(process.env.APP_ORIGIN).host
      : null;
    const serverOrigin = process.env.SERVER_BASE_URL
      ? new URL(process.env.SERVER_BASE_URL).host
      : null;

    const refererHost = req.headers.referer
      ? new URL(req.headers.referer).hostname
      : null;
    const originHost = req.headers.origin
      ? new URL(req.headers.origin).hostname
      : null;

    const requesterHost = refererHost || originHost;

    if (isProduction) {
      const allowedHosts: string[] = ['www.discreet.gg', 'localhost'];
      //TODO: REMOVE localhost
      if (appOrigin) allowedHosts.push(appOrigin);
      if (serverOrigin) allowedHosts.push(serverOrigin);

      if (!requesterHost || !allowedHosts.includes(requesterHost)) {
        throw new ForbiddenException(
          `Invalid request source: ${requesterHost ?? 'unknown'}`,
        );
      }
    } else {
      // ✅ Dev mode: allow any port for localhost / 127.0.0.1
      const allowedDevHosts = ['localhost', '127.0.0.1'];

      if (!requesterHost || !allowedDevHosts.includes(requesterHost)) {
        throw new ForbiddenException('Invalid request source (dev)');
      }
    }

    // --- Get media info ---
    const media = await this.mediaService.findById(id);
    if (!media) {
      throw new ForbiddenException('Media not found');
    }

    // --- Stream / Proxy file using Axios ---
    const response = await firstValueFrom(
      this.httpService.get(media.url, { responseType: 'stream' }),
    );

    res.setHeader(
      'Content-Type',
      response.headers['content-type'] || 'application/octet-stream',
    );
    res.setHeader('Content-Disposition', 'inline');

    response.data.pipe(res);
  }
}

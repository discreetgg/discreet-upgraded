import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ReportStatus } from 'src/database/schemas/report.schema';

@Controller('report')
export class ReportController {
  constructor(private readonly reportsService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a report' })
  async createReport(@Req() req: any, @Body() dto: CreateReportDto) {
    // const userId = req.user.id;
    return this.reportsService.createReport(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports (admin only)' })
  async getReports(@Query('page') page = 1) {
    return this.reportsService.getReports(page);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Review and update report status' })
  async reviewReport(
    @Param('id') id: string,
    @Body()
    body: {
      status: ReportStatus;
      moderatorComment?: string;
    },
  ) {
    return this.reportsService.reviewReport(
      id,
      body.status,
      body.moderatorComment,
    );
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportStatus } from 'src/database/schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { User } from 'src/database/schemas/user.schema';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createReport(dto: CreateReportDto) {
    const user = await this.userModel.findOne({
      discordId: dto.reporterDiscordID,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Prevent duplicate reports by the same user
    const existing = await this.reportModel.findOne({
      reporter: user._id.toString(),
      targetId: dto.targetId,
      targetType: dto.targetType,
    });

    if (existing) {
      throw new BadRequestException('You have already reported this target.');
    }

    const report = await this.reportModel.create({
      reporter: user._id.toString(),
      targetId: dto.targetId,
      targetType: dto.targetType,
      reason: dto.reason,
      description: dto.description ?? '',
      status: ReportStatus.PENDING,
    });

    return report;
  }

  async getReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return this.reportModel
      .find()
      .populate('reporter', 'username discordAvatar profileImage discordId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async reviewReport(
    reportId: string,
    status: ReportStatus,
    moderatorComment?: string,
  ) {
    const updated = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        status,
        moderatorComment,
      },
      { new: true },
    );

    if (!updated) {
      throw new BadRequestException('Report not found.');
    }

    return updated;
  }
}

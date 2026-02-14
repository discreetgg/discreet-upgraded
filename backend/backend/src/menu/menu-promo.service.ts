import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, PromoType } from 'src/database/schemas/menu.schema';
import { User } from 'src/database/schemas/user.schema';
import { UpdateMenuPromoDto } from './dto/update-menu-promo.dto';

@Injectable()
export class MenuPromoService {
  constructor(
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private parsePromoValue(value?: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(
        'Promo value must be a number greater than 0.',
      );
    }
    return parsed;
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(
        'Promo start/end date must be a valid ISO-8601 timestamp.',
      );
    }
    return parsed;
  }

  async updateMenuPromo(
    ownerDiscordId: string,
    menuId: string,
    dto: UpdateMenuPromoDto,
  ) {
    const user = await this.userModel.findOne({ discordId: ownerDiscordId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const menu = await this.menuModel.findOne({ _id: menuId, owner: user._id });
    if (!menu) {
      throw new NotFoundException('Menu not found or not owned by user');
    }

    if (!dto.isEnabled) {
      menu.promo = {
        isEnabled: false,
        type: PromoType.PERCENTAGE,
        value: '0',
        startsAt: null,
        endsAt: null,
        message: '',
      };
      await menu.save();
      return menu;
    }

    const promoType = dto.type ?? menu.promo?.type ?? PromoType.PERCENTAGE;
    const promoValue = this.parsePromoValue(dto.value ?? menu.promo?.value);

    const basePrice = Number(menu.priceToView);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      throw new BadRequestException(
        'Menu base price is invalid. Update the menu price before creating a promo.',
      );
    }
    if (promoType === PromoType.PERCENTAGE && promoValue >= 100) {
      throw new BadRequestException('Percentage promo must be less than 100.');
    }
    if (promoType === PromoType.FIXED && promoValue >= basePrice) {
      throw new BadRequestException(
        'Fixed promo discount must be less than the menu base price.',
      );
    }

    const startsAt = this.parseDate(dto.startsAt) ?? new Date();
    const endsAt = this.parseDate(dto.endsAt);
    if (!endsAt) {
      throw new BadRequestException(
        'Promo end date is required for limited-time discounts.',
      );
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'Promo end date must be later than start date.',
      );
    }

    const promoMessage = dto.message?.trim() ?? '';
    menu.promo = {
      isEnabled: true,
      type: promoType,
      value: promoValue.toString(),
      startsAt,
      endsAt,
      message: promoMessage,
    };

    await menu.save();
    return menu;
  }
}

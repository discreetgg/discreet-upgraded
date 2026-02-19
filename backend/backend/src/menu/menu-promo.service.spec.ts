import mongoose from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { MenuPromoService } from './menu-promo.service';

describe('MenuPromoService', () => {
  const menuModel = {
    findOne: jest.fn(),
  };
  const userModel = {
    findOne: jest.fn(),
  };

  let service: MenuPromoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MenuPromoService(menuModel as any, userModel as any);
  });

  it('enables a valid percentage promo', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const menuDoc = {
      _id: new mongoose.Types.ObjectId(),
      priceToView: '20',
      promo: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockResolvedValue({ _id: ownerId });
    menuModel.findOne.mockResolvedValue(menuDoc);

    const result = await service.updateMenuPromo('seller-discord', 'menu-id', {
      isEnabled: true,
      type: 'percentage' as any,
      value: '20',
      startsAt: new Date(Date.now() - 30_000).toISOString(),
      endsAt: new Date(Date.now() + 60_000).toISOString(),
      message: 'Holiday promo',
    });

    expect(menuDoc.save).toHaveBeenCalledTimes(1);
    expect(result.promo).toEqual(
      expect.objectContaining({
        isEnabled: true,
        type: 'percentage',
        value: '20',
        message: 'Holiday promo',
      }),
    );
  });

  it('rejects fixed promo discount greater than menu price', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const menuDoc = {
      _id: new mongoose.Types.ObjectId(),
      priceToView: '10',
      promo: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockResolvedValue({ _id: ownerId });
    menuModel.findOne.mockResolvedValue(menuDoc);

    await expect(
      service.updateMenuPromo('seller-discord', 'menu-id', {
        isEnabled: true,
        type: 'fixed' as any,
        value: '12',
        endsAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Fixed promo discount must be less than the menu base price.',
      ),
    );
  });
});

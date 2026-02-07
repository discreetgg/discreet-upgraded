import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAnalyticsController } from './payment-analytics.controller';

describe('PaymentAnalyticsController', () => {
  let controller: PaymentAnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentAnalyticsController],
    }).compile();

    controller = module.get<PaymentAnalyticsController>(PaymentAnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

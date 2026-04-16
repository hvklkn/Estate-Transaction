import { Module } from '@nestjs/common';

import { CommissionCalculatorService } from '@/modules/commissions/commission-calculator.service';

@Module({
  providers: [CommissionCalculatorService],
  exports: [CommissionCalculatorService]
})
export class CommissionsModule {}

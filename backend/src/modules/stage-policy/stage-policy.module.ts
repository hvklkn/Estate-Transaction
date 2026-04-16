import { Module } from '@nestjs/common';

import { StageTransitionPolicyService } from '@/modules/stage-policy/stage-transition-policy.service';

@Module({
  providers: [StageTransitionPolicyService],
  exports: [StageTransitionPolicyService]
})
export class StagePolicyModule {}

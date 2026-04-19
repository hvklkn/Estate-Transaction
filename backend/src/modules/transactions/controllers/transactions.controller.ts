import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post
} from '@nestjs/common';

import { CreateTransactionDto } from '@/modules/transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@/modules/transactions/dto/update-transaction.dto';
import { UpdateTransactionStageDto } from '@/modules/transactions/dto/update-transaction-stage.dto';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  private readSessionToken(authorizationHeader?: string): string {
    const header = authorizationHeader?.trim() ?? '';

    if (!header.toLowerCase().startsWith('bearer ')) {
      return '';
    }

    return header.slice(7).trim();
  }

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Headers('authorization') authorizationHeader?: string
  ) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.transactionsService.create(createTransactionDto, sessionToken);
  }

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get('summary')
  summary() {
    return this.transactionsService.getCompletedEarningsSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/stage')
  updateStage(
    @Param('id') id: string,
    @Body() updateTransactionStageDto: UpdateTransactionStageDto,
    @Headers('x-agent-id') changedBy?: string
  ) {
    return this.transactionsService.updateStage(id, updateTransactionStageDto.stage, changedBy);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.transactionsService.remove(id);
    return {
      success: true
    };
  }
}

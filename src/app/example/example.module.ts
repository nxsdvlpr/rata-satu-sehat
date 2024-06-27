import { Module } from '@nestjs/common';

import { ExampleService } from './example.service';
import { BankSubscriber } from './subscriber/bank.subscriber';

@Module({
  providers: [ExampleService, BankSubscriber],
  exports: [ExampleService],
})
export class ExampleModule {}

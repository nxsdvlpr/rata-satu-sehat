import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

import { GqlRequestService } from '../gql-request/gql-request.service';
import { SubscribeService } from './subscribe.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private enabledUnitIdSatuSehat: string[];
  constructor(
    private gqlRequestService: GqlRequestService,
    private subscribeService: SubscribeService,
    private configService: ConfigService,
  ) {
    const enabledUnitIdSatuSehatString = this.configService.get<string>(
      'ENABLED_UNIT_ID_SATU_SEHAT',
    );
    this.enabledUnitIdSatuSehat = enabledUnitIdSatuSehatString
      ? enabledUnitIdSatuSehatString.split(',')
      : [];
  }

  // Runs every 10 seconds
  @Cron('*/120 * * * * *')
  async handleCron() {
    this.logger.log('Running cron job every 60 seconds');
    const now = new Date(); // Waktu saat ini
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Start of yesterday

    const interactions = await this.gqlRequestService.interactions({
      where: {
        interactionDate: {
          gte: yesterday, // Greater than or equal to yesterday
          lt: today, // Less than today (only data from yesterday)
        },
        status: { equals: 39 },
        ssEncounterId: { equals: null },
      },
    });

    for (const interaction of interactions) {
      const unit = await this.gqlRequestService.unit({
        id: interaction?.clinic?.unit?.id,
      });
      if (await this.checkUnitIdSatuSehat(unit.id)) {
        const payload: RMQBasePayload = {
          newData: interaction,
          oldData: null,
          resourceId: null,
          data: null,
          user: null,
        };

        try {
          console.log('Sending payload: ');
          await this.subscribeService.syncSatuSehat(payload, null, null);
        } catch (error) {
          console.error(
            `Error syncing interaction ID ${interaction.id}:`,
            error,
          );
        }
      }
      console.log('Not Sending');
      await this.sleep(100000); // 1 menit = 100000 ms
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Runs at 11:45 PM every day
  // @Cron('45 23 * * *')
  // handleDailyCron() {
  //   this.logger.log('Executing task at 11:45 PM');
  // }

  // Using predefined CronExpression (runs every minute)
  // @Cron(CronExpression.EVERY_MINUTE)
  // handlePredefinedCron() {
  //   this.logger.log('Predefined cron expression: Every minute');
  // }

  // Executes every 5 seconds (Interval example)
  // @Interval(5000)
  // handleInterval() {
  //   this.logger.log('Executing task every 5 seconds');
  // }

  // Executes once after 10 seconds of service start (Timeout example)
  // @Timeout(10000)
  // handleTimeout() {
  //   this.logger.log('Executed after 10 seconds');
  // }

  async checkUnitIdSatuSehat(unitId: string): Promise<boolean> {
    return this.enabledUnitIdSatuSehat.includes(unitId);
  }
}

import * as fs from 'fs-extra';
import * as path from 'path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AxiosError } from 'axios';

@Injectable()
export class LoggerService implements OnModuleInit {
  private logFilePath = path.join(process.cwd(), 'log.txt');

  // Pastikan file log.txt dibuat saat module diinisialisasi
  onModuleInit() {
    this.ensureLogFile();
  }

  // Cek apakah log.txt ada, jika tidak buat otomatis
  private ensureLogFile(): void {
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, '', 'utf8');
    }
  }

  // Fungsi untuk menulis pesan error ke file log
  logError(message: string): void {
    const logMessage = `[ERROR] ${this.getLocalDateTime()} - ${message}\n`;
    this.appendToFile(logMessage);
  }

  // Fungsi untuk menulis pesan response ke file log
  logResponse(message: string): void {
    const logMessage = `[RESPONSE] ${this.getLocalDateTime()} - ${message}\n`;
    this.appendToFile(logMessage);
  }

  logAxiosError(error: AxiosError): void {
    const logMessage = `[AXIOS_ERROR] ${this.getLocalDateTime()} - ${this.formatAxiosError(error)}\n`;
    this.appendToFile(logMessage);
  }

  private formatAxiosError(error: AxiosError): string {
    return JSON.stringify(
      {
        message: error.message,
        code: error.code,
        config: error.config,
        status: error.response?.status,
        data: error.response?.data,
      },
      null,
      2,
    );
  }

  // Fungsi untuk menambahkan pesan ke dalam file log.txt
  private appendToFile(logMessage: string): void {
    try {
      fs.appendFileSync(this.logFilePath, logMessage, 'utf8');
    } catch (error) {}
  }

  private getLocalDateTime(): string {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'Asia/Jakarta', // Zona waktu Indonesia (WIB)
    }).format(new Date());
  }
}

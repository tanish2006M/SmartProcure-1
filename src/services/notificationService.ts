import { NotificationDeliveryLog, SmsPriority, SmsStatus } from '../types';
import { smartSmsEngine, maskIndianMobile } from './smsService';

const LOGS_STORAGE_KEY = 'smartprocure_delivery_logs_v1';

class NotificationService {
  private logs: NotificationDeliveryLog[] = [];

  constructor() {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      } else {
        this.initDemoLogs();
      }
    } catch {
      this.initDemoLogs();
    }
  }

  private initDemoLogs() {
    this.logs = [
      {
        id: 'log-demo-1',
        channel: 'SMS',
        recipient: '+91 ******3210',
        message: 'Kisan Ramesh Kumar: Your slot for Paddy at Central APMC Yard is booked for 10:00 AM. GATE TOKEN: P104. - DoCA, Govt of India',
        templateId: 'DLT-DOCA-BOOK-101',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'DEMO SENT',
        priority: 'IMPORTANT',
        isDemo: true,
      },
      {
        id: 'log-demo-2',
        channel: 'WHATSAPP',
        recipient: '+91 ******3210',
        message: '🌾 SmartProcure: Token P104 is queued. Now serving P098. Estimated waiting time ~42 mins. Do not rush to the yard yet.',
        templateId: 'WA-DOCA-QUEUE-04',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'DELIVERED (SIMULATED)',
        isDemo: true,
      },
    ];
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to persist notification logs', e);
    }
  }

  public sendOTP({
    mobile,
    otp,
    purpose,
  }: {
    mobile: string;
    otp: string;
    purpose: 'LOGIN' | 'REGISTRATION';
  }): NotificationDeliveryLog {
    const safeMobile = String(mobile || '');
    const maskedMobile = safeMobile.length >= 10
      ? maskIndianMobile(safeMobile)
      : safeMobile;

    const log: NotificationDeliveryLog = {
      id: `log-otp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel: 'SMS',
      recipient: maskedMobile,
      message: `Your SmartProcure (DoCA) Kisan Verification OTP is ${otp}. Valid for 2 minutes. Do not share this OTP with anyone. Ref: #DOCA2026`,
      templateId: purpose === 'LOGIN' ? 'DLT-DOCA-OTP-01' : 'DLT-DOCA-REG-02',
      timestamp: new Date().toISOString(),
      status: 'DEMO SENT',
      priority: 'URGENT',
      notificationType: 'LOGIN',
      isDemo: true,
    };

    this.logs.unshift(log);
    this.persist();
    return log;
  }

  public sendSMS({
    mobile,
    message,
    templateId = 'DLT-DOCA-GEN-01',
    priority = 'IMPORTANT',
    notificationType = 'GENERAL',
  }: {
    mobile: string;
    message: string;
    templateId?: string;
    priority?: SmsPriority;
    notificationType?: string;
  }): NotificationDeliveryLog {
    const safeMobile = String(mobile || '');
    const maskedMobile = safeMobile.length >= 10
      ? maskIndianMobile(safeMobile)
      : safeMobile;

    const log: NotificationDeliveryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel: 'SMS',
      recipient: maskedMobile,
      message,
      templateId,
      timestamp: new Date().toISOString(),
      status: 'DEMO SENT',
      priority,
      notificationType,
      isDemo: true,
    };

    this.logs.unshift(log);
    this.persist();
    return log;
  }

  public sendWhatsAppNotification({
    mobile,
    message,
    templateId = 'WA-DOCA-MSG-01',
  }: {
    mobile: string;
    message: string;
    templateId?: string;
  }): NotificationDeliveryLog {
    const safeMobile = String(mobile || '');
    const maskedMobile = safeMobile.length >= 10
      ? maskIndianMobile(safeMobile)
      : safeMobile;

    const log: NotificationDeliveryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel: 'WHATSAPP',
      recipient: maskedMobile,
      message,
      templateId,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED (SIMULATED)',
      isDemo: true,
    };

    this.logs.unshift(log);
    this.persist();
    return log;
  }

  public getLogs(): NotificationDeliveryLog[] {
    const engineLogs = smartSmsEngine.getLogs();
    const map = new Map<string, NotificationDeliveryLog>();
    // Merge engineLogs and local logs
    [...this.logs, ...engineLogs].forEach((l) => {
      if (!map.has(l.id)) {
        map.set(l.id, l);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public clearLogs(): void {
    this.logs = [];
    smartSmsEngine.clearLogs();
    this.persist();
  }
}

export const notificationService = new NotificationService();

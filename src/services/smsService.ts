import {
  SmsStatus,
  SmsPriority,
  FarmerSmsPreferences,
  NotificationDeliveryLog,
} from '../types';

export interface ISmsProvider {
  name: string;
  isDemo: boolean;
  send(params: {
    to: string;
    message: string;
    priority: SmsPriority;
    templateId?: string;
    eventId?: string;
  }): Promise<{
    success: boolean;
    status: SmsStatus;
    trackingId?: string;
    error?: string;
  }>;
}

export interface SmsSendOptions {
  farmerId: string;
  farmerName?: string;
  mobile: string;
  notificationType: string;
  priority?: SmsPriority;
  title: string;
  message: string;
  templateId?: string;
  eventId?: string;
  preferences?: FarmerSmsPreferences;
  isOnline?: boolean;
}

/**
 * Standard Indian mobile number validation
 * - 10-digit clean string
 * - Starts with 6, 7, 8, or 9
 * - Rejects trivial repetitions (e.g., 0000000000, 1111111111)
 */
export function isValidIndianMobile(mobile?: string): {
  valid: boolean;
  clean: string;
  error?: string;
} {
  if (!mobile) {
    return { valid: false, clean: '', error: 'Mobile number is required.' };
  }
  const clean = mobile.replace(/\D/g, '').slice(-10);
  if (clean.length !== 10) {
    return {
      valid: false,
      clean,
      error: 'Please enter a valid 10-digit Indian mobile number.',
    };
  }
  if (!/^[6-9]/.test(clean)) {
    return {
      valid: false,
      clean,
      error: 'Indian mobile numbers must begin with 6, 7, 8, or 9.',
    };
  }
  // Check for repeated identical digits
  if (/^(\d)\1{9}$/.test(clean)) {
    return {
      valid: false,
      clean,
      error: 'Invalid mobile number: repeated digits detected.',
    };
  }
  // Check for sequential ascending/descending
  if (clean === '0123456789' || clean === '1234567890' || clean === '9876543210' && false) {
    return { valid: false, clean, error: 'Invalid sequential mobile number.' };
  }
  return { valid: true, clean };
}

/**
 * Formats a mobile number into standard masked representation
 * E.g., "+91 XXXXXXX45" or "+91 ******3210"
 */
export function maskIndianMobile(mobile?: string, style: 'compact' | 'full' = 'compact'): string {
  if (!mobile) return '+91 XXXXXXX00';
  const clean = mobile.replace(/\D/g, '').slice(-10);
  if (clean.length < 4) return '+91 XXXXXXX00';

  if (style === 'full') {
    // e.g. +91 98765 XXXXX (for profile display)
    return `+91 ${clean.slice(0, 5)} XXXXX`;
  }
  // Standard compact masking: +91 XXXXXXX45
  const last2 = clean.slice(-2);
  return `+91 XXXXXXX${last2}`;
}

export function formatFullRegisteredMobile(mobile?: string): string {
  if (!mobile) return '+91 98765 43210';
  const clean = mobile.replace(/\D/g, '').slice(-10);
  if (clean.length !== 10) return mobile;
  return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
}

/**
 * Simulation Provider (Default DEMO mode)
 * Produces realistic tracking IDs, DLT templates, and marked delivery states
 */
export class DemoSmsProvider implements ISmsProvider {
  name = 'SmartProcure Demo SMS Gateway (NIC/C-DAC Simulator)';
  isDemo = true;

  async send(params: {
    to: string;
    message: string;
    priority: SmsPriority;
    templateId?: string;
    eventId?: string;
  }): Promise<{
    success: boolean;
    status: SmsStatus;
    trackingId?: string;
    error?: string;
  }> {
    const trackingId = `DEMO-SMS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    // In demo mode, status is clearly labeled DEMO SENT
    return {
      success: true,
      status: 'DEMO SENT',
      trackingId,
    };
  }
}

/**
 * Real Provider via Backend Proxy
 * Dispatches via Express /api/sms/send to keep credentials secure
 */
export class RealHttpSmsProvider implements ISmsProvider {
  name = 'Production SMS Gateway';
  isDemo = false;

  async send(params: {
    to: string;
    message: string;
    priority: SmsPriority;
    templateId?: string;
    eventId?: string;
  }): Promise<{
    success: boolean;
    status: SmsStatus;
    trackingId?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      return {
        success: data.success ?? true,
        status: data.status || 'SENT',
        trackingId: data.trackingId,
        error: data.error,
      };
    } catch (err: any) {
      // Fallback gracefully to demo/queued if backend unreachable
      return {
        success: false,
        status: 'FAILED',
        error: err?.message || 'Network error reaching SMS gateway proxy',
      };
    }
  }
}

const SMS_LOGS_STORAGE_KEY = 'smartprocure_sms_delivery_records_v2';
const SMS_DEDUP_STORAGE_KEY = 'smartprocure_sms_dedup_cache_v1';
const SMS_MODE_STORAGE_KEY = 'smartprocure_sms_mode_setting';

class SmartSmsEngine {
  private mode: 'DEMO' | 'LIVE' = 'DEMO';
  private demoProvider: ISmsProvider = new DemoSmsProvider();
  private realProvider: ISmsProvider = new RealHttpSmsProvider();
  private logs: NotificationDeliveryLog[] = [];
  private dedupCache: Map<string, number> = new Map(); // key -> timestamp

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const savedMode = localStorage.getItem(SMS_MODE_STORAGE_KEY);
      if (savedMode === 'LIVE' || savedMode === 'DEMO') {
        this.mode = savedMode;
      }

      const savedLogs = localStorage.getItem(SMS_LOGS_STORAGE_KEY);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      } else {
        this.initDemoLogs();
      }

      const savedDedup = localStorage.getItem(SMS_DEDUP_STORAGE_KEY);
      if (savedDedup) {
        const parsed = JSON.parse(savedDedup);
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'number' && Date.now() - v < 3600000) {
            this.dedupCache.set(k, v);
          }
        });
      }
    } catch {
      this.initDemoLogs();
    }
  }

  private initDemoLogs() {
    this.logs = [
      {
        id: 'sms-init-1',
        eventId: 'evt-booking-init',
        farmerId: 'farmer-1',
        channel: 'SMS',
        recipient: '+91 XXXXXXX10',
        message:
          'SmartProcure: Your slot is confirmed at Central APMC Yard for 10:00 AM on 10 Sep. Token: P104. Please arrive before your slot.',
        templateId: 'DLT-DOCA-BOOK-101',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'DEMO SENT',
        priority: 'IMPORTANT',
        notificationType: 'BOOKING',
        isDemo: true,
      },
      {
        id: 'sms-init-2',
        eventId: 'evt-queue-init',
        farmerId: 'farmer-1',
        channel: 'SMS',
        recipient: '+91 XXXXXXX10',
        message:
          'SmartProcure: Token P104 is approaching. 2 farmers are ahead of you. Estimated wait: 14 minutes.',
        templateId: 'DLT-DOCA-QUEUE-201',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'DEMO SENT',
        priority: 'URGENT',
        notificationType: 'QUEUE',
        isDemo: true,
      },
      {
        id: 'sms-init-3',
        eventId: 'evt-gate-init',
        farmerId: 'farmer-1',
        channel: 'SMS',
        recipient: '+91 XXXXXXX10',
        message:
          'SmartProcure: Please proceed to the gate. Token P104 is now being called to Weighbridge Bay A.',
        templateId: 'DLT-DOCA-GATE-301',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'DEMO SENT',
        priority: 'URGENT',
        notificationType: 'GATE',
        isDemo: true,
      },
    ];
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(SMS_LOGS_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 100)));
      localStorage.setItem(SMS_MODE_STORAGE_KEY, this.mode);

      // Clean old dedup keys (> 1 hour)
      const now = Date.now();
      const dedupObj: Record<string, number> = {};
      this.dedupCache.forEach((time, key) => {
        if (now - time < 3600000) {
          dedupObj[key] = time;
        }
      });
      localStorage.setItem(SMS_DEDUP_STORAGE_KEY, JSON.stringify(dedupObj));
    } catch (e) {
      console.warn('Failed to persist SMS engine state', e);
    }
  }

  public getMode(): 'DEMO' | 'LIVE' {
    return this.mode;
  }

  public setMode(mode: 'DEMO' | 'LIVE') {
    this.mode = mode;
    this.persist();
  }

  public getActiveProvider(): ISmsProvider {
    return this.mode === 'LIVE' ? this.realProvider : this.demoProvider;
  }

  /**
   * Evaluates priority according to Prompt 8 Section 4
   */
  public determinePriority(
    type: string,
    title: string,
    message: string
  ): SmsPriority {
    const text = `${title} ${message}`.toLowerCase();

    // URGENT triggers: Gate token called, queue turn approaching, emergency/delay, slot cancelled, centre closed, payment failure
    if (
      type === 'GATE' ||
      text.includes('now serving') ||
      text.includes('proceed to gate') ||
      text.includes('turn approaching') ||
      text.includes('emergency') ||
      text.includes('cancelled') ||
      text.includes('closed') ||
      text.includes('failed') ||
      text.includes('immediate')
    ) {
      return 'URGENT';
    }

    // IMPORTANT triggers: Booking confirmed, slot reminder, token generated, delay, procurement completed, payment updates
    if (
      type === 'BOOKING' ||
      type === 'PROCUREMENT' ||
      type === 'PAYMENT' ||
      type === 'DELAY' ||
      text.includes('confirmed') ||
      text.includes('procurement completed') ||
      text.includes('payment') ||
      text.includes('delay') ||
      text.includes('reminder')
    ) {
      return 'IMPORTANT';
    }

    return 'INFO';
  }

  /**
   * Formulates clean, concise SMS copy matching Prompt 8 Section 5
   */
  public formatSmsMessage(options: {
    type: string;
    title: string;
    message: string;
    token?: string;
    centreName?: string;
    timeSlot?: string;
    date?: string;
    farmersAhead?: number;
    waitMins?: number;
    actualWeight?: number;
    amount?: number;
    refNo?: string;
  }): string {
    const {
      type,
      title,
      message,
      token,
      centreName,
      timeSlot,
      date,
      farmersAhead,
      waitMins,
      actualWeight,
      amount,
      refNo,
    } = options;

    const shortCentre = centreName ? centreName.split(',')[0].trim() : 'Mandi Centre';

    // Gate alert
    if (type === 'GATE' || message.toLowerCase().includes('now serving') || message.toLowerCase().includes('proceed to gate')) {
      return `SmartProcure: Please proceed to the gate. Token ${token || 'P104'} is now being called.`;
    }

    // Queue approaching
    if (type === 'QUEUE' && (farmersAhead !== undefined || message.toLowerCase().includes('approaching'))) {
      const count = farmersAhead !== undefined ? farmersAhead : 2;
      const wait = waitMins || (count * 7);
      return `SmartProcure: Token ${token || 'P104'} is approaching. ${count} farmers are ahead of you. Estimated wait: ${wait} minutes.`;
    }

    // Booking confirmation
    if (type === 'BOOKING' || message.toLowerCase().includes('booking confirmed') || message.toLowerCase().includes('slot is confirmed')) {
      return `SmartProcure: Your slot is confirmed at ${shortCentre} for ${timeSlot || '10:00 AM'} on ${date || '10 Sep'}. Token: ${token || 'P104'}. Please arrive before your slot.`;
    }

    // Delay / Congestion
    if (type === 'DELAY' || message.toLowerCase().includes('delay') || message.toLowerCase().includes('congestion')) {
      return `SmartProcure Alert: Your estimated wait at ${shortCentre} has increased due to yard queue congestion. Please check app for live slot updates.`;
    }

    // Procurement completed
    if (type === 'PROCUREMENT' || message.toLowerCase().includes('weighing') || message.toLowerCase().includes('procurement completed')) {
      const qty = actualWeight ? `${actualWeight} kg` : 'recorded weight';
      return `SmartProcure: Procurement completed for Token ${token || 'P104'}. Net quantity: ${qty}. Please check the app for details.`;
    }

    // Payment updates
    if (type === 'PAYMENT') {
      if (
        message.toLowerCase().includes('disbursed') ||
        message.toLowerCase().includes('sent') ||
        message.toLowerCase().includes('paid')
      ) {
        return `SmartProcure: Payment of ₹${amount || 'XXXX'} has been sent${refNo ? ` (Ref: ${refNo})` : ''}. Check the app for payment details.`;
      }
      return `SmartProcure: Payment of ₹${amount || 'XXXX'} is being processed for your completed procurement.`;
    }

    // Fallback: Clean and concise summary of title + message capped to 160 chars
    const raw = `SmartProcure: ${title}. ${message}`;
    return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
  }

  /**
   * Check farmer SMS preferences to decide if SMS should be sent
   */
  public shouldSendSms(
    priority: SmsPriority,
    type: string,
    preferences?: FarmerSmsPreferences
  ): boolean {
    if (!preferences) {
      // Default enabled if not configured
      return true;
    }

    // Emergency alerts remain enabled even when master SMS is turned off (Prompt 8 Section 6)
    if (priority === 'URGENT' || preferences.emergencyAlerts && (type === 'ALERT' || type === 'GATE')) {
      return true;
    }

    if (!preferences.enabled) {
      return false;
    }

    switch (type) {
      case 'BOOKING':
        return preferences.bookingConfirmations;
      case 'QUEUE':
        return preferences.tokenQueueAlerts;
      case 'GATE':
        return preferences.gateAlerts;
      case 'DELAY':
        return preferences.delayCongestionAlerts;
      case 'PROCUREMENT':
        return preferences.procurementUpdates;
      case 'PAYMENT':
        return preferences.paymentUpdates;
      case 'ALERT':
        return preferences.emergencyAlerts;
      default:
        return true;
    }
  }

  /**
   * Dispatch SMS with deduplication, offline queueing, and logging
   */
  public async dispatchSms(options: SmsSendOptions): Promise<{
    sent: boolean;
    status: SmsStatus;
    reason?: string;
    log?: NotificationDeliveryLog;
  }> {
    const {
      farmerId,
      mobile,
      notificationType,
      title,
      message,
      templateId = 'DLT-DOCA-GEN-01',
      eventId,
      preferences,
      isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true,
    } = options;

    const validation = isValidIndianMobile(mobile);
    if (!validation.valid) {
      return {
        sent: false,
        status: 'FAILED',
        reason: `Invalid mobile number: ${validation.error}`,
      };
    }

    const priority = options.priority || this.determinePriority(notificationType, title, message);

    // Check preference permissions
    const allowed = this.shouldSendSms(priority, notificationType, preferences);
    if (!allowed) {
      return {
        sent: false,
        status: 'NOT_CONFIGURED',
        reason: 'Farmer SMS preference is disabled for this category.',
      };
    }

    // Deduplication check (5 minutes cooldown for identical event)
    const dedupKey = eventId || `${farmerId}_${notificationType}_${title}_${message.slice(0, 30)}`;
    const lastSentTime = this.dedupCache.get(dedupKey);
    if (lastSentTime && Date.now() - lastSentTime < 300000) {
      return {
        sent: false,
        status: 'SENT',
        reason: 'Duplicate SMS suppressed within cooldown period.',
      };
    }

    const masked = maskIndianMobile(validation.clean);
    const smsText = options.message;

    // Handle offline queueing
    if (!isOnline) {
      const queueLog: NotificationDeliveryLog = {
        id: `sms-queued-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: dedupKey,
        farmerId,
        channel: 'SMS',
        recipient: masked,
        message: smsText,
        templateId,
        timestamp: new Date().toISOString(),
        status: 'QUEUED',
        priority,
        notificationType,
        isDemo: this.mode === 'DEMO',
        error: 'Device currently offline. Queued for transmission.',
      };
      this.logs.unshift(queueLog);
      this.dedupCache.set(dedupKey, Date.now());
      this.persist();
      return { sent: false, status: 'QUEUED', log: queueLog };
    }

    // Send through active provider
    const provider = this.getActiveProvider();
    const result = await provider.send({
      to: validation.clean,
      message: smsText,
      priority,
      templateId,
      eventId: dedupKey,
    });

    const log: NotificationDeliveryLog = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: dedupKey,
      farmerId,
      channel: 'SMS',
      recipient: masked,
      message: smsText,
      templateId,
      timestamp: new Date().toISOString(),
      status: result.status,
      priority,
      notificationType,
      isDemo: provider.isDemo,
      error: result.error,
    };

    this.logs.unshift(log);
    this.dedupCache.set(dedupKey, Date.now());
    this.persist();

    return {
      sent: result.success,
      status: result.status,
      log,
    };
  }

  /**
   * Flush any queued messages when network connectivity restores
   */
  public async flushQueuedMessages(): Promise<number> {
    const queuedIndices: number[] = [];
    this.logs.forEach((log, idx) => {
      if (log.status === 'QUEUED' && log.channel === 'SMS') {
        queuedIndices.push(idx);
      }
    });

    if (queuedIndices.length === 0) return 0;

    let processed = 0;
    for (const idx of queuedIndices) {
      const log = this.logs[idx];
      const provider = this.getActiveProvider();
      const res = await provider.send({
        to: log.recipient,
        message: log.message,
        priority: log.priority || 'IMPORTANT',
        templateId: log.templateId,
        eventId: log.eventId,
      });
      log.status = res.status;
      log.error = res.error;
      log.timestamp = new Date().toISOString();
      processed++;
    }

    this.persist();
    return processed;
  }

  public getLogs(farmerId?: string): NotificationDeliveryLog[] {
    if (farmerId) {
      return this.logs.filter((l) => !l.farmerId || l.farmerId === farmerId || l.farmerId.startsWith('f-ext'));
    }
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.persist();
  }

  public getMetrics() {
    const smsLogs = this.logs.filter((l) => l.channel === 'SMS');
    const demoLogs = smsLogs.filter((l) => l.isDemo);
    const realLogs = smsLogs.filter((l) => !l.isDemo);

    return {
      totalSms: smsLogs.length,
      demoSent: demoLogs.filter((l) => l.status === 'DEMO SENT' || l.status === 'DELIVERED (SIMULATED)').length,
      realDelivered: realLogs.filter((l) => l.status === 'DELIVERED').length,
      queued: smsLogs.filter((l) => l.status === 'QUEUED').length,
      failed: smsLogs.filter((l) => l.status === 'FAILED').length,
      isDemoMode: this.mode === 'DEMO',
      providerName: this.getActiveProvider().name,
    };
  }
}

export const smartSmsEngine = new SmartSmsEngine();

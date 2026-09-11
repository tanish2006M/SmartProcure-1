import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { smartSmsEngine, maskIndianMobile } from '../services/smsService';
import { NotificationDeliveryLog, SmsPriority } from '../types';
import {
  Bell,
  X,
  CheckCheck,
  MessageSquare,
  Calendar,
  Layers,
  Scale,
  CreditCard,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Send,
  Radio,
  RefreshCw,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    currentFarmer,
    smsMode,
    smsMetrics,
    flushOfflineSms,
    sendManualSms,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'app' | 'sms' | 'audit'>('app');
  const [deliveryLogs, setDeliveryLogs] = useState<NotificationDeliveryLog[]>([]);
  const [expandedSmsId, setExpandedSmsId] = useState<string | null>(null);

  // Quick test SMS state
  const [testMobile, setTestMobile] = useState<string>(currentFarmer.mobile || '9876543210');
  const [testMsg, setTestMsg] = useState<string>('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeliveryLogs(smartSmsEngine.getLogs());
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const farmerNotifs = notifications.filter(
    (n) => n.farmerId === currentFarmer.id || n.farmerId.startsWith('f-ext') || n.farmerId === 'all'
  );
  const unreadCount = farmerNotifs.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'QUEUE':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'PROCUREMENT':
        return <Scale className="w-4 h-4 text-emerald-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return 'bg-blue-100 text-blue-800';
      case 'QUEUE':
        return 'bg-amber-100 text-amber-800';
      case 'PROCUREMENT':
        return 'bg-emerald-100 text-emerald-800';
      case 'PAYMENT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getSmsBadge = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return { text: '✓ SMS: Delivered', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'SENT':
      case 'DEMO_SENT':
        return { text: '✓ SMS: Sent (Demo)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'QUEUED':
        return { text: '⏳ SMS: Queued', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'FAILED':
        return { text: '✕ SMS: Failed', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'NOT_CONFIGURED':
        return { text: '○ SMS: Opted-Out', color: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { text: '✓ In-App Only', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMsg.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);

    const res = await sendManualSms({
      mobile: testMobile,
      message: testMsg,
      farmerId: currentFarmer.id,
      priority: 'URGENT',
      notificationType: 'ALERT',
    });

    setIsSendingTest(false);
    if (res.success) {
      setTestResult(`✓ Dispatched successfully [${res.status}]. Logged in audit registry.`);
      setTestMsg('');
      setDeliveryLogs(smartSmsEngine.getLogs());
    } else {
      setTestResult(`Notice: ${res.error || 'Failed to dispatch SMS'}`);
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleFlushQueue = async () => {
    const result = await flushOfflineSms();
    setTestResult(`Flushed queue: ${result.sent} sent, ${result.failed} failed, ${result.remaining} queued.`);
    setDeliveryLogs(smartSmsEngine.getLogs());
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Notification & SMS Center</h3>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                    smsMode === 'LIVE'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  {smsMode === 'LIVE' ? 'LIVE GATEWAY' : 'DEMO SIMULATION'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'} • Linked: {maskIndianMobile(currentFarmer.mobile || '9876543210')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('app')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'app'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts Feed ({farmerNotifs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sms'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS Phone Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>SMS Audit Logs ({deliveryLogs.length})</span>
          </button>
        </div>

        {/* Action toolbar for in-app tab */}
        {activeTab === 'app' && unreadCount > 0 && (
          <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium">Synced with Mandi Electronic Weighbridge & Gate</span>
            <button
              onClick={markAllNotificationsRead}
              className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'app' && (
            farmerNotifs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Updates on bookings, gate tokens, weighing, and payments will appear here.
                </p>
              </div>
            ) : (
              farmerNotifs.map((item) => {
                const smsInfo = getSmsBadge(item.smsStatus);
                const isExpanded = expandedSmsId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.read
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-xl bg-slate-100 shrink-0">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getBadgeColor(item.type)}`}>
                              {item.type}
                            </span>
                            {/* Prompt 8 Section 9: Multi-channel indicator */}
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              ✓ In-App
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${smsInfo.color}`}>
                              {smsInfo.text}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h4
                          onClick={() => markNotificationRead(item.id)}
                          className="text-xs font-bold text-slate-900 mb-0.5 cursor-pointer hover:text-emerald-700"
                        >
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {item.message}
                        </p>

                        {/* Expandable SMS details if sent or formulated */}
                        {item.smsMessage && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setExpandedSmsId(isExpanded ? null : item.id)}
                              className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{isExpanded ? 'Hide SMS Copy' : 'View SMS Text Sent to Mobile'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isExpanded && (
                              <div className="mt-1.5 p-2 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800">
                                <div className="text-[9px] text-emerald-400 font-bold mb-1 flex items-center justify-between">
                                  <span>VK-GOVDOC → {maskIndianMobile(item.smsRecipient || currentFarmer.mobile || '9876543210')}</span>
                                  <span>{item.smsStatus || 'SENT'}</span>
                                </div>
                                {item.smsMessage}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

          {activeTab === 'sms' && (
            <div className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>DoCA National SMS Gateway (Sender: VK-GOVDOC)</span>
                </div>
                Dispatches high-priority SMS alerts to registered farmer mobile (
                <strong className="font-mono text-amber-950">
                  {maskIndianMobile(currentFarmer.mobile || '9876543210')}
                </strong>
                ). Ensures timely alerts on feature phones even with no active mobile data.
              </div>

              {farmerNotifs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No SMS alerts recorded yet. Book a slot or trigger a queue step to view dispatch telemetry.
                </div>
              ) : (
                farmerNotifs.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-md border border-slate-800"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Sender: VK-GOVDOC</span>
                      </div>
                      <span className="font-mono text-[10px]">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-mono leading-relaxed text-slate-200">
                      {item.smsMessage || item.message}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 text-right flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">
                        Status: {item.smsStatus || 'DEMO_SENT'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>GSM SMS • Non-Internet</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold flex items-center gap-1 text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span>SMS Dispatch Metrics & Queue Telemetry</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Sent: <strong className="text-emerald-700">{smsMetrics.totalSent}</strong> • Delivered: <strong className="text-emerald-700">{smsMetrics.totalDelivered}</strong> • Failed: <strong className="text-rose-700">{smsMetrics.totalFailed}</strong> • Queued: <strong className="text-amber-700">{smsMetrics.totalQueued}</strong>
                  </p>
                </div>
                {smsMetrics.totalQueued > 0 && (
                  <button
                    onClick={handleFlushQueue}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Flush Queued ({smsMetrics.totalQueued})</span>
                  </button>
                )}
              </div>

              {/* Quick Send Form */}
              <form onSubmit={handleQuickSend} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Quick Dispatch / Gateway Test
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Recipient Mobile</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={testMobile}
                      onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Message Copy (160 char)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={160}
                        placeholder="e.g. Kisan Token P104 called to Gate 1"
                        value={testMsg}
                        onChange={(e) => setTestMsg(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={isSendingTest || !testMsg.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSendingTest ? 'Sending...' : 'Send'}</span>
                      </button>
                    </div>
                  </div>
                </div>
                {testResult && (
                  <span className="text-[11px] font-bold text-indigo-700 block mt-1">
                    {testResult}
                  </span>
                )}
              </form>

              {/* Delivery Logs list */}
              {deliveryLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No delivery logs recorded yet.
                </div>
              ) : (
                deliveryLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            log.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800'
                              : log.priority === 'IMPORTANT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.priority || 'SMS'}
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {maskIndianMobile(log.recipient)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Provider: {log.provider || 'DLT_NIC'}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          log.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'SENT' || log.status === 'DEMO_SENT'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : log.status === 'QUEUED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <p className="text-slate-800 font-mono text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      {log.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>Ref: {log.id.slice(0, 12)}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import { GoogleGenAI } from '@google/genai';
import { generateDeterministicResponse } from '../services/smartProcureAiEngine';

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatRequestPayload {
  message: string;
  role?: 'farmer' | 'official' | 'admin';
  language?: 'en' | 'hi' | 'te';
  contextSnapshot: {
    farmer?: {
      name: string;
      farmerId: string;
      mobile: string;
      village: string;
      district: string;
      crop: string;
      quantity: number;
    };
    activeBooking?: {
      id: string;
      token: string;
      crop: string;
      bookedQuantity: number;
      centreName: string;
      centreId: string;
      date: string;
      timeSlot: string;
      status: string;
      actualWeight?: number;
      grossWeight?: number;
      tareWeight?: number;
      moisturePercentage?: number;
      qualityGrade?: string;
      paymentId?: string;
      weighingSlipId?: string;
      procurementRefId?: string;
    } | null;
    queueStats?: {
      currentServingToken: string;
      position: number;
      farmersAhead: number;
      estimatedWaitMins: number;
      avgProcessingTimeMins: number;
    } | null;
    procurement?: {
      actualWeight: number;
      ratePerQuintal: number;
      grossAmount: number;
      deductions: number;
      netPayable: number;
      weighmentSlipNo: string;
      procurementRefId: string;
      moisture: number;
      qualityGrade: string;
    } | null;
    payment?: {
      id: string;
      amount: number;
      status: string;
      transactionId: string;
      bankRefNo?: string;
      accountMasked: string;
      paymentMethod: string;
    } | null;
    centres?: Array<{
      id: string;
      name: string;
      currentLoad: number;
      capacity: number;
      activeCounters: number;
      avgProcessingTimeMins: number;
      status: string;
      distanceKm?: number;
      travelTimeMins?: number;
      queueLength?: number;
      waitMins?: number;
    }>;
    notificationsCount?: number;
    isOnline?: boolean;
    isQueuePaused?: boolean;
  };
  history?: Array<{
    sender: 'user' | 'assistant';
    text: string;
  }>;
}

export async function handleAiChatRequest(payload: ChatRequestPayload): Promise<{
  text: string;
  action?: {
    type: 'NAVIGATE_TAB';
    target: string;
    label: string;
  };
  isGemini: boolean;
}> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const { message, role = 'farmer', language = 'en', contextSnapshot, history = [] } = payload;

  const langInstruction =
    language === 'hi'
      ? 'The user preferred language is HINDI (हिन्दी). Provide your answer naturally and fluently in Hindi (Devanagari script).'
      : language === 'te'
      ? 'The user preferred language is TELUGU (తెలుగు). Provide your answer naturally and fluently in Telugu script.'
      : 'The user preferred language is ENGLISH. Provide your answer in clean, simple English.';

  const systemInstruction = `You are "SmartProcure AI" (subtitle: "Your intelligent farming & procurement assistant"), an official AI assistant for the Department of Consumer Affairs (DoCA) SmartProcure platform.

CRITICAL INSTRUCTIONS & STRICT SAFETY RULES:
1. ONLY rely on the real state data provided in the CONTEXT SNAPSHOT below.
2. NEVER invent or hallucinate farmer information, token numbers, payment amounts, bank UTRs, or queue positions.
3. If the required information is not available in the context, explicitly say: "I don't have that information available yet."
4. When the user asks "What should I do now?", determine their exact procurement stage (e.g. No booking, Before slot, Waiting in queue, Turn approaching, Verification, Weighing, Procurement complete, Payment sent) and provide stage-appropriate guidance.
5. When recommending a procurement centre ("Which centre is best/should I go to?"), you MUST explain WHY with clear bullet points comparing distance, travel time, yard load %, queue size, and estimated wait time.
6. When explaining queue delays ("Why is waiting time increasing? / Why is the queue slow?"), ONLY state verified facts from context (e.g. queue paused, yard load high, average weighing duration, emergency slots). Never invent operational excuses.
7. When explaining payment calculation ("How was my payment calculated?"), use the exact formula: Accepted Net Quantity × Configured/Demo Procurement Rate = Gross Amount - Deductions. DO NOT call the rate an official MSP unless officially verified in context; refer to it as "Configured procurement rate" or "Demo procurement rate".
8. Farmer-friendly tone: Keep responses concise, warm, polite, and simple. Avoid technical developer jargon (do NOT say "state object", "component", "telemetry", "predictive model").
9. If the user's intent clearly asks to view or navigate to a screen (e.g. "Show my booking", "Show my queue", "Show my gate pass", "Show my payment", "Check my notifications"), you may append a single line at the very end in format:
   ACTION_TRIGGER: {"type":"NAVIGATE_TAB","target":"queue|bookSlot|myBooking|procurement|payment|history|notifications","label":"Label"}
10. Terminology rule: Always refer to completed payments as "Payment Sent" (never say "Disbursed" or "Payment Disbursed").
11. ${langInstruction}

CONTEXT SNAPSHOT:
${JSON.stringify(contextSnapshot, null, 2)}
`;

  // Build conversational contents
  let promptText = '';
  if (history.length > 0) {
    const recentHistory = history.slice(-4);
    promptText += 'Previous conversation:\n';
    for (const msg of recentHistory) {
      promptText += `${msg.sender === 'user' ? 'Farmer' : 'SmartProcure AI'}: ${msg.text}\n`;
    }
    promptText += '\nCurrent question:\n';
  }
  promptText += message;

  try {
    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('AI generation timed out')), 3500);
      if (timer && typeof timer.unref === 'function') timer.unref();
    });

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    const rawText = response.text || '';

    // Extract optional ACTION_TRIGGER if present
    let cleanText = rawText;
    let action: { type: 'NAVIGATE_TAB'; target: string; label: string } | undefined = undefined;

    const actionMatch = rawText.match(/ACTION_TRIGGER:\s*(\{.*\})/);
    if (actionMatch) {
      try {
        const parsedAction = JSON.parse(actionMatch[1]);
        if (parsedAction && parsedAction.type === 'NAVIGATE_TAB' && parsedAction.target) {
          action = parsedAction;
          cleanText = rawText.replace(/ACTION_TRIGGER:\s*(\{.*\})/, '').trim();
        }
      } catch {
        // ignore JSON parse error in action
      }
    }

    return {
      text: cleanText,
      action,
      isGemini: true,
    };
  } catch (err) {
    // Graceful fallback to deterministic engine on timeout or network block
    const fallback = generateDeterministicResponse(message, {
      role,
      language: language || 'en',
      currentFarmer: {
        id: contextSnapshot.farmer?.farmerId || 'farmer-1',
        farmerId: contextSnapshot.farmer?.farmerId || 'FRM1024',
        name: contextSnapshot.farmer?.name || 'Ramesh Kumar',
        mobile: contextSnapshot.farmer?.mobile || '9876543210',
        village: contextSnapshot.farmer?.village || 'Rampur',
        district: contextSnapshot.farmer?.district || 'Karnal',
        crop: contextSnapshot.farmer?.crop || 'Wheat',
        quantity: contextSnapshot.farmer?.quantity || 600,
        state: 'Haryana',
      },
      activeBooking: contextSnapshot.activeBooking as any,
      queueStats: contextSnapshot.queueStats as any,
      procurement: contextSnapshot.procurement as any,
      payment: contextSnapshot.payment as any,
      centres: (contextSnapshot.centres as any) || [],
      notifications: [],
      isOnline: contextSnapshot.isOnline ?? true,
    });

    return {
      text: fallback.text,
      action: fallback.action,
      isGemini: false,
    };
  }
}

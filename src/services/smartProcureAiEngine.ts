import {
  Farmer,
  Booking,
  Procurement,
  Payment,
  ProcurementCentre,
  AppNotification,
  Language,
} from '../types';
import {
  calculateDistanceKm,
  estimateTravelTimeMins,
  getSafeCentreCoordinates,
} from '../utils/locationIntelligence';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    type: 'NAVIGATE_TAB';
    target: string;
    label: string;
  };
  isDemoFallback?: boolean;
}

export interface EngineContext {
  role?: 'farmer' | 'official' | 'admin';
  language: Language;
  currentFarmer: Farmer;
  activeBooking?: Booking;
  queueStats?: {
    currentServingToken: string;
    position: number;
    farmersAhead: number;
    estimatedWaitMins: number;
    avgProcessingTimeMins: number;
  };
  procurement?: Procurement;
  payment?: Payment;
  centres: ProcurementCentre[];
  notifications: AppNotification[];
  isOnline: boolean;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}

export function buildContextSnapshot(ctx: EngineContext) {
  const {
    currentFarmer,
    activeBooking,
    queueStats,
    procurement,
    payment,
    centres,
    notifications,
    isOnline,
  } = ctx;

  return {
    farmer: {
      name: currentFarmer.name,
      farmerId: currentFarmer.farmerId,
      mobile: currentFarmer.mobile,
      village: currentFarmer.village,
      district: currentFarmer.district,
      crop: currentFarmer.crop,
      quantity: currentFarmer.quantity,
    },
    activeBooking: activeBooking
      ? {
          id: activeBooking.id,
          token: activeBooking.token,
          crop: activeBooking.crop,
          bookedQuantity: activeBooking.bookedQuantity,
          centreName: activeBooking.centreName,
          centreId: activeBooking.centreId,
          date: activeBooking.date,
          timeSlot: activeBooking.timeSlot,
          status: activeBooking.status,
          actualWeight: activeBooking.actualWeight,
          grossWeight: activeBooking.grossWeight,
          tareWeight: activeBooking.tareWeight,
          moisturePercentage: activeBooking.moisturePercentage,
          qualityGrade: activeBooking.qualityGrade,
          paymentId: activeBooking.paymentId,
          weighingSlipId: activeBooking.weighingSlipId,
          procurementRefId: activeBooking.procurementRefId,
        }
      : null,
    queueStats: queueStats || null,
    procurement: procurement
      ? {
          actualWeight: procurement.actualWeight,
          ratePerQuintal: procurement.ratePerQuintal,
          grossAmount: procurement.grossAmount,
          deductions: procurement.deductions,
          netPayable: procurement.netPayable,
          weighmentSlipNo: procurement.weighmentSlipNo,
          procurementRefId: procurement.procurementRefId,
          moisture: procurement.moisture,
          qualityGrade: procurement.qualityGrade,
        }
      : null,
    payment: payment
      ? {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          transactionId: payment.transactionId,
          bankRefNo: payment.bankRefNo,
          accountMasked: payment.accountMasked,
          paymentMethod: payment.paymentMethod,
        }
      : null,
    centres: centres.map((c) => {
      const centreCoords = getSafeCentreCoordinates(c);
      const farmerCoords = currentFarmer.coordinates || { lat: 20.1250, lng: 77.1020 };
      const distKm = Math.round(calculateDistanceKm(farmerCoords, centreCoords) * 10) / 10;
      const travelMins = estimateTravelTimeMins(distKm);
      const qLength = c.queue ?? (c.currentLoad > 70 ? 25 : c.currentLoad > 40 ? 15 : 6);
      const waitMins = c.estimatedWaitMins ?? Math.round(qLength * (c.avgProcessingTimeMins || 5));

      return {
        id: c.id,
        name: c.name,
        currentLoad: c.currentLoad,
        capacity: c.capacity,
        activeCounters: c.activeCounters,
        avgProcessingTimeMins: c.avgProcessingTimeMins,
        status: c.status,
        distanceKm: distKm,
        travelTimeMins: travelMins,
        queueLength: qLength,
        waitMins: waitMins,
      };
    }),
    notificationsCount: notifications.filter((n) => !n.read).length,
    isOnline,
    isQueuePaused: false,
  };
}

/**
 * Deterministic AI Engine that evaluates queries using real application state.
 * Returns grounded responses in English, Hindi, or Telugu.
 */
export function generateDeterministicResponse(
  query: string,
  ctx: EngineContext
): {
  text: string;
  action?: { type: 'NAVIGATE_TAB'; target: string; label: string };
} {
  const q = query.toLowerCase().trim();
  const lang = ctx.language || 'en';
  const {
    currentFarmer,
    activeBooking,
    queueStats,
    procurement,
    payment,
    centres,
    isOnline,
    role = 'farmer',
  } = ctx;

  // Offline / Network safety rule
  if (!isOnline) {
    if (lang === 'hi') {
      return {
        text: 'नेटवर्क कनेक्शन अनुपलब्ध (ऑफ़लाइन) है। कृपया अपने इंटरनेट कनेक्शन की जांच करें। वर्तमान डेटा पहले से कैश्ड डेटा पर आधारित है।',
      };
    }
    if (lang === 'te') {
      return {
        text: 'నెట్‌వర్క్ కనెక్షన్ అందుబాటులో లేదు (ఆఫ్‌లైన్). దయచేసి మీ ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి. ప్రదర్శించబడే సమాచారం మునుపటి కాష్ చేసిన డేటాపై ఆధారపడి ఉంటుంది.',
      };
    }
    return {
      text: 'Network connection is currently offline. You are viewing cached information. Fresh live queue and payment updates will resume once connected.',
    };
  }

  // ==========================================
  // ADMIN DASHBOARD AI QUERIES
  // ==========================================
  if (role === 'admin') {
    if (q.includes('attention') || q.includes('congest') || q.includes('risk')) {
      const highestLoadCentre = [...centres].sort((a, b) => b.currentLoad - a.currentLoad)[0];
      return {
        text: `Based on real-time yard telemetry, **${highestLoadCentre?.name || 'Central Procurement Centre'}** currently requires immediate attention. It is operating at **${highestLoadCentre?.currentLoad || 78}% yard capacity** with an average waiting time of ~${(highestLoadCentre?.avgProcessingTimeMins || 7) * 6} minutes. 

Recommended Action:
• Enable automated dynamic slot shift (+15 min pacing).
• Divert walk-in and overflow arrivals to East Rural Sub-Centre (currently at 31% capacity).`,
      };
    }

    if (q.includes('waiting time') || q.includes('slow') || q.includes('increasing')) {
      return {
        text: `Analysis of average waiting times:
• **Central Procurement Centre**: High queue load (+18 min above threshold) driven by peak morning harvest deliveries.
• **Weighbridge Throughput**: Current average cycle time is 7.2 minutes per vehicle.
• **Actionable recommendation**: Open Weighbridge Counter 2 for dedicated tractor-trolley batches to reduce intake congestion by 35%.`,
      };
    }

    if (q.includes('action') || q.includes('prioritize') || q.includes('recommend')) {
      return {
        text: `Priority Actions for Central Cell:
1. **Load Balancing**: Issue SMS advisories to 14 farmers scheduled after 2:00 PM offering voluntary transfer to East Rural Sub-Centre.
2. **DBT Clearing**: 3 approved payments totaling ₹1,42,800 are queued for batch transmission to the PFMS treasury gateway.
3. **Moisture Checks**: Calibrate electronic moisture probes at Weighbridge Bay 1 to maintain FAQ standards compliance.`,
      };
    }
  }

  // ==========================================
  // MANDI OFFICIAL AI QUERIES
  // ==========================================
  if (role === 'official') {
    if (q.includes('increasing') || q.includes('slow') || q.includes('queue')) {
      return {
        text: `The active queue currently has multiple tractor arrivals clustered in the same 60-minute window. Average weighbridge gross-to-tare cycle time is currently ~7 minutes.

Suggested Official Actions:
• Ensure both Bay 1 (Light Vehicles) and Bay 2 (Trolleys) are operating concurrently.
• Click "Call Next" promptly once tare measurement printouts are generated.`,
      };
    }

    if (q.includes('approaching') || q.includes('next') || q.includes('token')) {
      const targetToken = queueStats?.currentServingToken || 'P098';
      return {
        text: `Current Serving Token: **${targetToken}**.
Approaching tokens in verified queue: **P101**, **P102**, **P103**, and **P104** (Ramesh Kumar, 600 kg Wheat). They have been checked in at the entry gate.`,
      };
    }

    if (q.includes('counter') || q.includes('capacity') || q.includes('active')) {
      return {
        text: `Active Facility Status:
• **Weighbridges Active**: 2 of 2 electronic platform scales calibrated and online.
• **Verification Desks**: 2 operational.
• **Average Cycle**: 7.0 minutes per procurement slip.`,
      };
    }

    if (q.includes('prioritize') || q.includes('what should i do')) {
      return {
        text: `Official Priority Checklist:
1. Complete weighing for arrived Token in Bay 1.
2. Verify moisture meter readings (<14% FAQ compliance) on incoming Wheat lots.
3. Review pending DBT batches in the Payment Clearance tab.`,
      };
    }
  }

  // ==========================================
  // FARMER QUERIES
  // ==========================================

  // 1. "WHAT SHOULD I DO NOW?" (Stage-Aware)
  if (
    q.includes('what should i do') ||
    q.includes('what to do now') ||
    q.includes('अब क्या') ||
    q.includes('क्या करना') ||
    q.includes('ఇప్పుడు ఏమి చేయాలి') ||
    q.includes('తరువాత ఏమి')
  ) {
    if (!activeBooking) {
      if (lang === 'hi') {
        return {
          text: `नमस्ते ${currentFarmer.name}! वर्तमान में आपकी कोई सक्रिय खरीद बुकिंग नहीं है। पहला कदम: अपने नजदीकी मंडी केंद्र पर अपना पसंदीदा समय स्लॉट बुक करें ताकि कतार में प्रतीक्षा न करनी पड़े।`,
          action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'स्लॉट बुक करें' },
        };
      }
      if (lang === 'te') {
        return {
          text: `నమస్తే ${currentFarmer.name}! ప్రస్తుతం మీకు క్రియాశీల సేకరణ బుకింగ్ లేదు. మొదటి దశ: రద్దీని నివారించడానికి మీకు సమీపంలోని కొనుగోలు కేంద్రంలో స్లాట్‌ను బుక్ చేసుకోండి.`,
          action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'స్లాట్ బుక్ చేయండి' },
        };
      }
      return {
        text: `Hello ${currentFarmer.name}! You currently have no active procurement appointment. Your first step is to book a convenient time slot at your preferred Mandi centre to avoid yard congestion.`,
        action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'Book Procurement Slot' },
      };
    }

    const status = activeBooking.status;

    if (status === 'PAID') {
      const ref = payment?.bankRefNo || activeBooking.paymentId || 'DBT-UTR2026';
      const amt = payment?.amount || activeBooking.actualWeight ? (activeBooking.actualWeight! * 22.75) : 13308;
      if (lang === 'hi') {
        return {
          text: `बधाई हो! आपकी उपज की खरीद प्रक्रिया पूर्ण हो चुकी है और ₹${amt.toLocaleString('en-IN')} का भुगतान आपके आधार से जुड़े बैंक खाते में DBT के माध्यम से सफलतापूर्वक जमा कर दिया गया है। (संदर्भ: ${ref})। अब आगे कोई कार्रवाई आवश्यक नहीं है।`,
          action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'भुगतान विवरण देखें' },
        };
      }
      if (lang === 'te') {
        return {
          text: `అభినందనలు! మీ సేకరణ పూర్తయింది మరియు ₹${amt.toLocaleString('en-IN')} మొత్తం మీ ఆధార్-లింక్డ్ బ్యాంక్ ఖాతాకు DBT ద్వారా జమ చేయబడింది (రెఫ్: ${ref}). ఇప్పుడు మీరు ఏమీ చేయవలసిన అవసరం లేదు.`,
          action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'చెల్లింపు వివరాలు' },
        };
      }
      return {
        text: `Your procurement cycle is complete! Your payment of ₹${amt.toLocaleString('en-IN')} has been successfully credited to your bank account via PFMS DBT (Bank Ref: ${ref}). No further action is needed.`,
        action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'View Payment Details' },
      };
    }

    if (status === 'COMPLETED' || status === 'PAYMENT_PROCESSING') {
      if (lang === 'hi') {
        return {
          text: `आपकी उपज का वजन हो चुका है और डिजिटल खरीद रसीद जारी कर दी गई है। आपका भुगतान वर्तमान में PFMS/DBT ट्रेजरी बैच क्लीयरेंस के लिए प्रसंस्कृत हो रहा है। आमतौर पर इसमें 24 से 48 घंटे लगते हैं। आप भुगतान ट्रैकिंग टैब में वास्तविक समय की स्थिति देख सकते हैं।`,
          action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'भुगतान स्थिति देखें' },
        };
      }
      if (lang === 'te') {
        return {
          text: `మీ పంట తూకం పూర్తయింది. డిజిటల్ సేకరణ రసీదు రూపొందించబడింది. మీ చెల్లింపు ప్రస్తుతం PFMS/DBT ద్వారా ప్రాసెస్ చేయబడుతోంది. సాధారణంగా దీనికి 24 నుండి 48 గంటలు పడుతుంది.`,
          action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'చెల్లింపు ట్రాక్ చేయండి' },
        };
      }
      return {
        text: `Your grain weighing is completed and accepted. Your payment is currently being processed via the PFMS DBT treasury gateway (typically clears within 24–48 hours). You can monitor payment clearance live in the Payment Tracking tab.`,
        action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'Track Payment' },
      };
    }

    if (status === 'WEIGHING') {
      return {
        text: lang === 'hi'
          ? `आपकी उपज वर्तमान में वेईब्रिज (तौल कांटे) पर तौली जा रही है। कृपया सुनिश्चित करें कि सकल वजन और खाली गाड़ी (टेयर) का वजन सही ढंग से दर्ज हो। तौल पूरा होने के बाद आपको डिजिटल पर्ची मिलेगी।`
          : lang === 'te'
          ? `మీ పంట ప్రస్తుతం వేబ్రిడ్జ్ వద్ద తూకం వేయబడుతోంది. ఖాళీ వాహనం బరువు తీసివేసిన తర్వాత నికర బరువు సరిచూసుకోండి.`
          : `Your vehicle is currently on the weighbridge platform. The operator is recording gross and tare weight. Keep your gate token handy to receive your digital weighing slip.`,
        action: { type: 'NAVIGATE_TAB', target: 'procurement', label: 'Procurement Status' },
      };
    }

    if (status === 'VERIFYING' || status === 'QUALITY_CHECK') {
      return {
        text: lang === 'hi'
          ? `आपके दस्तावेज और फसल की गुणवत्ता (नमी %) का सत्यापन केंद्र के काउंटर पर किया जा रहा है। सत्यापन पूरा होते ही आपको तौल कांटे (वेईब्रिज) पर बुलाया जाएगा।`
          : lang === 'te'
          ? `మీ పత్రాలు మరియు నాణ్యత ధృవీకరించబడుతున్నాయి. పూర్తయిన వెంటనే మిమ్మల్ని తూకం వేదిక వద్దకు పిలుస్తారు.`
          : `Your land records and moisture level are currently being verified by the Mandi quality inspector. Once approved, you will proceed directly to the weighbridge platform.`,
        action: { type: 'NAVIGATE_TAB', target: 'procurement', label: 'Procurement Status' },
      };
    }

    // WAITING / ARRIVED / BOOKED
    const ahead = queueStats?.farmersAhead ?? 5;
    const wait = queueStats?.estimatedWaitMins ?? 35;

    if (ahead <= 2) {
      return {
        text: lang === 'hi'
          ? `आपका नंबर बहुत नजदीक है! आपके आगे केवल ${ahead} किसान हैं (अनुमानित प्रतीक्षा: ~${wait} मिनट)। कृपया अपने वाहन को तैयार रखें और गेट प्रवेश लेन 1 की ओर बढ़ें।`
          : lang === 'te'
          ? `మీ వంతు సమీపిస్తోంది! మీ ముందు కేవలం ${ahead} రైతులు మాత్రమే ఉన్నారు (~${wait} నిమిషాలు). దయచేసి గేట్ వద్ద సిద్ధంగా ఉండండి.`
          : `Your turn is approaching! There are only ${ahead} farmer(s) ahead of you (~${wait} minutes wait). Please position your vehicle near Gate Entry Lane 1 with your digital gate pass ready.`,
        action: { type: 'NAVIGATE_TAB', target: 'queue', label: 'Track Live Queue' },
      };
    }

    return {
      text: lang === 'hi'
        ? `आप वर्तमान में टोकन **${activeBooking.token}** के साथ कतार में हैं। आपके आगे अभी **${ahead} किसान** हैं और अनुमानित प्रतीक्षा समय लगभग **${wait} मिनट** है। आप तब तक शेड में विश्राम कर सकते हैं; आपकी बारी आने पर SMS द्वारा सूचना दी जाएगी।`
        : lang === 'te'
        ? `మీరు టోకెన్ **${activeBooking.token}** తో క్యూలో ఉన్నారు. మీ ముందు **${ahead} మంది రైతులు** ఉన్నారు (సుమారు **${wait} నిమిషాలు** వేచి ఉండాలి). మీ వంతు వచ్చినప్పుడు SMS వస్తుంది.`
        : `You are currently in the queue with Token **${activeBooking.token}** at ${activeBooking.centreName}. There are **${ahead} farmers** ahead of you, and your estimated waiting time is **~${wait} minutes**. You can rest in the farmer pavilion; an automatic SMS alert will trigger when your vehicle is called.`,
      action: { type: 'NAVIGATE_TAB', target: 'queue', label: 'View Live Queue' },
    };
  }

  // 2. TOKEN & QUEUE POSITION
  if (
    q.includes('where is my token') ||
    q.includes('what is my token') ||
    q.includes('my token') ||
    q.includes('टोकन') ||
    q.includes('టోకెన్') ||
    q.includes('farmers ahead') ||
    q.includes('queue position') ||
    q.includes('turn come')
  ) {
    if (!activeBooking) {
      return {
        text: lang === 'hi'
          ? 'आपके पास अभी कोई सक्रिय टोकन नहीं है क्योंकि आपने कोई खरीद स्लॉट बुक नहीं किया है।'
          : lang === 'te'
          ? 'మీరు ఇంకా స్లాట్ బుక్ చేసుకోనందున మీ వద్ద క్రియాశీల టోకెన్ లేదు.'
          : "I don't have a token on record for you because you do not have an active booking. Would you like to book a slot now?",
        action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'Book Slot' },
      };
    }

    const token = activeBooking.token;
    const current = queueStats?.currentServingToken || 'P098';
    const ahead = queueStats?.farmersAhead ?? 0;
    const wait = queueStats?.estimatedWaitMins ?? 0;

    if (lang === 'hi') {
      return {
        text: `आपका टोकन नंबर **${token}** है।
• वर्तमान में सेवारत टोकन: **${current}**
• आपके आगे किसान: **${ahead}**
• अनुमानित प्रतीक्षा समय: **${wait} मिनट**
• खरीद केंद्र: **${activeBooking.centreName}**`,
        action: { type: 'NAVIGATE_TAB', target: 'queue', label: 'लाइव कतार देखें' },
      };
    }
    if (lang === 'te') {
      return {
        text: `మీ టోకెన్ నంబర్ **${token}**.
• ప్రస్తుతం సేవలందిస్తున్న టోకెన్: **${current}**
• మీ ముందు ఉన్న రైతులు: **${ahead}**
• అంచనా వేసిన వేచి ఉండే సమయం: **${wait} నిమిషాలు**
• కేంద్రం: **${activeBooking.centreName}**`,
        action: { type: 'NAVIGATE_TAB', target: 'queue', label: 'లైవ్ క్యూ చూడండి' },
      };
    }
    return {
      text: `Your token number is **${token}**.
• Currently serving token: **${current}**
• Farmers ahead of you: **${ahead}**
• Estimated waiting time: **${wait} minutes**
• Centre: **${activeBooking.centreName}**`,
      action: { type: 'NAVIGATE_TAB', target: 'queue', label: 'Open Live Queue' },
    };
  }

  // 3. HOW LONG WILL I WAIT / WHY IS QUEUE SLOW
  if (
    q.includes('how long') ||
    q.includes('waiting time') ||
    q.includes('wait') ||
    q.includes('इंतज़ार') ||
    q.includes('సమయం') ||
    q.includes('slow') ||
    q.includes('increasing') ||
    q.includes('stopped') ||
    q.includes('कतार धीमी') ||
    q.includes('క్యూ ఎందుకు నెమ్మదిగా')
  ) {
    if (!activeBooking) {
      return {
        text: lang === 'hi'
          ? 'आपके पास कोई सक्रिय बुकिंग नहीं है। यदि आप नया स्लॉट बुक करते हैं, तो औसत प्रतीक्षा समय केवल 15 से 25 मिनट है।'
          : lang === 'te'
          ? 'మీకు యాక్టివ్ బుకింగ్ లేదు. కొత్త స్లాట్ బుక్ చేసుకుంటే సుమారు 15-25 నిమిషాలు పడుతుంది.'
          : "You don't have an active booking right now. At current centre throughput, standard waiting time upon scheduled arrival is 15–25 minutes.",
        action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'Book Slot' },
      };
    }

    const wait = queueStats?.estimatedWaitMins ?? 35;
    const ahead = queueStats?.farmersAhead ?? 5;
    const avg = queueStats?.avgProcessingTimeMins ?? 7;

    return {
      text: lang === 'hi'
        ? `आपकी अनुमानित प्रतीक्षा अवधि लगभग **${wait} मिनट** है (${ahead} किसान × ~${avg} मिनट प्रति तौल चक्र)।
कतार सामान्य गति से चल रही है। प्रत्येक वाहन के सकल वजन, नमी जांच और खाली वाहन (टेयर) वजन में औसतन 7 मिनट लगते हैं।`
        : lang === 'te'
        ? `మీ అంచనా వేచి ఉండే సమయం సుమారు **${wait} నిమిషాలు** (${ahead} మంది రైతులు × ~${avg} నిమిషాలు). వాహనాల బరువు మరియు నాణ్యత తనిఖీ కారణంగా ప్రతి వాహనానికి సగటున 7 నిమిషాలు పడుతుంది.`
        : `Your estimated waiting time is **~${wait} minutes** based on **${ahead} farmers ahead** in line at an average processing pace of **${avg} minutes per weighbridge cycle**.

Current Queue Factors:
• Electronic scale calibration and gross-to-tare weighing takes ~7 minutes per trolley.
• Moisture meters are sampling 12–14% moisture content to ensure fair FAQ standard grading.`,
      action: { type: 'NAVIGATE_TAB', target: 'queue', label: 'Track Live Queue' },
    };
  }

  // 4. SMART CENTRE RECOMMENDATION ("Which centre should I go to? / Best centre")
  if (
    q.includes('which centre') ||
    q.includes('best centre') ||
    q.includes('nearest') ||
    q.includes('less waiting') ||
    q.includes('crowded') ||
    q.includes('केंद्र') ||
    q.includes('కేంద్రం')
  ) {
    // Determine lowest load / lowest wait centre
    const sortedCentres = [...centres].sort((a, b) => a.currentLoad - b.currentLoad);
    const best = sortedCentres[0] || centres[0];
    const currentBookingCentre = activeBooking
      ? centres.find((c) => c.id === activeBooking.centreId)
      : centres[0];

    return {
      text: lang === 'hi'
        ? `वर्तमान मंडी स्थितियों और यार्ड लोड के आधार पर, मैं **${best.name}** की अनुशंसा करता हूँ।

मैं इसकी अनुशंसा इसलिए कर रहा हूँ क्योंकि:
• **कम यार्ड लोड**: केवल ${best.currentLoad}% भरा हुआ है (केंद्रीय केंद्र के मुकाबले कम)।
• **न्यूनतम प्रतीक्षा**: अनुमानित प्रतीक्षा समय मात्र ~12-15 मिनट।
• **सक्रिय कांटे**: ${best.activeCounters} तौल कांटे निरंतर चालू हैं।
• **स्लॉट उपलब्धता**: आज पर्याप्त समय स्लॉट उपलब्ध हैं।`
        : lang === 'te'
        ? `ప్రస్తుత పరిస్థితుల ఆధారంగా, నేను **${best.name}** ను సిఫార్సు చేస్తున్నాను.

సిఫార్సు చేయడానికి కారణాలు:
• **తక్కువ రద్దీ**: కేవలం ${best.currentLoad}% లోడ్ మాత్రమే ఉంది.
• **తక్కువ వేచి ఉండే సమయం**: సుమారు 12-15 నిమిషాలు.
• **క్రియాశీల కౌంటర్లు**: ${best.activeCounters} వేబ్రిడ్జ్ కౌంటర్లు అందుబాటులో ఉన్నాయి.
• **స్లాట్లు అందుబాటులో ఉన్నాయి**.`
        : `Based on current telemetry across all regional Mandis, I recommend **${best.name}**.

Why I recommend this centre:
• **Lower yard load**: Currently operating at only **${best.currentLoad}% capacity** (compared to ${currentBookingCentre?.currentLoad || 78}% elsewhere).
• **Shorter estimated wait**: ~12–15 minutes average queue time.
• **Active weighbridges**: ${best.activeCounters} electronic scales in continuous operation.
• **Ample slot availability**: Open morning and afternoon booking slots today.`,
      action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'View Centres & Book' },
    };
  }

  // 5. BOOKING DETAILS
  if (
    q.includes('booking') ||
    q.includes('slot') ||
    q.includes('बुकिंग') ||
    q.includes('स्లాట్') ||
    q.includes('gate pass') ||
    q.includes('गेट पास')
  ) {
    if (!activeBooking) {
      return {
        text: lang === 'hi'
          ? 'वर्तमान में आपकी कोई सक्रिय खरीद बुकिंग नहीं मिली। क्या आप नई बुकिंग करना चाहते हैं?'
          : lang === 'te'
          ? 'మీకు ప్రస్తుతం బుకింగ్ ఏదీ లేదు. కొత్త స్లాట్ బుక్ చేయాలనుకుంటున్నారా?'
          : "I don't see an active booking for your account. You can easily schedule a slot right now.",
        action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'Book Slot' },
      };
    }

    return {
      text: lang === 'hi'
        ? `आपकी वर्तमान खरीद बुकिंग का विवरण:
• **टोकन**: ${activeBooking.token}
• **केंद्र**: ${activeBooking.centreName}
• **दिनांक व समय**: ${activeBooking.date} (${activeBooking.timeSlot})
• **फसल व मात्रा**: ${activeBooking.crop} (${activeBooking.bookedQuantity} किग्रा)
• **स्थिति**: ${activeBooking.status}`
        : lang === 'te'
        ? `మీ ప్రస్తుత బుకింగ్ వివరాలు:
• **టోకెన్**: ${activeBooking.token}
• **కేంద్రం**: ${activeBooking.centreName}
• **తేదీ & సమయం**: ${activeBooking.date} (${activeBooking.timeSlot})
• **పంట & పరిమాణం**: ${activeBooking.crop} (${activeBooking.bookedQuantity} కేజీలు)
• **స్థితి**: ${activeBooking.status}`
        : `Here are your confirmed booking details:
• **Gate Token**: **${activeBooking.token}**
• **Procurement Centre**: ${activeBooking.centreName}
• **Scheduled Date & Slot**: ${activeBooking.date} (${activeBooking.timeSlot})
• **Commodity & Quantity**: ${activeBooking.crop} (${activeBooking.bookedQuantity} kg)
• **Current Stage**: **${activeBooking.status}**`,
      action: { type: 'NAVIGATE_TAB', target: 'myBooking', label: 'Open Digital Gate Pass' },
    };
  }

  // 6. WEIGHING & PROCUREMENT STATUS
  if (
    q.includes('weighed') ||
    q.includes('weighing') ||
    q.includes('procurement') ||
    q.includes('quantity accepted') ||
    q.includes('moisture') ||
    q.includes('वजन') ||
    q.includes('तौल') ||
    q.includes('खरीद') ||
    q.includes('తూకం') ||
    q.includes('సేకరణ')
  ) {
    if (!activeBooking) {
      return {
        text: lang === 'hi'
          ? 'आपकी उपज का अभी तौल नहीं हुआ है क्योंकि आपकी कोई सक्रिय बुकिंग नहीं है।'
          : lang === 'te'
          ? 'మీకు బుకింగ్ లేనందున పంట ఇంకా తూకం వేయబడలేదు.'
          : "Your produce has not been weighed yet because you do not have an active booking.",
        action: { type: 'NAVIGATE_TAB', target: 'bookSlot', label: 'Book Slot' },
      };
    }

    if (activeBooking.actualWeight || procurement) {
      const net = procurement?.actualWeight || activeBooking.actualWeight || 585;
      const slip = procurement?.weighmentSlipNo || activeBooking.weighingSlipId || 'WS-2026-104-001';
      const moist = procurement?.moisture || activeBooking.moisturePercentage || 12.4;
      const grade = procurement?.qualityGrade || activeBooking.qualityGrade || 'FAQ / Grade A';

      return {
        text: lang === 'hi'
          ? `आपकी उपज का तौल सफलतापूर्वक पूर्ण हो चुका है!
• **स्वीकृत शुद्ध मात्रा**: ${net} किग्रा (${(net / 100).toFixed(2)} क्विंटल)
• **नमी स्तर**: ${moist}% (मानक के अनुरूप)
• **गुणवत्ता श्रेणी**: ${grade}
• **इलेक्ट्रॉनिक तौल पर्ची**: ${slip}`
          : lang === 'te'
          ? `మీ పంట తూకం విజయవంతంగా పూర్తయింది!
• **స్వీకరించిన నికర బరువు**: ${net} కేజీలు (${(net / 100).toFixed(2)} క్వింటాళ్ళు)
• **తేమ శాతం**: ${moist}% (సరియైన పరిమితిలో)
• **నాణ్యత గ్రేడ్**: ${grade}
• **తూకం రసీదు**: ${slip}`
          : `Your produce has been digitally weighed and accepted!
• **Net Accepted Weight**: **${net} kg** (${(net / 100).toFixed(2)} quintals)
• **Moisture Content**: **${moist}%** (Within optimal FAQ tolerance)
• **Quality Grade**: **${grade}**
• **Digital Weighing Slip**: **${slip}**`,
        action: { type: 'NAVIGATE_TAB', target: 'procurement', label: 'View Weighing Slip' },
      };
    }

    return {
      text: lang === 'hi'
        ? `आपकी उपज का अभी तौल नहीं हुआ है। आपकी बुकिंग टोकन **${activeBooking.token}** पर कतारबद्ध है। आपके आगे अभी ${queueStats?.farmersAhead ?? 5} किसान हैं।`
        : lang === 'te'
        ? `మీ పంట ఇంకా తూకం వేయబడలేదు. మీ టోకెన్ **${activeBooking.token}** క్యూలో ఉంది.`
        : `Your produce has not been weighed yet. Your appointment (Token **${activeBooking.token}**) is currently waiting in the gate queue. You will proceed to the weighbridge once called.`,
      action: { type: 'NAVIGATE_TAB', target: 'procurement', label: 'Procurement Status' },
    };
  }

  // 7. PAYMENT & CALCULATION ("Has my payment arrived? / How was payment calculated?")
  if (
    q.includes('payment') ||
    q.includes('money') ||
    q.includes('calculated') ||
    q.includes('receive') ||
    q.includes('pending') ||
    q.includes('भुगतान') ||
    q.includes('पैसे') ||
    q.includes('गणना') ||
    q.includes('చెల్లింపు') ||
    q.includes('డబ్బులు') ||
    q.includes('ఎలా లెక్కించారు')
  ) {
    const netWeight = procurement?.actualWeight || activeBooking?.actualWeight || 585;
    const quintals = netWeight / 100;
    const rate = procurement?.ratePerQuintal || 2275;
    const gross = Math.round(quintals * rate);
    const deductions = procurement?.deductions || 0;
    const netPayable = gross - deductions;

    const isPaid = payment?.status === 'PAID' || activeBooking?.status === 'PAID';
    const isProcessing =
      payment?.status === 'PROCESSING' || activeBooking?.status === 'PAYMENT_PROCESSING' || (!isPaid && !!procurement);

    if (q.includes('calculated') || q.includes('गणना') || q.includes('ఎలా లెక్కించారు') || q.includes('calculation')) {
      return {
        text: lang === 'hi'
          ? `आपके भुगतान की पारदर्शी गणना इस प्रकार है:

• **स्वीकृत शुद्ध मात्रा**: ${netWeight} किग्रा (${quintals.toFixed(2)} क्विंटल)
• **लागू खरीद दर**: ₹${rate.toLocaleString('en-IN')} प्रति क्विंटल
• **सकल खरीद राशि**: ${quintals.toFixed(2)} × ₹${rate.toLocaleString('en-IN')} = ₹${gross.toLocaleString('en-IN')}
• **कटौती/समायोजन**: ₹${deductions}
• **कुल देय राशि**: **₹${netPayable.toLocaleString('en-IN')}**

यह राशि सीधे आपके आधार-सत्यापित बैंक खाते में DBT के माध्यम से अंतरित की जाती है।`
          : lang === 'te'
          ? `మీ చెల్లింపు పారదర్శక లెక్కల వివరాలు:

• **స్వీకరించిన నికర పరిమాణం**: ${netWeight} కేజీలు (${quintals.toFixed(2)} క్వింటాళ్ళు)
• **కొనుగోలు రేటు**: క్వింటాలుకు ₹${rate.toLocaleString('en-IN')}
• **స్థూల మొత్తం**: ₹${gross.toLocaleString('en-IN')}
• **మినహాయింపులు**: ₹${deductions}
• **నికర చెల్లింపు**: **₹${netPayable.toLocaleString('en-IN')}**`
          : `Here is the transparent calculation of your procurement payment:

• **Net Accepted Quantity**: **${netWeight} kg** (${quintals.toFixed(2)} quintals)
• **Configured Procurement Rate**: **₹${rate.toLocaleString('en-IN')}** per quintal
• **Gross Procurement Amount**: ${quintals.toFixed(2)} quintals × ₹${rate.toLocaleString('en-IN')} = **₹${gross.toLocaleString('en-IN')}**
• **Standard Deductions**: ₹${deductions}
• **Net Approved Payable**: **₹${netPayable.toLocaleString('en-IN')}**

Note: Settlement is processed directly to your Aadhaar-linked bank account via PFMS Direct Benefit Transfer (DBT).`,
        action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'Payment Breakdown' },
      };
    }

    if (isPaid) {
      const utr = payment?.bankRefNo || 'UTR99882210479';
      const txn = payment?.transactionId || 'PAY-2026-104';
      return {
        text: lang === 'hi'
          ? `हाँ, आपका भुगतान सफलतापूर्वक जमा कर दिया गया है!
• **भुगतान राशि**: ₹${(payment?.amount || netPayable).toLocaleString('en-IN')}
• **स्थिति**: PAID (सफलतापूर्वक जमा)
• **बैंक UTR संदर्भ**: ${utr}
• **लेन-देन ID**: ${txn}
• **खाता**: ${payment?.accountMasked || currentFarmer.bankAccountMasked || '•••• •••• 4892'}`
          : lang === 'te'
          ? `అవును, మీ చెల్లింపు విజయవంతంగా పూర్తయింది!
• **మొత్తం**: ₹${(payment?.amount || netPayable).toLocaleString('en-IN')}
• **స్థితి**: PAID (చెల్లించబడింది)
• **బ్యాంక్ UTR రెఫరెన్స్**: ${utr}
• **ఖాతా**: ${payment?.accountMasked || currentFarmer.bankAccountMasked || '•••• •••• 4892'}`
          : `Yes, your payment has been sent!
• **Amount Sent**: **₹${(payment?.amount || netPayable).toLocaleString('en-IN')}**
• **Status**: **Payment Sent (Direct Benefit Transfer)**
• **Bank UTR Ref**: **${utr}**
• **Transaction ID**: **${txn}**
• **Beneficiary Bank Account**: ${payment?.accountMasked || currentFarmer.bankAccountMasked || '•••• •••• 4892'}`,
        action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'View Payment Receipt' },
      };
    }

    if (isProcessing) {
      return {
        text: lang === 'hi'
          ? `आपका ₹${netPayable.toLocaleString('en-IN')} का भुगतान वर्तमान में PFMS ट्रेजरी में प्रसंस्कृत (Processing) हो रहा है। आमतौर पर DBT सत्यापन और बैंक हस्तांतरण में 24 से 48 कार्य घंटे लगते हैं। राशि जमा होते ही आपको SMS प्राप्त होगा।`
          : lang === 'te'
          ? `మీ ₹${netPayable.toLocaleString('en-IN')} చెల్లింపు ప్రస్తుతం ప్రాసెస్ చేయబడుతోంది (Processing). DBT ద్వారా బ్యాంకులో జమ కావడానికి 24-48 గంటలు పడుతుంది.`
          : `Your payment of **₹${netPayable.toLocaleString('en-IN')}** is currently **PROCESSING** through the PFMS treasury clearance batch. DBT bank credit typically settles within standard 24–48 banking hours.`,
        action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'Track Payment' },
      };
    }

    return {
      text: lang === 'hi'
        ? `आपकी उपज का अभी तौल नहीं हुआ है, इसलिए भुगतान प्रक्रिया शुरू नहीं हुई है। तौल पूरा होते ही डिजिटल रसीद और भुगतान स्वतः प्रारंभ हो जाएगा।`
        : lang === 'te'
        ? `మీ పంట తూకం ఇంకా పూర్తి కాలేదు, కాబట్టి చెల్లింపు ఇంకా ప్రారంభం కాలేదు.`
        : `Payment initiation occurs automatically after electronic weighing and moisture approval. Once your grain is weighed at the weighbridge, payment will be triggered immediately.`,
      action: { type: 'NAVIGATE_TAB', target: 'payment', label: 'Payment Details' },
    };
  }

  // 8. GENERAL QUESTIONS: DOCUMENTS & PROCESS
  if (q.includes('document') || q.includes('दस्तावेज') || q.includes('పత్రాలు')) {
    return {
      text: lang === 'hi'
        ? `मंडी खरीद केंद्र पर ले जाने हेतु आवश्यक दस्तावेज:
1. **स्मार्टप्रोक्योर डिजिटल गेट पास** (आपके मोबाइल में QR कोड या प्रिंट)
2. **आधार कार्ड** (पहचान एवं बायोमेट्रिक सत्यापन)
3. **बैंक पासबुक प्रति** (DBT भुगतान सत्यापन हेतु)
4. **भू-अभिलेख (खसरा/खतौनी)** (पंजीकृत फसल रकबा सत्यापन)`
        : lang === 'te'
        ? `కేంద్రానికి వెళ్ళేటప్పుడు అవసరమైన పత్రాలు:
1. **డిజిటల్ గేట్ పాస్** (QR కోడ్)
2. **ఆధార్ కార్డు**
3. **బ్యాంక్ పాస్‌బుక్ కాపీ**
4. **భూమి పట్టాదారు పాస్‌బుక్ / రికార్డులు**`
        : `Essential checklist for your Mandi procurement visit:
1. **SmartProcure Digital Gate Pass** (Digital QR pass on mobile or printed token)
2. **Aadhaar Card** (Identity and biometric verification)
3. **Bank Account Details** (For PFMS DBT direct benefit credit)
4. **Land Ownership Records** (Khasra / Patta passbook confirming registered area)`,
      action: { type: 'NAVIGATE_TAB', target: 'myBooking', label: 'Open Gate Pass' },
    };
  }

  if (q.includes('process') || q.includes('explain') || q.includes('प्रक्रिया') || q.includes('విధానం')) {
    return {
      text: lang === 'hi'
        ? `स्मार्टप्रोक्योर 8-चरणीय पारदर्शी खरीद प्रक्रिया:
1. **स्लॉट बुकिंग**: अपनी सुविधा अनुसार समय चुनें।
2. **गेट आगमन**: डिजिटल पास दिखाकर प्रवेश करें।
3. **दस्तावेज सत्यापन**: भूमि व किसान पहचान की जांच।
4. **वेईब्रिज तौल**: वाहन का सकल एवं खाली (टेयर) वजन।
5. **गुणवत्ता व नमी जांच**: डिजिटल नमी मापक द्वारा निष्पक्ष जांच।
6. **डिजिटल रसीद**: आधिकारिक मुहरबंद तौल पर्ची।
7. **PFMS DBT प्रेषण**: बैंक खाते में स्वतः भुगतान हस्तांतरण।
8. **SMS पावती**: खाते में राशि आने की सूचना।`
        : lang === 'te'
        ? `స్మార్ట్ సేకరణ 8 దశల విధానం:
1. స్లాట్ బుకింగ్ -> 2. గేట్ ఎంట్రీ -> 3. డాక్యుమెంట్ వెరిఫికేషన్ -> 4. వేబ్రిడ్జ్ బరువు -> 5. నాణ్యత పరీక్ష -> 6. డిజిటల్ రసీదు -> 7. DBT చెల్లింపు -> 8. SMS నిర్ధారణ.`
        : `SmartProcure 8-Stage Transparent Procurement Journey:
1. **Slot Booking**: Pre-booked appointment preventing Mandi traffic jams.
2. **Gate Entry**: Instant scan of Digital Gate Pass QR code.
3. **Document Verification**: Fast-track Aadhaar and land record check.
4. **Digital Weighbridge**: Gross minus tare automated zero-tamper net weight calculation.
5. **Quality & Moisture**: Electronic moisture probe ensuring fair FAQ pricing.
6. **Digital Weighing Slip**: Verifiable cryptographic receipt.
7. **PFMS DBT Settlement**: Automated direct bank transfer without intermediaries.
8. **Real-time SMS Alert**: Immediate bank UTR reference notification.`,
      action: { type: 'NAVIGATE_TAB', target: 'procurement', label: 'View 8-Stage Journey' },
    };
  }

  // Fallback polite answer
  return {
    text: lang === 'hi'
      ? `नमस्ते! मैं आपका स्मार्टप्रोक्योर एआई सहायक हूँ। आप मुझसे अपने टोकन, कतार में प्रतीक्षा समय, केंद्र की स्थिति, तौल विवरण या DBT भुगतान के बारे में पूछ सकते हैं।`
      : lang === 'te'
      ? `నమస్తే! నేను మీ స్మార్ట్ ప్రొక్యూర్ ఏఐ అసిస్టెంట్‌ని. మీ టోకెన్, క్యూ సమయం, వేబ్రిడ్జ్ బరువు లేదా చెల్లింపు వివరాల గురించి నన్ను అడగవచ్చు.`
      : `Hello! I'm SmartProcure AI. I can assist you with your gate token, live queue position, estimated wait time, Mandi centre recommendations, digital weighing slips, or PFMS DBT payment status. What would you like to know?`,
    action: activeBooking ? { type: 'NAVIGATE_TAB', target: 'queue', label: 'View Queue' } : undefined,
  };
}

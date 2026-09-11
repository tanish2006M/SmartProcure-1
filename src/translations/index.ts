import { Language } from '../types';

export interface Translations {
  portalTitle: string;
  departmentTitle: string;
  tagline: string;
  taglineSub: string;
  nav: {
    dashboard: string;
    bookSlot: string;
    myBooking: string;
    liveQueue: string;
    procurementStatus: string;
    payment: string;
    notifications: string;
    history: string;
    profile: string;
    centres: string;
  };
  common: {
    token: string;
    date: string;
    slot: string;
    crop: string;
    quantity: string;
    procurementCentre: string;
    status: string;
    waiting: string;
    estimatedWait: string;
    position: string;
    farmersAhead: string;
    nowServing: string;
    online: string;
    offline: string;
    demoNotice: string;
    refresh: string;
    viewDetails: string;
    back: string;
    close: string;
    submit: string;
    confirm: string;
    downloadReceipt: string;
  };
  stages: {
    booked: string;
    arrived: string;
    verification: string;
    weighing: string;
    procurement: string;
    payment: string;
    completed: string;
    noShow: string;
  };
  booking: {
    title: string;
    subtitle: string;
    selectCrop: string;
    enterQty: string;
    selectCentre: string;
    selectDate: string;
    selectSlot: string;
    smartRecommend: string;
    smartRecommendDesc: string;
    bookRecommended: string;
    alternativeCentre: string;
    alternativeDesc: string;
    bookThisSlot: string;
    slotFull: string;
    slotsAvailable: string;
    confirmBooking: string;
    tokenGeneratedTitle: string;
    tokenGeneratedDesc: string;
  };
  queue: {
    title: string;
    subtitle: string;
    nowServing: string;
    yourToken: string;
    farmersAheadCount: string;
    avgProcessTime: string;
    centreStatus: string;
    liveStatusTitle: string;
    queueProgressionNotice: string;
    turnApproachingAlert: string;
  };
  procurement: {
    title: string;
    slipNo: string;
    bookedWeight: string;
    actualWeight: string;
    qualityGrade: string;
    moisture: string;
    ratePerQuintal: string;
    grossPayable: string;
    verifiedBy: string;
    officialRemarks: string;
    completedNotice: string;
  };
  payment: {
    title: string;
    amountTitle: string;
    statusTitle: string;
    txnId: string;
    dbtNotice: string;
    bankAccount: string;
    ifsc: string;
  };
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    ctaBook: string;
    ctaTrack: string;
    ctaOfficial: string;
    workflowTitle: string;
    benefit1Title: string;
    benefit1Desc: string;
    benefit2Title: string;
    benefit2Desc: string;
    benefit3Title: string;
    benefit3Desc: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    portalTitle: 'SmartProcure',
    departmentTitle: 'Department of Consumer Affairs • Govt. of India',
    tagline: 'Smart Procurement. Less Waiting. Complete Transparency.',
    taglineSub: 'Connecting farmers and procurement centres through smart slot booking, dynamic queue management and transparent procurement tracking.',
    nav: {
      dashboard: 'Dashboard',
      bookSlot: 'Book Slot',
      myBooking: 'My Booking',
      liveQueue: 'Live Queue',
      procurementStatus: 'Procurement Status',
      payment: 'Payment',
      notifications: 'Notifications',
      history: 'History',
      profile: 'Profile',
      centres: 'Centres List',
    },
    common: {
      token: 'Token',
      date: 'Date',
      slot: 'Time Slot',
      crop: 'Crop Type',
      quantity: 'Quantity',
      procurementCentre: 'Procurement Centre',
      status: 'Status',
      waiting: 'Waiting',
      estimatedWait: 'Estimated Waiting',
      position: 'Your Position',
      farmersAhead: 'Farmers Ahead',
      nowServing: 'Now Serving',
      online: 'ONLINE',
      offline: 'OFFLINE CACHE',
      demoNotice: 'DEMO PROTOTYPE',
      refresh: 'Refresh',
      viewDetails: 'View Details',
      back: 'Back',
      close: 'Close',
      submit: 'Submit',
      confirm: 'Confirm',
      downloadReceipt: 'Download Receipt',
    },
    stages: {
      booked: 'BOOKED',
      arrived: 'ARRIVED',
      verification: 'VERIFICATION',
      weighing: 'WEIGHING',
      procurement: 'PROCUREMENT',
      payment: 'PAYMENT PROCESSING',
      completed: 'PAYMENT SENT',
      noShow: 'NO-SHOW',
    },
    booking: {
      title: 'Smart Slot Booking',
      subtitle: 'Choose your crop, check centre capacities, and book the optimal slot with zero waiting.',
      selectCrop: 'Select Crop',
      enterQty: 'Approximate Quantity (kg)',
      selectCentre: 'Select Procurement Centre',
      selectDate: 'Select Date',
      selectSlot: 'Select Available Time Slot',
      smartRecommend: 'RECOMMENDED SLOT (Smart Automation)',
      smartRecommendDesc: 'Calculated based on current yard load, queue length, and fastest processing time.',
      bookRecommended: 'BOOK RECOMMENDED SLOT',
      alternativeCentre: 'ALTERNATIVE PROCUREMENT CENTRE',
      alternativeDesc: 'Lower congestion alternative to save your travel and waiting time.',
      bookThisSlot: 'Book Slot',
      slotFull: 'FULL (0 slots)',
      slotsAvailable: 'slots available',
      confirmBooking: 'Confirm Appointment',
      tokenGeneratedTitle: 'Slot Booked & Token Generated!',
      tokenGeneratedDesc: 'Your digital pass is ready. Please reach the centre 15 mins prior to your slot.',
    },
    queue: {
      title: 'Live Mandi Queue Tracking',
      subtitle: 'Real-time token progression at your procurement centre.',
      nowServing: 'NOW SERVING',
      yourToken: 'Your Token',
      farmersAheadCount: 'Farmers Ahead',
      avgProcessTime: 'Avg Processing Time',
      centreStatus: 'Yard Status',
      liveStatusTitle: 'Active Queue Movement',
      queueProgressionNotice: 'Queue updates automatically as officials process weighing and verification.',
      turnApproachingAlert: 'Alert: Your turn is approaching! Please keep your grain bags ready at the unloading bay.',
    },
    procurement: {
      title: 'Procurement & Weighment Verification',
      slipNo: 'Weighment Slip Number',
      bookedWeight: 'Booked Weight',
      actualWeight: 'Actual Verified Weight',
      qualityGrade: 'Quality Grade (FAQ)',
      moisture: 'Moisture Content (%)',
      ratePerQuintal: 'Govt MSP Rate / Quintal',
      grossPayable: 'Gross Payable Amount',
      verifiedBy: 'Inspecting Official',
      officialRemarks: 'Verification Remarks',
      completedNotice: 'Grain weighing completed and passed government procurement standards.',
    },
    payment: {
      title: 'Direct Benefit Transfer (DBT) Payment',
      amountTitle: 'Procurement Amount',
      statusTitle: 'Payment Status',
      txnId: 'Transaction ID / UTR',
      dbtNotice: 'Directly credited to Aadhaar-linked Bank Account through PFMS / NPCI.',
      bankAccount: 'Bank Account',
      ifsc: 'IFSC Code',
    },
    landing: {
      heroTitle: 'SMART PROCUREMENT. LESS WAITING.',
      heroSubtitle: 'Connecting farmers and procurement centres through smart slot booking, real-time queue management and transparent procurement tracking.',
      ctaBook: 'BOOK A SLOT',
      ctaTrack: 'TRACK PROCUREMENT',
      ctaOfficial: 'OFFICIAL LOGIN',
      workflowTitle: 'How SmartProcure Works',
      benefit1Title: 'LESS WAITING',
      benefit1Desc: 'Smart slot recommendations and dynamic queue notifications eliminate days of Mandi queuing.',
      benefit2Title: 'REAL-TIME INFORMATION',
      benefit2Desc: 'Live token counter, SMS alerts, and precise waiting-time estimates on your mobile phone.',
      benefit3Title: 'TRANSPARENT PAYMENTS',
      benefit3Desc: 'Direct digital weighment slips, fixed MSP calculation, and instant DBT bank status tracking.',
    },
  },
  hi: {
    portalTitle: 'स्मार्ट प्रोक्योर',
    departmentTitle: 'उपभोक्ता मामले विभाग • भारत सरकार',
    tagline: 'स्मार्ट खरीद। कम इंतज़ार। पूर्ण पारदर्शिता।',
    taglineSub: 'स्मार्ट स्लॉट बुकिंग, लाइव कतार प्रबंधन और पारदर्शी खरीद ट्रैकिंग के माध्यम से किसानों और खरीद केंद्रों को जोड़ना।',
    nav: {
      dashboard: 'डैशबोर्ड',
      bookSlot: 'स्लॉट बुक करें',
      myBooking: 'मेरी बुकिंग',
      liveQueue: 'लाइव कतार',
      procurementStatus: 'खरीद स्थिति',
      payment: 'भुगतान स्थिति',
      notifications: 'सूचनाएं',
      history: 'इतिहास',
      profile: 'प्रोफ़ाइल',
      centres: 'केंद्र सूची',
    },
    common: {
      token: 'टोकन',
      date: 'दिनांक',
      slot: 'समय स्लॉट',
      crop: 'फसल का प्रकार',
      quantity: 'मात्रा',
      procurementCentre: 'खरीद केंद्र',
      status: 'स्थिति',
      waiting: 'प्रतीक्षारत',
      estimatedWait: 'अनुमानित प्रतीक्षा',
      position: 'आपकी स्थिति',
      farmersAhead: 'आगे किसान',
      nowServing: 'वर्तमान टोकन',
      online: 'ऑनलाइन',
      offline: 'ऑफ़लाइन कैश',
      demoNotice: 'डेमो प्रोटोटाइप',
      refresh: 'ताज़ा करें',
      viewDetails: 'विवरण देखें',
      back: 'वापस',
      close: 'बंद करें',
      submit: 'जमा करें',
      confirm: 'पुष्टि करें',
      downloadReceipt: 'रसीद डाउनलोड करें',
    },
    stages: {
      booked: 'बुक हुआ',
      arrived: 'पहुंचे',
      verification: 'सत्यापन',
      weighing: 'तौल कार्य',
      procurement: 'खरीद पूर्ण',
      payment: 'भुगतान प्रक्रिया',
      completed: 'भुगतान भेजा गया',
      noShow: 'अनुपस्थित',
    },
    booking: {
      title: 'स्मार्ट स्लॉट बुकिंग',
      subtitle: 'अपनी फसल चुनें, केंद्र क्षमता जांचें और बिना प्रतीक्षा के उपयुक्त स्लॉट बुक करें।',
      selectCrop: 'फसल चुनें',
      enterQty: 'अनुमानित मात्रा (किलोग्राम)',
      selectCentre: 'खरीद केंद्र चुनें',
      selectDate: 'दिनांक चुनें',
      selectSlot: 'उपलब्ध समय स्लॉट चुनें',
      smartRecommend: 'अनुशंसित स्लॉट (स्मार्ट ऑटोमेशन)',
      smartRecommendDesc: 'मंडी लोड, कतार लंबाई और सबसे तेज तौल समय के आधार पर चयनित।',
      bookRecommended: 'अनुशंसित स्लॉट बुक करें',
      alternativeCentre: 'वैकल्पिक खरीद केंद्र',
      alternativeDesc: 'कम भीड़ वाला केंद्र जो आपका यात्रा और प्रतीक्षा समय बचाएगा।',
      bookThisSlot: 'स्लॉट बुक करें',
      slotFull: 'भरा हुआ (0 शेष)',
      slotsAvailable: 'स्लॉट उपलब्ध',
      confirmBooking: 'अपॉइंटमेंट पक्का करें',
      tokenGeneratedTitle: 'स्लॉट बुक हुआ और टोकन जारी!',
      tokenGeneratedDesc: 'आपका डिजिटल पास तैयार है। कृपया स्लॉट से 15 मिनट पहले पहुंचें।',
    },
    queue: {
      title: 'लाइव मंडी कतार ट्रैकिंग',
      subtitle: 'आपके खरीद केंद्र पर वास्तविक समय टोकन की स्थिति।',
      nowServing: 'वर्तमान में सेवारत',
      yourToken: 'आपका टोकन',
      farmersAheadCount: 'आपसे आगे किसान',
      avgProcessTime: 'औसत तौल समय',
      centreStatus: 'मंडी स्थिति',
      liveStatusTitle: 'सक्रिय कतार प्रगति',
      queueProgressionNotice: 'अधिकारी द्वारा सत्यापन और तौल कार्य होते ही कतार स्वतः आगे बढ़ती है।',
      turnApproachingAlert: 'चेतावनी: आपकी बारी निकट है! कृपया अनलोडिंग बे पर बोरियां तैयार रखें।',
    },
    procurement: {
      title: 'खरीद एवं तौल सत्यापन',
      slipNo: 'तौल पर्ची संख्या',
      bookedWeight: 'बुक किया गया वजन',
      actualWeight: 'वास्तविक प्रमाणित वजन',
      qualityGrade: 'गुणवत्ता ग्रेड (FAQ)',
      moisture: 'नमी का प्रतिशत (%)',
      ratePerQuintal: 'सरकारी एमएसपी दर / क्विंटल',
      grossPayable: 'कुल देय राशि',
      verifiedBy: 'निरीक्षण अधिकारी',
      officialRemarks: 'सत्यापन टिप्पणी',
      completedNotice: 'अनाज की तौल पूरी हुई और सरकारी मानकों पर खरी उतरी।',
    },
    payment: {
      title: 'प्रत्यक्ष लाभ अंतरण (DBT) भुगतान',
      amountTitle: 'कुल खरीद राशि',
      statusTitle: 'भुगतान स्थिति',
      txnId: 'लेन-देन आईडी / UTR',
      dbtNotice: 'PFMS/NPCI के माध्यम से सीधे आधार से जुड़े बैंक खाते में जमा।',
      bankAccount: 'बैंक खाता',
      ifsc: 'आईएफएससी कोड',
    },
    landing: {
      heroTitle: 'स्मार्ट खरीद। कम इंतज़ार।',
      heroSubtitle: 'स्मार्ट स्लॉट बुकिंग, रीयल-टाइम कतार प्रबंधन और पारदर्शी खरीद ट्रैकिंग के साथ किसानों का सशक्तिकरण।',
      ctaBook: 'स्लॉट बुक करें',
      ctaTrack: 'खरीद ट्रैक करें',
      ctaOfficial: 'अधिकारी लॉगिन',
      workflowTitle: 'स्मार्ट प्रोक्योर कैसे काम करता है',
      benefit1Title: 'कम इंतज़ार',
      benefit1Desc: 'स्मार्ट स्लॉट सिफारिश और लाइव कतार सूचनाओं से मंडी में दिनों का इंतजार खत्म।',
      benefit2Title: 'रीयल-टाइम जानकारी',
      benefit2Desc: 'लाइव टोकन काउंटर, एसएमएस अलर्ट और सटीक प्रतीक्षा समय मोबाइल पर उपलब्ध।',
      benefit3Title: 'पारदर्शी भुगतान',
      benefit3Desc: 'डिजिटल तौल पर्ची, एमएसपी गणना और सीधे बैंक खाते में डीबीटी भुगतान की स्थिति।',
    },
  },
  te: {
    portalTitle: 'స్మార్ట్ ప్రొక్యూర్',
    departmentTitle: 'వినియోగదారుల వ్యవహారాల శాఖ • భారత ప్రభుత్వం',
    tagline: 'స్మార్ట్ సేకరణ. తక్కువ వేచి ఉండటం. పూర్తి పారదర్శకత.',
    taglineSub: 'స్మార్ట్ స్లాట్ బుకింగ్, ప్రత్యక్ష క్యూ నిర్వహణ మరియు పారదర్శక సేకరణ ట్రాకింగ్ ద్వారా రైతులు మరియు సేకరణ కేంద్రాలను కనెక్ట్ చేయడం.',
    nav: {
      dashboard: 'డ్యాష్‌బోర్డ్',
      bookSlot: 'స్లాట్ బుక్ చేయండి',
      myBooking: 'నా బుకింగ్',
      liveQueue: 'ప్రత్యక్ష క్యూ',
      procurementStatus: 'సేకరణ స్థితి',
      payment: 'చెల్లింపు స్థితి',
      notifications: 'నోటిఫికేషన్లు',
      history: 'చరిత్ర',
      profile: 'ప్రొఫైల్',
      centres: 'కేంద్రాల జాబితా',
    },
    common: {
      token: 'టోకెన్',
      date: 'తేదీ',
      slot: 'సమయ స్లాట్',
      crop: 'పంట రకం',
      quantity: 'పరిమాణం',
      procurementCentre: 'సేకరణ కేంద్రం',
      status: 'స్థితి',
      waiting: 'నిరీక్షణలో',
      estimatedWait: 'అంచనా వేసిన నిరీక్షణ',
      position: 'మీ స్థానం',
      farmersAhead: 'ముందున్న రైతులు',
      nowServing: 'ప్రస్తుత టోకెన్',
      online: 'ఆన్‌లైన్',
      offline: 'ఆఫ్‌లైన్ కాష్',
      demoNotice: 'డెమో ప్రోటోటైప్',
      refresh: 'రిఫ్రెష్',
      viewDetails: 'వివరాలు చూడండి',
      back: 'వెనుకకు',
      close: 'మూసివేయి',
      submit: 'సమర్పించండి',
      confirm: 'నిర్ధారించండి',
      downloadReceipt: 'రసీదు డౌన్‌లోడ్',
    },
    stages: {
      booked: 'బుక్ చేయబడింది',
      arrived: 'చేరుకున్నారు',
      verification: 'ధృవీకరణ',
      weighing: 'తూకం ప్రక్రియ',
      procurement: 'సేకరణ పూర్తయింది',
      payment: 'చెల్లింపు ప్రక్రియ',
      completed: 'చెల్లింపు పంపబడింది',
      noShow: 'హాజరుకాలేదు',
    },
    booking: {
      title: 'స్మార్ట్ స్లాట్ బుకింగ్',
      subtitle: 'మీ పంటను ఎంచుకోండి, కేంద్ర సామర్థ్యాన్ని తనిఖీ చేసి, క్యూ లేని సరైన స్లాట్‌ను బుక్ చేయండి.',
      selectCrop: 'పంటను ఎంచుకోండి',
      enterQty: 'సుమారు పరిమాణం (కిలోలు)',
      selectCentre: 'సేకరణ కేంద్రాన్ని ఎంచుకోండి',
      selectDate: 'తేదీని ఎంచుకోండి',
      selectSlot: 'అందుబాటులో ఉన్న స్లాట్‌ను ఎంచుకోండి',
      smartRecommend: 'సిఫార్సు చేయబడిన స్లాట్ (స్మార్ట్ ఆటోమేషన్)',
      smartRecommendDesc: 'మార్కెట్ లోడ్ మరియు వేగవంతమైన ప్రాసెసింగ్ సమయం ఆధారంగా లెక్కించబడింది.',
      bookRecommended: 'సిఫార్సు చేసిన స్లాట్‌ను బుక్ చేయండి',
      alternativeCentre: 'ప్రత్యామ్నాయ సేకరణ కేంద్రం',
      alternativeDesc: 'తక్కువ రద్దీ ఉన్న కేంద్రం మీ ప్రయాణ మరియు నిరీక్షణ సమయాన్ని ఆదా చేస్తుంది.',
      bookThisSlot: 'స్లాట్ బుక్ చేయండి',
      slotFull: 'నిండిపోయింది (0 ఖాళీ)',
      slotsAvailable: 'స్లాట్లు అందుబాటులో ఉన్నాయి',
      confirmBooking: 'నియామకాన్ని నిర్ధారించండి',
      tokenGeneratedTitle: 'స్లాట్ బుక్ అయింది & టోకెన్ వచ్చింది!',
      tokenGeneratedDesc: 'మీ డిజిటల్ పాస్ సిద్ధంగా ఉంది. దయచేసి స్లాట్ సమయానికి 15 నిమిషాల ముందు చేరుకోండి.',
    },
    queue: {
      title: 'ప్రత్యక్ష మార్కెట్ క్యూ ట్రాకింగ్',
      subtitle: 'సేకరణ కేంద్రంలో ప్రత్యక్ష టోకెన్ పురోగతి.',
      nowServing: 'ప్రస్తుతం సేవలందిస్తున్నది',
      yourToken: 'మీ టోకెన్',
      farmersAheadCount: 'ముందున్న రైతులు',
      avgProcessTime: 'సగటు ప్రాసెసింగ్ సమయం',
      centreStatus: 'కేంద్రం స్థితి',
      liveStatusTitle: 'క్యూ కదలిక',
      queueProgressionNotice: 'తూకం మరియు ధృవీకరణ పూర్తి కాగానే క్యూ స్వయంచాలకంగా ముందుకు సాగుతుంది.',
      turnApproachingAlert: 'హెచ్చరిక: మీ వంతు సమీపిస్తోంది! దయచేసి మీ ధాన్యం సంచులను అన్‌లోడింగ్ బే వద్ద సిద్ధంగా ఉంచండి.',
    },
    procurement: {
      title: 'సేకరణ మరియు తూకం ధృవీకరణ',
      slipNo: 'తూకం రసీదు సంఖ్య',
      bookedWeight: 'బుక్ చేసిన బరువు',
      actualWeight: 'వాస్తవ ధృవీకరించిన బరువు',
      qualityGrade: 'నాణ్యత గ్రేడ్ (FAQ)',
      moisture: 'తేమ శాతం (%)',
      ratePerQuintal: 'ప్రభుత్వ కనీస మద్దతు ధర (MSP) / క్వింటాల్',
      grossPayable: 'మొత్తం చెల్లించవలసిన మొత్తం',
      verifiedBy: 'తనిఖీ అధికారి',
      officialRemarks: 'ధృవీకరణ వ్యాఖ్యలు',
      completedNotice: 'ధాన్యం తూకం పూర్తయింది మరియు ప్రభుత్వ ప్రమాణాలకు అనుగుణంగా ఉంది.',
    },
    payment: {
      title: 'డైరెక్ట్ బెనిఫిట్ ట్రాన్స్‌ఫర్ (DBT) చెల్లింపు',
      amountTitle: 'మొత్తం సేకరణ మొత్తం',
      statusTitle: 'చెల్లింపు స్థితి',
      txnId: 'లావాదేవీ ID / UTR',
      dbtNotice: 'PFMS/NPCI ద్వారా ఆధార్‌తో లింక్ చేయబడిన బ్యాంక్ ఖాతాకు నేరుగా జమ చేయబడుతుంది.',
      bankAccount: 'బ్యాంక్ ఖాతా',
      ifsc: 'IFSC కోడ్',
    },
    landing: {
      heroTitle: 'స్మార్ట్ సేకరణ. తక్కువ నిరీక్షణ.',
      heroSubtitle: 'స్మార్ట్ స్లాట్ బుకింగ్, రియల్-టైమ్ క్యూ మరియు పారదర్శక సేకరణ ట్రాకింగ్‌తో రైతులకు సాధికారత.',
      ctaBook: 'స్లాట్ బుక్ చేయండి',
      ctaTrack: 'సేకరణను ట్రాక్ చేయండి',
      ctaOfficial: 'అధికారి లాగిన్',
      workflowTitle: 'స్మార్ట్ ప్రొక్యూర్ ఎలా పనిచేస్తుంది',
      benefit1Title: 'తక్కువ వేచి ఉండటం',
      benefit1Desc: 'స్మార్ట్ స్లాట్ సూచనలు మరియు లైవ్ క్యూ హెచ్చరికలు మార్కెట్‌లో రోజుల తరబడి వేచి ఉండే పరిస్థితిని తొలగిస్తాయి.',
      benefit2Title: 'నిజ-సమయ సమాచారం',
      benefit2Desc: 'లైవ్ టోకెన్ కౌంటర్, SMS హెచ్చరికలు మరియు ఖచ్చితమైన వేచి ఉండే సమయం మొబైల్‌లో కనిపిస్తాయి.',
      benefit3Title: 'పారదర్శక చెల్లింపులు',
      benefit3Desc: 'డిజిటల్ వేమెంట్ స్లిప్పులు, స్థిర MSP గణన మరియు తక్షణ DBT బ్యాంక్ స్థితి ట్రాకింగ్.',
    },
  },
};

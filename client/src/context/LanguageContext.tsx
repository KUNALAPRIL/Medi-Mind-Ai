import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Navigation Links
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  aiChat: { en: 'AI Chat', hi: 'एआई चैट' },
  healthAnalytics: { en: 'Health Analytics', hi: 'स्वास्थ्य विश्लेषण' },
  medicalRecords: { en: 'Medical Records', hi: 'चिकित्सा रिकॉर्ड' },
  prescriptionScanner: { en: 'Prescription Scanner', hi: 'पर्चा स्कैनर' },
  reminders: { en: 'Reminders', hi: 'दवा अनुस्मारक' },
  symptomChecker: { en: 'Symptom Checker', hi: 'लक्षण जांचकर्ता' },
  bookAppointment: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' },
  doctorPanel: { en: 'Doctor Panel', hi: 'डॉक्टर पैनल' },
  adminPanel: { en: 'Admin Panel', hi: 'एडमिन पैनल' },
  workspace: { en: 'Workspace', hi: 'कार्यक्षेत्र' },
  close: { en: 'Close', hi: 'बंद करें' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },

  // Dashboard translations
  healthHub: { en: 'Clinical Health Hub', hi: 'चिकित्सीय स्वास्थ्य केंद्र' },
  compilationMsg: { en: 'MediMind AI has compiled your diagnostic logs successfully.', hi: 'एआई ने आपके नैदानिक ​​लॉग को सफलतापूर्वक संकलित किया है।' },
  healthIndex: { en: 'Health Index', hi: 'स्वास्थ्य सूचकांक' },
  score: { en: 'Score', hi: 'अंक' },
  complianceCalculation: { en: 'Calculated dynamically based on treatment compliance rates', hi: 'दवा अनुपालन दरों के आधार पर गतिशील रूप से गणना की गई' },
  treatmentAdherence: { en: 'Treatment Adherence', hi: 'उपचार अनुपालन' },
  weeksAgo: { en: '2 Wks Ago', hi: '2 सप्ताह पहले' },
  currentRate: { en: 'Current Rate', hi: 'वर्तमान दर' },
  aiAdvisoryNotes: { en: 'AI Advisory Notes', hi: 'एआई सलाह नोट्स' },
  upcomingMeds: { en: 'Upcoming Medications (Today)', hi: 'आज की आने वाली दवाएं' },
  noMedsScheduled: { en: 'No medications scheduled for today.', hi: 'आज के लिए कोई दवा निर्धारित नहीं है।' },
  recentReports: { en: 'Recent Scanned Reports', hi: 'हाल ही में स्कैन की गई रिपोर्ट' },
  noReportsScanned: { en: 'No medical documents scanned yet.', hi: 'अभी तक कोई चिकित्सा दस्तावेज स्कैन नहीं किया गया है।' },
  viewMetrics: { en: 'Inspect', hi: 'निरीक्षण करें' },
  upcomingVisits: { en: 'Upcoming Visits', hi: 'आगामी अपॉइंटमेंट' },
  noVisitsScheduled: { en: 'No upcoming appointments found.', hi: 'कोई आगामी अपॉइंटमेंट नहीं मिला।' },

  // Quick Action Shortcuts
  symptomTitle: { en: 'Symptom Checker', hi: 'लक्षण जांचकर्ता' },
  symptomSub: { en: 'Evaluate health risks', hi: 'स्वास्थ्य जोखिमों की जांच करें' },
  chatTitle: { en: 'Consult AI Agent', hi: 'एआई डॉक्टर से बात करें' },
  chatSub: { en: 'Symptom triaging chat', hi: 'लक्षण चैट परामर्श' },
  scanTitle: { en: 'Scan Prescription', hi: 'पर्चा स्कैन करें' },
  scanSub: { en: 'Parse medicines schedule', hi: 'दवाओं का समय निकालें' },
  analyticsTitle: { en: 'Health Analytics', hi: 'स्वास्थ्य विश्लेषण' },
  analyticsSub: { en: 'View biomarker lines', hi: 'बायोमार्कर चार्ट देखें' },

  // Buttons and actions
  seedData: { en: 'Seed Demo Data', hi: 'डेमो डेटा लोड करें' },
  seeding: { en: 'Seeding...', hi: 'लोड हो रहा है...' },
  saveVerify: { en: 'Save & Verify', hi: 'सहेजें और सत्यापित करें' },
  syncReminders: { en: 'Sync to Daily Reminders', hi: 'दवा रिमाइंडर में सिंक करें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  send: { en: 'Send Message', hi: 'संदेश भेजें' },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'hi' ? 'hi' : 'en') as Language;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Set custom header config on axois / fetch globally via html element if desired
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key: string): string => {
    const term = translations[key];
    if (!term) return key;
    return term[language] || term['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type LanguageCode = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'pa' | 'as' | 'ur';

export const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' },
];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'samitibook-language';

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    'app.name': 'SamitiBook',
    'app.tagline': 'Transparent Festival Management',
    'language.label': 'Language',
    'status.online': 'System Online',
    'nav.main': 'Main Menu',
    'nav.system': 'System',
    'nav.dashboard': 'Dashboard',
    'nav.members': 'Members',
    'nav.orgChart': 'Org Chart',
    'nav.chandaDonations': 'Chanda & Donations',
    'nav.expenses': 'Expenses',
    'nav.inventory': 'Inventory',
    'nav.analytics': 'Analytics',
    'nav.broadcasts': 'Broadcasts',
    'nav.pujaEditions': 'Puja Editions',
    'nav.roleManagement': 'Role Management',
    'nav.settings': 'Settings',
    'auth.adminPortal': 'Admin Portal',
    'auth.memberSync': 'Member Sync',
    'auth.emailAddress': 'Email Address',
    'auth.password': 'Password',
    'auth.phoneNumber': 'Phone Number',
    'auth.accessDashboard': 'Access Dashboard',
    'auth.memberLogin': 'Member Login',
    'auth.adminLogin': 'Admin Login',
    'auth.registerCommittee': 'Register Committee',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.delete': 'Delete',
    'form.search': 'Search',
    'form.copy': 'Copy',
    'common.loading': 'Loading...',
    'common.approved': 'Approved',
    'common.pending': 'Pending',
    'dashboard.totalDonations': 'Total Donations',
    'dashboard.totalChanda': 'Total Chanda',
    'dashboard.totalExpenses': 'Total Expenses',
    'dashboard.memberCount': 'Member Count',
  },
  hi: {
    'language.label': 'भाषा',
    'status.online': 'सिस्टम ऑनलाइन',
    'nav.main': 'मुख्य मेनू',
    'nav.system': 'सिस्टम',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.members': 'सदस्य',
    'nav.orgChart': 'संगठन चार्ट',
    'nav.chandaDonations': 'चंदा और दान',
    'nav.expenses': 'खर्च',
    'nav.inventory': 'इन्वेंटरी',
    'nav.analytics': 'विश्लेषण',
    'nav.broadcasts': 'घोषणाएँ',
    'nav.pujaEditions': 'पूजा संस्करण',
    'nav.roleManagement': 'भूमिका प्रबंधन',
    'nav.settings': 'सेटिंग्स',
    'auth.adminPortal': 'एडमिन पोर्टल',
    'auth.memberSync': 'सदस्य सिंक',
    'auth.emailAddress': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.phoneNumber': 'फोन नंबर',
    'auth.accessDashboard': 'डैशबोर्ड खोलें',
    'auth.memberLogin': 'सदस्य लॉगिन',
    'auth.adminLogin': 'एडमिन लॉगिन',
    'auth.registerCommittee': 'समिति पंजीकरण',
    'form.save': 'सेव करें',
    'form.cancel': 'रद्द करें',
    'form.delete': 'हटाएँ',
    'form.search': 'खोजें',
    'form.copy': 'कॉपी करें',
    'common.loading': 'लोड हो रहा है...',
    'common.approved': 'स्वीकृत',
    'common.pending': 'लंबित',
    'dashboard.totalDonations': 'कुल दान',
    'dashboard.totalChanda': 'कुल चंदा',
    'dashboard.totalExpenses': 'कुल खर्च',
    'dashboard.memberCount': 'सदस्य संख्या',
  },
  bn: {
    'language.label': 'ভাষা',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.members': 'সদস্য',
    'nav.chandaDonations': 'চাঁদা ও দান',
    'nav.expenses': 'খরচ',
    'nav.inventory': 'ইনভেন্টরি',
    'nav.analytics': 'বিশ্লেষণ',
    'nav.broadcasts': 'বার্তা',
    'nav.settings': 'সেটিংস',
    'auth.adminPortal': 'অ্যাডমিন পোর্টাল',
    'auth.memberLogin': 'সদস্য লগইন',
    'auth.registerCommittee': 'কমিটি নিবন্ধন',
  },
  ta: {
    'language.label': 'மொழி',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.members': 'உறுப்பினர்கள்',
    'nav.chandaDonations': 'சந்தா மற்றும் நன்கொடை',
    'nav.expenses': 'செலவுகள்',
    'nav.inventory': 'சரக்கு',
    'nav.analytics': 'பகுப்பாய்வு',
    'nav.broadcasts': 'அறிவிப்புகள்',
    'nav.settings': 'அமைப்புகள்',
    'auth.adminPortal': 'நிர்வாக போர்டல்',
    'auth.memberLogin': 'உறுப்பினர் உள்நுழைவு',
    'auth.registerCommittee': 'குழு பதிவு',
  },
  te: {
    'language.label': 'భాష',
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    'nav.members': 'సభ్యులు',
    'nav.chandaDonations': 'చందా మరియు విరాళాలు',
    'nav.expenses': 'ఖర్చులు',
    'nav.inventory': 'ఇన్వెంటరీ',
    'nav.analytics': 'విశ్లేషణ',
    'nav.broadcasts': 'ప్రకటనలు',
    'nav.settings': 'సెట్టింగ్స్',
    'auth.adminPortal': 'అడ్మిన్ పోర్టల్',
    'auth.memberLogin': 'సభ్యుల లాగిన్',
    'auth.registerCommittee': 'సమితి నమోదు',
  },
  mr: {
    'language.label': 'भाषा',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.members': 'सदस्य',
    'nav.chandaDonations': 'चंदा आणि देणगी',
    'nav.expenses': 'खर्च',
    'nav.inventory': 'इन्व्हेंटरी',
    'nav.analytics': 'विश्लेषण',
    'nav.broadcasts': 'घोषणा',
    'nav.settings': 'सेटिंग्ज',
    'auth.adminPortal': 'ॲडमिन पोर्टल',
    'auth.memberLogin': 'सदस्य लॉगिन',
    'auth.registerCommittee': 'समिती नोंदणी',
  },
  gu: {
    'language.label': 'ભાષા',
    'nav.dashboard': 'ડેશબોર્ડ',
    'nav.members': 'સભ્યો',
    'nav.chandaDonations': 'ચંદા અને દાન',
    'nav.expenses': 'ખર્ચ',
    'nav.inventory': 'ઇન્વેન્ટરી',
    'nav.analytics': 'વિશ્લેષણ',
    'nav.broadcasts': 'જાહેરાતો',
    'nav.settings': 'સેટિંગ્સ',
    'auth.adminPortal': 'એડમિન પોર્ટલ',
    'auth.memberLogin': 'સભ્ય લોગિન',
    'auth.registerCommittee': 'સમિતિ નોંધણી',
  },
  kn: {
    'language.label': 'ಭಾಷೆ',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.members': 'ಸದಸ್ಯರು',
    'nav.chandaDonations': 'ಚಂದಾ ಮತ್ತು ದೇಣಿಗೆ',
    'nav.expenses': 'ಖರ್ಚುಗಳು',
    'nav.inventory': 'ಇನ್‌ವೆಂಟರಿ',
    'nav.analytics': 'ವಿಶ್ಲೇಷಣೆ',
    'nav.broadcasts': 'ಪ್ರಕಟಣೆಗಳು',
    'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'auth.adminPortal': 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್',
    'auth.memberLogin': 'ಸದಸ್ಯ ಲಾಗಿನ್',
    'auth.registerCommittee': 'ಸಮಿತಿ ನೋಂದಣಿ',
  },
  ml: {
    'language.label': 'ഭാഷ',
    'nav.dashboard': 'ഡാഷ്ബോർഡ്',
    'nav.members': 'അംഗങ്ങൾ',
    'nav.chandaDonations': 'ചന്ദയും സംഭാവനയും',
    'nav.expenses': 'ചെലവുകൾ',
    'nav.inventory': 'ഇൻവെന്ററി',
    'nav.analytics': 'വിശകലനം',
    'nav.broadcasts': 'അറിയിപ്പുകൾ',
    'nav.settings': 'ക്രമീകരണങ്ങൾ',
    'auth.adminPortal': 'അഡ്മിൻ പോർട്ടൽ',
    'auth.memberLogin': 'അംഗ ലോഗിൻ',
    'auth.registerCommittee': 'സമിതി രജിസ്ട്രേഷൻ',
  },
  or: {
    'language.label': 'ଭାଷା',
    'nav.dashboard': 'ଡ୍ୟାଶବୋର୍ଡ',
    'nav.members': 'ସଦସ୍ୟ',
    'nav.chandaDonations': 'ଚାନ୍ଦା ଓ ଦାନ',
    'nav.expenses': 'ଖର୍ଚ୍ଚ',
    'nav.inventory': 'ଇନଭେଣ୍ଟରୀ',
    'nav.analytics': 'ବିଶ୍ଳେଷଣ',
    'nav.broadcasts': 'ଘୋଷଣା',
    'nav.settings': 'ସେଟିଂସ୍',
    'auth.adminPortal': 'ଆଡମିନ ପୋର୍ଟାଲ',
    'auth.memberLogin': 'ସଦସ୍ୟ ଲଗଇନ',
    'auth.registerCommittee': 'ସମିତି ପଞ୍ଜିକରଣ',
  },
  pa: {
    'language.label': 'ਭਾਸ਼ਾ',
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.members': 'ਮੈਂਬਰ',
    'nav.chandaDonations': 'ਚੰਦਾ ਅਤੇ ਦਾਨ',
    'nav.expenses': 'ਖਰਚੇ',
    'nav.inventory': 'ਇਨਵੈਂਟਰੀ',
    'nav.analytics': 'ਵਿਸ਼ਲੇਸ਼ਣ',
    'nav.broadcasts': 'ਐਲਾਨ',
    'nav.settings': 'ਸੈਟਿੰਗਾਂ',
    'auth.adminPortal': 'ਐਡਮਿਨ ਪੋਰਟਲ',
    'auth.memberLogin': 'ਮੈਂਬਰ ਲਾਗਇਨ',
    'auth.registerCommittee': 'ਸਮਿਤੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
  },
  as: {
    'language.label': 'ভাষা',
    'nav.dashboard': 'ডেশ্বব’ৰ্ড',
    'nav.members': 'সদস্য',
    'nav.chandaDonations': 'চাঁদা আৰু দান',
    'nav.expenses': 'খৰচ',
    'nav.inventory': 'ইনভেণ্টৰি',
    'nav.analytics': 'বিশ্লেষণ',
    'nav.broadcasts': 'ঘোষণা',
    'nav.settings': 'ছেটিংছ',
    'auth.adminPortal': 'এডমিন পোৰ্টেল',
    'auth.memberLogin': 'সদস্য লগইন',
    'auth.registerCommittee': 'সমিতি পঞ্জীয়ন',
  },
  ur: {
    'language.label': 'زبان',
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.members': 'اراکین',
    'nav.chandaDonations': 'چندہ اور عطیات',
    'nav.expenses': 'اخراجات',
    'nav.inventory': 'انوینٹری',
    'nav.analytics': 'تجزیات',
    'nav.broadcasts': 'اعلانات',
    'nav.settings': 'ترتیبات',
    'auth.adminPortal': 'ایڈمن پورٹل',
    'auth.memberLogin': 'رکن لاگ ان',
    'auth.registerCommittee': 'سمیتی رجسٹریشن',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function isLanguageCode(value: string | null): value is LanguageCode {
  return LANGUAGES.some(language => language.code === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLanguageCode(saved) ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t: (key, params) => {
      let translation = translations[language]?.[key] || translations.en[key] || key;
      if (params) {
        for (const [param, paramValue] of Object.entries(params)) {
          translation = translation.replace(`{{${param}}}`, String(paramValue));
        }
      }
      return translation;
    },
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

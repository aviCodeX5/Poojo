import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'PujaCommittee',
    'app.tagline': 'Committee Management System',
    'loading': 'Loading...',
    'error.required': 'This field is required',
    'error.invalid': 'Invalid input',
    'error.network': 'Network error. Please try again.',
    'success.saved': 'Saved successfully',
    'success.updated': 'Updated successfully',
    'success.deleted': 'Deleted successfully',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.members': 'Members',
    'nav.chanda': 'Chanda',
    'nav.donations': 'Donations',
    'nav.expenses': 'Expenses',
    'nav.inventory': 'Inventory',
    'nav.cultural': 'Cultural',
    'nav.analytics': 'Analytics',
    'nav.broadcasts': 'Broadcasts',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.phone': 'Phone Number',
    'auth.adminLogin': 'Admin Login',
    'auth.memberLogin': 'Member Login',
    'auth.forgotPassword': 'Forgot Password?',
    
    // Forms
    'form.name': 'Name',
    'form.address': 'Address',
    'form.amount': 'Amount',
    'form.date': 'Date',
    'form.notes': 'Notes',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.edit': 'Edit',
    'form.delete': 'Delete',
    'form.search': 'Search',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalDonations': 'Total Donations',
    'dashboard.totalChanda': 'Total Chanda',
    'dashboard.totalExpenses': 'Total Expenses',
    'dashboard.memberCount': 'Member Count',
    'dashboard.netSurplus': 'Net Surplus',
    'dashboard.recentActivity': 'Recent Activity',
    
    // Chanda
    'chanda.title': 'Chanda Ledger',
    'chanda.recordCollection': 'Record Collection',
    'chanda.donorName': 'Donor Name',
    'chanda.donorPhone': 'Donor Phone',
    'chanda.approved': 'Approved',
    'chanda.pending': 'Pending',
    'chanda.receiptNumber': 'Receipt Number',
    
    // Donations
    'donations.title': 'Donations & Sponsors',
    'donations.addDonation': 'Add Donation',
    'donations.donorName': 'Donor Name',
    'donations.donationType': 'Donation Type',
    'donations.receipt': 'Receipt',
    
    // Expenses
    'expenses.title': 'Expense Ledger',
    'expenses.addExpense': 'Add Expense',
    'expenses.category': 'Category',
    'expenses.vendor': 'Vendor',
    'expenses.reason': 'Reason',
    'expenses.billPhoto': 'Bill Photo',
    
    // Analytics
    'analytics.title': 'Smart Analytics',
    'analytics.insights': 'Insights',
    'analytics.financialOverview': 'Financial Overview',
    'analytics.expenseCategories': 'Expense Categories',
    'analytics.budgetHealth': 'Budget Health',
    
    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    
    // Messages
    'msg.confirmDelete': 'Are you sure you want to delete this item?',
    'msg.deleteSuccess': 'Item deleted successfully',
    'msg.saveSuccess': 'Item saved successfully',
    'msg.networkError': 'Network error. Please try again.',
    'msg.unauthorized': 'You are not authorized to perform this action.',
    
    // Roles
    'role.admin': 'Admin',
    'role.secretary': 'Secretary',
    'role.jointSecretary': 'Joint Secretary',
    'role.cashier': 'Cashier',
    'role.lightIncharge': 'Light Incharge',
    'role.pandalIncharge': 'Pandal Incharge',
    'role.donationIncharge': 'Donation Incharge',
    'role.chandaIncharge': 'Chanda Incharge',
    'role.visarjanIncharge': 'Visarjan Incharge',
    'role.culturalIncharge': 'Cultural Incharge',
    'role.mandapIncharge': 'Mandap Incharge',
    'role.chandaVolunteer': 'Chanda Volunteer',
    'role.member': 'Member',
  },
  
  hi: {
    // Common
    'app.name': 'पूजासमिति',
    'app.tagline': 'समिति प्रबंधन प्रबंधन तंत्र',
    'loading': 'लोड हो रहा है...',
    'error.required': 'यह फ़ील्ड आवश्यक है',
    'error.invalid': 'अमान्य इनपुट',
    'error.network': 'नेटवर्क त्रुटि। कृपया करें।',
    'success.saved': 'सफलतापूर्वक सहेजा गया',
    'success.updated': 'सफलतापूर्वक अपडेट किया गया',
    'success.deleted': 'सफलतापूर्वक हटा दिया गया',
    
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.members': 'सदस्य',
    'nav.chanda': 'चंदा',
    'nav.donations': 'दान',
    'nav.expenses': 'खर्च',
    'nav.inventory': 'इन्वेंटरी',
    'nav.cultural': 'सांस्कृतिक',
    'nav.analytics': 'विश्लेषण',
    'nav.broadcasts': 'घोषणा',
    'nav.settings': 'सेटिंग्स',
    'nav.logout': 'लॉगआउट',
    
    // Auth
    'auth.login': 'लॉगिन',
    'auth.register': 'रजिस्टर',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.phone': 'फोन नंबर',
    'auth.adminLogin': 'एडमिन लॉगिन',
    'auth.memberLogin': 'सदस्य लॉगिन',
    'auth.forgotPassword': 'पासवर्ड भूल गया?',
    
    // Forms
    'form.name': 'नाम',
    'form.address': 'पता',
    'form.amount': 'राशि',
    'form.date': 'तिथि',
    'form.notes': 'टिप्पणियाँ',
    'form.save': 'सेव करें',
    'form.cancel': 'रद्द करें',
    'form.edit': 'संपादित करें',
    'form.delete': 'हटाएं',
    'form.search': 'खोजें',
    
    // Dashboard
    'dashboard.title': 'डैशबोर्ड',
    'dashboard.totalDonations': 'कुल दान',
    'dashboard.totalChanda': 'कुल चंदा',
    'dashboard.totalExpenses': 'कुल खर्च',
    'dashboard.memberCount': 'सदस्य संख्या',
    'dashboard.netSurplus': 'शुद्ध लाभ',
    'dashboard.recentActivity': 'हाल की गतिविधियाँ',
    
    // Chanda
    'chanda.title': 'चंदा लेजर',
    'chanda.recordCollection': 'संग्रहण दर्ज करें',
    'chanda.donorName': 'दाता का नाम',
    'chanda.donorPhone': 'दाता का फोन',
    'chanda.approved': 'स्वीकृत',
    'chanda.pending': 'लंबित',
    'chanda.receiptNumber': 'रसीद नंबर',
    
    // Donations
    'donations.title': 'दान और प्रायोजक',
    'donations.addDonation': 'दान जोड़ें',
    'donations.donorName': 'दाता का नाम',
    'donations.donationType': 'दान प्रकार',
    'donations.receipt': 'रसीद',
    
    // Expenses
    'expenses.title': 'खर्च लेजर',
    'expenses.addExpense': 'खर्च जोड़ें',
    'expenses.category': 'श्रेणी',
    'expenses.vendor': 'विक्रेता',
    'expenses.reason': 'कारण',
    'expenses.billPhoto': 'बिल फोटो',
    
    // Analytics
    'analytics.title': 'स्मार्ट विश्लेषण',
    'analytics.insights': 'अंतर्दृष्टि',
    'analytics.financialOverview': 'वित्तीय अवलोकन',
    'analytics.expenseCategories': 'खर्च श्रेणियाँ',
    'analytics.budgetHealth': 'बजट स्वास्थ्य',
    
    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.general': 'सामान्य',
    'settings.security': 'सुरक्षा',
    'settings.notifications': 'सूचनाएँ',
    'settings.language': 'भाषा',
    'settings.theme': 'थीम',
    
    // Messages
    'msg.confirmDelete': 'क्या आप इस आइटम को हटाना चाहते हैं?',
    'msg.deleteSuccess': 'आइटम सफलतापूर्वक हटा दिया गया',
    'msg.saveSuccess': 'आइटम सफलतापूर्वक सहेजा गया',
    'msg.networkError': 'नेटवर्क त्रुटि। कृपया करें।',
    'msg.unauthorized': 'आपको यह कार्य करने की अनुमति नहीं है।',
    
    // Roles
    'role.admin': 'एडमिन',
    'role.secretary': 'सचिव',
    'role.jointSecretary': 'संयुक्त सचिव',
    'role.cashier': 'कैशियर',
    'role.lightIncharge': 'लाइट इंचार्ज',
    'role.pandalIncharge': 'पंडाल इंचार्ज',
    'role.donationIncharge': 'दान इंचार्ज',
    'role.chandaIncharge': 'चंदा इंचार्ज',
    'role.visarjanIncharge': 'विसर्जन इंचार्ज',
    'role.culturalIncharge': 'सांस्कृतिक इंचार्ज',
    'role.mandapIncharge': 'मंडप इंचार्ज',
    'role.chandaVolunteer': 'चंदा स्वयंसेवक',
    'role.member': 'सदस्य',
  },
  
  bn: {
    // Bengali translations
    'app.name': 'পূজাসমিতি',
    'app.tagline': 'কমিটি পরিচালনা ব্যবস্থা',
    'loading': 'লোড হচ্ছে...',
    'error.required': 'এই ফিল্ডটি আবশ্যক',
    'error.invalid': 'অবৈধ ইনপুট',
    'error.network': 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।',
    'success.saved': 'সফলতাফুর্ভভাবে সংরক্ষিত',
    'success.updated': 'সফলতাফুর্ভাবে আপডেট করা হয়েছে',
    'success.deleted': 'সফলতাফুর্ভাবে মুছে ফেলা হয়েছে',
    
    // Add more Bengali translations as needed...
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.members': 'সদস্য',
    'nav.chanda': 'চাঁদা',
    'nav.donations': 'দান',
    'nav.expenses': 'খরচ',
    'nav.inventory': 'ইনভেন্টরি',
    'nav.cultural': 'সাংস্কৃতিক',
    'nav.analytics': 'বিশ্লেষণ',
    'nav.broadcasts': 'সম্প্রকাশন',
    'nav.settings': 'সেটিংস',
    'nav.logout': 'লগআউট',
    
    'form.name': 'নাম',
    'form.address': 'ঠিকানা',
    'form.amount': 'পরিমাণ',
    'form.save': 'সংরক্ষণ করুন',
    'form.cancel': 'বাতিল',
    'form.edit': 'সম্পাদনা',
    'form.delete': 'মুছে ফেলুন',
    
    // Dashboard
    'dashboard.title': 'ড্যাশবোর্ড',
    'dashboard.totalDonations': 'মোট দান',
    'dashboard.totalChanda': 'মোট চাঁদা',
    'dashboard.totalExpenses': 'মোট খরচ',
    'dashboard.memberCount': 'সদস্য সংখ্যা',
    'dashboard.netSurplus': 'নিট উদ্বক্তি',
    
    // Chanda
    'chanda.title': 'চাঁদা লেজার',
    'chanda.recordCollection': 'সংগ্রহণ রেকর্ড করুন',
    'chanda.donorName': 'দাতার নাম',
    'chanda.approved': 'অনুমোদিত',
    'chanda.pending': 'মুলতুই',
    
    // Add more Bengali translations...
  },
  
  ta: {
    // Tamil translations
    'app.name': 'பூஜைகமிட்டி',
    'app.tagline': 'குழுவன் மேலாண்முறை மேலாணமுறை',
    'loading': 'ஏறுகிறப்பது...',
    'error.required': 'இந்து புலம் தேவைக்கப்படும்',
    'error.invalid': 'தவறுப்படு உள்ளீட்',
    'error.network': 'நெட்வொர்க் பிழை. மீண்டும் முயற்சுக.',
    'success.saved': 'வெற்றிப்படும் சேமிக்கப்படும்',
    'success.updated': 'வெற்றிப்படும் புதுப்படும்',
    'success.deleted': 'வெற்றிப்படும் நீக்கப்படும்',
    
    // Add more Tamil translations...
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.members': 'உறுபியர்கள்',
    'nav.chanda': 'சண்டா',
    'nav.donations': 'தர்மானங்கள்',
    'nav.expenses': 'செலவுகள்',
    'nav.inventory': 'பண்டூப்பனர்',
    'nav.cultural': 'கலாச்சார நிகழ்வுகள்',
    'nav.analytics': 'பகுப்பனவியல்',
    'nav.broadcasts': 'அறிவிப்பனங்கள்',
    'nav.settings': 'அமைப்பாடுகள்',
    
    'form.name': 'பெயர்',
    'form.address': 'முகவிடம்',
    'form.amount': 'தொகை',
    'form.save': 'சேமிக்க',
    'form.cancel': 'ரத்து',
    
    // Dashboard
    'dashboard.title': 'டாஷ்போர்டு',
    'dashboard.totalDonations': 'மொத்த தர்மானங்கள்',
    'dashboard.totalChanda': 'மொத்த சண்டா',
    'dashboard.totalExpenses': 'மொத்த செலவுகள்',
    'dashboard.memberCount': 'உறுபியர்கள் எண்ணிக்கை',
    
    // Chanda
    'chanda.title': 'சண்டா பதிவுபுகள்',
    'chanda.recordCollection': 'சேகர பதிவு',
    
    // Add more Tamil translations...
  },
  
  te: {
    // Telugu translations
    'app.name': 'పూజాకమిటీ',
    'app.tagline': 'కమిటీ నిర్వహణ నిర్వహణ వ్యవస్థం',
    'loading': 'లోడ్ అవుతోంది...',
    'error.required': 'ఈ ఫీల్డ్ అవసరకం',
    'error.invalid': 'చెల్ల నమోదు',
    'error.network': 'నెట్‌వర్క్ లోపలి. దయచేసి చూడండి.',
    'success.saved': 'విజయవంగా సేవ్ చేయబడింది',
    'success.updated': 'విజయవంగా నవీకరించేయబడింది',
    'success.deleted': 'విజయవంగా తొలగించేయబడింది',
    
    // Add more Telugu translations...
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.members': 'సభ్యులు',
    'nav.chanda': 'చండా',
    'nav.donations': 'విరధానాలు',
    'nav.expenses': 'ఖర్చాలు',
    'nav.inventory': 'ఇన్వెంటరీ',
    'nav.cultural': 'సాంస్కృతిక',
    'nav.analytics': 'విశ్లేషణలు',
    'nav.broadcasts': 'ప్రసంలేలలు',
    'nav.settings': 'సెట్టింగ్స్',
    
    'form.name': 'పేరు',
    'form.address': 'చిరునా',
    'form.amount': 'మొత్తం',
    'form.save': 'సేవ్ చేయండి',
    'form.cancel': 'రద్దు',
    
    // Dashboard
    'dashboard.title': 'డాష్‌బోర్డ్',
    'dashboard.totalDonations': 'మొత్త విరధానాలు',
    'dashboard.totalChanda': 'మొత్త చండా',
    'dashboard.totalExpenses': 'మొత్త ఖర్చాలు',
    'dashboard.memberCount': 'సభ్యుల సంఖ్య',
    
    // Chanda
    'chanda.title': 'చండా పుస్తక్లు',
    'chanda.recordCollection': 'సేకరాణ నమోదు',
    
    // Add more Telugu translations...
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage for saved language
    const savedLanguage = localStorage.getItem('puja-committee-language');
    return (savedLanguage as Language) || 'en';
  });

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem('puja-committee-language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || key;
    
    // Replace parameters in translation string
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

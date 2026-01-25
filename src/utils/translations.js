/**
 * Translation System
 * Supports English and Arabic (Sudan's native language)
 */

export const translations = {
  en: {
    // App
    appName: 'VoltEdge',
    loading: 'Loading...',
    error: 'Error',
    
    // Home Screen
    home: 'Home',
    infrastructureStatus: 'Infrastructure Status',
    realTimeMonitoring: 'Real-time monitoring of water and power systems',
    totalAssets: 'Total Assets',
    failed: 'Failed',
    atRisk: 'At Risk',
    pendingActions: 'Pending Actions',
    viewMap: 'View Map',
    keyCapabilities: 'Key Capabilities',
    dependencyAwareMap: 'Dependency-Aware City Map',
    cascadingFailure: 'Cascading Failure System',
    interventionRanking: 'Intervention Ranking Engine',
    survivalWaterMode: 'Minimum Survival Water Mode',
    facilityTimers: 'Facility-Collapse Timers',
    offlineFunctionality: 'Offline Functionality',
    
    // Map Screen
    sudanMap: 'Sudan Map',
    online: 'Online',
    offline: 'Offline',
    showPriorityList: 'Show Priority List',
    hidePriorityList: 'Hide Priority List',
    interventionPriority: 'Intervention Priority',
    topFacilities: 'Top {count} facilities',
    
    // Facility Types
    type: 'Type',
    water: 'Water',
    power: 'Power',
    shelter: 'Shelter',
    food: 'Food',
    
    // Status
    status: 'Status',
    operational: 'Operational',
    failed: 'Failed',
    atRisk: 'At Risk',
    
    // Facility Modal
    reportProblem: 'Report Problem',
    close: 'Close',
    priorityPoints: 'Priority Points',
    
    // Report Modal
    facilityCondition: 'Facility Condition',
    supplyAmount: 'Supply Amount',
    populationAmount: 'Population Amount',
    facilityImportance: 'Facility Importance',
    cancel: 'Cancel',
    submitReport: 'Submit Report',
    
    // Conditions
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    bad: 'Bad',
    
    // Amounts
    veryHigh: 'Very High',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    veryLow: 'Very Low',
    
    // Importance
    veryImportant: 'Very Important',
    important: 'Important',
    moderate: 'Moderate',
    notImportant: 'Not Important',
    
    // Points
    points: 'points',
    pts: 'pts',
  },
  ar: {
    // Arabic translations
    appName: 'فولت إيدج',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    
    home: 'الرئيسية',
    infrastructureStatus: 'حالة البنية التحتية',
    realTimeMonitoring: 'مراقبة فورية لأنظمة المياه والطاقة',
    totalAssets: 'إجمالي الأصول',
    failed: 'فاشل',
    atRisk: 'معرض للخطر',
    pendingActions: 'إجراءات معلقة',
    viewMap: 'عرض الخريطة',
    keyCapabilities: 'القدرات الرئيسية',
    dependencyAwareMap: 'خريطة المدينة مع الوعي بالتبعيات',
    cascadingFailure: 'نظام الفشل المتتالي',
    interventionRanking: 'محرك ترتيب التدخل',
    survivalWaterMode: 'وضع الحد الأدنى لمياه البقاء',
    facilityTimers: 'مؤقتات انهيار المنشآت',
    offlineFunctionality: 'وظائف بدون اتصال',
    
    sudanMap: 'خريطة السودان',
    online: 'متصل',
    offline: 'غير متصل',
    showPriorityList: 'إظهار قائمة الأولويات',
    hidePriorityList: 'إخفاء قائمة الأولويات',
    interventionPriority: 'أولوية التدخل',
    topFacilities: 'أفضل {count} منشأة',
    
    type: 'النوع',
    water: 'مياه',
    power: 'طاقة',
    shelter: 'ملجأ',
    food: 'طعام',
    
    status: 'الحالة',
    operational: 'تعمل',
    failed: 'فاشلة',
    atRisk: 'معرضة للخطر',
    
    reportProblem: 'الإبلاغ عن مشكلة',
    close: 'إغلاق',
    priorityPoints: 'نقاط الأولوية',
    
    facilityCondition: 'حالة المنشأة',
    supplyAmount: 'كمية الإمداد',
    populationAmount: 'كمية السكان',
    facilityImportance: 'أهمية المنشأة',
    cancel: 'إلغاء',
    submitReport: 'إرسال التقرير',
    
    excellent: 'ممتاز',
    good: 'جيد',
    fair: 'عادل',
    poor: 'ضعيف',
    bad: 'سيء',
    
    veryHigh: 'عالية جداً',
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
    veryLow: 'منخفضة جداً',
    
    veryImportant: 'مهم جداً',
    important: 'مهم',
    moderate: 'معتدل',
    notImportant: 'غير مهم',
    
    points: 'نقاط',
    pts: 'نقاط',
  },
};

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {string} language - Language code ('en' or 'ar')
 * @param {object} params - Parameters to replace in translation
 * @returns {string} Translated text
 */
export const t = (key, language = 'en', params = {}) => {
  const lang = translations[language] || translations.en;
  let text = lang[key] || translations.en[key] || key;
  
  // Replace parameters like {count}
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
};

// Note: useLanguage hook is in LanguageContext.js

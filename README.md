# حاسبة الاستثمار العقاري

تطبيق حاسبة استثمار عقاري احترافي باللغة العربية ويدعم اتجاه RTL. يحتوي المستودع على نسختين:

- نسخة Web جاهزة للنشر على Vercel في جذر المشروع.
- نسخة iOS SwiftUI داخل `RealEstateInvestmentCalculator/` وملف Xcode project.

الواجهة مصممة كتجربة Wizard خطوة بخطوة ومناسبة للاستخدام المهني على الهاتف.

## النشر على Vercel

النسخة الأساسية المطلوبة لـ Vercel موجودة في الملفات:

- `index.html`
- `styles.css`
- `app.js`
- `vercel.json`
- `package.json`

طريقة النشر:

1. ارفع المستودع إلى GitHub.
2. افتح Vercel واختر **New Project**.
3. اختر المستودع.
4. اترك إعدادات Build كما هي؛ التطبيق Static ولا يحتاج Framework.
5. اضغط **Deploy**.

يمكن أيضاً التشغيل محلياً بأي خادم static، مثل:

```bash
npx serve .
```

أو عبر Vercel CLI:

```bash
vercel dev
```

## طريقة التشغيل

### نسخة الويب

افتح `index.html` مباشرة في المتصفح أو شغّل خادم static. زر **تصدير تقرير PDF** يفتح نافذة الطباعة لحفظ التقرير بصيغة PDF.

### نسخة iOS

1. افتح الملف `RealEstateInvestmentCalculator.xcodeproj` باستخدام Xcode 16 أو أحدث.
2. اختر محاكي iPhone 13 Pro Max أو جهاز iPhone فعلي.
3. شغّل التطبيق من Scheme باسم `RealEstateInvestmentCalculator`.

> يتطلب المشروع iOS 17.0 أو أحدث لاستخدام SwiftUI Charts مع Pie Chart عبر `SectorMark`.

## أهم المميزات

- واجهة عربية بالكامل مع دعم RTL.
- اختيار نوع العقار من بطاقات واضحة.
- إدخال تكاليف الأرض، البناء، التطوير، الإيرادات، المصاريف، والتمويل البنكي الاختياري.
- تحقق من المدخلات ومنع القيم السالبة.
- حساب مؤشرات مالية فعلية مثل NOI وROI وYield on Cost وPayback وDSCR.
- Dashboard احترافي ببطاقات KPIs.
- رسوم بيانية داخل التطبيق:
  - Pie Chart لتوزيع تكلفة المشروع.
  - Bar Chart لمقارنة الإيراد والمصاريف وNOI وصافي الدخل بعد التمويل.
  - Line Chart للتدفقات النقدية لعشر سنوات.
- تصدير تقرير PDF احترافي باللغة العربية يتضمن الغلاف، الجداول، التوصية، والملاحظة القانونية.
- مشاركة التقرير مباشرة من داخل التطبيق.

## هيكل الملفات

- `Models/`
  - `PropertyType.swift`
  - `InvestmentInput.swift`
  - `FinancingInput.swift`
  - `CalculationResult.swift`
- `ViewModels/`
  - `InvestmentCalculatorViewModel.swift`
- `Views/`
  - `SplashView.swift`
  - `PropertyTypeSelectionView.swift`
  - `LandInputView.swift`
  - `DevelopmentCostView.swift`
  - `RevenueInputView.swift`
  - `OperatingExpensesView.swift`
  - `FinancingView.swift`
  - `ResultsDashboardView.swift`
  - `ChartsView.swift`
  - `PDFPreviewView.swift`
- `Services/`
  - `InvestmentCalculatorService.swift`
  - `PDFExportService.swift`
  - `NumberFormatterService.swift`
- `Components/`
  - `LuxuryCard.swift`
  - `PrimaryButton.swift`
  - `InputField.swift`
  - `KPIResultCard.swift`
  - `SectionHeader.swift`
  - `DesignSystem.swift`

## المعادلات المستخدمة

إجمالي قيمة الأرض:

```text
مساحة الأرض × سعر المتر
```

إجمالي تكلفة تملك الأرض:

```text
قيمة الأرض + رسوم السعي + ضريبة التصرفات العقارية + الرسوم الأخرى
```

إجمالي تكلفة التطوير:

```text
تكلفة البناء والتطوير المباشرة + احتياطي المخاطر
```

إجمالي تكلفة المشروع:

```text
إجمالي تكلفة الأرض + إجمالي تكلفة التطوير
```

الإيراد السنوي:

```text
الإيراد الشهري × 12 × نسبة الإشغال
```

للعقار الفندقي:

```text
عدد الغرف × ADR × أيام التشغيل × نسبة الإشغال + الإيرادات الإضافية
```

NOI:

```text
الإيراد السنوي - المصاريف التشغيلية السنوية
```

Yield on Cost:

```text
NOI ÷ إجمالي تكلفة المشروع × 100
```

ROI:

```text
صافي الدخل السنوي بعد التمويل ÷ إجمالي تكلفة المشروع × 100
```

Payback Period:

```text
إجمالي تكلفة المشروع ÷ صافي الدخل السنوي
```

القسط الثابت للتمويل:

```text
PMT = P × (r × (1 + r)^n) ÷ ((1 + r)^n - 1)
```

DSCR:

```text
NOI ÷ خدمة الدين السنوية
```

## منطق التقييم

- أقل من 6٪: ضعيف.
- من 6٪ إلى أقل من 8٪: متوسط.
- من 8٪ إلى أقل من 10٪: جيد.
- 10٪ فأكثر: ممتاز.

## تصدير PDF

من شاشة النتائج اضغط زر **تصدير تقرير PDF**. يقوم التطبيق بإنشاء تقرير يحتوي على:

- صفحة غلاف.
- تاريخ إنشاء التقرير ونوع العقار.
- ملخص تنفيذي.
- جداول المدخلات والتكاليف والإيرادات والمصاريف والتمويل.
- جدول المؤشرات النهائية.
- رسوم بيانية.
- توصية مختصرة حسب نتيجة العائد.
- ملاحظة: "هذا التقرير تقديري ولا يغني عن الدراسة المالية والهندسية التفصيلية."

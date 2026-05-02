import SwiftUI

struct ResultsDashboardView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel
    private let formatter = NumberFormatterService.shared

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(title: "لوحة النتائج", subtitle: "ملخص مالي تنفيذي للمشروع العقاري مع المؤشرات الأساسية والرسوم البيانية.", stepText: "المرحلة 7 من 7")

            LuxuryCard {
                HStack(spacing: 16) {
                    VStack(alignment: .trailing, spacing: 7) {
                        Text("تقييم الاستثمار")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(LuxuryTheme.muted)
                        Text(viewModel.result.rating.rawValue)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(LuxuryTheme.gold)
                    }
                    Spacer()
                    Image(systemName: ratingIcon)
                        .font(.system(size: 42, weight: .bold))
                        .foregroundStyle(LuxuryTheme.gold)
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                KPIResultCard(title: "إجمالي تكلفة الأرض", value: formatter.currency(viewModel.result.totalLandCost), icon: "map.fill")
                KPIResultCard(title: "تكلفة البناء والتطوير", value: formatter.currency(viewModel.result.totalDevelopmentCost), icon: "hammer.fill")
                KPIResultCard(title: "إجمالي تكلفة المشروع", value: formatter.currency(viewModel.result.totalProjectCost), icon: "building.2.fill", highlight: true)
                KPIResultCard(title: "الإيراد السنوي", value: formatter.currency(viewModel.result.annualRevenue), icon: "banknote.fill")
                KPIResultCard(title: "المصاريف التشغيلية", value: formatter.currency(viewModel.result.operatingExpenses), icon: "wrench.adjustable.fill")
                KPIResultCard(title: "NOI", value: formatter.currency(viewModel.result.noi), icon: "chart.line.uptrend.xyaxis", highlight: true)
                KPIResultCard(title: "الدخل بعد التمويل", value: formatter.currency(viewModel.result.netIncomeAfterFinancing), icon: "creditcard.fill")
                KPIResultCard(title: "Yield on Cost", value: formatter.percent(viewModel.result.yieldOnCost), icon: "percent", highlight: true)
                KPIResultCard(title: "ROI", value: formatter.percent(viewModel.result.roi), icon: "arrow.up.right")
                KPIResultCard(title: "فترة الاسترداد", value: "\(formatter.number(viewModel.result.paybackPeriod)) سنة", icon: "clock.fill")
                KPIResultCard(title: "القسط الشهري", value: formatter.currency(viewModel.result.monthlyDebtService), icon: "calendar")
                KPIResultCard(title: "DSCR", value: viewModel.result.dscr.map { formatter.number($0) } ?? "لا يوجد", icon: "gauge.with.dots.needle.67percent")
                KPIResultCard(title: "نقطة التعادل", value: formatter.percent(viewModel.result.breakEvenOccupancy), icon: "equal.circle.fill")
            }

            ChartsView(viewModel: viewModel)

            PDFPreviewView(viewModel: viewModel)

            VStack(spacing: 10) {
                SecondaryButton(title: "السابق", icon: "arrow.right", action: viewModel.previous)
                SecondaryButton(title: "إعادة الحساب", icon: "arrow.clockwise", action: viewModel.restart)
            }
        }
        .onAppear { viewModel.recalculate() }
    }

    private var ratingIcon: String {
        switch viewModel.result.rating {
        case .excellent: return "crown.fill"
        case .good: return "hand.thumbsup.fill"
        case .average: return "minus.circle.fill"
        case .weak: return "exclamationmark.triangle.fill"
        }
    }
}

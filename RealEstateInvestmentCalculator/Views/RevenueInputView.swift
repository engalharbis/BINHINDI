import SwiftUI

struct RevenueInputView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(title: "الإيرادات المتوقعة", subtitle: "تتغير المسميات حسب نوع العقار المختار.", stepText: "المرحلة 4 من 7")
            LuxuryCard {
                VStack(spacing: 14) {
                    InputField(viewModel.input.propertyType.unitLabel, value: $viewModel.input.unitsCount)
                    InputField(viewModel.input.propertyType.rentLabel, value: $viewModel.input.averageMonthlyRent, suffix: "SAR")
                    InputField("نسبة الإشغال المتوقعة", value: $viewModel.input.occupancyRate, suffix: "%")
                    if viewModel.input.propertyType == .hospitalityServicedApartments {
                        InputField("عدد أيام التشغيل", value: $viewModel.input.operatingDays, suffix: "يوم")
                    }
                    InputField(viewModel.input.propertyType.additionalIncomeLabel, value: $viewModel.input.additionalIncome, suffix: "SAR")
                    ReadOnlyAmountRow(title: "إجمالي الدخل الشهري", value: viewModel.result.monthlyIncome)
                    ReadOnlyAmountRow(title: "إجمالي الدخل السنوي", value: viewModel.result.annualRevenue)
                }
            }
            WizardNavigation(canGoBack: true, primaryTitle: "التالي", primaryIcon: "arrow.left", onBack: viewModel.previous, onNext: viewModel.next)
        }
        .onChange(of: viewModel.input) { _ in viewModel.recalculate() }
    }
}

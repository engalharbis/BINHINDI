import SwiftUI

struct OperatingExpensesView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(title: "المصاريف التشغيلية", subtitle: "احسب المصاريف السنوية للوصول إلى صافي الدخل التشغيلي NOI.", stepText: "المرحلة 5 من 7")
            LuxuryCard {
                VStack(spacing: 14) {
                    InputField("الصيانة السنوية", value: $viewModel.input.annualMaintenance, suffix: "SAR")
                    InputField("الحراسة والأمن", value: $viewModel.input.security, suffix: "SAR")
                    InputField("النظافة", value: $viewModel.input.cleaning, suffix: "SAR")
                    InputField("الكهرباء والمياه على المالك", value: $viewModel.input.ownerUtilities, suffix: "SAR")
                    InputField("الإدارة والتشغيل", value: $viewModel.input.managementOperations, suffix: "SAR")
                    InputField("التأمين", value: $viewModel.input.insurance, suffix: "SAR")
                    InputField("التسويق", value: $viewModel.input.marketing, suffix: "SAR")
                    InputField("مصاريف أخرى", value: $viewModel.input.otherOperatingExpenses, suffix: "SAR")
                    InputField("نسبة المصاريف التشغيلية من الإيراد", value: $viewModel.input.operatingExpensePercentage, suffix: "%")
                    ReadOnlyAmountRow(title: "صافي الدخل التشغيلي NOI", value: viewModel.result.noi)
                }
            }
            WizardNavigation(canGoBack: true, primaryTitle: "التالي", primaryIcon: "arrow.left", onBack: viewModel.previous, onNext: viewModel.next)
        }
        .onChange(of: viewModel.input) { _ in viewModel.recalculate() }
    }
}

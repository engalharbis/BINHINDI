import SwiftUI

struct DevelopmentCostView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(title: "البناء والتطوير", subtitle: "اجمع التكاليف المباشرة وغير المباشرة مع احتياطي مخاطر واضح.", stepText: "المرحلة 3 من 7")
            LuxuryCard {
                VStack(spacing: 14) {
                    InputField("مسطح البناء الإجمالي", value: $viewModel.input.builtUpArea, suffix: "م²")
                    InputField("تكلفة البناء للمتر", value: $viewModel.input.constructionCostPerMeter, suffix: "SAR")
                    ReadOnlyAmountRow(title: "إجمالي تكلفة البناء", value: viewModel.result.baseConstructionCost)
                    InputField("تكلفة التصميم والاستشارات", value: $viewModel.input.designConsultingCost, suffix: "SAR")
                    InputField("تكلفة التراخيص", value: $viewModel.input.permitCost, suffix: "SAR")
                    InputField("تكلفة الإشراف الهندسي", value: $viewModel.input.engineeringSupervisionCost, suffix: "SAR")
                    InputField("تكلفة البنية التحتية", value: $viewModel.input.infrastructureCost, suffix: "SAR")
                    InputField("تكلفة الكهرباء", value: $viewModel.input.electricityCost, suffix: "SAR")
                    InputField("تكلفة المياه", value: $viewModel.input.waterCost, suffix: "SAR")
                    InputField("تكلفة الدفاع المدني", value: $viewModel.input.civilDefenseCost, suffix: "SAR")
                    InputField("تكلفة المصاعد إن وجدت", value: $viewModel.input.elevatorsCost, suffix: "SAR")
                    InputField("تكلفة التشطيبات", value: $viewModel.input.finishingCost, suffix: "SAR")
                    InputField("احتياطي مخاطر / طوارئ", value: $viewModel.input.contingencyPercentage, suffix: "%")
                    ReadOnlyAmountRow(title: "إجمالي تكلفة التطوير", value: viewModel.result.totalDevelopmentCost)
                }
            }
            WizardNavigation(canGoBack: true, primaryTitle: "التالي", primaryIcon: "arrow.left", onBack: viewModel.previous, onNext: viewModel.next)
        }
        .onChange(of: viewModel.input) { _ in viewModel.recalculate() }
    }
}

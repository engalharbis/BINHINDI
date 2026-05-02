import SwiftUI

struct LandInputView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(title: "مدخلات الأرض", subtitle: "أدخل تكلفة التملك والرسوم المرتبطة بالأرض.", stepText: "المرحلة 2 من 7")
            LuxuryCard {
                VStack(spacing: 14) {
                    InputField("مساحة الأرض بالمتر المربع", value: $viewModel.input.landArea, suffix: "م²")
                    InputField("سعر المتر", value: $viewModel.input.landPricePerMeter, suffix: "SAR")
                    ReadOnlyAmountRow(title: "إجمالي قيمة الأرض", value: viewModel.input.landArea * viewModel.input.landPricePerMeter)
                    InputField("رسوم السعي أو الوساطة", value: $viewModel.input.brokerageFees, suffix: "SAR")
                    InputField("ضريبة التصرفات العقارية", value: $viewModel.input.realEstateTransactionTax, suffix: "SAR")
                    InputField("رسوم أخرى", value: $viewModel.input.otherLandFees, suffix: "SAR")
                    ReadOnlyAmountRow(title: "إجمالي تكلفة تملك الأرض", value: viewModel.result.totalLandCost)
                }
            }
            WizardNavigation(canGoBack: true, primaryTitle: "التالي", primaryIcon: "arrow.left", onBack: viewModel.previous, onNext: viewModel.next)
        }
        .onChange(of: viewModel.input) { _ in viewModel.recalculate() }
    }
}

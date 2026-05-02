import SwiftUI

struct SplashView: View {
    @StateObject private var viewModel = InvestmentCalculatorViewModel()
    @State private var didStart = false

    var body: some View {
        NavigationStack {
            if didStart {
                CalculatorWizardView(viewModel: viewModel)
                    .navigationBarBackButtonHidden()
            } else {
                VStack(spacing: 26) {
                    Spacer()

                    ZStack {
                        Circle()
                            .fill(LuxuryTheme.black)
                            .frame(width: 112, height: 112)
                        Image(systemName: "building.columns.fill")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundStyle(LuxuryTheme.gold)
                    }

                    VStack(spacing: 12) {
                        Text("حاسبة الاستثمار العقاري")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(LuxuryTheme.black)
                            .multilineTextAlignment(.center)
                        Text("احسب جدوى مشروعك العقاري بدقة واحترافية")
                            .font(.headline)
                            .foregroundStyle(LuxuryTheme.muted)
                            .multilineTextAlignment(.center)
                    }

                    LuxuryCard {
                        HStack(spacing: 14) {
                            VStack(alignment: .trailing, spacing: 5) {
                                Text("Real Estate Investment Calculator")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(LuxuryTheme.gold)
                                Text("تحليل تكلفة، إيراد، تمويل، مؤشرات وجدوى في تجربة عربية كاملة.")
                                    .font(.subheadline)
                                    .foregroundStyle(LuxuryTheme.muted)
                                    .multilineTextAlignment(.trailing)
                            }
                            Image(systemName: "chart.pie.fill")
                                .font(.title2)
                                .foregroundStyle(LuxuryTheme.black)
                        }
                    }

                    Spacer()

                    PrimaryButton(title: "بدء الحساب", icon: "arrow.left") {
                        didStart = true
                    }
                }
                .padding(22)
                .luxuryScreen()
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
    }
}

struct CalculatorWizardView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 0) {
            ProgressView(value: Double(viewModel.currentStep.rawValue + 1), total: Double(InvestmentCalculatorViewModel.Step.allCases.count))
                .tint(LuxuryTheme.gold)
                .padding(.horizontal, 20)
                .padding(.top, 12)

            ScrollView {
                VStack(spacing: 18) {
                    switch viewModel.currentStep {
                    case .propertyType:
                        PropertyTypeSelectionView(viewModel: viewModel)
                    case .land:
                        LandInputView(viewModel: viewModel)
                    case .development:
                        DevelopmentCostView(viewModel: viewModel)
                    case .revenue:
                        RevenueInputView(viewModel: viewModel)
                    case .expenses:
                        OperatingExpensesView(viewModel: viewModel)
                    case .financing:
                        FinancingView(viewModel: viewModel)
                    case .results:
                        ResultsDashboardView(viewModel: viewModel)
                    }

                    if let message = viewModel.validationMessage {
                        Text(message)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.red.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
                .padding(20)
            }
        }
        .luxuryScreen()
        .environment(\.layoutDirection, .rightToLeft)
    }
}

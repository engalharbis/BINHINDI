import SwiftUI

struct FinancingView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(title: "التمويل البنكي", subtitle: "فعّل التمويل عند وجود قرض أو تمويل عقاري لحساب خدمة الدين وDSCR.", stepText: "المرحلة 6 من 7")
            LuxuryCard {
                VStack(spacing: 16) {
                    Toggle("هل يوجد تمويل بنكي؟", isOn: $viewModel.input.financing.hasFinancing)
                        .font(.headline)
                        .tint(LuxuryTheme.gold)

                    if viewModel.input.financing.hasFinancing {
                        InputField("مبلغ التمويل", value: $viewModel.input.financing.financingAmount, suffix: "SAR")
                        InputField("نسبة التمويل من إجمالي تكلفة المشروع", value: $viewModel.input.financing.financingRatio, suffix: "%")
                        InputField("مدة التمويل بالسنوات", value: $viewModel.input.financing.termYears, suffix: "سنة")
                        InputField("نسبة الفائدة أو الربح السنوي", value: $viewModel.input.financing.annualInterestRate, suffix: "%")

                        Picker("نوع السداد", selection: $viewModel.input.financing.repaymentType) {
                            ForEach(RepaymentType.allCases) { type in
                                Text(type.rawValue).tag(type)
                            }
                        }
                        .pickerStyle(.segmented)

                        ReadOnlyAmountRow(title: "القسط الشهري", value: viewModel.result.monthlyDebtService)
                        ReadOnlyAmountRow(title: "إجمالي تكلفة التمويل", value: viewModel.result.totalFinancingCost)
                        ReadOnlyAmountRow(title: "صافي التدفق بعد خدمة الدين", value: viewModel.result.netIncomeAfterFinancing)
                        if let dscr = viewModel.result.dscr {
                            ReadOnlyAmountRow(title: "DSCR", value: dscr)
                        }
                    } else {
                        Text("سيتم تجاهل التمويل في الحسابات واستخدام صافي الدخل التشغيلي كمصدر العائد.")
                            .font(.subheadline)
                            .foregroundStyle(LuxuryTheme.muted)
                            .multilineTextAlignment(.trailing)
                    }
                }
            }
            WizardNavigation(canGoBack: true, primaryTitle: "حساب النتائج", primaryIcon: "checkmark", onBack: viewModel.previous, onNext: viewModel.next)
        }
        .onChange(of: viewModel.input) { _ in viewModel.recalculate() }
    }
}

import Foundation
import SwiftUI

@MainActor
final class InvestmentCalculatorViewModel: ObservableObject {
    enum Step: Int, CaseIterable {
        case propertyType
        case land
        case development
        case revenue
        case expenses
        case financing
        case results

        var title: String {
            switch self {
            case .propertyType: return "نوع العقار"
            case .land: return "تكاليف الأرض"
            case .development: return "البناء والتطوير"
            case .revenue: return "الإيرادات"
            case .expenses: return "المصاريف"
            case .financing: return "التمويل"
            case .results: return "النتائج"
            }
        }
    }

    @Published var input = InvestmentInput()
    @Published var result: CalculationResult
    @Published var currentStep: Step = .propertyType
    @Published var validationMessage: String?
    @Published var isExporting = false
    @Published var exportedPDFURL: URL?

    private let calculator = InvestmentCalculatorService()
    private let pdfService = PDFExportService()

    init() {
        result = calculator.calculate(input: InvestmentInput())
    }

    func recalculate() {
        sanitizeInput()
        result = calculator.calculate(input: input)
    }

    func next() {
        guard validateCurrentStep() else { return }
        recalculate()
        guard let next = Step(rawValue: currentStep.rawValue + 1) else { return }
        currentStep = next
    }

    func previous() {
        validationMessage = nil
        guard let previous = Step(rawValue: currentStep.rawValue - 1) else { return }
        currentStep = previous
    }

    func restart() {
        input = InvestmentInput()
        recalculate()
        currentStep = .propertyType
        exportedPDFURL = nil
    }

    func exportPDF() {
        recalculate()
        isExporting = true
        validationMessage = nil
        Task {
            do {
                let url = try await pdfService.export(input: input, result: result)
                exportedPDFURL = url
            } catch {
                validationMessage = "تعذر تصدير التقرير. حاول مرة أخرى."
            }
            isExporting = false
        }
    }

    func costDistribution() -> [ChartSlice] {
        [
            ChartSlice(name: "الأرض", value: result.landValue),
            ChartSlice(name: "البناء", value: result.baseConstructionCost),
            ChartSlice(name: "الرسوم", value: input.brokerageFees + input.realEstateTransactionTax + input.otherLandFees + input.permitCost),
            ChartSlice(name: "الاحتياطي", value: result.contingencyAmount),
            ChartSlice(name: "تكاليف أخرى", value: max(result.totalProjectCost - result.landValue - result.baseConstructionCost - result.contingencyAmount - input.brokerageFees - input.realEstateTransactionTax - input.otherLandFees - input.permitCost, 0))
        ].filter { $0.value > 0 }
    }

    func incomeMetrics() -> [BarMetric] {
        [
            BarMetric(name: "الإيراد", value: result.annualRevenue),
            BarMetric(name: "المصاريف", value: result.operatingExpenses),
            BarMetric(name: "NOI", value: result.noi),
            BarMetric(name: "بعد التمويل", value: result.netIncomeAfterFinancing)
        ]
    }

    private func validateCurrentStep() -> Bool {
        validationMessage = nil
        switch currentStep {
        case .propertyType:
            return true
        case .land:
            guard input.landArea > 0, input.landPricePerMeter > 0 else {
                validationMessage = "أدخل مساحة الأرض وسعر المتر بقيم أكبر من صفر."
                return false
            }
        case .development:
            guard input.builtUpArea >= 0, input.constructionCostPerMeter >= 0 else {
                validationMessage = "لا يمكن إدخال قيم سالبة في تكاليف التطوير."
                return false
            }
        case .revenue:
            guard input.unitsCount > 0, input.averageMonthlyRent > 0 else {
                validationMessage = "أدخل عدد الوحدات ومتوسط الإيجار أو السعر."
                return false
            }
        case .expenses:
            guard input.operatingExpensePercentage <= 100 else {
                validationMessage = "نسبة المصاريف التشغيلية يجب ألا تتجاوز 100٪."
                return false
            }
        case .financing:
            if input.financing.hasFinancing {
                guard input.financing.financingAmount > 0, input.financing.termYears > 0 else {
                    validationMessage = "أدخل مبلغ التمويل ومدة التمويل."
                    return false
                }
            }
        case .results:
            return true
        }
        return true
    }

    private func sanitizeInput() {
        input.landArea = max(input.landArea, 0)
        input.landPricePerMeter = max(input.landPricePerMeter, 0)
        input.brokerageFees = max(input.brokerageFees, 0)
        input.realEstateTransactionTax = max(input.realEstateTransactionTax, 0)
        input.otherLandFees = max(input.otherLandFees, 0)
        input.builtUpArea = max(input.builtUpArea, 0)
        input.constructionCostPerMeter = max(input.constructionCostPerMeter, 0)
        input.designConsultingCost = max(input.designConsultingCost, 0)
        input.permitCost = max(input.permitCost, 0)
        input.engineeringSupervisionCost = max(input.engineeringSupervisionCost, 0)
        input.infrastructureCost = max(input.infrastructureCost, 0)
        input.electricityCost = max(input.electricityCost, 0)
        input.waterCost = max(input.waterCost, 0)
        input.civilDefenseCost = max(input.civilDefenseCost, 0)
        input.elevatorsCost = max(input.elevatorsCost, 0)
        input.finishingCost = max(input.finishingCost, 0)
        input.contingencyPercentage = min(max(input.contingencyPercentage, 0), 100)
        input.unitsCount = max(input.unitsCount, 0)
        input.averageMonthlyRent = max(input.averageMonthlyRent, 0)
        input.occupancyRate = min(max(input.occupancyRate, 0), 100)
        input.additionalIncome = max(input.additionalIncome, 0)
        input.operatingDays = max(input.operatingDays, 0)
        input.operatingExpensePercentage = min(max(input.operatingExpensePercentage, 0), 100)
        input.financing.financingAmount = max(input.financing.financingAmount, 0)
        input.financing.financingRatio = min(max(input.financing.financingRatio, 0), 100)
        input.financing.termYears = max(input.financing.termYears, 0)
        input.financing.annualInterestRate = max(input.financing.annualInterestRate, 0)
    }
}

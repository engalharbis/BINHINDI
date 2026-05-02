import Foundation

struct CalculationResult: Codable {
    var landValue: Double
    var totalLandCost: Double
    var baseConstructionCost: Double
    var directDevelopmentCosts: Double
    var contingencyAmount: Double
    var totalDevelopmentCost: Double
    var totalProjectCost: Double
    var monthlyIncome: Double
    var annualRevenue: Double
    var operatingExpenses: Double
    var noi: Double
    var monthlyDebtService: Double
    var annualDebtService: Double
    var totalFinancingCost: Double
    var netIncomeAfterFinancing: Double
    var yieldOnCost: Double
    var roi: Double
    var paybackPeriod: Double
    var dscr: Double?
    var breakEvenOccupancy: Double
    var rating: InvestmentRating
    var cashFlows: [CashFlowYear]
}

enum InvestmentRating: String, Codable {
    case excellent = "ممتاز"
    case good = "جيد"
    case average = "متوسط"
    case weak = "ضعيف"
}

struct CashFlowYear: Identifiable, Codable {
    var id: Int { year }
    let year: Int
    let revenue: Double
    let expenses: Double
    let noi: Double
    let netAfterDebt: Double
}

struct ChartSlice: Identifiable {
    let id = UUID()
    let name: String
    let value: Double
}

struct BarMetric: Identifiable {
    let id = UUID()
    let name: String
    let value: Double
}

import Foundation

enum RepaymentType: String, CaseIterable, Identifiable, Codable, Equatable {
    case monthlyFixed = "قسط ثابت شهري"
    case annual = "قسط سنوي"

    var id: String { rawValue }
}

struct FinancingInput: Codable, Equatable {
    var hasFinancing = false
    var financingAmount = 0.0
    var financingRatio = 0.0
    var termYears = 15.0
    var annualInterestRate = 5.0
    var repaymentType: RepaymentType = .monthlyFixed
}

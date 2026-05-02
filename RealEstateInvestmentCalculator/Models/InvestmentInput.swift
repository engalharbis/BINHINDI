import Foundation

struct InvestmentInput: Codable, Equatable {
    var propertyType: PropertyType = .residentialBuilding

    var landArea = 0.0
    var landPricePerMeter = 0.0
    var brokerageFees = 0.0
    var realEstateTransactionTax = 0.0
    var otherLandFees = 0.0

    var builtUpArea = 0.0
    var constructionCostPerMeter = 0.0
    var designConsultingCost = 0.0
    var permitCost = 0.0
    var engineeringSupervisionCost = 0.0
    var infrastructureCost = 0.0
    var electricityCost = 0.0
    var waterCost = 0.0
    var civilDefenseCost = 0.0
    var elevatorsCost = 0.0
    var finishingCost = 0.0
    var contingencyPercentage = 7.5

    var unitsCount = 0.0
    var averageMonthlyRent = 0.0
    var occupancyRate = 90.0
    var additionalIncome = 0.0
    var operatingDays = 365.0

    var annualMaintenance = 0.0
    var security = 0.0
    var cleaning = 0.0
    var ownerUtilities = 0.0
    var managementOperations = 0.0
    var insurance = 0.0
    var marketing = 0.0
    var otherOperatingExpenses = 0.0
    var operatingExpensePercentage = 0.0

    var financing = FinancingInput()
}

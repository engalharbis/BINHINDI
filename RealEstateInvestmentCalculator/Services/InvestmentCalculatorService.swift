import Foundation

struct InvestmentCalculatorService {
    func calculate(input: InvestmentInput) -> CalculationResult {
        let landValue = input.landArea * input.landPricePerMeter
        let totalLandCost = landValue + input.brokerageFees + input.realEstateTransactionTax + input.otherLandFees

        let baseConstructionCost = input.builtUpArea * input.constructionCostPerMeter
        let developmentBeforeContingency = baseConstructionCost
            + input.designConsultingCost
            + input.permitCost
            + input.engineeringSupervisionCost
            + input.infrastructureCost
            + input.electricityCost
            + input.waterCost
            + input.civilDefenseCost
            + input.elevatorsCost
            + input.finishingCost
        let contingencyAmount = developmentBeforeContingency * (input.contingencyPercentage / 100)
        let totalDevelopmentCost = developmentBeforeContingency + contingencyAmount
        let totalProjectCost = totalLandCost + totalDevelopmentCost

        let occupancyMultiplier = normalizedPercent(input.occupancyRate)
        let monthlyIncome: Double
        let annualRevenue: Double
        if input.propertyType == .hospitalityServicedApartments {
            annualRevenue = (input.unitsCount * input.averageMonthlyRent * input.operatingDays * occupancyMultiplier) + input.additionalIncome
            monthlyIncome = annualRevenue / 12
        } else {
            monthlyIncome = (input.unitsCount * input.averageMonthlyRent * occupancyMultiplier) + input.additionalIncome
            annualRevenue = monthlyIncome * 12
        }

        let fixedOperatingExpenses = input.annualMaintenance
            + input.security
            + input.cleaning
            + input.ownerUtilities
            + input.managementOperations
            + input.insurance
            + input.marketing
            + input.otherOperatingExpenses
        let percentageOperatingExpenses = annualRevenue * normalizedPercent(input.operatingExpensePercentage)
        let operatingExpenses = fixedOperatingExpenses + percentageOperatingExpenses
        let noi = annualRevenue - operatingExpenses

        let monthlyDebtService = calculateMonthlyDebtService(financing: input.financing)
        let annualDebtService = input.financing.hasFinancing
            ? (input.financing.repaymentType == .monthlyFixed ? monthlyDebtService * 12 : monthlyDebtService)
            : 0
        let totalFinancingPayments = annualDebtService * max(input.financing.termYears, 0)
        let totalFinancingCost = input.financing.hasFinancing ? max(totalFinancingPayments - input.financing.financingAmount, 0) : 0
        let netIncomeAfterFinancing = noi - annualDebtService
        let yieldOnCost = safeDivide(noi, totalProjectCost) * 100
        let roi = safeDivide(netIncomeAfterFinancing, totalProjectCost) * 100
        let paybackPeriod = safeDivide(totalProjectCost, max(netIncomeAfterFinancing, 0))
        let dscr = input.financing.hasFinancing && annualDebtService > 0 ? safeDivide(noi, annualDebtService) : nil
        let breakEvenOccupancy = annualRevenue > 0 ? min(max(safeDivide(operatingExpenses + annualDebtService, annualRevenue) * input.occupancyRate, 0), 100) : 0
        let rating = rating(for: yieldOnCost)
        let cashFlows = (1...10).map { year in
            let growthFactor = pow(1.025, Double(year - 1))
            let expenseGrowth = pow(1.018, Double(year - 1))
            let grownRevenue = annualRevenue * growthFactor
            let grownExpenses = operatingExpenses * expenseGrowth
            let grownNOI = grownRevenue - grownExpenses
            return CashFlowYear(
                year: year,
                revenue: grownRevenue,
                expenses: grownExpenses,
                noi: grownNOI,
                netAfterDebt: grownNOI - annualDebtService
            )
        }

        return CalculationResult(
            landValue: landValue,
            totalLandCost: totalLandCost,
            baseConstructionCost: baseConstructionCost,
            directDevelopmentCosts: developmentBeforeContingency,
            contingencyAmount: contingencyAmount,
            totalDevelopmentCost: totalDevelopmentCost,
            totalProjectCost: totalProjectCost,
            monthlyIncome: monthlyIncome,
            annualRevenue: annualRevenue,
            operatingExpenses: operatingExpenses,
            noi: noi,
            monthlyDebtService: input.financing.repaymentType == .monthlyFixed ? monthlyDebtService : monthlyDebtService / 12,
            annualDebtService: annualDebtService,
            totalFinancingCost: totalFinancingCost,
            netIncomeAfterFinancing: netIncomeAfterFinancing,
            yieldOnCost: yieldOnCost,
            roi: roi,
            paybackPeriod: paybackPeriod.isFinite ? paybackPeriod : 0,
            dscr: dscr,
            breakEvenOccupancy: breakEvenOccupancy,
            rating: rating,
            cashFlows: cashFlows
        )
    }

    private func calculateMonthlyDebtService(financing: FinancingInput) -> Double {
        guard financing.hasFinancing, financing.financingAmount > 0, financing.termYears > 0 else { return 0 }
        let principal = financing.financingAmount
        let annualRate = financing.annualInterestRate / 100
        if financing.repaymentType == .annual {
            let n = financing.termYears
            guard annualRate > 0 else { return principal / n }
            return principal * (annualRate * pow(1 + annualRate, n)) / (pow(1 + annualRate, n) - 1)
        }

        let monthlyRate = annualRate / 12
        let months = financing.termYears * 12
        guard monthlyRate > 0 else { return principal / months }
        return principal * (monthlyRate * pow(1 + monthlyRate, months)) / (pow(1 + monthlyRate, months) - 1)
    }

    private func normalizedPercent(_ value: Double) -> Double {
        min(max(value, 0), 100) / 100
    }

    private func safeDivide(_ numerator: Double, _ denominator: Double) -> Double {
        guard denominator != 0 else { return 0 }
        return numerator / denominator
    }

    private func rating(for yieldOnCost: Double) -> InvestmentRating {
        if yieldOnCost >= 10 { return .excellent }
        if yieldOnCost >= 8 { return .good }
        if yieldOnCost >= 6 { return .average }
        return .weak
    }
}

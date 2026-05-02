import Foundation
import UIKit

final class PDFExportService {
    private let pageBounds = CGRect(x: 0, y: 0, width: 595, height: 842)
    private let margin: CGFloat = 42
    private let formatter = NumberFormatterService.shared

    func export(input: InvestmentInput, result: CalculationResult) async throws -> URL {
        let fileName = "تقرير-جدوى-الاستثمار-العقاري-\(Int(Date().timeIntervalSince1970)).pdf"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

        let renderer = UIGraphicsPDFRenderer(bounds: pageBounds)
        try renderer.writePDF(to: url) { context in
            drawCover(context: context, input: input, result: result)
            drawTables(context: context, input: input, result: result)
            drawChartsPage(context: context, input: input, result: result)
        }

        return url
    }

    private func drawCover(context: UIGraphicsPDFRendererContext, input: InvestmentInput, result: CalculationResult) {
        context.beginPage()
        UIColor(red: 0.05, green: 0.05, blue: 0.045, alpha: 1).setFill()
        context.fill(pageBounds)

        let gold = UIColor(red: 0.78, green: 0.61, blue: 0.31, alpha: 1)
        gold.setFill()
        UIBezierPath(roundedRect: CGRect(x: margin, y: 84, width: 118, height: 8), cornerRadius: 4).fill()

        drawText("تقرير جدوى الاستثمار العقاري", x: margin, y: 140, width: pageBounds.width - margin * 2, font: .boldSystemFont(ofSize: 34), color: .white, alignment: .right)
        drawText("حاسبة الاستثمار العقاري", x: margin, y: 196, width: pageBounds.width - margin * 2, font: .systemFont(ofSize: 19, weight: .semibold), color: gold, alignment: .right)

        let date = DateFormatter.localizedString(from: Date(), dateStyle: .long, timeStyle: .short)
        drawText("تاريخ إنشاء التقرير: \(date)", x: margin, y: 260, width: pageBounds.width - margin * 2, font: .systemFont(ofSize: 14), color: .white.withAlphaComponent(0.85), alignment: .right)
        drawText("نوع العقار: \(input.propertyType.rawValue)", x: margin, y: 286, width: pageBounds.width - margin * 2, font: .systemFont(ofSize: 14), color: .white.withAlphaComponent(0.85), alignment: .right)

        let summary = """
        ملخص تنفيذي: تبلغ تكلفة المشروع \(formatter.currency(result.totalProjectCost))، بإيراد سنوي متوقع \(formatter.currency(result.annualRevenue)) وصافي دخل تشغيلي \(formatter.currency(result.noi)). العائد السنوي على التكلفة \(formatter.percent(result.yieldOnCost))، والتقييم المختصر للمشروع: \(result.rating.rawValue).
        """
        drawText(summary, x: margin, y: 350, width: pageBounds.width - margin * 2, font: .systemFont(ofSize: 17), color: .white, alignment: .right)

        drawKPIBox(title: "إجمالي تكلفة المشروع", value: formatter.currency(result.totalProjectCost), rect: CGRect(x: margin, y: 520, width: 245, height: 88), color: gold)
        drawKPIBox(title: "Yield on Cost", value: formatter.percent(result.yieldOnCost), rect: CGRect(x: 308, y: 520, width: 245, height: 88), color: gold)
        drawKPIBox(title: "NOI", value: formatter.currency(result.noi), rect: CGRect(x: margin, y: 626, width: 245, height: 88), color: gold)
        drawKPIBox(title: "التقييم", value: result.rating.rawValue, rect: CGRect(x: 308, y: 626, width: 245, height: 88), color: gold)
    }

    private func drawTables(context: UIGraphicsPDFRendererContext, input: InvestmentInput, result: CalculationResult) {
        context.beginPage()
        drawPageHeader("الجداول المالية")
        var y: CGFloat = 92

        y = drawTable(title: "المدخلات الأساسية", rows: [
            ("نوع العقار", input.propertyType.rawValue),
            ("مساحة الأرض", "\(formatter.number(input.landArea)) م²"),
            ("مسطح البناء", "\(formatter.number(input.builtUpArea)) م²"),
            ("نسبة الإشغال", formatter.percent(input.occupancyRate))
        ], y: y)

        y = drawTable(title: "تكاليف الأرض", rows: [
            ("إجمالي قيمة الأرض", formatter.currency(result.landValue)),
            ("رسوم السعي أو الوساطة", formatter.currency(input.brokerageFees)),
            ("ضريبة التصرفات العقارية", formatter.currency(input.realEstateTransactionTax)),
            ("رسوم أخرى", formatter.currency(input.otherLandFees)),
            ("إجمالي تكلفة تملك الأرض", formatter.currency(result.totalLandCost))
        ], y: y + 16)

        y = drawTable(title: "تكاليف البناء والتطوير", rows: [
            ("إجمالي تكلفة البناء", formatter.currency(result.baseConstructionCost)),
            ("التصميم والاستشارات", formatter.currency(input.designConsultingCost)),
            ("التراخيص والإشراف والبنية التحتية", formatter.currency(input.permitCost + input.engineeringSupervisionCost + input.infrastructureCost)),
            ("الكهرباء والمياه والدفاع المدني", formatter.currency(input.electricityCost + input.waterCost + input.civilDefenseCost)),
            ("المصاعد والتشطيبات", formatter.currency(input.elevatorsCost + input.finishingCost)),
            ("احتياطي المخاطر", formatter.currency(result.contingencyAmount)),
            ("إجمالي تكلفة التطوير", formatter.currency(result.totalDevelopmentCost))
        ], y: y + 16)

        context.beginPage()
        drawPageHeader("الإيرادات والمصاريف والنتائج")
        y = 92
        y = drawTable(title: "الإيرادات", rows: [
            (input.propertyType.unitLabel, formatter.number(input.unitsCount)),
            (input.propertyType.rentLabel, formatter.currency(input.averageMonthlyRent)),
            ("الدخل الإضافي", formatter.currency(input.additionalIncome)),
            ("إجمالي الدخل الشهري", formatter.currency(result.monthlyIncome)),
            ("إجمالي الدخل السنوي", formatter.currency(result.annualRevenue))
        ], y: y)

        y = drawTable(title: "المصاريف التشغيلية", rows: [
            ("الصيانة السنوية", formatter.currency(input.annualMaintenance)),
            ("الحراسة والنظافة والمرافق", formatter.currency(input.security + input.cleaning + input.ownerUtilities)),
            ("الإدارة والتأمين والتسويق", formatter.currency(input.managementOperations + input.insurance + input.marketing)),
            ("مصاريف أخرى ونسبة تشغيلية", formatter.currency(input.otherOperatingExpenses + result.annualRevenue * input.operatingExpensePercentage / 100)),
            ("إجمالي المصاريف التشغيلية", formatter.currency(result.operatingExpenses)),
            ("NOI", formatter.currency(result.noi))
        ], y: y + 16)

        if input.financing.hasFinancing {
            y = drawTable(title: "التمويل", rows: [
                ("مبلغ التمويل", formatter.currency(input.financing.financingAmount)),
                ("مدة التمويل", "\(formatter.number(input.financing.termYears)) سنة"),
                ("نسبة الفائدة أو الربح", formatter.percent(input.financing.annualInterestRate)),
                ("نوع السداد", input.financing.repaymentType.rawValue),
                ("القسط الشهري", formatter.currency(result.monthlyDebtService)),
                ("إجمالي تكلفة التمويل", formatter.currency(result.totalFinancingCost)),
                ("DSCR", result.dscr.map { formatter.number($0) } ?? "غير متاح")
            ], y: y + 16)
        }

        _ = drawTable(title: "النتائج والمؤشرات", rows: [
            ("إجمالي تكلفة المشروع", formatter.currency(result.totalProjectCost)),
            ("صافي الدخل بعد التمويل", formatter.currency(result.netIncomeAfterFinancing)),
            ("Yield on Cost", formatter.percent(result.yieldOnCost)),
            ("ROI", formatter.percent(result.roi)),
            ("فترة استرداد رأس المال", "\(formatter.number(result.paybackPeriod)) سنة"),
            ("نقطة التعادل التقريبية", formatter.percent(result.breakEvenOccupancy)),
            ("التقييم المختصر", result.rating.rawValue)
        ], y: min(y + 16, 520))
    }

    private func drawChartsPage(context: UIGraphicsPDFRendererContext, input: InvestmentInput, result: CalculationResult) {
        context.beginPage()
        drawPageHeader("الرسوم البيانية والتوصية")

        drawBarChart(
            rect: CGRect(x: margin, y: 108, width: pageBounds.width - margin * 2, height: 230),
            items: [
                ("الإيراد", result.annualRevenue),
                ("المصاريف", result.operatingExpenses),
                ("NOI", result.noi),
                ("بعد التمويل", result.netIncomeAfterFinancing)
            ]
        )

        drawPieChart(
            rect: CGRect(x: margin, y: 386, width: 220, height: 220),
            items: [
                ("الأرض", result.landValue),
                ("البناء", result.baseConstructionCost),
                ("الرسوم", input.brokerageFees + input.realEstateTransactionTax + input.otherLandFees + input.permitCost),
                ("الاحتياطي", result.contingencyAmount),
                ("الأخرى", max(result.totalProjectCost - result.landValue - result.baseConstructionCost - result.contingencyAmount, 0))
            ]
        )

        let recommendation = recommendationText(for: result)
        drawText("التوصية المختصرة", x: 308, y: 398, width: 245, font: .boldSystemFont(ofSize: 18), color: .black, alignment: .right)
        drawText(recommendation, x: 308, y: 432, width: 245, font: .systemFont(ofSize: 14), color: .darkGray, alignment: .right)

        drawText("ملاحظة: هذا التقرير تقديري ولا يغني عن الدراسة المالية والهندسية التفصيلية.", x: margin, y: 742, width: pageBounds.width - margin * 2, font: .systemFont(ofSize: 13, weight: .semibold), color: .darkGray, alignment: .right)
    }

    private func drawPageHeader(_ title: String) {
        UIColor.white.setFill()
        UIRectFill(pageBounds)
        UIColor(red: 0.05, green: 0.05, blue: 0.045, alpha: 1).setFill()
        UIRectFill(CGRect(x: 0, y: 0, width: pageBounds.width, height: 64))
        drawText(title, x: margin, y: 22, width: pageBounds.width - margin * 2, font: .boldSystemFont(ofSize: 20), color: .white, alignment: .right)
    }

    private func drawTable(title: String, rows: [(String, String)], y: CGFloat) -> CGFloat {
        drawText(title, x: margin, y: y, width: pageBounds.width - margin * 2, font: .boldSystemFont(ofSize: 16), color: .black, alignment: .right)
        var currentY = y + 30
        for (label, value) in rows {
            let rect = CGRect(x: margin, y: currentY, width: pageBounds.width - margin * 2, height: 30)
            UIColor(white: currentY.truncatingRemainder(dividingBy: 60) == 0 ? 0.97 : 0.94, alpha: 1).setFill()
            UIBezierPath(roundedRect: rect, cornerRadius: 4).fill()
            drawText(value, x: margin + 12, y: currentY + 8, width: 190, font: .systemFont(ofSize: 11, weight: .semibold), color: .black, alignment: .left)
            drawText(label, x: margin + 212, y: currentY + 8, width: pageBounds.width - margin * 2 - 224, font: .systemFont(ofSize: 11), color: .darkGray, alignment: .right)
            currentY += 34
        }
        return currentY
    }

    private func drawKPIBox(title: String, value: String, rect: CGRect, color: UIColor) {
        UIColor.white.withAlphaComponent(0.08).setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: 8).fill()
        drawText(title, x: rect.minX + 14, y: rect.minY + 16, width: rect.width - 28, font: .systemFont(ofSize: 12), color: .white.withAlphaComponent(0.75), alignment: .right)
        drawText(value, x: rect.minX + 14, y: rect.minY + 42, width: rect.width - 28, font: .boldSystemFont(ofSize: 19), color: color, alignment: .right)
    }

    private func drawBarChart(rect: CGRect, items: [(String, Double)]) {
        drawText("مقارنة الإيرادات والمصاريف", x: rect.minX, y: rect.minY - 30, width: rect.width, font: .boldSystemFont(ofSize: 17), color: .black, alignment: .right)
        let maxValue = max(items.map(\.1).max() ?? 1, 1)
        let barWidth = rect.width / CGFloat(items.count) - 18
        for (index, item) in items.enumerated() {
            let height = CGFloat(max(item.1, 0) / maxValue) * (rect.height - 44)
            let x = rect.minX + CGFloat(index) * (barWidth + 18)
            let y = rect.maxY - height - 24
            UIColor(red: 0.78, green: 0.61, blue: 0.31, alpha: 1).setFill()
            UIBezierPath(roundedRect: CGRect(x: x, y: y, width: barWidth, height: height), cornerRadius: 5).fill()
            drawText(item.0, x: x - 8, y: rect.maxY - 16, width: barWidth + 16, font: .systemFont(ofSize: 9), color: .darkGray, alignment: .center)
        }
    }

    private func drawPieChart(rect: CGRect, items: [(String, Double)]) {
        let filtered = items.filter { $0.1 > 0 }
        let total = filtered.reduce(0) { $0 + $1.1 }
        guard total > 0 else { return }
        let colors: [UIColor] = [.black, UIColor(red: 0.78, green: 0.61, blue: 0.31, alpha: 1), .darkGray, .lightGray, UIColor(red: 0.95, green: 0.88, blue: 0.70, alpha: 1)]
        var start: CGFloat = -.pi / 2
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        for (index, item) in filtered.enumerated() {
            let end = start + CGFloat(item.1 / total) * .pi * 2
            let path = UIBezierPath()
            path.move(to: center)
            path.addArc(withCenter: center, radius: radius, startAngle: start, endAngle: end, clockwise: true)
            path.close()
            colors[index % colors.count].setFill()
            path.fill()
            start = end
        }
        drawText("توزيع التكلفة", x: rect.minX, y: rect.maxY + 18, width: rect.width, font: .boldSystemFont(ofSize: 14), color: .black, alignment: .center)
    }

    private func drawText(_ text: String, x: CGFloat, y: CGFloat, width: CGFloat, font: UIFont, color: UIColor, alignment: NSTextAlignment) {
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = alignment
        paragraph.baseWritingDirection = .rightToLeft
        paragraph.lineSpacing = 4
        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: color,
            .paragraphStyle: paragraph
        ]
        NSString(string: text).draw(in: CGRect(x: x, y: y, width: width, height: 160), withAttributes: attributes)
    }

    private func recommendationText(for result: CalculationResult) -> String {
        switch result.rating {
        case .excellent:
            return "المؤشرات قوية والعائد يتجاوز 10٪. يوصى بالانتقال إلى دراسة تفصيلية تشمل حساسية الإشغال والتكلفة."
        case .good:
            return "العائد جيد ومناسب للمراجعة الاستثمارية، مع ضرورة ضبط تكاليف التنفيذ وشروط التمويل."
        case .average:
            return "العائد متوسط. يفضل تحسين الإيجارات أو خفض تكلفة الأرض أو البناء قبل اتخاذ قرار نهائي."
        case .weak:
            return "العائد أقل من المستوى المستهدف. يوصى بإعادة التفاوض على التكلفة أو إعادة تصميم نموذج الإيرادات."
        }
    }
}

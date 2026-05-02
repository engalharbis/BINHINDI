import Foundation

enum NumberFormatterService {
    static let shared = NumberFormatterServiceImpl()
}

final class NumberFormatterServiceImpl {
    private let currencyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "ar_SA")
        formatter.numberStyle = .currency
        formatter.currencyCode = "SAR"
        formatter.maximumFractionDigits = 0
        return formatter
    }()

    private let decimalFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "ar_SA")
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        return formatter
    }()

    func currency(_ value: Double) -> String {
        currencyFormatter.string(from: NSNumber(value: value)) ?? "\(Int(value)) ر.س"
    }

    func number(_ value: Double) -> String {
        decimalFormatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    func percent(_ value: Double) -> String {
        "\(number(value))٪"
    }
}

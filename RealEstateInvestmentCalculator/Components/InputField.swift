import SwiftUI

struct InputField: View {
    let title: String
    let suffix: String?
    @Binding var value: Double

    init(_ title: String, value: Binding<Double>, suffix: String? = nil) {
        self.title = title
        self._value = value
        self.suffix = suffix
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(LuxuryTheme.charcoal)

            HStack(spacing: 8) {
                if let suffix {
                    Text(suffix)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(LuxuryTheme.gold)
                }
                TextField("0", value: $value, format: .number)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .onChange(of: value) { newValue in
                        if newValue < 0 { value = 0 }
                    }
            }
            .padding(.horizontal, 14)
            .frame(height: 50)
            .background(Color.black.opacity(0.035))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}

struct ReadOnlyAmountRow: View {
    let title: String
    let value: Double

    var body: some View {
        HStack {
            Text(NumberFormatterService.shared.currency(value))
                .font(.headline)
                .foregroundStyle(LuxuryTheme.gold)
            Spacer()
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(LuxuryTheme.charcoal)
        }
        .padding(14)
        .background(LuxuryTheme.black)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

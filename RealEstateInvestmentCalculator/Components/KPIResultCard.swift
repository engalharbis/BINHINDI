import SwiftUI

struct KPIResultCard: View {
    let title: String
    let value: String
    var icon: String = "chart.line.uptrend.xyaxis"
    var highlight = false

    var body: some View {
        LuxuryCard {
            VStack(alignment: .trailing, spacing: 12) {
                HStack {
                    Image(systemName: icon)
                        .foregroundStyle(highlight ? LuxuryTheme.gold : LuxuryTheme.black)
                    Spacer()
                    Text(title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(LuxuryTheme.muted)
                        .lineLimit(2)
                        .multilineTextAlignment(.trailing)
                }

                Text(value)
                    .font(.system(size: 21, weight: .bold, design: .rounded))
                    .foregroundStyle(highlight ? LuxuryTheme.gold : LuxuryTheme.black)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
    }
}

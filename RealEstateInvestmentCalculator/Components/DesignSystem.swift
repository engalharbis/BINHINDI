import SwiftUI

enum LuxuryTheme {
    static let black = Color(red: 0.05, green: 0.05, blue: 0.045)
    static let charcoal = Color(red: 0.12, green: 0.12, blue: 0.11)
    static let gold = Color(red: 0.78, green: 0.61, blue: 0.31)
    static let softGold = Color(red: 0.95, green: 0.88, blue: 0.70)
    static let background = Color(red: 0.965, green: 0.96, blue: 0.945)
    static let card = Color.white
    static let muted = Color(red: 0.42, green: 0.42, blue: 0.39)
}

extension View {
    func luxuryScreen() -> some View {
        self
            .background(LuxuryTheme.background.ignoresSafeArea())
            .font(.system(.body, design: .rounded))
    }
}

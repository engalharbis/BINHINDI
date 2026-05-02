import SwiftUI

@main
struct RealEstateInvestmentCalculatorApp: App {
    var body: some Scene {
        WindowGroup {
            SplashView()
                .environment(\.layoutDirection, .rightToLeft)
                .preferredColorScheme(.light)
        }
    }
}

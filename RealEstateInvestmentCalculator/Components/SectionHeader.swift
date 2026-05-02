import SwiftUI

struct SectionHeader: View {
    let title: String
    let subtitle: String
    var stepText: String?

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            if let stepText {
                Text(stepText)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(LuxuryTheme.gold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(LuxuryTheme.black)
                    .clipShape(Capsule())
            }

            Text(title)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(LuxuryTheme.black)
                .multilineTextAlignment(.trailing)

            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(LuxuryTheme.muted)
                .multilineTextAlignment(.trailing)
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
        .padding(.top, 8)
    }
}

struct WizardNavigation: View {
    let canGoBack: Bool
    let primaryTitle: String
    let primaryIcon: String
    let onBack: () -> Void
    let onNext: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            PrimaryButton(title: primaryTitle, icon: primaryIcon, action: onNext)
            if canGoBack {
                SecondaryButton(title: "السابق", icon: "arrow.right", action: onBack)
            }
        }
        .padding(.top, 8)
    }
}

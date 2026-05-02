import SwiftUI

struct PrimaryButton: View {
    let title: String
    var icon: String = "arrow.left"
    var isLoading = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: icon)
                }
                Text(title)
                    .font(.headline)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .foregroundStyle(.white)
            .background(LuxuryTheme.black)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .disabled(isLoading)
    }
}

struct SecondaryButton: View {
    let title: String
    var icon: String = "arrow.right"
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                Text(title)
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .foregroundStyle(LuxuryTheme.black)
            .background(Color.white)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(LuxuryTheme.black.opacity(0.14)))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}

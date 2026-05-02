import SwiftUI

struct PropertyTypeSelectionView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 18) {
            SectionHeader(
                title: "اختر نوع العقار",
                subtitle: "سيتم تكييف حقول الإيرادات والمؤشرات حسب طبيعة الأصل العقاري.",
                stepText: "المرحلة 1 من 7"
            )

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(PropertyType.allCases) { type in
                    Button {
                        viewModel.input.propertyType = type
                        viewModel.recalculate()
                    } label: {
                        VStack(alignment: .trailing, spacing: 12) {
                            Image(systemName: type.iconName)
                                .font(.title2)
                                .foregroundStyle(viewModel.input.propertyType == type ? LuxuryTheme.gold : LuxuryTheme.black)
                            Text(type.rawValue)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(LuxuryTheme.black)
                                .multilineTextAlignment(.trailing)
                                .lineLimit(2)
                                .minimumScaleFactor(0.75)
                        }
                        .frame(maxWidth: .infinity, minHeight: 104, alignment: .topTrailing)
                        .padding(14)
                        .background(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(viewModel.input.propertyType == type ? LuxuryTheme.gold : Color.black.opacity(0.08), lineWidth: viewModel.input.propertyType == type ? 2 : 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }

            WizardNavigation(canGoBack: false, primaryTitle: "التالي", primaryIcon: "arrow.left", onBack: {}, onNext: viewModel.next)
        }
    }
}

import SwiftUI

struct PDFPreviewView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        LuxuryCard {
            VStack(alignment: .trailing, spacing: 14) {
                HStack {
                    Image(systemName: "doc.richtext.fill")
                        .foregroundStyle(LuxuryTheme.gold)
                    Spacer()
                    Text("تقرير PDF احترافي")
                        .font(.headline)
                }

                Text("يتضمن الغلاف، الملخص التنفيذي، الجداول المالية، الرسوم البيانية، والتوصية النهائية.")
                    .font(.subheadline)
                    .foregroundStyle(LuxuryTheme.muted)
                    .multilineTextAlignment(.trailing)

                PrimaryButton(title: viewModel.isExporting ? "جاري التصدير..." : "تصدير تقرير PDF", icon: "square.and.arrow.up", isLoading: viewModel.isExporting) {
                    viewModel.exportPDF()
                }

                if let url = viewModel.exportedPDFURL {
                    ShareLink(item: url) {
                        HStack {
                            Image(systemName: "paperplane.fill")
                            Text("مشاركة التقرير")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .foregroundStyle(LuxuryTheme.black)
                        .background(LuxuryTheme.softGold)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    Text(url.lastPathComponent)
                        .font(.caption)
                        .foregroundStyle(LuxuryTheme.muted)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
        }
    }
}

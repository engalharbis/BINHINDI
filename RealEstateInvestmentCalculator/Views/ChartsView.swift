import Charts
import SwiftUI

struct ChartsView: View {
    @ObservedObject var viewModel: InvestmentCalculatorViewModel

    var body: some View {
        VStack(spacing: 16) {
            LuxuryCard {
                VStack(alignment: .trailing, spacing: 12) {
                    Text("توزيع تكلفة المشروع")
                        .font(.headline)
                    if viewModel.costDistribution().isEmpty {
                        EmptyChartView(text: "أدخل بيانات التكلفة لعرض الرسم.")
                    } else {
                        Chart(viewModel.costDistribution()) { slice in
                            SectorMark(
                                angle: .value("القيمة", slice.value),
                                innerRadius: .ratio(0.58),
                                angularInset: 2
                            )
                            .foregroundStyle(by: .value("البند", slice.name))
                        }
                        .frame(height: 230)
                        .chartLegend(position: .bottom, alignment: .center)
                    }
                }
            }

            LuxuryCard {
                VStack(alignment: .trailing, spacing: 12) {
                    Text("مقارنة الدخل والمصاريف")
                        .font(.headline)
                    Chart(viewModel.incomeMetrics()) { metric in
                        BarMark(
                            x: .value("البند", metric.name),
                            y: .value("القيمة", metric.value)
                        )
                        .foregroundStyle(LuxuryTheme.gold.gradient)
                        .cornerRadius(5)
                    }
                    .frame(height: 230)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                }
            }

            LuxuryCard {
                VStack(alignment: .trailing, spacing: 12) {
                    Text("التدفقات النقدية لعشر سنوات")
                        .font(.headline)
                    Chart(viewModel.result.cashFlows) { item in
                        LineMark(
                            x: .value("السنة", item.year),
                            y: .value("بعد التمويل", item.netAfterDebt)
                        )
                        .foregroundStyle(LuxuryTheme.black)
                        .interpolationMethod(.catmullRom)
                        PointMark(
                            x: .value("السنة", item.year),
                            y: .value("بعد التمويل", item.netAfterDebt)
                        )
                        .foregroundStyle(LuxuryTheme.gold)
                    }
                    .frame(height: 230)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                }
            }
        }
    }
}

struct EmptyChartView: View {
    let text: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "chart.pie")
                .font(.largeTitle)
                .foregroundStyle(LuxuryTheme.gold)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(LuxuryTheme.muted)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 180)
        .background(Color.black.opacity(0.035))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

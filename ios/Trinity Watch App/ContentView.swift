import SwiftUI
import WatchKit

struct ContentView: View {
    @StateObject private var heartRateMonitor = HeartRateMonitor()
    @StateObject private var phoneConnector: PhoneConnector
    @Environment(\.scenePhase) var scenePhase
    
    init() {
        let monitor = HeartRateMonitor()
        _heartRateMonitor = StateObject(wrappedValue: monitor)
        _phoneConnector = StateObject(wrappedValue: PhoneConnector(heartRateMonitor: monitor))
    }

    var body: some View {
        VStack(spacing: 2) {
            // 심박수 표시
            VStack(spacing: 0) {
                if let heartRate = heartRateMonitor.heartRate {
                    Text("\(Int(heartRate))")
                        .font(.system(size: 25, weight: .bold))
                        .foregroundColor(.red)
                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.red)
                } else {
                    Text("--")
                        .font(.system(size: 25, weight: .bold))
                        .foregroundColor(.gray)
                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            // 걸음수 표시
            VStack(spacing: 0) {
                Text("\(heartRateMonitor.stepCount)")
                    .font(.system(size: 25, weight: .bold))
                    .foregroundColor(.green)
                Text("STEPS")
                    .font(.caption)
                    .foregroundColor(.green)
            }

            // 칼로리 표시
            VStack(spacing: 0) {
                Text(String(format: "%.1f", heartRateMonitor.calories))
                    .font(.system(size: 25, weight: .bold))
                    .foregroundColor(.blue)
                Text("CALORIES")
                    .font(.caption)
                    .foregroundColor(.blue)
            }

            // 시작/중지 버튼
            if phoneConnector.isMonitoring {
                Button(action: {
                    heartRateMonitor.stopHeartRateMonitoring()
                    phoneConnector.isMonitoring = false
                }) {
                    Text("Stop")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            } else {
                Button(action: {
                    heartRateMonitor.startHeartRateMonitoring(
                        onHeartRateUpdated: { heartRate in
                            phoneConnector.sendMessageToPhone(
                                heartRate: heartRate,
                                steps: heartRateMonitor.stepCount,
                                calories: heartRateMonitor.calories
                            )
                        },
                        onStepCountUpdated: { steps in
                            phoneConnector.sendMessageToPhone(
                                heartRate: heartRateMonitor.heartRate ?? 0,
                                steps: steps,
                                calories: heartRateMonitor.calories
                            )
                        },
                        onCaloriesUpdated: { calories in
                            phoneConnector.sendMessageToPhone(
                                heartRate: heartRateMonitor.heartRate ?? 0,
                                steps: heartRateMonitor.stepCount,
                                calories: calories
                            )
                        }
                    )
                    phoneConnector.isMonitoring = true
                }) {
                    Text("Start")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
            }
        }
        .padding()
    }
}

#Preview {
    ContentView()
}

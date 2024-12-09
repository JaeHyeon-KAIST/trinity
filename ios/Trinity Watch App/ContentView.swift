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
        VStack(spacing: 10) {
            Text("Health Monitor")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 5) {
                if let heartRate = heartRateMonitor.heartRate {
                    Text("\(Int(heartRate))")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.red)
                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.red)
                } else {
                    Text("--")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.gray)
                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            VStack(spacing: 5) {
                Text("\(heartRateMonitor.stepCount)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.green)
                Text("STEPS")
                    .font(.caption)
                    .foregroundColor(.green)
            }

            if phoneConnector.isMonitoring {
                Button(action: {
                    heartRateMonitor.stopHeartRateMonitoring()
                    phoneConnector.isMonitoring = false
                }) {
                    Text("Stop")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            } else {
                Button(action: {
                    heartRateMonitor.startHeartRateMonitoring(
                        onHeartRateUpdated: { heartRate in
                            phoneConnector.sendMessageToPhone(
                                heartRate: heartRate,
                                steps: heartRateMonitor.stepCount
                            )
                        },
                        onStepCountUpdated: { steps in
                            phoneConnector.sendMessageToPhone(
                                heartRate: heartRateMonitor.heartRate ?? 0,
                                steps: steps
                            )
                        }
                    )
                    phoneConnector.isMonitoring = true
                }) {
                    Text("Start")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
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

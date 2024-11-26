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
        VStack {
            Text("Real-Time Heart Rate")
                .font(.headline)

            if let heartRate = heartRateMonitor.heartRate {
                Text("\(Int(heartRate)) bpm")
                    .font(.largeTitle)
                    .foregroundColor(.red)
            } else {
                Text("Fetching...")
                    .foregroundColor(.gray)
            }

            if phoneConnector.isMonitoring {
                Button(action: {
                    heartRateMonitor.stopHeartRateMonitoring()
                    phoneConnector.isMonitoring = false
                }) {
                    Text("Stop Monitoring")
                        .padding()
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            } else {
                Button(action: {
                    heartRateMonitor.startHeartRateMonitoring { heartRate in
                        phoneConnector.sendMessageToPhone(heartRate: heartRate)
                    }
                    phoneConnector.isMonitoring = true
                }) {
                    Text("Start Monitoring")
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
        }
        .padding()
    }
}

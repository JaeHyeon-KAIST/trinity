import Foundation
import WatchConnectivity
import SwiftUI

final class PhoneConnector: NSObject, ObservableObject, WCSessionDelegate {
    @Published var receivedMessage = "Waiting..."
    @Published var isMonitoring: Bool = false {
        didSet {
            sendMonitoringState()
        }
    }
    var session: WCSession
    private var heartRateMonitor: HeartRateMonitor?
    
    init(heartRateMonitor: HeartRateMonitor) {
        self.session = WCSession.default
        self.heartRateMonitor = heartRateMonitor
        super.init()
        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
        }
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("Session activation failed: \(error.localizedDescription)")
        } else {
            print("Session activated with state: \(activationState.rawValue)")
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        print("Message received: \(message)")
        if let messageFromPhone = message["command"] as? String {
            self.handleCommand(messageFromPhone)
            replyHandler(["status": "success"])
        }
    }
    
    private func sendMonitoringState() {
        if session.isReachable {
            let message: [String: Any] = ["monitoringState": isMonitoring]
            session.sendMessage(message, replyHandler: nil) { error in
                print("Error sending monitoring state to iPhone: \(error.localizedDescription)")
            }
        }
    }

    func sendMessageToPhone(heartRate: Double, steps: Int, calories: Double?) {
        if session.isReachable {
            let message: [String: Any] = [
                "heartRate": heartRate,
                "steps": steps,
                "calories": calories ?? 0,
                "monitoringState": isMonitoring
            ]
            session.sendMessage(message, replyHandler: nil) { error in
                print("Error sending message to iPhone: \(error.localizedDescription)")
            }
        } else {
            print("iPhone is not reachable.")
        }
    }

    func handleCommand(_ command: String) {
        DispatchQueue.main.async {
            print("Received command: \(command)")
            if command == "startMonitoring" {
                print("Start monitoring command received from iPhone.")
                self.heartRateMonitor?.startHeartRateMonitoring(
                    onHeartRateUpdated: { [weak self] heartRate in
                        self?.sendMessageToPhone(
                            heartRate: heartRate,
                            steps: self?.heartRateMonitor?.stepCount ?? 0,
                            calories: self?.heartRateMonitor?.calories
                        )
                    },
                    onStepCountUpdated: { [weak self] steps in
                        self?.sendMessageToPhone(
                            heartRate: self?.heartRateMonitor?.heartRate ?? 0.0, // 옵셔널 기본값 처리
                            steps: steps,
                            calories: self?.heartRateMonitor?.calories ?? 0.0 // 옵셔널 기본값 처리
                        )
                    },
                    onCaloriesUpdated: { [weak self] calories in
                        self?.sendMessageToPhone(
                            heartRate: self?.heartRateMonitor?.heartRate ?? 0.0, // 옵셔널 기본값 처리
                            steps: self?.heartRateMonitor?.stepCount ?? 0, // 옵셔널 기본값 처리
                            calories: calories // 이미 Double 타입
                        )
                    }
                )
                self.isMonitoring = true
            } else if command == "stopMonitoring" {
                print("Stop monitoring command received from iPhone.")
                self.heartRateMonitor?.stopHeartRateMonitoring()
                self.isMonitoring = false
            }
        }
    }
}

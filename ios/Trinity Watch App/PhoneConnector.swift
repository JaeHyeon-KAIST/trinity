import Foundation
import WatchConnectivity
import SwiftUI

final class PhoneConnector: NSObject, ObservableObject, WCSessionDelegate {
    @Published var receivedMessage = "Waiting..."
    @Published var isMonitoring: Bool = false {
        didSet {
            // isMonitoring 상태가 변경될 때마다 아이폰에 알림
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
            // 성공 응답 전송
            replyHandler(["status": "success"])
        }
    }
    
    // 모니터링 상태를 아이폰에 전송하는 메서드
    private func sendMonitoringState() {
        if session.isReachable {
            let message: [String: Any] = ["monitoringState": isMonitoring]
            session.sendMessage(message, replyHandler: nil) { error in
                print("Error sending monitoring state to iPhone: \(error.localizedDescription)")
            }
        }
    }

    func sendMessageToPhone(heartRate: Double) {
        if session.isReachable {
            let message: [String: Any] = [
                "heartRate": heartRate,
                "monitoringState": isMonitoring  // 심박수와 함께 현재 상태도 전송
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
                self.heartRateMonitor?.startHeartRateMonitoring { heartRate in
                    self.sendMessageToPhone(heartRate: heartRate)
                }
                self.isMonitoring = true
            } else if command == "stopMonitoring" {
                print("Stop monitoring command received from iPhone.")
                self.heartRateMonitor?.stopHeartRateMonitoring()
                self.isMonitoring = false
            }
        }
    }
}

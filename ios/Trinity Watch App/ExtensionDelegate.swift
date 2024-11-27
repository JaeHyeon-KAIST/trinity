import WatchKit
import WatchConnectivity

class ExtensionDelegate: NSObject, WKExtensionDelegate {
    func applicationDidFinishLaunching() {
        setupWatchConnectivity()
    }
    
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    // 백그라운드 태스크 처리
    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        for task in backgroundTasks {
            switch task {
            case let connectivityTask as WKWatchConnectivityRefreshBackgroundTask:
                // 연결성 유지
                setupWatchConnectivity()
                connectivityTask.setTaskCompletedWithSnapshot(false)
                
            case let refreshTask as WKApplicationRefreshBackgroundTask:
                // 백그라운드 리프레시
                WKExtension.shared().scheduleBackgroundRefresh(withPreferredDate: Date().addingTimeInterval(1), userInfo: nil) { _ in }
                refreshTask.setTaskCompletedWithSnapshot(false)
                
            default:
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }
}

extension ExtensionDelegate: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("Session activation failed: \(error.localizedDescription)")
        } else {
            print("Session activated with state: \(activationState.rawValue)")
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if let command = message["command"] as? String, command == "startMonitoring" {
            DispatchQueue.main.async {
                // 앱 활성화를 위한 백그라운드 태스크 실행
                WKExtension.shared().scheduleBackgroundRefresh(withPreferredDate: Date().addingTimeInterval(1), userInfo: nil) { error in
                    if let error = error {
                        print("Failed to schedule background refresh: \(error)")
                    }
                }
            }
        }
    }
}

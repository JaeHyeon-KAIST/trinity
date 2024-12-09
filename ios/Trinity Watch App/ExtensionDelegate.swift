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
    
    // Background task handling
    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        for task in backgroundTasks {
            switch task {
            case let connectivityTask as WKWatchConnectivityRefreshBackgroundTask:
                // Maintain connectivity
                setupWatchConnectivity()
                connectivityTask.setTaskCompletedWithSnapshot(false)
                
            case let refreshTask as WKApplicationRefreshBackgroundTask:
                // Background refresh
                WKExtension.shared().scheduleBackgroundRefresh(
                    withPreferredDate: Date().addingTimeInterval(15*60), // Schedule next refresh in 15 minutes
                    userInfo: nil
                ) { _ in }
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
        if let command = message["command"] as? String {
            if command == "startMonitoring" {
                DispatchQueue.main.async {
                    // Schedule background refresh to keep app active
                    WKExtension.shared().scheduleBackgroundRefresh(
                        withPreferredDate: Date().addingTimeInterval(15*60),
                        userInfo: nil
                    ) { error in
                        if let error = error {
                            print("Failed to schedule background refresh: \(error)")
                        }
                    }
                }
            }
        }
    }
}

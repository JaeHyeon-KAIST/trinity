import HealthKit
import SwiftUI

final class HeartRateMonitor: NSObject, ObservableObject {
    @Published var heartRate: Double?
    private let healthStore = HKHealthStore()
    private var activeQuery: HKAnchoredObjectQuery?
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    
    override init() {
        super.init()
    }
  
    // Method to check if HealthKit is available
    private func isHealthDataAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }
  
    // Method to check current authorization status
    private func checkAuthorizationStatus(completion: @escaping (Bool) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            completion(false)
            return
        }
        let status = healthStore.authorizationStatus(for: heartRateType)
        switch status {
        case .sharingAuthorized:
            completion(true)
        default:
            completion(false)
        }
    }
  
    // Modify startHeartRateMonitoring to include authorization check
    func startHeartRateMonitoring(onHeartRateUpdated: @escaping (Double) -> Void) {
        guard isHealthDataAvailable() else {
            print("Health data not available.")
            return
        }
        
        checkAuthorizationStatus { [weak self] authorized in
            guard let self = self else { return }
            if authorized {
                // Start monitoring directly
                self.beginHeartRateMonitoring(onHeartRateUpdated: onHeartRateUpdated)
            } else {
                // Request authorization first
                self.requestAuthorization { success in
                    if success {
                        // Start monitoring after authorization is granted
                        self.beginHeartRateMonitoring(onHeartRateUpdated: onHeartRateUpdated)
                    } else {
                        print("HealthKit authorization failed.")
                    }
                }
            }
        }
    }
  
    // Updated requestAuthorization method with completion handler
    private func requestAuthorization(completion: @escaping (Bool) -> Void) {
        let typesToShare: Set = [
            HKObjectType.workoutType(),
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        let typesToRead: Set = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        
        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
            if let error = error {
                print("Authorization failed: \(error.localizedDescription)")
            }
            completion(success)
        }
    }

    // Separated method to begin heart rate monitoring
    private func beginHeartRateMonitoring(onHeartRateUpdated: @escaping (Double) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            print("Heart rate type unavailable.")
            return
        }

        // Workout session configuration remains the same
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .other
        
        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            
            let dataSource = HKLiveWorkoutDataSource(
                healthStore: healthStore,
                workoutConfiguration: configuration
            )
            builder.dataSource = dataSource
            
            session.startActivity(with: Date())
            builder.beginCollection(withStart: Date()) { success, error in
                if !success {
                    print("Failed to begin collection: \(String(describing: error))")
                    return
                }
            }
            
            self.workoutSession = session
            self.workoutBuilder = builder
            
            let query = HKAnchoredObjectQuery(
                type: heartRateType,
                predicate: nil,
                anchor: nil,
                limit: HKObjectQueryNoLimit
            ) { [weak self] _, samples, _, _, _ in
                self?.process(samples: samples, onHeartRateUpdated: onHeartRateUpdated)
            }

            query.updateHandler = { [weak self] _, samples, _, _, _ in
                self?.process(samples: samples, onHeartRateUpdated: onHeartRateUpdated)
            }

            healthStore.execute(query)
            activeQuery = query
            
            // Enable background delivery
            healthStore.enableBackgroundDelivery(for: heartRateType, frequency: .immediate) { success, error in
                if let error = error {
                    print("Failed to enable background delivery: \(error)")
                }
            }
            
        } catch {
            print("Failed to start workout session: \(error)")
        }
    }

    func stopHeartRateMonitoring() {
        // 쿼리 중지
        if let query = activeQuery {
            healthStore.stop(query)
            activeQuery = nil
        }
        
        guard let builder = workoutBuilder else { return }
        
        // 워크아웃 세션 종료
        workoutSession?.end()
        builder.endCollection(withEnd: Date()) { [weak self] success, error in
            guard success else {
                print("Failed to end collection: \(String(describing: error))")
                return
            }
            
            builder.finishWorkout { (workout, error) in
                guard let workout = workout else {
                    print("Failed to finish workout: \(String(describing: error))")
                    return
                }
                
                print("Finished workout: \(workout)")
            }
            
            // 백그라운드 딜리버리 비활성화
            if let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) {
                self?.healthStore.disableBackgroundDelivery(for: heartRateType) { success, error in
                    if let error = error {
                        print("Failed to disable background delivery: \(error)")
                    }
                }
            }
            
            self?.workoutSession = nil
            self?.workoutBuilder = nil
        }
    }

    private func process(samples: [HKSample]?, onHeartRateUpdated: @escaping (Double) -> Void) {
        guard let samples = samples as? [HKQuantitySample] else { return }
        guard let latestSample = samples.last else { return }
        
        let heartRate = latestSample.quantity.doubleValue(for: HKUnit(from: "count/min"))
        
        // 워크아웃 빌더에 심박수 데이터 추가
        if let builder = workoutBuilder {
            builder.add([latestSample]) { success, error in
                if !success {
                    print("Failed to add heart rate samples to workout: \(String(describing: error))")
                }
            }
        }
        
        DispatchQueue.main.async {
            self.heartRate = heartRate
            onHeartRateUpdated(heartRate)
        }
    }
}

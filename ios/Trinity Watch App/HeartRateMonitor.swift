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
        requestAuthorization()
    }
    
    private func requestAuthorization() {
        // HealthKit 권한 요청
        let typesToShare: Set = [HKObjectType.workoutType()]
        let typesToRead: Set = [HKObjectType.quantityType(forIdentifier: .heartRate)!]
        
        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
            if !success {
                print("Authorization failed: \(String(describing: error))")
            }
        }
    }

    func startHeartRateMonitoring(onHeartRateUpdated: @escaping (Double) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            print("Heart rate type unavailable.")
            return
        }

        // 워크아웃 세션 설정
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .other
        
        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            
            // 워크아웃 세션 시작
            session.startActivity(with: Date())
            builder.beginCollection(withStart: Date()) { success, error in
                guard success else {
                    print("Failed to begin collection: \(String(describing: error))")
                    return
                }
            }
            
            self.workoutSession = session
            self.workoutBuilder = builder
            
            // 심박수 쿼리 설정
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
            
            // 백그라운드 딜리버리 활성화
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
        
        // 워크아웃 세션 종료
        workoutSession?.end()
        workoutBuilder?.endCollection(withEnd: Date()) { success, error in
            guard success else {
                print("Failed to end collection: \(String(describing: error))")
                return
            }
            
            self.workoutBuilder?.finishWorkout { _, error in
                if let error = error {
                    print("Failed to finish workout: \(error)")
                }
            }
        }
        
        // 백그라운드 딜리버리 비활성화
        if let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) {
            healthStore.disableBackgroundDelivery(for: heartRateType) { success, error in
                if let error = error {
                    print("Failed to disable background delivery: \(error)")
                }
            }
        }
        
        workoutSession = nil
        workoutBuilder = nil
    }

    private func process(samples: [HKSample]?, onHeartRateUpdated: @escaping (Double) -> Void) {
        guard let samples = samples as? [HKQuantitySample] else { return }
        guard let latestSample = samples.last else { return }

        let heartRate = latestSample.quantity.doubleValue(for: HKUnit(from: "count/min"))
        DispatchQueue.main.async {
            self.heartRate = heartRate
            onHeartRateUpdated(heartRate)
        }
    }
}

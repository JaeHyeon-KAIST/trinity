import HealthKit
import SwiftUI

final class HeartRateMonitor: NSObject, ObservableObject {
    @Published var heartRate: Double?
    private let healthStore = HKHealthStore()
    private var activeQuery: HKAnchoredObjectQuery?

    func startHeartRateMonitoring(onHeartRateUpdated: @escaping (Double) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            print("Heart rate type unavailable.")
            return
        }

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
        print("Heart rate monitoring started.")
    }

    func stopHeartRateMonitoring() {
        if let query = activeQuery {
            healthStore.stop(query)
            activeQuery = nil
            print("Heart rate monitoring stopped.")
        }
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

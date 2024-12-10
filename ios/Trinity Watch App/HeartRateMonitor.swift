import HealthKit
import SwiftUI

final class HeartRateMonitor: NSObject, ObservableObject {
    @Published var heartRate: Double?
    @Published var stepCount: Int = 0
    @Published var calories: Double = 0.0
    private let healthStore = HKHealthStore()
    private var activeQuery: HKAnchoredObjectQuery?
    private var stepQuery: HKQuery?
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    private var initialStepCount: Int = 0
    
    override init() {
        super.init()
    }
  
    // Method to check if HealthKit is available
    private func isHealthDataAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }
  
    // Method to check current authorization status
    private func checkAuthorizationStatus(completion: @escaping (Bool) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate),
              let stepCountType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            completion(false)
            return
        }
        
        let statusHeart = healthStore.authorizationStatus(for: heartRateType)
        let statusSteps = healthStore.authorizationStatus(for: stepCountType)
        
        switch (statusHeart, statusSteps) {
        case (.sharingAuthorized, .sharingAuthorized):
            completion(true)
        default:
            completion(false)
        }
    }
    
    private func requestAuthorization(completion: @escaping (Bool) -> Void) {
        let typesToShare: Set = [
            HKObjectType.workoutType(),
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!
        ]
        let typesToRead: Set = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!
        ]
        
        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
            if let error = error {
                print("Authorization failed: \(error.localizedDescription)")
            }
            completion(success)
        }
    }
  
    private func processCalories(samples: [HKSample]?, onCaloriesUpdated: @escaping (Double) -> Void) {
        guard let samples = samples as? [HKQuantitySample] else { return }
        guard let latestSample = samples.last else { return }

        let calorieValue = latestSample.quantity.doubleValue(for: HKUnit.kilocalorie())

        DispatchQueue.main.async {
            self.calories = calorieValue
            onCaloriesUpdated(calorieValue)
        }
    }
  
    private func startCalorieMonitoring(onCaloriesUpdated: @escaping (Double) -> Void) {
        guard let calorieType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) else {
            print("Calorie type unavailable.")
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date(), end: nil, options: .strictStartDate)

        let query = HKAnchoredObjectQuery(
            type: calorieType,
            predicate: predicate,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, _, _ in
            self?.processCalories(samples: samples, onCaloriesUpdated: onCaloriesUpdated)
        }

        query.updateHandler = { [weak self] _, samples, _, _, _ in
            self?.processCalories(samples: samples, onCaloriesUpdated: onCaloriesUpdated)
        }

        healthStore.execute(query)

        // Enable background delivery for active energy burned
        healthStore.enableBackgroundDelivery(for: calorieType, frequency: .immediate) { success, error in
            if let error = error {
                print("Failed to enable background delivery for calories: \(error)")
            }
        }
    }

    private func startStepCounting() {
        guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else { return }
        
        // Reset step count to 0
        self.stepCount = 0
        
        // Setup real-time step counting query
        let predicate = HKQuery.predicateForSamples(withStart: Date(), end: nil, options: .strictStartDate)
        
        self.stepQuery = HKObserverQuery(sampleType: stepType, predicate: predicate) { [weak self] query, completionHandler, error in
            guard error == nil else {
                print("Step counting error: \(error!.localizedDescription)")
                return
            }
            
            let stepsSampleQuery = HKSampleQuery(sampleType: stepType,
                                               predicate: predicate,
                                               limit: HKObjectQueryNoLimit,
                                               sortDescriptors: nil) { [weak self] _, results, error in
                guard let samples = results as? [HKQuantitySample],
                      error == nil else { return }
                
                let steps = samples.reduce(0) { $0 + Int($1.quantity.doubleValue(for: HKUnit.count())) }
                
                DispatchQueue.main.async {
                    self?.stepCount = steps
                }
            }
            
            self?.healthStore.execute(stepsSampleQuery)
            completionHandler()
        }
        
        if let query = stepQuery {
            healthStore.execute(query)
            
            // Enable background delivery for steps
            healthStore.enableBackgroundDelivery(for: stepType, frequency: .immediate) { success, error in
                if let error = error {
                    print("Failed to enable background delivery for steps: \(error)")
                }
            }
        }
    }

    func startHeartRateMonitoring(onHeartRateUpdated: @escaping (Double) -> Void,
                                  onStepCountUpdated: @escaping (Int) -> Void,
                                  onCaloriesUpdated: @escaping (Double) -> Void) {
        guard isHealthDataAvailable() else {
            print("Health data not available.")
            return
        }
        
        checkAuthorizationStatus { [weak self] authorized in
            guard let self = self else { return }
            if authorized {
                self.beginHeartRateMonitoring(onHeartRateUpdated: onHeartRateUpdated)
                self.startStepCounting()
                self.startCalorieMonitoring(onCaloriesUpdated: onCaloriesUpdated)
                // Setup step count updates
                self.$stepCount.sink { steps in
                    onStepCountUpdated(steps)
                }
            } else {
                self.requestAuthorization { success in
                    if success {
                        self.beginHeartRateMonitoring(onHeartRateUpdated: onHeartRateUpdated)
                        self.startStepCounting()
                        self.startCalorieMonitoring(onCaloriesUpdated: onCaloriesUpdated)
                    } else {
                        print("HealthKit authorization failed.")
                    }
                }
            }
        }
    }

    private func beginHeartRateMonitoring(onHeartRateUpdated: @escaping (Double) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            print("Heart rate type unavailable.")
            return
        }

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
            
            // Enable background delivery for heart rate
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
        // Stop queries
        if let query = activeQuery {
            healthStore.stop(query)
            activeQuery = nil
        }
        
        if let query = stepQuery {
            healthStore.stop(query)
            stepQuery = nil
        }
        
        // Reset step count
        stepCount = 0
        calories = 0.0
        
        guard let builder = workoutBuilder else { return }
        
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
            
            // Disable background delivery
            if let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate),
               let stepType = HKObjectType.quantityType(forIdentifier: .stepCount),
               let calorieType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
                self?.healthStore.disableBackgroundDelivery(for: heartRateType) { success, error in
                    if let error = error {
                        print("Failed to disable background delivery for heart rate: \(error)")
                    }
                }
                self?.healthStore.disableBackgroundDelivery(for: stepType) { success, error in
                    if let error = error {
                        print("Failed to disable background delivery for steps: \(error)")
                    }
                }
                self?.healthStore.disableBackgroundDelivery(for: calorieType) { success, error in
                    if let error = error {
                        print("Failed to disable background delivery for calories: \(error)")
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

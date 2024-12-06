import Foundation
import WeatherKit
import CoreLocation

@objc(WeatherKitModule)
class WeatherKitModule: NSObject {
    private let weatherService = WeatherService()

    // 현재 날씨 정보 가져오기
    @objc
    func getCurrentWeather(_ latitude: Double, longitude: Double, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let location = CLLocation(latitude: latitude, longitude: longitude)

        Task {
            do {
                let weather = try await weatherService.weather(for: location)
                let currentWeather = weather.currentWeather

                let temperature = currentWeather.temperature.value
                let condition = currentWeather.condition.description
                let humidity = currentWeather.humidity * 100 // 퍼센트 값
                let precipitationIntensity = currentWeather.precipitationIntensity.value // 강수 강도 (단위: km/h)
                
                // Daily Forecast에서 최고/최저 기온 및 강수량 가져오기
                let dailyForecast = weather.dailyForecast.first
                let highTemperature = dailyForecast?.highTemperature.value ?? 0
                let lowTemperature = dailyForecast?.lowTemperature.value ?? 0

                resolver([
                    "temperature": temperature,
                    "condition": condition,
                    "humidity": humidity,
                    "precipitationIntensity": precipitationIntensity,
                    "highTemperature": highTemperature,
                    "lowTemperature": lowTemperature
                ])
            } catch {
                rejecter("Error", "Unable to fetch current weather", error)
            }
        }
    }

    // 일주일 날씨 정보 가져오기
    @objc
    func getWeeklyWeather(_ latitude: Double, longitude: Double, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let location = CLLocation(latitude: latitude, longitude: longitude)

        Task {
            do {
                let weather = try await weatherService.weather(for: location)
                let weeklyForecast = weather.dailyForecast.prefix(7) // 일주일 데이터

                var weeklyData: [[String: Any]] = []

                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
                dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul") // 한국 시간대 설정

                for day in weeklyForecast {
                    let date = day.date
                    let formattedDate = dateFormatter.string(from: date) // 한국 시간으로 변환
                    let highTemperature = day.highTemperature.value
                    let lowTemperature = day.lowTemperature.value
                    let condition = day.condition.description
                    let precipitationChance = day.precipitationChance * 100 // 퍼센트 값

                    weeklyData.append([
                        "date": formattedDate,
                        "highTemperature": highTemperature,
                        "lowTemperature": lowTemperature,
                        "condition": condition,
                        "precipitationChance": precipitationChance
                    ])
                }

                resolver(weeklyData)
            } catch {
                rejecter("Error", "Unable to fetch weekly weather", error)
            }
        }
    }
}

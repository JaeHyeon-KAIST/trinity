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
                
                // Daily Forecast에서 최고/최저 기온 및 강수량 가져오기
                let dailyForecast = weather.dailyForecast.first
                let highTemperature = dailyForecast?.highTemperature.value ?? 0
                let lowTemperature = dailyForecast?.lowTemperature.value ?? 0
                let precipitationAmount = dailyForecast?.precipitationAmount.value ?? 0 // 강수량 (단위: mm)

                resolver([
                    "temperature": temperature,
                    "condition": condition,
                    "humidity": humidity,
                    "highTemperature": highTemperature,
                    "lowTemperature": lowTemperature,
                    "precipitationAmount": precipitationAmount // 추가된 강수량 데이터
                ])
            } catch {
                rejecter("Error", "Unable to fetch current weather", error)
            }
        }
    }
  
    // 시간별 날씨 정보 가져오기
    @objc
    func getHourlyWeather(_ latitude: Double, longitude: Double, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let location = CLLocation(latitude: latitude, longitude: longitude)

        Task {
            do {
                let weather = try await weatherService.weather(for: location)
                let hourlyForecast = weather.hourlyForecast.prefix(24) // 24시간 데이터 가져오기

                var hourlyData: [[String: Any]] = []

                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "HH:mm"
                dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul") // 한국 시간대

                // 자정 기준으로 데이터를 정렬
                let now = Date()
                let calendar = Calendar.current
                let todayMidnight = calendar.startOfDay(for: now)

                let beforeMidnight = hourlyForecast.filter { $0.date < todayMidnight }
                let afterMidnight = hourlyForecast.filter { $0.date >= todayMidnight }

                let sortedHourlyForecast = afterMidnight + beforeMidnight

                for hour in sortedHourlyForecast {
                    let time = hour.date
                    let formattedTime = dateFormatter.string(from: time) // 시간 형식 변환
                    let temperature = hour.temperature.value
                    let precipitationChance = hour.precipitationChance * 100 // 강수 확률 (%)

                    hourlyData.append([
                        "time": formattedTime,
                        "temperature": temperature,
                        "precipitationChance": precipitationChance
                    ])
                }

                resolver(hourlyData)
            } catch {
                rejecter("Error", "Unable to fetch hourly weather", error)
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
                let weeklyForecast = weather.dailyForecast.dropFirst(1).prefix(7) // 내일부터 7일 데이터

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
                    let precipitationAmount = day.precipitationAmount.value // 강수량 (단위: mm)

                    weeklyData.append([
                        "date": formattedDate,
                        "highTemperature": highTemperature,
                        "lowTemperature": lowTemperature,
                        "condition": condition,
                        "precipitationChance": precipitationChance,
                        "precipitationAmount": precipitationAmount // 추가된 강수량 데이터
                    ])
                }

                resolver(weeklyData)
            } catch {
                rejecter("Error", "Unable to fetch weekly weather", error)
            }
        }
    }
}

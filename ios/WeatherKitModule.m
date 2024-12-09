//
//  WeatherKitModule.m
//  trinity
//
//  Created by JaeHyeon Lee on 12/5/24.
//

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WeatherKitModule, NSObject)
RCT_EXTERN_METHOD(getCurrentWeather:(double)latitude
                     longitude:(double)longitude
                     resolver:(RCTPromiseResolveBlock)resolver
                     rejecter:(RCTPromiseRejectBlock)rejecter)

// 오늘의 시간별 날씨 정보 가져오기
RCT_EXTERN_METHOD(getHourlyWeather:(double)latitude
                     longitude:(double)longitude
                     resolver:(RCTPromiseResolveBlock)resolver
                     rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(getTwentyFourWeather:(double)latitude
                     longitude:(double)longitude
                     resolver:(RCTPromiseResolveBlock)resolver
                     rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(getWeeklyWeather:(double)latitude
                     longitude:(double)longitude
                     resolver:(RCTPromiseResolveBlock)resolver
                     rejecter:(RCTPromiseRejectBlock)rejecter)
@end

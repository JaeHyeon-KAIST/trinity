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

RCT_EXTERN_METHOD(getWeeklyWeather:(double)latitude
                     longitude:(double)longitude
                     resolver:(RCTPromiseResolveBlock)resolver
                     rejecter:(RCTPromiseRejectBlock)rejecter)
@end

import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {NativeModules} from 'react-native';

const {WeatherKitModule} = NativeModules;

import SunnySVG from '../../assets/icon/sunny.svg';
import RainySVG from '../../assets/icon/rainy.svg';
import CloudySVG from '../../assets/icon/cloudy.svg';
import PartlyCloudySVG from '../../assets/icon/partlyCloudy.svg';

interface CurrentWeather {
  temperature: number; // 현재 온도
  condition: string; // 날씨 상태
  humidity: number; // 습도 (%)
  highTemperature: number; // 최고 기온
  lowTemperature: number; // 최저 기온
  precipitationAmount: number; // 강수량 (mm)
}

interface WeeklyWeather {
  date: string; // 날짜 (ISO 형식 또는 지정된 포맷)
  highTemperature: number; // 최고 기온
  lowTemperature: number; // 최저 기온
  condition: 'sunny' | 'cloudy' | 'partlyCloudy' | 'rainy';
  precipitationChance: number; // 강수 확률 (%)
  precipitationAmount: number; // 강수량 (mm)
}

export default function Weather() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(
    null,
  );
  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeather[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (value: number): string => {
    if (value === 0) {
      return '0'; // 0은 그대로 0으로 표시
    }
    return value > 10 ? Math.round(value).toString() : value.toFixed(1);
  };

  const classifyCondition = (condition: string) => {
    const normalizedCondition = condition?.toLowerCase(); // 소문자로 변환
    if (['clear', 'mostly clear', 'hot'].includes(normalizedCondition)) {
      return 'sunny';
    }
    if (
      [
        'cloudy',
        'mostly cloudy',
        'breezy',
        'foggy',
        'haze',
        'smoky',
        'blowing dust',
        'blowing snow',
      ].includes(normalizedCondition)
    ) {
      return 'cloudy';
    }
    if (['partly cloudy'].includes(normalizedCondition)) {
      return 'partlyCloudy';
    }
    if (
      [
        'rain',
        'drizzle',
        'freezing drizzle',
        'freezing rain',
        'sleet',
        'snow',
        'heavy rain',
        'heavy snow',
        'thunderstorms',
        'scatteredthunderstorms',
        'isolatedthunderstorms',
        'wintrymix',
        'hail',
        'tropicalstorm',
        'hurricane',
      ].includes(normalizedCondition)
    ) {
      return 'rainy';
    }
    return 'sunny';
  };

  useEffect(() => {
    const fetchWeather = async () => {
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;

          try {
            // Fetch current weather
            const current = await WeatherKitModule.getCurrentWeather(
              latitude,
              longitude,
            );
            current.condition = classifyCondition(current.condition);
            setCurrentWeather(current);

            // Fetch weekly weather
            const weekly = await WeatherKitModule.getWeeklyWeather(
              latitude,
              longitude,
            );
            weekly.forEach((day: {conditionType: string; condition: any}) => {
              day.condition = classifyCondition(day.condition);
            });
            setWeeklyWeather(weekly);
          } catch (err) {
            console.error('Error fetching weather:', err);
            setError('날씨 정보를 가져오는 데 실패했습니다.');
          } finally {
            setLoading(false);
          }
        },
        error => {
          console.error('Error getting location:', error);
          setError('위치 정보를 가져오는 데 실패했습니다.');
          setLoading(false);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    };

    fetchWeather();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#000" />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Left Section: Current Weather */}
      <View style={styles.leftSection}>
        {currentWeather?.condition === 'cloudy' && (
          <CloudySVG width={100} height={100} />
        )}
        {currentWeather?.condition === 'partlyCloudy' && (
          <PartlyCloudySVG width={100} height={100} />
        )}
        {currentWeather?.condition === 'rainy' && (
          <RainySVG width={100} height={100} />
        )}
        {currentWeather?.condition === 'sunny' && ( // <SunnySVG width={110} height={110} />
          <SunnySVG width={100} height={100} />
        )}
        <Text style={styles.temperature}>
          <Text style={styles.temperatureValue}>
            {currentWeather?.temperature
              ? formatNumber(currentWeather.temperature)
              : '--'}
          </Text>
          <Text style={styles.temperatureUnit}>°C</Text>
        </Text>
        {currentWeather?.highTemperature && currentWeather?.lowTemperature ? (
          <View style={styles.highLowTemperature}>
            <Text style={styles.highLowTemperatureText}>
              H: {formatNumber(currentWeather.highTemperature)}
            </Text>
            <Text style={styles.highLowTemperatureText}>
              L:{formatNumber(currentWeather.lowTemperature)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {/* Top Section: Weekly Forecast */}
        <View style={styles.forecastContainer}>
          {weeklyWeather?.map((day, index) => (
            <View key={index} style={styles.forecastItem}>
              <Text style={styles.day}>
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                })}
              </Text>
              {day.condition === 'cloudy' && (
                <CloudySVG width={24} height={24} />
              )}
              {day.condition === 'partlyCloudy' && (
                <PartlyCloudySVG width={24} height={24} />
              )}
              {day.condition === 'rainy' && <RainySVG width={24} height={24} />}
              {day.condition === 'sunny' && <SunnySVG width={24} height={24} />}
            </View>
          ))}
        </View>

        {/* Bottom Section: Humidity and Precipitation */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>습도</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoValue}>
                {currentWeather?.humidity
                  ? formatNumber(currentWeather.humidity)
                  : '--'}
              </Text>
              <Text style={styles.infoUnit}>%</Text>
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>강수량</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoValue}>
                {currentWeather?.precipitationAmount !== undefined
                  ? formatNumber(currentWeather.precipitationAmount)
                  : '--'}
              </Text>
              <Text style={styles.infoUnit}>mm</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  leftSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#003D08',
    paddingLeft: 3,
    paddingRight: 65,
  },
  temperature: {
    position: 'absolute',
    top: 10,
    right: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  temperatureValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#003D08',
  },
  temperatureUnit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003D08',
    marginLeft: 2,
  },
  highLowTemperature: {
    position: 'absolute',
    bottom: 7,
    right: 5,
  },
  highLowTemperatureText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003D08',
  },
  rightSection: {
    flex: 2,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#003D08',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  forecastItem: {
    alignItems: 'center',
  },
  day: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003D08',
    marginBottom: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    alignItems: 'center',
    flex: 1,
  },
  infoItem: {},
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003D08',
  },
  infoText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  infoValue: {
    fontSize: 31,
    fontWeight: 'bold',
    color: '#003D08',
  },
  infoUnit: {
    fontSize: 16,
    color: '#003D08',
    marginLeft: 2,
  },
});

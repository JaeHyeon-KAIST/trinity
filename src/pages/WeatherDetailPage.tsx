import React, {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';
import {NativeModules} from 'react-native';
import CurrentWeatherSVG, {
  classifyCondition,
} from '../utils/CurrentWeatherSVG.tsx';
import dayjs from 'dayjs';

const {WeatherKitModule} = NativeModules;

interface CurrentWeather {
  temperature: number; // 현재 온도
  condition: string; // 날씨 상태
  humidity: number; // 습도 (%)
  highTemperature: number; // 최고 기온
  lowTemperature: number; // 최저 기온
  precipitationAmount: number; // 강수량 (mm)
}

interface WeatherData {
  time: string;
  temperature: number;
  condition: string;
}

interface DailyWeather {
  date: string;
  highTemperature: number;
  lowTemperature: number;
  condition: string;
}

export default function WeatherDetailPage() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(
    null,
  );
  const [hourlyWeather, sethourlyWeather] = useState<WeatherData[] | null>(
    null,
  );
  const [weeklyWeather, setWeeklyWeather] = useState<DailyWeather[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (value: number | undefined): string => {
    if (value === 0 || value === undefined) {
      return '0'; // 0은 그대로 0으로 표시
    }
    return value > 10 ? Math.round(value).toString() : value.toFixed(1);
  };

  useEffect(() => {
    const fetchWeather = async () => {
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;

          try {
            const current = await WeatherKitModule.getCurrentWeather(
              latitude,
              longitude,
            );
            const hourly = await WeatherKitModule.getTwentyFourWeather(
              latitude,
              longitude,
            );
            const weekly = await WeatherKitModule.getWeeklyWeather(
              latitude,
              longitude,
            );
            setCurrentWeather(current);
            sethourlyWeather(hourly);
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
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <SafeAreaView style={{backgroundColor: '#F4FDED', flex: 1}}>
      <HomeDetailPageContainer title="기상 정보">
        <Text style={styles.city}>대전광역시</Text>
        <View style={styles.cityTempContainer}>
          <Text style={styles.cityTempNumber}>
            {formatNumber(currentWeather?.temperature)}
          </Text>
          <Text style={styles.cityTempDegree}>°</Text>
        </View>
        <Text style={styles.cityCondition}>{currentWeather?.condition}</Text>
        <Text style={styles.cityHighLowTemp}>
          H:{Math.round(currentWeather?.highTemperature as number)}° L:
          {Math.round(currentWeather?.lowTemperature as number)}°
        </Text>
        <View style={styles.hourlyWeatherContainer}>
          <FlatList
            data={hourlyWeather}
            horizontal
            renderItem={({item}) => (
              <View style={styles.hourlyWeatherCard}>
                <Text style={styles.hourlyTime}>{item.time}</Text>
                <CurrentWeatherSVG
                  condition={classifyCondition(item.condition)}
                  size={30}
                />
                <Text style={styles.hourlyTemp}>
                  {Math.round(item.temperature) + '°'}
                </Text>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        <View style={styles.weeklyWeatherContainer}>
          {weeklyWeather && (
            <View>
              {weeklyWeather.map((day, index) => {
                const minTemp = Math.min(
                  ...weeklyWeather.map(d => d.lowTemperature),
                );
                const maxTemp = Math.max(
                  ...weeklyWeather.map(d => d.highTemperature),
                );
                const totalRange = maxTemp - minTemp;

                // 막대 시작점과 너비 계산
                const leftOffset =
                  ((day.lowTemperature - minTemp) / totalRange) * 100;
                const width =
                  ((day.highTemperature - day.lowTemperature) / totalRange) *
                  100;

                return (
                  <View key={index} style={styles.weeklyWeatherRow}>
                    <Text style={styles.weekdayText}>
                      {dayjs(day.date).format('ddd')}
                    </Text>
                    <CurrentWeatherSVG
                      condition={classifyCondition(day.condition)}
                      size={30}
                    />
                    <Text style={styles.lowTemp}>
                      {Math.round(day.lowTemperature)}°
                    </Text>
                    <View style={styles.temperatureBarContainer}>
                      <View style={styles.temperatureBar}>
                        <View
                          style={[
                            styles.temperatureRange,
                            {
                              left: `${leftOffset}%`,
                              width: `${width}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.highTemp}>
                      {Math.round(day.highTemperature)}°
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  city: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#003D08',
  },
  cityTempContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // 숫자와 기호를 겹칠 수 있도록 설정
  },
  cityTempNumber: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#003D08',
    textAlign: 'center', // 숫자가 정확히 가운데 오도록 설정
  },
  cityTempDegree: {
    fontSize: 70,
    fontWeight: 'normal',
    color: '#003D08',
    position: 'absolute', // 기호를 숫자와 겹치도록 설정
    right: -25, // 숫자 오른쪽에 배치
    top: 0, // 숫자의 위쪽에 약간 맞춰 배치
  },
  cityCondition: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#003D08',
  },
  cityHighLowTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#003D08',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  hourlyWeatherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  hourlyWeatherCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    width: 50,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hourlyTemp: {
    fontSize: 16,
    marginTop: 4,
  },
  weeklyWeatherContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    width: 380,
  },
  weeklyWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  weekdayText: {
    width: 50,
    fontSize: 16,
    fontWeight: 'bold',
  },
  lowTemp: {
    marginLeft: 10,
    fontSize: 14,
    color: 'blue',
    marginRight: 10,
  },
  highTemp: {
    fontSize: 14,
    color: 'red',
    marginLeft: 10,
  },
  temperatureBarContainer: {
    flex: 1,
    marginHorizontal: 0,
  },
  temperatureBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  temperatureRange: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#90caf9',
    borderRadius: 5,
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

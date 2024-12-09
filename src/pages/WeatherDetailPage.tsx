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
  const [hourlyWeather, sethourlyWeather] = useState<WeatherData[] | null>(
    null,
  );
  const [weeklyWeather, setWeeklyWeather] = useState<DailyWeather[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;

          try {
            const hourly = await WeatherKitModule.getTwentyFourWeather(
              latitude,
              longitude,
            );
            const weekly = await WeatherKitModule.getWeeklyWeather(
              latitude,
              longitude,
            );
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
        <Text style={styles.title}>시간별 날씨</Text>
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
        <Text style={styles.title}>주간 날씨</Text>
        <View style={styles.weeklyWeatherContainer}>
          {weeklyWeather?.map((day, index) => (
            <View key={index} style={styles.weeklyWeatherCard}>
              <Text style={styles.weekdayText}>
                {dayjs(day.date).format('ddd')}
              </Text>
              <CurrentWeatherSVG
                condition={classifyCondition(day.condition)}
                size={30}
              />
              <Text style={styles.highTemp}>
                {Math.round(day.highTemperature) + '°'}
              </Text>
              <Text style={styles.lowTemp}>
                {Math.round(day.lowTemperature) + '°'}
              </Text>
            </View>
          ))}
        </View>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  city: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
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
    marginVertical: 10,
  },
  hourlyWeatherCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    width: 60,
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
  },
  weeklyWeatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  weekdayText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
  },
  highTemp: {
    fontSize: 16,
    color: 'red',
  },
  lowTemp: {
    fontSize: 16,
    color: 'blue',
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

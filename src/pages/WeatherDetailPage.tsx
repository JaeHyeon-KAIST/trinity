import React, {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';
import {NativeModules} from 'react-native';

const {WeatherKitModule} = NativeModules;

interface HourlyWeather {
  time: string;
  temperature: number;
  precipitationChance: number;
}

export default function WeatherDetailPage() {
  const [hourlyWeather, setHourlyWeather] = useState<HourlyWeather[] | null>(
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
            // 시간별 날씨 가져오기
            const hourly = await WeatherKitModule.getHourlyWeather(
              latitude,
              longitude,
            );
            setHourlyWeather(hourly);
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
        <ScrollView contentContainerStyle={styles.container}>
          {hourlyWeather && (
            <View>
              <Text style={styles.title}>시간별 날씨</Text>
              <View style={styles.hourlyContainer}>
                {hourlyWeather.map((hour, index) => (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.hourlyText}>시간: {hour.time}</Text>
                    <Text style={styles.hourlyText}>
                      기온: {hour.temperature}°C
                    </Text>
                    <Text style={styles.hourlyText}>
                      강수 확률: {hour.precipitationChance}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
  dailyForecast: {
    marginVertical: 8,
  },
  hourlyContainer: {
    marginVertical: 16,
  },
  hourlyItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
  },
  hourlyText: {
    fontSize: 14,
  },
});

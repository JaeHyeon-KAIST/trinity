import React, {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, View, StyleSheet, ActivityIndicator} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';
import {NativeModules} from 'react-native';

const {WeatherKitModule} = NativeModules;

export default function WeatherDetailPage() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weeklyWeather, setWeeklyWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;
          console.log('현재 위치:', latitude, longitude);

          try {
            // 현재 날씨 가져오기
            const current = await WeatherKitModule.getCurrentWeather(
              latitude,
              longitude,
            );
            setCurrentWeather(current);

            // 주간 날씨 가져오기
            const weekly = await WeatherKitModule.getWeeklyWeather(
              latitude,
              longitude,
            );
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
        <View style={styles.container}>
          {currentWeather && (
            <>
              <Text style={styles.title}>현재 날씨</Text>
              <Text>기온: {currentWeather.temperature}°C</Text>
              <Text>날씨 상태: {currentWeather.condition}</Text>
              <Text>습도: {currentWeather.humidity}%</Text>
              <Text>
                강수 강도: {currentWeather.precipitationIntensity} mm/h
              </Text>
              <Text>최고 기온: {currentWeather.highTemperature}°C</Text>
              <Text>최저 기온: {currentWeather.lowTemperature}°C</Text>
            </>
          )}
          {weeklyWeather && (
            <View>
              <Text style={styles.title}>주간 예보</Text>
              {weeklyWeather.map((day, index) => (
                <View key={index}>
                  <Text>날짜: {day.date}</Text>
                  <Text>최고 기온: {day.highTemperature}°C</Text>
                  <Text>최저 기온: {day.lowTemperature}°C</Text>
                  <Text>날씨 상태: {day.condition}</Text>
                  <Text>강수 확률: {day.precipitationChance}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
});

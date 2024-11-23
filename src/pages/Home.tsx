import React, {useState, useEffect} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import AppleHealthKit from 'react-native-health';
import {SafeAreaView} from 'react-native-safe-area-context';

type HeartRateSample = {
  value: number; // 심박수 값
  startDate: string; // 측정 시간
};

export default function Home() {
  const [heartRateData, setHeartRateData] = useState<HeartRateSample | null>(
    null,
  ); // 최신 심박수 데이터
  const [error, setError] = useState<string | null>(null); // 에러 상태

  useEffect(() => {
    // HealthKit 옵션 설정
    const options = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.HeartRate], // 심박수 읽기 권한
        write: [], // 쓰기 권한 없음
      },
    };

    // HealthKit 초기화
    AppleHealthKit.initHealthKit(options, err => {
      if (err) {
        setError('Error initializing HealthKit: ' + err);
        return;
      }

      // 심박수 데이터 가져오기
      const heartRateOptions = {
        startDate: new Date(0).toISOString(), // 시작 시간을 1970년
        limit: 1, // 가장 최근 데이터 1개만 가져오기
        ascending: false, // 최신 데이터가 먼저 오도록 설정
      };

      AppleHealthKit.getHeartRateSamples(heartRateOptions, (err, results) => {
        if (err) {
          setError('Error fetching heart rate samples: ' + err);
          return;
        }

        if (results && results.length > 0) {
          const latestHeartRate = results[0]; // 가장 최신 데이터
          setHeartRateData({
            value: latestHeartRate.value, // 심박수 값
            startDate: latestHeartRate.startDate, // 측정 시간
          });
        } else {
          setError('No heart rate data available.');
        }
      });
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Latest Heart Rate</Text>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : heartRateData ? (
        <View>
          <Text style={styles.heartRate}>{heartRateData.value} bpm</Text>
          <Text style={styles.time}>
            Measured at: {new Date(heartRateData.startDate).toLocaleString()}
          </Text>
        </View>
      ) : (
        <Text style={styles.loading}>Loading...</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heartRate: {
    fontSize: 24,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  time: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
  loading: {
    fontSize: 16,
    color: '#888',
  },
});

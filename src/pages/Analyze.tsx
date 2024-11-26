import React, {useEffect, useState, useRef} from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Button,
  Alert,
  View,
  ScrollView,
  AppState,
  Platform,
} from 'react-native';
import {watchEvents, sendMessage} from 'react-native-watch-connectivity';
import BackgroundTimer from 'react-native-background-timer';
import RNBackgroundFetch from 'react-native-background-fetch';

interface HeartRateData {
  timestamp: number;
  heartRate: number;
}

interface Statistics {
  duration: number;
  totalMeasurements: number;
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
}

interface WatchMessage {
  heartRate?: number;
  monitoringState?: boolean;
  status?: string;
  heartRateData?: {
    heartRate: number;
    timestamp: number;
  };
}

export default function Analyze() {
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [watchStatus, setWatchStatus] = useState<string>('Disconnected');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<Statistics | null>(null);
  const [recentData, setRecentData] = useState<HeartRateData[]>([]);

  const heartRateDataRef = useRef<HeartRateData[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTaskRef = useRef<number | null>(null);

  // 워치 연결 상태 확인 함수
  const checkWatchConnection = async () => {
    try {
      await sendMessage(
        {command: 'checkConnection'},
        reply => {
          if (reply.status === 'connected') {
            setWatchStatus('Connected');
          }
        },
        error => {
          console.log('Watch connection check failed:', error);
          setWatchStatus('Disconnected');
        },
      );
    } catch (error) {
      console.log('Watch connection check failed:', error);
      setWatchStatus('Disconnected');
    }
  };

  // 백그라운드 작업 설정
  const setupBackgroundTask = async () => {
    try {
      // Configure background fetch
      await RNBackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // 15분
          stopOnTerminate: false,
          enableHeadless: true,
          startOnBoot: true,
          requiredNetworkType: RNBackgroundFetch.NETWORK_TYPE_NONE,
          requiresCharging: false,
          requiresDeviceIdle: false,
          requiresBatteryNotLow: false,
        },
        async taskId => {
          console.log('[BackgroundFetch] Received task:', taskId);
          if (isMonitoring) {
            await checkWatchConnection();
            // 데이터 동기화 로직 추가
            await syncHeartRateData();
          }
          RNBackgroundFetch.finish(taskId);
        },
        error => {
          console.log('[BackgroundFetch] Failed to configure:', error);
        },
      );

      // Start background fetch
      await RNBackgroundFetch.start();
    } catch (error) {
      console.log('Failed to setup background task:', error);
    }
  };

  // 워치 연결 유지
  const keepWatchConnection = () => {
    if (Platform.OS === 'ios') {
      // Start background timer
      BackgroundTimer.runBackgroundTimer(() => {
        if (isMonitoring) {
          checkWatchConnection();
          syncHeartRateData();
        }
      }, 1000);

      // Setup background fetch if not already configured
      setupBackgroundTask();
    }
  };

  // 데이터 동기화
  const syncHeartRateData = async () => {
    try {
      await sendMessage(
        {command: 'syncData'},
        (reply: WatchMessage) => {
          if (reply.heartRateData) {
            const heartRateData: HeartRateData = {
              timestamp: Date.now(),
              heartRate: Number(reply.heartRateData.heartRate),
            };
            handleNewHeartRateData(heartRateData);
          }
        },
        error => {
          console.log('Data sync failed:', error);
        },
      );
    } catch (error) {
      console.log('Failed to sync data:', error);
    }
  };

  // 새로운 심박수 데이터 처리
  const handleNewHeartRateData = (newData: HeartRateData) => {
    if (isMonitoring && startTimeRef.current) {
      heartRateDataRef.current.push(newData);
      setRecentData(prev => [...prev, newData].slice(-5));
      setHeartRate(`${newData.heartRate} bpm`);

      // 백그라운드에서 데이터 로깅
      console.log(
        `Background heart rate data: ${newData.heartRate} at ${new Date(
          newData.timestamp,
        ).toLocaleTimeString()}`,
      );
    }
  };

  // 앱 상태 변경 감지
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        if (isMonitoring) {
          checkWatchConnection();
          syncHeartRateData();
        }
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('App has gone to the background!');
        if (isMonitoring) {
          keepWatchConnection();
        }
      }
      appStateRef.current = nextAppState;
    });

    // Cleanup function
    return () => {
      subscription.remove();
      if (backgroundTaskRef.current) {
        BackgroundTimer.stopBackgroundTimer();
        RNBackgroundFetch.stop();
      }
    };
  }, [isMonitoring]);

  // 워치 이벤트 구독
  // 워치 이벤트 구독 부분 수정
  useEffect(() => {
    const unsubscribeMessage = watchEvents.on('message', (message, reply) => {
      if ('heartRate' in message) {
        const heartRateData: HeartRateData = {
          timestamp: Date.now(),
          heartRate: Number(message.heartRate),
        };
        handleNewHeartRateData(heartRateData);
      }
      if ('monitoringState' in message) {
        setIsMonitoring(Boolean(message.monitoringState));
        setIsLoading(false);
      }
    });

    const unsubscribeReachability = watchEvents.on(
      'reachability',
      reachable => {
        setWatchStatus(reachable ? 'Connected' : 'Disconnected');
      },
    );

    return () => {
      unsubscribeMessage();
      unsubscribeReachability();
    };
  }, [handleNewHeartRateData]);

  const startMonitoring = () => {
    if (watchStatus === 'Connected') {
      setIsLoading(true);
      startTimeRef.current = Date.now();
      heartRateDataRef.current = [];
      setRecentData([]);
      setSessionStats(null);

      sendMessage(
        {command: 'startMonitoring'},
        reply => {
          if (reply.status === 'success') {
            console.log('Start monitoring command sent and confirmed.');
            setIsMonitoring(true);
            keepWatchConnection();
          } else {
            Alert.alert('Error', 'Watch failed to start monitoring.');
          }
          setIsLoading(false);
        },
        error => {
          console.error('Failed to send start command:', error);
          Alert.alert('Error', 'Failed to send start command to Watch.');
          setIsLoading(false);
        },
      );
    } else {
      Alert.alert('Error', 'Watch is not connected.');
    }
  };

  const stopMonitoring = () => {
    if (watchStatus === 'Connected') {
      setIsLoading(true);
      sendMessage(
        {command: 'stopMonitoring'},
        reply => {
          if (reply.status === 'success') {
            console.log('Stop monitoring command sent and confirmed.');
            setIsMonitoring(false);

            const sessionDuration = startTimeRef.current
              ? Math.floor((Date.now() - startTimeRef.current) / 1000)
              : 0;

            if (heartRateDataRef.current.length > 0) {
              const heartRates = heartRateDataRef.current.map(
                data => data.heartRate,
              );
              const avgHeartRate =
                heartRates.reduce((a, b) => a + b) / heartRates.length;
              const maxHeartRate = Math.max(...heartRates);
              const minHeartRate = Math.min(...heartRates);

              const stats: Statistics = {
                duration: sessionDuration,
                totalMeasurements: heartRateDataRef.current.length,
                avgHeartRate: parseFloat(avgHeartRate.toFixed(1)),
                maxHeartRate,
                minHeartRate,
              };

              setSessionStats(stats);
            }

            // Cleanup
            startTimeRef.current = null;
            heartRateDataRef.current = [];
            BackgroundTimer.stopBackgroundTimer();
          } else {
            Alert.alert('Error', 'Watch failed to stop monitoring.');
          }
          setIsLoading(false);
        },
        error => {
          console.error('Failed to send stop command:', error);
          Alert.alert('Error', 'Failed to send stop command to Watch.');
          setIsLoading(false);
        },
      );
    } else {
      Alert.alert('Error', 'Watch is not connected.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Real-Time Heart Rate</Text>
        <Text style={styles.status}>Watch Status: {watchStatus}</Text>
        {heartRate ? (
          <Text style={styles.heartRate}>{heartRate}</Text>
        ) : (
          <Text style={styles.loading}>Waiting for data...</Text>
        )}

        {isMonitoring ? (
          <Button
            title="Stop Monitoring"
            onPress={stopMonitoring}
            color="red"
            disabled={isLoading}
          />
        ) : (
          <Button
            title="Start Monitoring"
            onPress={startMonitoring}
            color="green"
            disabled={isLoading}
          />
        )}

        {/* 실시간 데이터 표시 */}
        {isMonitoring && recentData.length > 0 && (
          <View style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>Recent Measurements</Text>
            {recentData.map((data, _) => (
              <Text key={data.timestamp} style={styles.dataText}>
                {new Date(data.timestamp).toLocaleTimeString()}:{' '}
                {data.heartRate} bpm
              </Text>
            ))}
          </View>
        )}

        {/* 세션 통계 표시 */}
        {sessionStats && (
          <View style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>Session Summary</Text>
            <Text style={styles.dataText}>
              Duration: {sessionStats.duration} seconds
            </Text>
            <Text style={styles.dataText}>
              Total Measurements: {sessionStats.totalMeasurements}
            </Text>
            <Text style={styles.dataText}>
              Average Heart Rate: {sessionStats.avgHeartRate} bpm
            </Text>
            <Text style={styles.dataText}>
              Maximum Heart Rate: {sessionStats.maxHeartRate} bpm
            </Text>
            <Text style={styles.dataText}>
              Minimum Heart Rate: {sessionStats.minHeartRate} bpm
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  heartRate: {
    fontSize: 24,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loading: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  dataContainer: {
    width: '90%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
});

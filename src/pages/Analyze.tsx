import React, {useEffect, useState, useRef} from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Button,
  Alert,
  View,
  ScrollView,
} from 'react-native';
import {watchEvents, sendMessage} from 'react-native-watch-connectivity';

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

export default function Analyze() {
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [watchStatus, setWatchStatus] = useState<string>('Disconnected');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<Statistics | null>(null);
  const [recentData, setRecentData] = useState<HeartRateData[]>([]);

  // 심박수 데이터를 저장할 배열
  const heartRateDataRef = useRef<HeartRateData[]>([]);
  // 모니터링 시작 시간
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribeMessage = watchEvents.on('message', (message: any) => {
      if (message.heartRate) {
        const currentHeartRate = message.heartRate;
        setHeartRate(`${currentHeartRate} bpm`);

        // 모니터링 중일 때만 데이터 저장
        if (isMonitoring && startTimeRef.current) {
          const newData = {
            timestamp: Date.now(),
            heartRate: currentHeartRate,
          };
          heartRateDataRef.current.push(newData);

          // 최근 데이터 업데이트 (최근 5개만 표시)
          setRecentData(prev => [...prev, newData].slice(-5));
        }
      }
      if (message.monitoringState !== undefined) {
        setIsMonitoring(message.monitoringState);
        setIsLoading(false);
      }
    });

    const unsubscribeReachability = watchEvents.on(
      'reachability',
      (reachable: boolean) => {
        setWatchStatus(reachable ? 'Connected' : 'Disconnected');
      },
    );

    return () => {
      unsubscribeMessage();
      unsubscribeReachability();
    };
  }, [isMonitoring]);

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

            console.log('=== Heart Rate Monitoring Session Summary ===');
            console.log(`Duration: ${sessionDuration} seconds`);
            console.log(
              `Total measurements: ${heartRateDataRef.current.length}`,
            );
            console.log(
              'Data:',
              JSON.stringify(heartRateDataRef.current, null, 2),
            );

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

              console.log('=== Statistics ===');
              console.log(`Average Heart Rate: ${avgHeartRate.toFixed(1)} bpm`);
              console.log(`Maximum Heart Rate: ${maxHeartRate} bpm`);
              console.log(`Minimum Heart Rate: ${minHeartRate} bpm`);
            }

            startTimeRef.current = null;
            heartRateDataRef.current = [];
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
            {recentData.map((data, index) => (
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

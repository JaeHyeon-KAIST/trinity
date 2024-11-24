import React, {useEffect, useState} from 'react';
import {SafeAreaView, Text, StyleSheet, Button, Alert} from 'react-native';
import {watchEvents, sendMessage} from 'react-native-watch-connectivity';

export default function Analyze() {
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [watchStatus, setWatchStatus] = useState<string>('Disconnected');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태 추가

  useEffect(() => {
    const unsubscribeMessage = watchEvents.on('message', (message: any) => {
      if (message.heartRate) {
        setHeartRate(`${message.heartRate} bpm`);
      }
      if (message.monitoringState !== undefined) {
        setIsMonitoring(message.monitoringState);
        setIsLoading(false); // 상태가 변경되면 로딩 해제
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
  }, []);

  const startMonitoring = () => {
    if (watchStatus === 'Connected') {
      setIsLoading(true); // 시작 전에 로딩 상태로 변경
      sendMessage(
        {command: 'startMonitoring'},
        reply => {
          if (reply.status === 'success') {
            console.log('Start monitoring command sent and confirmed.');
            setIsMonitoring(true);
          } else {
            Alert.alert('Error', 'Watch failed to start monitoring.');
          }
          setIsLoading(false); // 응답 받으면 로딩 해제
        },
        error => {
          console.error('Failed to send start command:', error);
          Alert.alert('Error', 'Failed to send start command to Watch.');
          setIsLoading(false); // 에러 발생시에도 로딩 해제
        },
      );
    } else {
      Alert.alert('Error', 'Watch is not connected.');
    }
  };

  const stopMonitoring = () => {
    if (watchStatus === 'Connected') {
      setIsLoading(true); // 정지 전에 로딩 상태로 변경
      sendMessage(
        {command: 'stopMonitoring'},
        reply => {
          if (reply.status === 'success') {
            console.log('Stop monitoring command sent and confirmed.');
            setIsMonitoring(false);
          } else {
            Alert.alert('Error', 'Watch failed to stop monitoring.');
          }
          setIsLoading(false); // 응답 받으면 로딩 해제
        },
        error => {
          console.error('Failed to send stop command:', error);
          Alert.alert('Error', 'Failed to send stop command to Watch.');
          setIsLoading(false); // 에러 발생시에도 로딩 해제
        },
      );
    } else {
      Alert.alert('Error', 'Watch is not connected.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          disabled={isLoading} // 로딩 중일 때 버튼 비활성화
        />
      ) : (
        <Button
          title="Start Monitoring"
          onPress={startMonitoring}
          color="green"
          disabled={isLoading} // 로딩 중일 때 버튼 비활성화
        />
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
});

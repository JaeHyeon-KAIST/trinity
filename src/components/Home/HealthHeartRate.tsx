import {
  Alert,
  AppState,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {watchEvents, sendMessage} from 'react-native-watch-connectivity';
import BackgroundTimer from 'react-native-background-timer';
import RNBackgroundFetch from 'react-native-background-fetch';
import React, {useEffect, useRef, useState} from 'react';

interface HealthData {
  timestamp: number;
  heartRate: number;
  steps: number;
}

interface Statistics {
  duration: number;
  totalMeasurements: number;
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  totalSteps: number;
}

interface WatchMessage {
  heartRate?: number;
  steps?: number;
  monitoringState?: boolean;
  status?: string;
  heartRateData?: {
    heartRate: number;
    steps: number;
    timestamp: number;
  };
}

export default function HealthHeartRate() {
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [steps, setSteps] = useState<number>(0);
  const [watchStatus, setWatchStatus] = useState<string>('Disconnected');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<Statistics | null>(null);
  const [recentData, setRecentData] = useState<HealthData[]>([]);

  const healthDataRef = useRef<HealthData[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTaskRef = useRef<number | null>(null);

  // Watch connection check
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

  // Background task setup
  const setupBackgroundTask = async () => {
    try {
      await RNBackgroundFetch.configure(
        {
          minimumFetchInterval: 15,
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
            await syncHealthData();
          }
          RNBackgroundFetch.finish(taskId);
        },
        error => {
          console.log('[BackgroundFetch] Failed to configure:', error);
        },
      );

      await RNBackgroundFetch.start();
    } catch (error) {
      console.log('Failed to setup background task:', error);
    }
  };

  // Keep watch connection
  const keepWatchConnection = () => {
    if (Platform.OS === 'ios') {
      BackgroundTimer.runBackgroundTimer(() => {
        if (isMonitoring) {
          checkWatchConnection();
          syncHealthData();
        }
      }, 1000);

      setupBackgroundTask();
    }
  };

  // Data sync
  const syncHealthData = async () => {
    try {
      await sendMessage(
        {command: 'syncData'},
        (reply: WatchMessage) => {
          if (reply.heartRateData) {
            const healthData: HealthData = {
              timestamp: Date.now(),
              heartRate: Number(reply.heartRateData.heartRate),
              steps: Number(reply.heartRateData.steps || 0),
            };
            handleNewHealthData(healthData);
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

  // Handle new health data
  const handleNewHealthData = (newData: HealthData) => {
    if (isMonitoring && startTimeRef.current) {
      healthDataRef.current.push(newData);
      setRecentData(prev => [...prev, newData].slice(-5));
      setHeartRate(`${newData.heartRate} bpm`);
      setSteps(newData.steps);

      console.log(
        `Background health data: HR: ${newData.heartRate}, Steps: ${
          newData.steps
        } at ${new Date(newData.timestamp).toLocaleTimeString()}`,
      );
    }
  };

  // App state change detection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        if (isMonitoring) {
          checkWatchConnection();
          syncHealthData();
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

    return () => {
      subscription.remove();
      if (backgroundTaskRef.current) {
        BackgroundTimer.stopBackgroundTimer();
        RNBackgroundFetch.stop();
      }
    };
  }, [isMonitoring]);

  // Watch event subscription
  useEffect(() => {
    const unsubscribeMessage = watchEvents.on(
      'message',
      (message: WatchMessage) => {
        if ('heartRate' in message && 'steps' in message) {
          const healthData: HealthData = {
            timestamp: Date.now(),
            heartRate: Number(message.heartRate),
            steps: Number(message.steps),
          };
          handleNewHealthData(healthData);
        }
        if ('monitoringState' in message) {
          const monitoringState = Boolean(message.monitoringState);

          if (monitoringState != isMonitoring) {
            setIsMonitoring(monitoringState);
            if (monitoringState) {
              startTimeRef.current = Date.now();
              healthDataRef.current = [];
              setRecentData([]);
              setSessionStats(null);
            } else {
              const sessionDuration = startTimeRef.current
                ? Math.floor((Date.now() - startTimeRef.current) / 1000)
                : 0;
              if (healthDataRef.current.length > 0) {
                const heartRates = healthDataRef.current.map(
                  data => data.heartRate,
                );
                const avgHeartRate =
                  heartRates.reduce((a, b) => a + b) / heartRates.length;
                const maxHeartRate = Math.max(...heartRates);
                const minHeartRate = Math.min(...heartRates);
                const totalSteps =
                  healthDataRef.current[healthDataRef.current.length - 1].steps;

                const stats: Statistics = {
                  duration: sessionDuration,
                  totalMeasurements: healthDataRef.current.length,
                  avgHeartRate: parseFloat(avgHeartRate.toFixed(1)),
                  maxHeartRate,
                  minHeartRate,
                  totalSteps,
                };

                setSessionStats(stats);
              }

              startTimeRef.current = null;
              healthDataRef.current = [];
            }
            setIsLoading(false);
          }
        }
      },
    );

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
  }, [isMonitoring]);

  const startMonitoring = () => {
    if (watchStatus === 'Connected') {
      setIsLoading(true);
      startTimeRef.current = Date.now();
      healthDataRef.current = [];
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

            if (healthDataRef.current.length > 0) {
              const heartRates = healthDataRef.current.map(
                data => data.heartRate,
              );
              const avgHeartRate =
                heartRates.reduce((a, b) => a + b) / heartRates.length;
              const maxHeartRate = Math.max(...heartRates);
              const minHeartRate = Math.min(...heartRates);
              const totalSteps =
                healthDataRef.current[healthDataRef.current.length - 1].steps;

              const stats: Statistics = {
                duration: sessionDuration,
                totalMeasurements: healthDataRef.current.length,
                avgHeartRate: parseFloat(avgHeartRate.toFixed(1)),
                maxHeartRate,
                minHeartRate,
                totalSteps,
              };

              setSessionStats(stats);
            }

            startTimeRef.current = null;
            healthDataRef.current = [];
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Health Monitor</Text>
      <Text style={styles.status}>Watch Status: {watchStatus}</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{heartRate ? heartRate : '--'}</Text>
          <Text style={styles.metricLabel}>Heart Rate</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{steps}</Text>
          <Text style={styles.metricLabel}>Steps</Text>
        </View>
      </View>

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

      {/* Recent data display */}
      {isMonitoring && recentData.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.sectionTitle}>Recent Measurements</Text>
          {recentData.map((data, index) => (
            <Text key={data.timestamp} style={styles.dataText}>
              {new Date(data.timestamp).toLocaleTimeString()}: {data.heartRate}{' '}
              bpm, {data.steps} steps
            </Text>
          ))}
        </View>
      )}

      {/* Session statistics display */}
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
          <Text style={styles.dataText}>
            Total Steps: {sessionStats.totalSteps}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  metricBox: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  dataContainer: {
    width: '90%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  dataText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  buttonContainer: {
    width: '90%',
    marginVertical: 20,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStart: {
    backgroundColor: '#4CAF50',
  },
  buttonStop: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

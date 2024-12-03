import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AppleHealthKit from 'react-native-health';

import HeartRateSVG from '../../assets/icon/heartRate.svg';

// Define the type for heart rate data
type HeartRateSample = {
  value: number; // Heart rate value
  startDate: string; // Measurement time
};

export default function Health() {
  const [heartRateData, setHeartRateData] = useState<HeartRateSample | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const options = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.HeartRate],
        write: [],
      },
    };

    // Initialize Apple HealthKit
    AppleHealthKit.initHealthKit(options, err => {
      if (err) {
        setError('Error initializing HealthKit: ' + err);
        return;
      }

      // Fetch heart rate samples
      const heartRateOptions = {
        startDate: new Date(0).toISOString(),
        limit: 1, // Fetch only the latest sample
        ascending: false,
      };

      AppleHealthKit.getHeartRateSamples(heartRateOptions, (err, results) => {
        if (err) {
          setError('Error fetching heart rate samples: ' + err);
          return;
        }

        if (results && results.length > 0) {
          const latestHeartRate = results[0];
          setHeartRateData({
            value: latestHeartRate.value,
            startDate: latestHeartRate.startDate,
          });
        } else {
          setError('No heart rate data available.');
        }
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <HeartRateSVG width={'100%'} />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : heartRateData ? (
        <View style={styles.heartRateContainer}>
          <Text style={styles.value}>{heartRateData.value}</Text>
          <Text style={styles.unit}>bpm</Text>
        </View> // <Text style={styles.heartRate}>{heartRateData.value}bpm</Text>
      ) : (
        <Text style={styles.loading}>Loading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  heartRateContainer: {
    flexDirection: 'row', // Arrange text horizontally
    alignItems: 'baseline', // Align the bottom of the text elements
    justifyContent: 'flex-end', // Align to the right
    width: '100%', // Make sure it spans the full width
    marginRight: 15, // Add some margin to the right
  },
  value: {
    fontSize: 48, // Larger size for the value
    fontWeight: 'bold',
    color: '#003D08',
  },
  unit: {
    fontSize: 20, // Smaller size for "bpm"
    color: '#003D08',
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  loading: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

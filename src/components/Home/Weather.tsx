import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import SunnySVG from '../../assets/icon/sunny.svg';
import RainySVG from '../../assets/icon/rainy.svg';
import CloudySVG from '../../assets/icon/cloudy.svg';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../router/Router.tsx';

export default function Weather() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      {/* Left Section: Current Weather */}
      <View style={styles.leftSection}>
        <CloudySVG width={110} height={110} />
        <Text style={styles.temperature}>
          <Text style={styles.temperatureValue}>27</Text>
          <Text style={styles.temperatureUnit}>°C</Text>
        </Text>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {/* Top Section: Weekly Forecast */}
        <View style={styles.forecastContainer}>
          {[
            {day: 'Mon', icon: <CloudySVG width={24} height={24} />},
            {
              day: 'Tue',
              icon: <CloudySVG width={24} height={24} />,
            },
            {day: 'Wed', icon: <RainySVG width={24} height={24} />},
            {
              day: 'Thu',
              icon: <RainySVG width={24} height={24} />,
            },
            {day: 'Fri', icon: <SunnySVG width={24} height={24} />},
            {
              day: 'Sat',
              icon: <SunnySVG width={24} height={24} />,
            },
            {day: 'Sun', icon: <SunnySVG width={24} height={24} />},
          ].map((item, index) => (
            <View key={index} style={styles.forecastItem}>
              <Text style={styles.day}>{item.day}</Text>
              {item.icon}
            </View>
          ))}
        </View>

        {/* Bottom Section: Humidity and Precipitation */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>습도</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoValue}>78</Text>
              <Text style={styles.infoUnit}>%</Text>
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>강수량</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoValue}>200</Text>
              <Text style={styles.infoUnit}>mm</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  leftSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#003D08',
    paddingLeft: 5,
    paddingRight: 40,
  },
  temperature: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  temperatureValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#003D08',
  },
  temperatureUnit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003D08',
    marginLeft: 2,
  },
  rightSection: {
    flex: 2,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#003D08',
    padding: 10,
  },
  forecastItem: {
    alignItems: 'center',
  },
  day: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003D08',
    marginBottom: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    alignItems: 'center',
    flex: 1,
  },
  infoItem: {},
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003D08',
  },
  infoText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  infoValue: {
    fontSize: 31,
    fontWeight: 'bold',
    color: '#003D08',
  },
  infoUnit: {
    fontSize: 16,
    color: '#003D08',
    marginLeft: 2,
  },
});

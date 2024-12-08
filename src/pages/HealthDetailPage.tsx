import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet} from 'react-native';
import React from 'react';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';
import HealthHeartRate from '../components/Home/HealthHeartRate.tsx';

export default function HealthDetailPage() {
  return (
    <SafeAreaView style={{backgroundColor: '#F4FDED', flex: 1}}>
      <HomeDetailPageContainer title="건강">
        <HealthHeartRate />
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, View} from 'react-native';
import Health from '../components/Home/Health.tsx';
import HomeDetailPageContainer from '../components/Home/HomeDetailPageContainer.tsx';
import Weather from '../components/Home/Weather.tsx';
import Remark from '../components/Home/Remark.tsx';
import WorkList from '../components/Home/WorkList.tsx';
import {useState} from 'react';

export default function Home() {
  const [progress, setProgress] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Single Component: Full Width */}
      <HomeDetailPageContainer
        title="기상정보"
        direction={'WeatherDetail'}
        fullWidth>
        <Weather />
      </HomeDetailPageContainer>
      {/* Two Components in a Row: Equal Width */}
      <View style={styles.row}>
        <HomeDetailPageContainer title="특이사항" direction={'RemarkDetail'}>
          <Remark />
        </HomeDetailPageContainer>
        <HomeDetailPageContainer title="건강" direction={'HealthDetail'}>
          <Health />
        </HomeDetailPageContainer>
      </View>

      <HomeDetailPageContainer
        title="오늘의 할 일"
        tailText={`진행도 ${progress}%`}
        customHeight={320}
        fullWidth>
        <WorkList setProgess={setProgress} />
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F4FDED',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row', // Align items horizontally
    justifyContent: 'space-between', // Space between components
    alignItems: 'center',
  },
});

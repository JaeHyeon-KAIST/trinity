import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, Text, View} from 'react-native';
import Health from '../components/Home/Health.tsx';
import HomeDetailPageContainer from '../components/Home/HomeDetailPageContainer.tsx';
import WeatherComponent from '../components/Home/WeatherComponent.tsx';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Single Component: Full Width */}
      <HomeDetailPageContainer title="기상정보" fullWidth>
        <WeatherComponent />
      </HomeDetailPageContainer>

      {/* Two Components in a Row: Equal Width */}
      <View style={styles.row}>
        <HomeDetailPageContainer title="특이사항">
          <View>
            <Text>병충해를 감지하였습니다.</Text>
          </View>
        </HomeDetailPageContainer>
        <HomeDetailPageContainer title="건강">
          <Health />
        </HomeDetailPageContainer>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row', // Align items horizontally
    justifyContent: 'space-between', // Space between components
    alignItems: 'center',
  },
});

import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, Text, View} from 'react-native';
import Health from '../components/Home/Health.tsx';
import HomeComponent from '../components/Home/HomeComponent.tsx';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Single Component: Full Width */}
      <HomeComponent title="기상정보" fullWidth>
        <View>
          <Text>기상정보</Text>
        </View>
      </HomeComponent>

      {/* Two Components in a Row: Equal Width */}
      <View style={styles.row}>
        <HomeComponent title="특이사항">
          <View>
            <Text>병충해를 감지하였습니다.</Text>
          </View>
        </HomeComponent>
        <HomeComponent title="건강">
          <Health />
        </HomeComponent>
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

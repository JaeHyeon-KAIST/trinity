import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, View} from 'react-native';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';

export default function WeatherDetailPage() {
  return (
    <SafeAreaView>
      <HomeDetailPageContainer title="기상 정보">
        <View>
          <Text>기상 정보</Text>
        </View>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, View} from 'react-native';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';

export default function RemarkDetailPage() {
  return (
    <SafeAreaView style={{backgroundColor: '#F4FDED'}}>
      <HomeDetailPageContainer title="특이사항">
        <View>
          <Text>특이사항</Text>
        </View>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

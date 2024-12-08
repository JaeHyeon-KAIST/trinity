import {Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function Tab1() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F4FDED',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>User Setting</Text>
    </SafeAreaView>
  );
}

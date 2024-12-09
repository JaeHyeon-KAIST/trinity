import {Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import {useEffect} from 'react';
import requestUserPermission from '../utils/requestUserPermission.tsx';

export default function Tab1() {
  useEffect(() => {
    const fetchFCMToken = async () => {
      const token = await requestUserPermission();
      if (token) {
        Clipboard.setString(token);
        console.log('FCM Token:', token);
      }
    };

    fetchFCMToken();
  }, []);

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

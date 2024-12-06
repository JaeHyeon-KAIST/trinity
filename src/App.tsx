import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Router from './router/Router.tsx';
import {StatusBar} from 'react-native';
import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import pushNotification from './utils/pushNotification.tsx';
import requestUserPermission from './utils/requestUserPermission.tsx';

function App(): React.JSX.Element {
  useEffect(() => {
    requestUserPermission();
  }, []);

  useEffect(() => {
    return messaging().onMessage(async remoteMessage => {
      await pushNotification(remoteMessage);
    });
  }, []);

  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F4FDED" />
        <Router />
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

export default App;

import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Router from './router/Router.tsx';
import {StatusBar} from 'react-native';
import {createContext, useEffect, useState} from 'react';
import messaging from '@react-native-firebase/messaging';
import pushNotification from './utils/pushNotification.tsx';
import requestUserPermission from './utils/requestUserPermission.tsx';

export const chatGPTContext = createContext<{
  message: string;
  setMessage: (message: string) => void;
}>({
  message: '',
  setMessage: () => {},
});

function App(): React.JSX.Element {
  const [message, setMessage] = useState(''); // Context 상태 관리

  useEffect(() => {
    requestUserPermission();
  }, []);

  useEffect(() => {
    return messaging().onMessage(async remoteMessage => {
      await pushNotification(remoteMessage);
    });
  }, []);

  return (
    <chatGPTContext.Provider value={{message, setMessage}}>
      <NavigationContainer>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#F4FDED" />
          <Router />
        </SafeAreaProvider>
      </NavigationContainer>
    </chatGPTContext.Provider>
  );
}

export default App;

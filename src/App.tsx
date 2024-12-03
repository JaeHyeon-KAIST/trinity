import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Router from './router/Router.tsx';
import {StatusBar} from 'react-native';

function App(): React.JSX.Element {
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

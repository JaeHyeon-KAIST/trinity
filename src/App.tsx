import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Router from './router/Router.tsx';

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <Router />
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

export default App;

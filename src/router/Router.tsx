import {createStackNavigator} from '@react-navigation/stack';
import TabNavigator from './TabNavigator.tsx';
import WeatherDetailPage from '../pages/WeatherDeatilPage.tsx';

const Stack = createStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  MainTab: undefined;
  WeatherDetail: undefined;
};

export default function Router() {
  return (
    <Stack.Navigator initialRouteName="MainTab">
      <Stack.Group screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTab" component={TabNavigator} />
        <Stack.Screen name="WeatherDetail" component={WeatherDetailPage} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

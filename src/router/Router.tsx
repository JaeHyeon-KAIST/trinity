import {createStackNavigator} from '@react-navigation/stack';
import TabNavigator from './TabNavigator.tsx';
import WeatherDetailPage from '../pages/WeatherDetailPage.tsx';
import RemarkDetailPage from '../pages/RemarkDetailPage.tsx';
import HealthDetailPage from '../pages/HealthDetailPage.tsx';
import ConnectChatPage from '../pages/ConnectChatPage.tsx';
import WorkoutPage from '../pages/WorkoutPage.tsx';

const Stack = createStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  MainTab: undefined;
  WeatherDetail: undefined;
  RemarkDetail: undefined;
  HealthDetail: undefined;
  ConnectChat: {userId: string};
  Workout: undefined;
};

export default function Router() {
  return (
    <Stack.Navigator initialRouteName="MainTab">
      <Stack.Group screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTab" component={TabNavigator} />
        <Stack.Screen name="WeatherDetail" component={WeatherDetailPage} />
        <Stack.Screen name="RemarkDetail" component={RemarkDetailPage} />
        <Stack.Screen name="HealthDetail" component={HealthDetailPage} />
        <Stack.Screen name="ConnectChat" component={ConnectChatPage} />
        <Stack.Screen name="Workout" component={WorkoutPage} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

import {createStackNavigator} from '@react-navigation/stack';
import TabNavigator from './TabNavigator.tsx';

const Stack = createStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  MainTab: undefined;
};

export default function Router() {
  return (
    <Stack.Navigator initialRouteName="MainTab">
      <Stack.Group screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTab" component={TabNavigator} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootStackParamList} from './Router.tsx';

import Tab1 from '../pages/Tab1.tsx';
import Chat from '../pages/Chat.tsx';
import Home from '../pages/Home.tsx';
import Analyze from '../pages/Analyze.tsx';
import Profile from '../pages/Profile.tsx';

import Tab1SVG from '../assets/icon/tab1.svg';
import ChatSVG from '../assets/icon/chat.svg';
import HomeSVG from '../assets/icon/home.svg';
import AnalyzeSVG from '../assets/icon/analyze.svg';
import ProfileSVG from '../assets/icon/profile.svg';

export type BottomTabParamList = {
  Tab1: undefined;
  Chat: undefined;
  Home: undefined;
  Analyze: undefined;
  Profile: undefined;
} & RootStackParamList;

const Bottom = createBottomTabNavigator<BottomTabParamList>();

const Tab1Icon = () => <Tab1SVG height={25} />;
const ChatIcon = () => <ChatSVG height={25} />;
const HomeIcon = () => <HomeSVG height={25} />;
const AnalyzeIcon = () => <AnalyzeSVG height={25} />;
const ProfileIcon = () => <ProfileSVG height={25} />;

export default function TabNavigator() {
  return (
    <>
      <Bottom.Navigator
        screenOptions={{
          tabBarShowLabel: false, // 텍스트 숨기기
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#F4FDED', // 탭바 배경색 설정
            height: 60,
          },
        }}>
        <Bottom.Screen
          name="Tab1"
          component={Tab1}
          options={{tabBarIcon: Tab1Icon}}
        />
        <Bottom.Screen
          name="Chat"
          component={Chat}
          options={{tabBarIcon: ChatIcon}}
        />
        <Bottom.Screen
          name="Home"
          component={Home}
          options={{tabBarIcon: HomeIcon}}
        />
        <Bottom.Screen
          name="Analyze"
          component={Analyze}
          options={{tabBarIcon: AnalyzeIcon}}
        />
        <Bottom.Screen
          name="Profile"
          component={Profile}
          options={{tabBarIcon: ProfileIcon}}
        />
      </Bottom.Navigator>
    </>
  );
}

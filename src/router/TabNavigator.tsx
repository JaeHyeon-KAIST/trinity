import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootStackParamList} from './Router.tsx';

import Tab1 from '../pages/Tab1.tsx';
import Chat from '../pages/Chat.tsx';
import Home from '../pages/Home.tsx';
import Note from '../pages/Note.tsx';
import Connect from '../pages/Connect.tsx';

import Tab1SVG from '../assets/icon/tab1.svg';
import ChatSVG from '../assets/icon/chat.svg';
import ChatSelectedSVG from '../assets/icon/chatSelected.svg';
import HomeSVG from '../assets/icon/home.svg';
import HomeSelectedSVG from '../assets/icon/homeSelected.svg';
import NoteSVG from '../assets/icon/note.svg';
import NoteSelectedSVG from '../assets/icon/noteSelected.svg';
import ConnectSVG from '../assets/icon/connect.svg';
import ConnectSelectedSVG from '../assets/icon/connectSelected.svg';

export type BottomTabParamList = {
  Tab1: undefined;
  Chat: undefined;
  Home: undefined;
  Note: undefined;
  Connect: undefined;
} & RootStackParamList;

const Bottom = createBottomTabNavigator<BottomTabParamList>();

const Tab1Icon = () => <Tab1SVG height={25} />;
const ChatIcon = ({focused}: {focused: boolean}) =>
  focused ? <ChatSelectedSVG height={25} /> : <ChatSVG height={25} />;
const HomeIcon = ({focused}: {focused: boolean}) =>
  focused ? <HomeSelectedSVG height={25} /> : <HomeSVG height={25} />;
const NoteIcon = ({focused}: {focused: boolean}) =>
  focused ? <NoteSelectedSVG height={25} /> : <NoteSVG height={25} />;
const ConnectIcon = ({focused}: {focused: boolean}) =>
  focused ? <ConnectSelectedSVG height={25} /> : <ConnectSVG height={25} />;

export default function TabNavigator() {
  return (
    <>
      <Bottom.Navigator
        initialRouteName={'Home'}
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
          name="Note"
          component={Note}
          options={{tabBarIcon: NoteIcon}}
        />
        <Bottom.Screen
          name="Connect"
          component={Connect}
          options={{tabBarIcon: ConnectIcon}}
        />
      </Bottom.Navigator>
    </>
  );
}

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../router/Router.tsx';
import {FlashList} from '@shopify/flash-list';
import ConnectMessage from '../components/Connect/ConnectMessage.tsx';
import MessageInput from '../components/Chat/MessageInput.tsx';
import {chatGPTContext} from '../App.tsx';

interface Message {
  user: string;
  message: string;
}

export default function ConnectChatPage() {
  const {message, setMessage} = useContext(chatGPTContext);
  const route = useRoute<RouteProp<RootStackParamList, 'ConnectChat'>>();
  const {userId} = route.params;

  const [serverState, setServerState] = useState('Loading...');
  const [serverMessages, setServerMessages] = useState<Message[]>([
    {
      user: 'expert',
      message: '안녕하세요, 무엇을 도와드릴까요?',
    },
    {
      user: 'user',
      message: '안녕하세요, 대파는 어떻게 먹어야 하나요?',
    },
    {
      user: 'expert',
      message: '라면에 파송송 해서 먹으세요!',
    },
  ]); // 타입 명시

  const serverMessagesList: Message[] = [
    {
      user: 'expert',
      message: '안녕하세요, 무엇을 도와드릴까요?',
    },
    {
      user: 'user',
      message: '안녕하세요, 대파는 어떻게 먹어야 하나요?',
    },
    {
      user: 'expert',
      message: '라면에 파송송 해서 먹으세요!',
    },
  ];
  const webSocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    webSocket.current = new WebSocket('wss://trinity.jaehyeon.com');

    webSocket.current.onopen = () => {
      setServerState('Connected to the server');
    };

    webSocket.current.onmessage = e => {
      let parse = JSON.parse(e.data);
      serverMessagesList.push(parse);
      setServerMessages([...serverMessagesList]);
    };

    webSocket.current.onerror = e => {
      setServerState(e.message);
    };

    webSocket.current.onclose = () => {
      setServerState('Disconnected. Check internet or server.');
    };

    return () => {
      webSocket.current?.close();
    };
  }, []);

  const sendMessage = (message: string) => {
    let str = JSON.stringify({user: userId, message: message});
    webSocket.current?.send(str);
  };

  const onClickSendGPTMessage = () => {
    sendMessage(message);
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>넙죽이 베테랑님의 교실</Text>
        <View style={styles.divider} />
        {serverState === 'Loading...' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003D08" />
            <Text style={styles.loadingText}>서버 연결 중...</Text>
          </View>
        ) : (
          <>
            <View style={styles.chatContainer}>
              <View style={styles.schedule}>
                <Text style={styles.scheduleTitle}>일정</Text>
                <View style={styles.scheduleTextContainer}>
                  <Text style={styles.scheduleText}>
                    10:00 넙죽이 베테랑님과 원격 미팅 예정
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <FlashList
                data={serverMessages}
                renderItem={({item}) => (
                  <ConnectMessage user={item.user} message={item.message} />
                )}
                estimatedItemSize={400}
                keyboardDismissMode={'on-drag'}
              />
            </View>
            {message !== '' &&
              message !== 'GPT: 안녕하세요! 무엇을 도와드릴까요?' && (
                <TouchableOpacity
                  onPress={onClickSendGPTMessage}
                  style={styles.buttonContainer}
                  activeOpacity={0.7}>
                  <Text style={styles.buttonText}>
                    GPT 답변 전문가한테 물어보기
                  </Text>
                </TouchableOpacity>
              )}
            <KeyboardAvoidingView behavior="padding">
              <MessageInput onShouldSendMessage={sendMessage} />
            </KeyboardAvoidingView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F4FDED',
  },
  container: {
    flex: 1,
    margin: 10,
    borderWidth: 1.5,
    borderColor: '#003D08',
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003D08',
    textAlign: 'left',
    marginVertical: 25,
    marginLeft: 10,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#003D08',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#003D08',
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
  },
  schedule: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003D08',
  },
  scheduleTextContainer: {
    marginTop: 5,
    marginLeft: -5,
    marginRight: 20,
    marginBottom: 10,
    borderRadius: 50,
    borderWidth: 1,
    padding: 5,
  },
  scheduleText: {
    paddingLeft: 5,
    fontSize: 16,
    color: '#003D08',
  },
  buttonContainer: {
    backgroundColor: '#E3F2D3',
    borderWidth: 1,
    borderColor: '#3C8031',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 60,
    marginBottom: 10,
  },
  buttonText: {
    color: '#003D08',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

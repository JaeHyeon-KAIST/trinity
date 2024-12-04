import {KeyboardAvoidingView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MessageInput from '../components/Chat/MessageInput.tsx';
import {useEffect, useMemo, useState} from 'react';
import {Message, Role} from '../utils/Interfaces.tsx';
import {FlashList} from '@shopify/flash-list';
import ChatMessage from '../components/Chat/ChatMessage.tsx';
import OpenAI from 'react-native-openai';

const DUMMY_MESSAGES: Message[] = [
  {
    content: '오늘의 날씨는 어떤가요?',
    role: Role.User,
  },
  {
    content: '오늘의 날씨는 맑아요! 기온은 27도입니다.',
    role: Role.Bot,
  },
  {
    content:
      '안녕하세요 ㅡ링날ㅇㄴㅁㄹㄴ아라ㅐㄴㅇㄹㄴㅇㄹㄴ아 ㅏ리ㅏㅇ ㅇ나래ㅔ ㄴㅇㅁ란이;ㅏ 리;ㅇ니;라 ;ㄴ이ㅏ리;ㄴㅇ ㄴ알 ;ㅣㄴㅇ마리; ㄴㅇ마 ;망ㄹ;ㅣ ㅏㄴㅇ',
    role: Role.User,
  },
  {
    content:
      '안녕하세요 sdjfodspak sdfo dsf posdaf opsdfpdsk ofdskpo dfsop dsokf dskopfk dspkfp dsopfkdpso kfopsdkpofksdop kfpo ak',
    role: Role.Bot,
  },
  {
    content:
      '안녕하세요 kfopdsk dsf sdkopf sdokf osdkopf ksdopkf opsdkfopkdspo fposd',
    role: Role.User,
  },
  {
    content: '안녕하세요',
    role: Role.Bot,
  },
  {
    content: '안녕하세요',
    role: Role.User,
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(DUMMY_MESSAGES);

  const openAI = useMemo(
    () =>
      new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
        organization: 'personal',
      }),
    [],
  );

  const getCompletion = async (message: string) => {
    if (!message.trim()) {
      return;
    }

    console.log('sending message', message);
    // Add the user's message and an empty bot message to the list
    setMessages(prevMessages => [
      ...prevMessages,
      {content: message, role: Role.User},
      {content: '', role: Role.Bot}, // Placeholder for the bot's response
    ]);

    openAI.chat.stream({
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'gpt-3.5-turbo',
    });
  };

  useEffect(() => {
    const handleNewMessage = (payload: any) => {
      console.log('received message', payload);
      setMessages(messages => {
        const newMessage = payload.choices[0]?.delta.content;
        if (newMessage) {
          messages[messages.length - 1].content += newMessage;
          return [...messages];
        }

        if (payload.choices[0]?.finishReason) {
          console.log('stream finished', messages);
        }
        return messages;
      });
    };

    openAI.chat.addListener('onChatMessageReceived', handleNewMessage);

    return () => {
      openAI.chat.removeListener('onChatMessageReceived');
    };
  }, [openAI]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        {messages.length === 0 && <Text>대화를 시작해보세요!</Text>}
        <FlashList
          data={messages}
          renderItem={({item}) => <ChatMessage {...item} />}
          estimatedItemSize={400}
          keyboardDismissMode="on-drag"
        />
      </View>
      <KeyboardAvoidingView behavior="padding">
        <MessageInput onShouldSendMessage={getCompletion} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Make SafeAreaView take the full screen
  },
  chatContainer: {
    flex: 1, // Make the red background fill available space
  },
});

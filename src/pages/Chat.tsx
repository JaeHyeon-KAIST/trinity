import {KeyboardAvoidingView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useState} from 'react';
import {FlashList} from '@shopify/flash-list';
import axios, {AxiosError} from 'axios';
import MessageInput from '../components/Chat/MessageInput';
import ChatMessage from '../components/Chat/ChatMessage';
import {Message, Role} from '../utils/Interfaces';

const START_MESSAGES: Message[] = [
  {
    content: '안녕하세요! 무엇을 도와드릴까요?',
    role: Role.Bot,
  },
];

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANCE_ID = process.env.ASSISTANCE_ID;
const THREADS_API_URL = 'https://api.openai.com/v1/threads';

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured');
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(START_MESSAGES);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const initializeThread = async () => {
    try {
      const response = await axios.post(
        THREADS_API_URL,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2', // Changed to v2
          },
        },
      );

      const newThreadId = response.data.id;
      if (newThreadId) {
        setThreadId(newThreadId);
        return newThreadId;
      } else {
        throw new Error('No threadId found in response');
      }
    } catch (error) {
      console.error(
        'Error creating thread:',
        (error as AxiosError).response?.data || error,
      );
      throw error;
    }
  };

  const getCompletion = async (message: string) => {
    if (!message.trim()) {
      return;
    }

    let currentThreadId = threadId;
    if (!currentThreadId) {
      try {
        currentThreadId = await initializeThread();
      } catch (error) {
        setMessages(prev => [
          ...prev,
          {
            content: '스레드 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
            role: Role.Bot,
          },
        ]);
        return;
      }
    }

    setLoading(true);
    setMessages(prev => [...prev, {content: message, role: Role.User}]);

    try {
      // Add the message to the thread
      await axios.post(
        `${THREADS_API_URL}/${currentThreadId}/messages`,
        {
          role: 'user',
          content: message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2', // Changed to v2
          },
        },
      );

      // Create and wait for the run
      const runResponse = await axios.post(
        `${THREADS_API_URL}/${currentThreadId}/runs`,
        {
          assistant_id: ASSISTANCE_ID,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2', // Changed to v2
          },
        },
      );

      const runId = runResponse.data.id;

      // Poll for run completion
      let runStatus = 'queued';
      let maxAttempts = 60; // Maximum 60 seconds timeout
      let attempts = 0;

      while (
        runStatus !== 'completed' &&
        runStatus !== 'failed' &&
        attempts < maxAttempts
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await axios.get(
          `${THREADS_API_URL}/${currentThreadId}/runs/${runId}`,
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2', // Changed to v2
            },
          },
        );

        runStatus = statusResponse.data.status;
        attempts++;
      }

      if (runStatus === 'completed') {
        const messagesResponse = await axios.get(
          `${THREADS_API_URL}/${currentThreadId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2', // Changed to v2
            },
          },
        );

        const lastMessage = messagesResponse.data.data[0];
        if (lastMessage && lastMessage.role === 'assistant') {
          setMessages(prev => [
            ...prev,
            {
              content: lastMessage.content[0].text.value,
              role: Role.Bot,
            },
          ]);
        }
      } else {
        throw new Error(
          runStatus === 'failed' ? 'Run failed' : 'Run timed out',
        );
      }
    } catch (error) {
      console.error(
        'Error in conversation:',
        (error as AxiosError).response?.data || error,
      );
      setMessages(prev => [
        ...prev,
        {
          content: '오류가 발생했습니다. 다시 시도해주세요.',
          role: Role.Bot,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.chatContainer}>
        {messages.length === 0 && <Text>대화를 시작해보세요!</Text>}
        <FlashList
          data={messages}
          renderItem={({item}) => <ChatMessage {...item} />}
          estimatedItemSize={400}
          keyboardDismissMode="on-drag"
        />
        {loading && <Text style={styles.loading}>GPT가 답변 중입니다...</Text>}
      </View>
      <KeyboardAvoidingView behavior="padding">
        <MessageInput onShouldSendMessage={getCompletion} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDED',
  },
  chatContainer: {
    flex: 1,
  },
  loading: {
    textAlign: 'center',
    padding: 10,
    color: 'gray',
  },
});

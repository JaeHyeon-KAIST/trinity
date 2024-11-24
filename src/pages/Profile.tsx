import React, {useEffect, useState} from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {sendMessage, watchEvents} from 'react-native-watch-connectivity';

export default function Profile() {
  const [messageFromWatch, setMessageFromWatch] = useState('Waiting...');
  const [message, setMessage] = useState('');

  const messageListener = () =>
    //여기로 메시지 들어옴
    watchEvents.on('message', (message: any) => {
      setMessageFromWatch(message.watchMessage);
    });

  useEffect(() => {
    messageListener();
  }, []);

  return (
    <SafeAreaView>
      <Text>Received from Watch App!</Text>
      <Text>{messageFromWatch}</Text>
      <Text>Send to Watch App!</Text>
      <TextInput placeholder="Message" onChangeText={setMessage}>
        {message}
      </TextInput>

      <TouchableOpacity
        onPress={() =>
          sendMessage(
            {messageFromApp: message},
            reply => {
              console.log(reply);
            },
            error => {
              if (error) {
                Alert.alert('메시지 전송 실패 🤔');
              }
            },
          )
        }>
        <Text>SEND!</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

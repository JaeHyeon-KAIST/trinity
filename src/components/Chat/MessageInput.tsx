import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useState} from 'react';
import {Colors} from 'react-native/Libraries/NewAppScreen';

export type MessageInputProps = {
  onShouldSendMessage: (message: string) => void;
};

export default function MessageInput({onShouldSendMessage}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const onSend = () => {
    if (!message.trim()) {
      return;
    }
    onShouldSendMessage(message);
    setMessage(''); // Clear the input field
  };

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          autoFocus
          placeholder="메시지를 입력"
          style={styles.messageInput}
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={onSend}>
          <Text>전송</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 10,
    borderColor: 'gray',
    backgroundColor: Colors.light,
  },
});

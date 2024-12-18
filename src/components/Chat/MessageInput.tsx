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
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          autoFocus
          placeholder="메시지를 입력"
          style={styles.messageInput}
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={onSend}
          activeOpacity={0.7}>
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 20,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    borderBottomWidth: 0,
    borderRadius: 20,
    padding: 10,
    borderColor: 'gray',
    backgroundColor: Colors.light,
  },
  sendButton: {
    borderRadius: 15,
    padding: 10,
    backgroundColor: '#E3F2D3',
    borderWidth: 1,
    borderColor: '#3C8031',
  },
  sendButtonText: {
    color: '#003D08',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

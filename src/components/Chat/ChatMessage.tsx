import {Message, Role} from '../../utils/Interfaces.tsx';
import {Image, StyleSheet, Text, View} from 'react-native';

export default function ChatMessage({content, role}: Message) {
  return (
    <View style={styles.row}>
      {role === Role.Bot ? (
        <View style={styles.item}>
          <Image
            style={styles.btnImage}
            source={require('../../assets/icon/gptLogoWhite.png')}
          />
        </View>
      ) : (
        <View style={styles.item}>
          <Image
            style={styles.btnImage}
            source={require('../../assets/icon/gptLogoWhite.png')}
          />
        </View>
      )}
      <Text style={styles.text}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    gap: 14,
    marginVertical: 12,
  },
  item: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  btnImage: {
    margin: 6,
    width: 16,
    height: 16,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000',
  },
  text: {
    padding: 4,
    fontSize: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  previewImage: {
    width: 240,
    height: 240,
    borderRadius: 10,
  },
  loading: {
    justifyContent: 'center',
    height: 26,
    marginLeft: 14,
  },
});

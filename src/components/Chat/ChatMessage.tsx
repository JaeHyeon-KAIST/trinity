import {Message, Role} from '../../utils/Interfaces';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {BottomTabParamList} from '../../router/TabNavigator.tsx';

interface ChatMessageProps extends Message {
  isLast: boolean; // isLast 프로퍼티 추가
}

export default function ChatMessage({content, role, isLast}: ChatMessageProps) {
  const isUser = role === Role.User;
  const navigation = useNavigation<NavigationProp<BottomTabParamList>>();

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{content}</Text>
        </View>
        <View style={styles.userAvatar}>
          <Image
            style={styles.btnImage}
            source={require('../../assets/icon/nupjuk.png')}
          />
        </View>
      </View>
    );
  }

  return (
    <>
      {isLast ? (
        <View>
          <View style={styles.botContainer}>
            <View style={styles.botAvatar}>
              <Image
                style={styles.btnImage}
                source={require('../../assets/icon/trinity.png')}
              />
            </View>
            <View style={styles.botBubble}>
              <Text style={styles.botText}>{content}</Text>
            </View>
          </View>
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Connect')}
              style={styles.buttonContainer}
              activeOpacity={0.7}>
              <Text style={styles.buttonText}>전문가를 연결하시겠습니까?</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.botContainer}>
          <View style={styles.botAvatar}>
            <Image
              style={styles.btnImage}
              source={require('../../assets/icon/trinity.png')}
            />
          </View>
          <View style={styles.botBubble}>
            <Text style={styles.botText}>{content}</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    marginVertical: 8,
    gap: 8,
  },
  botContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    marginVertical: 8,
    gap: 8,
  },
  userAvatar: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  botAvatar: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  userBubble: {
    backgroundColor: '#0084FF',
    padding: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '70%',
  },
  botBubble: {
    backgroundColor: '#E8E8E8',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    maxWidth: '70%',
  },
  btnImage: {
    width: 30,
    height: 30,
    borderRadius: 100,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  botText: {
    color: '#000000',
    fontSize: 16,
  },
  buttonWrapper: {
    alignItems: 'center', // 수평 중앙 정렬
    justifyContent: 'center', // 수직 중앙 정렬
    marginTop: 5,
    marginBottom: 20,
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
  },
  buttonText: {
    color: '#003D08',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import React from 'react';
import {StyleSheet, Text, TextStyle, View} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../router/Router.tsx';

// WordBreakKeepAllText Component
const WordBreakKeepAllText = ({
  text,
  textStyles,
}: {
  text: string;
  textStyles?: TextStyle;
}) => {
  return (
    <View style={styles.container}>
      {text.split(' ').map((word, index) => (
        <Text key={`${word}-${index}`} style={textStyles}>
          {word}{' '}
        </Text>
      ))}
    </View>
  );
};

// Remark Component
export default function Remark() {
  return (
    <View style={noticeStyles.container}>
      <WordBreakKeepAllText
        text="병충해를 감지하였습니다"
        textStyles={noticeStyles.alertText}
      />
      <WordBreakKeepAllText
        text="자세한 사항을 확인하기 위해 클릭해주세요"
        textStyles={noticeStyles.subText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
});

const noticeStyles = StyleSheet.create({
  container: {
    padding: 10,
  },
  alertText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
    textAlign: 'left',
  },
  subText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#003D08',
    textAlign: 'left',
  },
});

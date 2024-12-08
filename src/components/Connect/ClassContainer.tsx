import {Text, View, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';

export default function ClassContainer({
  name,
  info,
  buttonText,
  buttonOnClick,
}: {
  name: string;
  info: string[];
  buttonText: string;
  buttonOnClick: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity
          onPress={buttonOnClick}
          activeOpacity={0.7}
          style={styles.buttonContainer}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <View style={styles.listItemContainer}>
        {info.map(item => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#003D08',
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 제목과 버튼을 양쪽으로 배치
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003D08',
  },
  buttonContainer: {
    backgroundColor: '#003D08',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20, // 둥글게
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listItemContainer: {
    paddingLeft: 20,
    paddingVertical: 15,
  },
  listItem: {
    flexDirection: 'row', // 수평 정렬
    alignItems: 'center',
    marginVertical: 3,
  },
  bullet: {
    fontSize: 16,
    marginRight: 5, // 텍스트와 점 간격
    color: '#003D08', // 점 색상
  },
  listText: {
    fontSize: 16,
    color: '#003D08',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#003D08', // Divider color
    width: '100%',
  },
});

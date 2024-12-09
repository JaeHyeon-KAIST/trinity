import {StyleSheet, Text, View, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import React from 'react';
import ClassContainer from '../components/Connect/ClassContainer.tsx';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../router/Router.tsx';

const DummyDataMy = [
  {
    id: 1,
    name: '넙죽이 베테랑님의 교실',
    info: ['애플망고 하우스 농업', '전정 기술', '스마트팜 입문'],
  },
];

const DummyDataOther = [
  {
    id: 1,
    name: 'ooo 베테랑님의 교실',
    info: ['벼농사 전문', '밭농사 입문'],
  },
  {
    id: 2,
    name: 'xxx 베테랑님의 교실',
    info: ['드론으로 쉽게 농사하기', '병충해 전문'],
  },
  {
    id: 3,
    name: 'yyy 베테랑님의 교실',
    info: ['농부의 삶', '농사 시작하기'],
  },
];

export default function Connect() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>내 교실</Text>
        <View style={styles.divider} />
        {DummyDataMy.map(item => (
          <ClassContainer
            key={item.id}
            name={item.name}
            info={item.info}
            buttonText="참여 중"
            buttonOnClick={() =>
              navigation.navigate('ConnectChat', {userId: 'user'})
            }
          />
        ))}
        <View style={styles.divider} />
        <Text style={styles.header}>다른 교실</Text>
        <View style={styles.divider} />
        {DummyDataOther.map(item => (
          <ClassContainer
            key={item.id}
            name={item.name}
            info={item.info}
            buttonText="신청하기"
            buttonOnClick={() => console.log('Clicked')}
          />
        ))}
        <ClassContainer
          name={'zzz 베테랑님의 교실'}
          info={['농사 시작하기', '농부의 삶']}
          buttonText="신청하기"
          buttonOnClick={() =>
            navigation.navigate('ConnectChat', {userId: 'expert'})
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4FDED',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // 마지막 요소가 잘리지 않도록 여유 공간 추가
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003D08',
    margin: 20,
  },
  divider: {
    borderBottomWidth: 1.5,
  },
});

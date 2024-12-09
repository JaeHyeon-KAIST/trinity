import React, {useState, useRef, useEffect} from 'react';
import {Text, View, FlatList, StyleSheet, Animated} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';

const DummyWorkList = [
  {id: 1, info: '보강지주 설치하기', done: false},
  {id: 2, info: '검은무늬병 방제하기', done: false},
  {
    id: 3,
    info: '염화가리 25kg/10a(아르) 주기',
    done: false,
  },
  {id: 4, info: 'A지역 파 수확하기', done: true},
  {id: 5, info: '토양 살충제 뿌리기', done: true},
];

const SWIPE_THRESHOLD = -100;
const ITEM_HEIGHT = 56;

export default function WorkList({setProgess}: {setProgess: Function}) {
  const [workList, setWorkList] = useState(DummyWorkList);
  const swipeableRefs = useRef<{[key: number]: Swipeable | null}>({}).current;

  useEffect(() => {
    const doneCount = workList.filter(item => item.done).length;
    const totalCount = workList.length;
    const progress = Math.floor((doneCount / totalCount) * 100);
    setProgess(progress);
  }, [workList]);

  const handleSwipe = (id: number) => {
    swipeableRefs[id]?.close();

    setTimeout(() => {
      setWorkList(prevList =>
        prevList.map(item =>
          item.id === id ? {...item, done: !item.done} : item,
        ),
      );
    }, 200);
  };

  const renderRightActions = (
    id: number,
    progress: Animated.AnimatedInterpolation<any>,
    done: boolean,
  ) => {
    if (done) {
      return null;
    }

    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    return (
      <View style={[styles.rightActionContainer]}>
        <Animated.View
          style={[
            styles.swipeAction,
            {
              opacity,
              transform: [{translateX: trans}],
            },
          ]}>
          <Text style={styles.swipeText}>완료</Text>
        </Animated.View>
      </View>
    );
  };

  const onSwipeableWillOpen = (id: number) => {
    handleSwipe(id);
  };

  const sortedWorkList = [...workList].sort(
    (a, b) => Number(a.done) - Number(b.done),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedWorkList}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <Swipeable
            ref={ref => (swipeableRefs[item.id] = ref)}
            enabled={!item.done}
            friction={2}
            leftThreshold={50}
            rightThreshold={SWIPE_THRESHOLD}
            overshootLeft={false}
            overshootRight={false}
            renderRightActions={progress =>
              renderRightActions(item.id, progress, item.done)
            }
            containerStyle={styles.swipeableContainer}
            onSwipeableWillOpen={() => onSwipeableWillOpen(item.id)}>
            <View style={[styles.item, item.done && styles.doneItem]}>
              <Text style={[styles.itemText, item.done && styles.doneText]}>
                {item.info}
              </Text>
            </View>
          </Swipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  swipeableContainer: {
    height: ITEM_HEIGHT,
  },
  rightActionContainer: {
    width: 50,
    height: ITEM_HEIGHT,
    borderBottomWidth: 1,
    borderColor: '#003D08',
  },
  item: {
    height: ITEM_HEIGHT,
    paddingHorizontal: 16,
    marginBottom: 8,
    width: '100%',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#003D08',
  },
  itemText: {
    fontSize: 16,
    color: '#003D08',
  },
  doneItem: {
    borderColor: '#A0A0A0',
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#A0A0A0',
  },
  swipeAction: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  swipeText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

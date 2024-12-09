import {SafeAreaView} from 'react-native-safe-area-context';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import AppleHealthKit from 'react-native-health';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';
import HealthHeartRate from '../components/Home/HealthHeartRate.tsx';

interface Workout {
  activityName: string;
  calories: number;
  distance: number;
  start: string;
  end: string;
  sourceName: string;
  device: string;
  heartRate?: number;
  maxHeartRate?: number;
  steps?: number;
}

export default function HealthDetailPage() {
  const [workoutData, setWorkoutData] = useState<Workout[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const options = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Workout,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.Steps,
        ],
        write: [],
      },
    };

    // Apple HealthKit 초기화
    AppleHealthKit.initHealthKit(options, (err: string) => {
      if (err) {
        setError(`Error initializing HealthKit: ${err}`);
        return;
      }

      // 워크아웃 데이터 가져오기
      const workoutOptions = {
        startDate: new Date(2023, 0, 1).toISOString(),
        endDate: new Date().toISOString(),
        type: 'Workout',
      };

      AppleHealthKit.getSamples(
        workoutOptions,
        async (err, results: Workout[]) => {
          if (err) {
            setError(`Error fetching workout data: ${err}`);
            return;
          }

          if (results && results.length > 0) {
            // sourceName이 "trinity"인 워크아웃 데이터만 필터링
            const filteredWorkouts = results.filter(
              workout => workout.sourceName === 'trinity',
            );

            // 각 워크아웃에 심박수와 걸음 수 데이터를 연결
            const enrichedWorkouts = await Promise.all(
              filteredWorkouts.map(async workout => {
                const startDate = new Date(workout.start);
                const endDate = new Date(workout.end);

                const healthOptions = {
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                };

                try {
                  // 심박수 데이터 가져오기
                  const heartRateData = await new Promise<any[]>(
                    (resolve, reject) => {
                      AppleHealthKit.getHeartRateSamples(
                        healthOptions,
                        (err, results) => {
                          if (err) {
                            reject(err);
                          } else {
                            resolve(results);
                          }
                        },
                      );
                    },
                  );

                  // 걸음 수 데이터 가져오기
                  const stepsData = await new Promise<any>(
                    (resolve, reject) => {
                      AppleHealthKit.getDailyStepCountSamples(
                        healthOptions,
                        (err, results) => {
                          if (err) {
                            reject(err);
                          } else {
                            resolve(results);
                          }
                        },
                      );
                    },
                  );

                  let avgHeartRate = null;
                  let maxHeartRate = null;
                  let totalSteps = 0;

                  // 심박수 평균과 최대값 계산
                  if (heartRateData && heartRateData.length > 0) {
                    const heartRates = heartRateData.map(hr => hr.value);
                    avgHeartRate = Math.round(
                      heartRates.reduce((sum, hr) => sum + hr, 0) /
                        heartRates.length,
                    );
                    maxHeartRate = Math.round(Math.max(...heartRates));
                  }

                  // 걸음 수 합산
                  if (stepsData && stepsData.length > 0) {
                    totalSteps = stepsData.reduce(
                      (sum, step) => sum + step.value,
                      0,
                    );
                  }

                  return {
                    ...workout,
                    heartRate: avgHeartRate,
                    maxHeartRate: maxHeartRate,
                    steps: Math.round(totalSteps),
                  };
                } catch (err) {
                  console.error(
                    `Error fetching health data for workout: ${err}`,
                  );
                  return {
                    ...workout,
                    heartRate: null,
                    maxHeartRate: null,
                    steps: null,
                  };
                }
              }),
            );

            setWorkoutData(enrichedWorkouts);

            if (enrichedWorkouts.length === 0) {
              setError('No workout data from Trinity source.');
            }
          } else {
            setError('No workout data available.');
          }
        },
      );
    });
  }, []);

  return (
    <SafeAreaView style={{backgroundColor: '#F4FDED', flex: 1}}>
      <HomeDetailPageContainer title="건강">
        <FlatList
          style={styles.flatList}
          data={workoutData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => {
            const startDate = new Date(item.start);
            const dateTitle = startDate
              .toLocaleDateString('ko-KR', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
              })
              .replace(/\. /g, '/')
              .replace('.', '');

            const startTime = startDate.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTime = new Date(item.end).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View style={styles.card}>
                {/* 날짜와 작업 시간 */}
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{dateTitle}</Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.label}>작업 시간</Text>
                    <Text style={styles.value}>
                      {startTime} - {endTime}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* 심박수, 걸음수, 칼로리 행 */}
                <View style={styles.contentContainer}>
                  {/* 왼쪽 열: 심박수 */}
                  <View style={styles.leftColumn}>
                    <View style={styles.dataRow}>
                      <Text style={styles.label}>평균 심박수</Text>
                      <Text style={styles.value}>
                        {item.heartRate ? `${item.heartRate} bpm` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.dataRow}>
                      <Text style={styles.label}>최대 심박수</Text>
                      <Text style={styles.value}>
                        {item.maxHeartRate ? `${item.maxHeartRate} bpm` : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* 오른쪽 열: 걸음수, 칼로리 */}
                  <View style={styles.rightColumn}>
                    <View style={styles.dataRow}>
                      <Text style={styles.label}>걸음 수</Text>
                      <Text style={styles.value}>
                        {item.steps ? item.steps.toLocaleString() : 'N/A'} 걸음
                      </Text>
                    </View>
                    <View style={styles.dataRow}>
                      <Text style={styles.label}>소모 칼로리</Text>
                      <Text style={styles.value}>
                        {Math.round(item.calories)} kcal
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
        {/*<HealthHeartRate />*/}
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flatList: {
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  dataRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
});

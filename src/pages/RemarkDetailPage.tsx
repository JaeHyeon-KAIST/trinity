import React, {useRef, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, View, StyleSheet, Image, TouchableOpacity} from 'react-native';
import HomeDetailPageContainer from '../components/Home/HomeDetailPage.tsx';
import remark1 from '../assets/dummyData/remark1.png';
import remark2 from '../assets/dummyData/remark2.png';
import Selected2DSVG from '../assets/icon/2D_Selected.svg';
import UnSelected2DSVG from '../assets/icon/2D_Unselected.svg';
import Selected3DSVG from '../assets/icon/3D_Selected.svg';
import UnSelected3DSVG from '../assets/icon/3D_Unselected.svg';
import Video from 'react-native-video';

// 화면 크기 가져오기
const map3DVideo = require('../assets/dummyData/3DMap.mp4');
const video = require('../assets/dummyData/testVideo.mp4');

type VideoRef = {
  presentFullscreenPlayer: () => void;
  seek(number: number): void;
};

export default function RemarkDetailPage() {
  const [mapViewMode, setMapViewMode] = useState<'2D' | '3D'>('2D');
  const [isPaused, setIsPaused] = useState(true);
  const videoRef = useRef<VideoRef>(null);

  const handleFullscreenPlayerWillPresent = () => {
    videoRef.current?.seek(0); // 재생 위치를 처음으로 설정
    setIsPaused(false); // 재생 시작
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeDetailPageContainer title="특이사항">
        <View style={styles.contentContainer}>
          <View>
            {mapViewMode === '2D' ? (
              <Image source={remark1} style={styles.image} />
            ) : (
              <Video
                source={map3DVideo}
                paused={false} // 자동 재생
                repeat={true} // 반복 재생
                style={styles.video}
                resizeMode="contain" // 비디오 크기 조정 방식
                onError={e => console.error('Video Error:', e)} // 에러 발생 시 호출
              />
            )}
            {mapViewMode === '2D' ? (
              <View style={styles.viewSelectButtonContainer}>
                <TouchableOpacity activeOpacity={0.8}>
                  <Selected2DSVG width={40} height={40} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMapViewMode('3D')}
                  activeOpacity={0.8}>
                  <UnSelected3DSVG width={40} height={40} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.viewSelectButtonContainer}>
                <TouchableOpacity
                  onPress={() => setMapViewMode('2D')}
                  activeOpacity={0.8}>
                  <UnSelected2DSVG width={40} height={40} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8}>
                  <Selected3DSVG width={40} height={40} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.sectionTitle}>{'<드론이 촬영한 사진>'}</Text>
          <Image source={remark2} style={styles.roundedImage} />
          <Text style={styles.infoText}>발견 일시: 2024.12.06 13시 23분</Text>
          <Text style={styles.infoText}>예상 병충해 정보: 검은무늬병</Text>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => {
              videoRef.current?.presentFullscreenPlayer(); // 전체 화면 실행
            }}>
            <Text style={styles.buttonText}>드론 촬영 영상 보기</Text>
          </TouchableOpacity>

          {/* 비디오 컴포넌트 */}
          <Video
            // @ts-ignore
            ref={videoRef} // 비디오 컨트롤을 위한 ref
            source={video}
            paused={isPaused}
            style={styles.hiddenVideo} // 화면에 보이지 않도록 숨김
            controls={true} // iOS와 Android 기본 컨트롤 사용
            resizeMode="contain"
            onFullscreenPlayerWillPresent={handleFullscreenPlayerWillPresent}
            onFullscreenPlayerWillDismiss={() => setIsPaused(true)}
          />
        </View>
      </HomeDetailPageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDED',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 4 / 3, // 이미지 비율
    resizeMode: 'cover',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9, // 16:9 비율 유지
    resizeMode: 'contain',
    marginBottom: 20,
  },
  viewSelectButtonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    right: 5,
    bottom: 30,
    gap: 5,
  },
  roundedImage: {
    width: '80%',
    height: undefined,
    aspectRatio: 5 / 3,
    resizeMode: 'cover',
    borderRadius: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#003D08',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#003D08',
    fontWeight: 'bold',
    marginVertical: 7,
    marginLeft: 15,
    alignSelf: 'flex-start',
  },
  button: {
    backgroundColor: '#E3F2D3',
    borderWidth: 1,
    borderColor: '#3C8031',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: '#003D08',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hiddenVideo: {
    width: 1, // 숨기기 위해 작은 크기로 설정
    height: 1, // 숨기기 위해 작은 크기로 설정
  },
});

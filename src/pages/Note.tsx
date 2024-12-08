import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import dayjs from 'dayjs';
import DownArrowSVG from '../assets/icon/downArrow.svg';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface WorkContent {
  title: string;
  details: string[];
}

interface JournalEntry {
  date: string;
  workContents: WorkContent[];
  results: string[];
  additionalNotes: string[];
}

export default function Note() {
  const [recording, setRecording] = useState(false);
  const [journalData, setJournalData] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRecorderPlayer = React.useRef(new AudioRecorderPlayer()).current;
  const today = dayjs().format('YYYY년 MM월 DD일');

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      return (
        granted['android.permission.RECORD_AUDIO'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('Permissions not granted.');
      return;
    }

    setRecording(true);
    const path = Platform.select({
      ios: 'recordedAudio.wav',
      android: `${Date.now()}.wav`,
    });

    try {
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.wav,
      };

      const uri = await audioRecorderPlayer.startRecorder(path, audioSet);
      console.log('Recording started at:', uri);
      audioRecorderPlayer.addRecordBackListener(e => {
        console.log('Recording progress:', e);
        return;
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);

      // 녹음 파일 경로를 직접 sendToOpenAI에 전달
      if (result) {
        console.log('Recorded file path:', result);
        await sendToOpenAI(result); // audioPath를 직접 전달
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecording(false);
    }
  };

  const parseJournalContent = (content: string): JournalEntry => {
    const sections = content.split('\n\n');

    const journalEntry: JournalEntry = {
      date: '',
      workContents: [],
      results: [],
      additionalNotes: [],
    };

    sections.forEach(section => {
      const lines = section.split('\n');

      if (lines[0].startsWith('날짜:')) {
        journalEntry.date = lines[0].replace('날짜: ', '').trim();
      } else if (lines[0] === '작업 내용') {
        let currentWorkContent: WorkContent | null = null;

        lines.slice(1).forEach(line => {
          if (line.startsWith('- ')) {
            if (currentWorkContent) {
              currentWorkContent.details.push(line.replace('- ', '').trim());
            }
          } else if (line.trim() !== '') {
            if (currentWorkContent) {
              journalEntry.workContents.push(currentWorkContent);
            }
            currentWorkContent = {
              title: line.trim(),
              details: [],
            };
          }
        });

        if (currentWorkContent) {
          journalEntry.workContents.push(currentWorkContent);
        }
      } else if (lines[0] === '작업 결과 및 특이 사항') {
        journalEntry.results = lines
          .slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.replace('- ', '').trim());
      } else if (lines[0] === '추가 메모') {
        journalEntry.additionalNotes = lines
          .slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.replace('- ', '').trim());
      }
    });

    return journalEntry;
  };

  const sendToOpenAI = async (path: string) => {
    if (!path) {
      console.log('No audio file to send.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(path);
      const audioBlob = await response.blob();

      // Fix the base64 conversion
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          } else {
            // Handle ArrayBuffer case if needed
            const bytes = new Uint8Array(reader.result);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64String = btoa(binary);
            resolve(base64String);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob); // This will usually give us a string result
      });

      const requestBody = {
        model: 'gpt-4o-audio-preview',
        messages: [
          {
            role: 'system',
            content: [
              {
                type: 'text',
                text: '너는 지금부터 농부의 일지를 자동으로 적어주는 역할을 할거야.\n\n일지는 다음과 같은 형태야.\n\n날짜: 2024년 12월 9일 \n\n작업 내용\n작물 상태 점검\n- 파 작물의 상태 점검\n- 병충해 여부 확인 (별다른 이상 없음)\n- 관수 시스템 작동 확인 및 청소\n비료 및 영양제 투여\n- 유기질 비료 5kg 투여\n- 파 생육 촉진제 1L 혼합하여 관수 실시\n잡초 제거\n- 파 밭 주변 잡초 제거 작업\n- 제거된 잡초는 퇴비로 사용하기 위해 모아둠\n\n작업 결과 및 특이 사항\n- 파 작물의 상태는 양호함\n- 잡초 제거 작업으로 재배 환경이 개선됨\n- 비료 투여 후 작물 상태 지속 관찰 필요\n\n추가 메모\n- 내일 새벽 강우 예보 있음. 비닐하우스 덮개 상태 점검 및 보수 필요\n- 1주일 후 병충해 방제를 위해 방제 작업 계획\n\n\n----------------------------\n\n앞으로 유저가 음성으로 본인이 오늘 한 작업을 알려줄거야. 그러면 그거 반영해서 일지를 적어주면 되는거야.\n\n모든 작업 일지는 예시 작업 일지를 기반으로 수정해서 줘. 조건은 다음과 같아\n1. 병충해 제거했다는 내용이 유저가 전달하면 - 병충해 여부 확인 (별다른 이상 없음) => 병충해 작물 제거  로 변경. 만약 병충해 제거했다는 내용 없다면 원래 예시 노트 내용인 - 파 작물의 상태 점검\n- 병충해 여부 확인 (별다른 이상 없음) 그대로 사용 \n2. 잡초 제거는 원래 없는 내용임. 잡초 뽑았다는 내용이 있다면 추가\n3. 작업 결과 및 특이 사항은 무조건 그대로 반환\n4. 추가 메모도 무조건 그대로 반환',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '',
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Audio,
                  format: 'wav',
                },
              },
            ],
          },
        ],
        modalities: ['text'],
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

      // Rest of the function remains the same...
      const openAIResponse = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json();
        throw new Error(JSON.stringify(errorData));
      }

      const result = await openAIResponse.json();
      console.log('OpenAI Response:', result);

      if (result.choices && result.choices[0]?.message?.content) {
        const content = result.choices[0].message.content;
        const parsedData = parseJournalContent(content);
        setJournalData(parsedData);
        console.log('Parsed Journal Data:', parsedData);
      }
    } catch (error) {
      console.error('Error sending audio to OpenAI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.noteContainer} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>분석 일지</Text>
          <View style={styles.headerDropDownContainer}>
            <DownArrowSVG width={15} height={15} />
            <Text style={styles.headerDropDownText}>일지 템플릿 A</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {!journalData && !isLoading && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={recording ? stopRecording : startRecording}>
              <Text style={styles.buttonText}>
                {recording ? '일지 생성' : '녹음 시작'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003D08" />
            <Text style={styles.loadingText}>일지 생성 중...</Text>
          </View>
        )}

        {journalData && (
          <View style={styles.journalContainer}>
            <Text style={styles.journalDate}>{today}</Text>

            <Text style={styles.sectionTitle}>작업 내용</Text>
            {journalData.workContents.map((workContent, index) => (
              <View key={index} style={styles.workContentContainer}>
                <Text style={styles.workContentTitle}>{workContent.title}</Text>
                {workContent.details.map((detail, detailIndex) => (
                  <Text key={detailIndex} style={styles.workContentDetail}>
                    • {detail}
                  </Text>
                ))}
              </View>
            ))}

            <Text style={styles.sectionTitle}>작업 결과 및 특이 사항</Text>
            {journalData.results.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                • {result}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>추가 메모</Text>
            {journalData.additionalNotes.map((note, index) => (
              <Text key={index} style={styles.noteText}>
                • {note}
              </Text>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  noteContainer: {
    flex: 1,
    backgroundColor: '#F4FDED',
  },
  container: {
    flex: 1,
    margin: 10,
    borderWidth: 1.5,
    borderColor: '#003D08',
    borderRadius: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerDropDownContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2D3',
    borderWidth: 1,
    borderColor: '#3C8031',
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  headerDropDownText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003D08',
    marginLeft: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003D08',
    textAlign: 'left',
    margin: 10,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#003D08',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#003D08',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  button: {
    backgroundColor: '#E3F2D3',
    borderWidth: 1,
    borderColor: '#3C8031',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: '#003D08',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#003D08',
    fontSize: 16,
  },
  journalContainer: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  journalDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003D08',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003D08',
    marginTop: 20,
    marginBottom: 10,
  },
  workContentContainer: {
    marginBottom: 15,
  },
  workContentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#003D08',
    marginBottom: 5,
  },
  workContentDetail: {
    fontSize: 14,
    color: '#003D08',
    marginLeft: 15,
    marginBottom: 3,
  },
  resultText: {
    fontSize: 14,
    color: '#003D08',
    marginLeft: 15,
    marginBottom: 3,
  },
  noteText: {
    fontSize: 14,
    color: '#003D08',
    marginLeft: 15,
    marginBottom: 3,
  },
});

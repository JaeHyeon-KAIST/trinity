import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
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
  purpose?: string; // B 템플릿용 추가
  duration?: string; // B 템플릿용 추가
}

export default function Note() {
  const [recording, setRecording] = useState(false);
  const [journalData, setJournalData] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRecorderPlayer = React.useRef(new AudioRecorderPlayer()).current;
  const today = dayjs().format('YYYY년 MM월 DD일');
  const [selectedTemplate, setSelectedTemplate] = useState('일지 템플릿 A');

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const templates = [
    {id: 'A', name: '일지 템플릿 A'},
    {id: 'B', name: '일지 템플릿 B'},
  ];

  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  const selectTemplate = (template: string) => {
    const selectedTemplateName =
      templates.find(t => t.id === template)?.name || '일지 템플릿 A';
    setSelectedTemplate(selectedTemplateName); // 템플릿 이름으로 저장
    setJournalData(null);
    setIsDropdownVisible(false);
  };

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
    if (selectedTemplate === templates[1].name) {
      const journalEntry: JournalEntry = {
        date: '',
        workContents: [],
        results: [],
        additionalNotes: [],
        purpose: '',
        duration: '',
      };

      let currentSection = '';
      let currentWorkContent: WorkContent | null = null;

      const lines = content.split('\n');
      let isInOverview = false;
      let isInStages = false;
      let isInFindings = false;
      let isInPlans = false;

      lines.forEach(line => {
        const trimmedLine = line.trim();

        // 섹션 시작 확인
        if (trimmedLine === '작업 개요') {
          isInOverview = true;
          isInStages = false;
          isInFindings = false;
          isInPlans = false;
        } else if (trimmedLine === '작업 진행 단계') {
          isInOverview = false;
          isInStages = true;
          isInFindings = false;
          isInPlans = false;
        } else if (trimmedLine === '발견 사항') {
          isInOverview = false;
          isInStages = false;
          isInFindings = true;
          isInPlans = false;
        } else if (trimmedLine === '이후 계획') {
          isInOverview = false;
          isInStages = false;
          isInFindings = false;
          isInPlans = true;
        }

        // 각 섹션별 처리
        if (isInOverview) {
          if (trimmedLine.startsWith('작업 날짜')) {
            journalEntry.date = trimmedLine.split(':')[1].trim();
          } else if (trimmedLine.startsWith('작업 목적')) {
            journalEntry.purpose = trimmedLine.split(':')[1].trim();
          } else if (trimmedLine.startsWith('작업 소요 시간')) {
            journalEntry.duration = trimmedLine.split(':')[1].trim();
          }
        } else if (isInStages) {
          if (
            trimmedLine === '준비' ||
            trimmedLine === '작업' ||
            trimmedLine === '정리'
          ) {
            currentWorkContent = {
              title: trimmedLine,
              details: [],
            };
            journalEntry.workContents.push(currentWorkContent);
          } else if (
            trimmedLine &&
            currentWorkContent &&
            !trimmedLine.startsWith('작업 진행 단계')
          ) {
            currentWorkContent.details.push(trimmedLine);
          }
        } else if (isInFindings) {
          if (trimmedLine && !trimmedLine.startsWith('발견 사항')) {
            journalEntry.results.push(trimmedLine);
          }
        } else if (isInPlans) {
          if (trimmedLine && !trimmedLine.startsWith('이후 계획')) {
            journalEntry.additionalNotes.push(trimmedLine);
          }
        }
      });

      return journalEntry;
    }

    // Template A 파싱 로직 (기존 코드 유지)
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
                text:
                  selectedTemplate === templates[0].name
                    ? '너는 지금부터 농부의 일지를 자동으로 적어주는 역할을 할거야.\n\n일지는 다음과 같은 형태야.\n\n날짜: 2024년 12월 9일 \n\n작업 내용\n작물 상태 점검\n- 파 작물의 상태 점검\n- 병충해 여부 확인 (별다른 이상 없음)\n- 관수 시스템 작동 확인 및 청소\n비료 및 영양제 투여\n- 유기질 비료 5kg 투여\n- 파 생육 촉진제 1L 혼합하여 관수 실시\n잡초 제거\n- 파 밭 주변 잡초 제거 작업\n- 제거된 잡초는 퇴비로 사용하기 위해 모아둠\n\n작업 결과 및 특이 사항\n- 파 작물의 상태는 양호함\n- 잡초 제거 작업으로 재배 환경이 개선됨\n- 비료 투여 후 작물 상태 지속 관찰 필요\n\n추가 메모\n- 내일 새벽 강우 예보 있음. 비닐하우스 덮개 상태 점검 및 보수 필요\n- 1주일 후 병충해 방제를 위해 방제 작업 계획\n\n\n----------------------------\n\n앞으로 유저가 음성으로 본인이 오늘 한 작업을 알려줄거야. 그러면 그거 반영해서 일지를 적어주면 되는거야.\n\n모든 작업 일지는 예시 작업 일지를 기반으로 수정해서 줘. 조건은 다음과 같아\n1. 병충해 제거했다는 내용이 유저가 전달하면 - 병충해 여부 확인 (별다른 이상 없음) => 병충해 작물 제거  로 변경. 만약 병충해 제거했다는 내용 없다면 원래 예시 노트 내용인 - 파 작물의 상태 점검\n- 병충해 여부 확인 (별다른 이상 없음) 그대로 사용 \n2. 잡초 제거는 원래 없는 내용임. 잡초 뽑았다는 내용이 있다면 추가\n3. 작업 결과 및 특이 사항은 무조건 그대로 반환\n4. 추가 메모도 무조건 그대로 반환'
                    : '너는 지금부터 농부의 일지를 자동으로 적어주는 역할을 할거야.\n\n일지는 다음과 같은 형태야.\n\n작업 개요\n   작업 날짜 : 2024년 12월 10일\n   작업 목적 : 작물 상태 점검 및 비료 투입\n   작업 소요 시간 : 3시간 \n\n작업 진행 단계\n준비 \n   농기구 점검 완료\n   비료 및 영양제 준비\n작업 \n   파 작물 상태 점검\n   관수 시스템 작동 확인 및 청소   \n   유기질 비료 5kg 투여   \n   파 생육 촉진제 1L 혼합하여 관수 실시\n정리\n   작업 후 밭 상태 정리\n   사용 장비 반납\n\n발견 사항\n   작업 성과 : 관수 시스템 정상 작동, 작물 상태 양호\n   발견된 문제 : 잡초 발생 증가, 일부 작물의 성장 저조\n   해결 방안 : 추가 제초 작업 필요, 약제 살포 계획   \n\n이후 계획\n단기 계획\n   비닐하우스 덮개 점검 (강우 대비)\n   작물 상태 추가 모니터링\n중기 계획\n   병충해 예방을 위한 방제 작업 (1주일 후)\n\n----------------------------\n\n앞으로 유저가 음성으로 본인이 오늘 한 작업을 알려줄거야. 그러면 그거 반영해서 일지를 적어주면 되는거야.\n\n모든 작업 일지는 예시 작업 일지를 기반으로 수정해서 줘. 조건은 다음과 같아\n\n1. 병충해 제거했다는 내용이 유저가 전달하면 - 작업사항에 추가해\n2. 병충해가 아니더라도 작업한 내용이 있다면 작업사항에 추가\n3. 작업날짜는 한국 시간 기준으로 현재 즉 오늘의 날짜로 바꿔서',
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
        console.log(content);
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
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleDropdown}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={toggleDropdown}
          activeOpacity={1}>
          <View style={styles.dropdownContainer}>
            {templates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.dropdownItem}
                onPress={() => selectTemplate(template.id)}>
                <Text
                  style={[
                    styles.dropdownText,
                    selectedTemplate === template.id && styles.selectedText,
                  ]}>
                  {template.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>분석 일지</Text>
          <TouchableOpacity
            style={styles.headerDropDownContainer}
            onPress={toggleDropdown}>
            <DownArrowSVG width={15} height={15} />
            <Text style={styles.headerDropDownText}>
              {selectedTemplate === templates[0].name
                ? templates[0].name
                : templates[1].name}
            </Text>
          </TouchableOpacity>
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

            {selectedTemplate === templates[1].name ? ( // B 템플릿인 경우 ScrollView 사용
              <ScrollView contentContainerStyle={{paddingBottom: 20}}>
                <Text style={styles.sectionTitle}>작업 개요</Text>
                <Text style={styles.workContentDetail}>
                  작업 목적: {journalData.purpose}
                </Text>
                <Text style={styles.workContentDetail}>
                  소요 시간: {journalData.duration}
                </Text>

                <Text style={styles.sectionTitle}>작업 진행 단계</Text>
                {journalData.workContents.map((workContent, index) => (
                  <View key={index} style={styles.workContentContainer}>
                    <Text style={styles.workContentTitle}>
                      {workContent.title}
                    </Text>
                    {workContent.details.map((detail, detailIndex) => (
                      <Text key={detailIndex} style={styles.workContentDetail}>
                        • {detail}
                      </Text>
                    ))}
                  </View>
                ))}

                <Text style={styles.sectionTitle}>발견 사항</Text>
                <View>
                  {journalData.results.map((result, index) => {
                    const [title, value] = result.split(':');
                    return value ? (
                      <View key={index} style={{marginBottom: 8}}>
                        <Text
                          style={[styles.workContentDetail, {color: '#666'}]}>
                          {title.trim()}
                        </Text>
                        <Text style={styles.workContentDetail}>
                          {value.trim()}
                        </Text>
                      </View>
                    ) : (
                      <Text key={index} style={styles.workContentTitle}>
                        {result.trim()}
                      </Text>
                    );
                  })}
                </View>

                <Text style={styles.sectionTitle}>이후 계획</Text>
                <View>
                  {journalData.additionalNotes.map((note, index) => {
                    const isTitle = note.includes('계획');
                    return isTitle ? (
                      <Text key={index} style={styles.workContentTitle}>
                        {note.trim()}
                      </Text>
                    ) : (
                      <Text key={index} style={styles.workContentDetail}>
                        • {note.trim()}
                      </Text>
                    );
                  })}
                </View>
              </ScrollView> // A 템플릿인 경우 기존 View 구조 유지
            ) : (
              <>
                <Text style={styles.sectionTitle}>작업 내용</Text>
                {journalData.workContents.map((workContent, index) => (
                  <View key={index} style={styles.workContentContainer}>
                    <Text style={styles.workContentTitle}>
                      {workContent.title}
                    </Text>
                    {workContent.details.map((detail, detailIndex) => (
                      <Text key={detailIndex} style={styles.workContentDetail}>
                        • {detail}
                      </Text>
                    ))}
                  </View>
                ))}

                <Text style={styles.sectionTitle}>작업 결과 및 특이 사항</Text>
                {journalData.results.map((result, index) => (
                  <Text key={index} style={styles.workContentDetail}>
                    • {result}
                  </Text>
                ))}

                <Text style={styles.sectionTitle}>추가 메모</Text>
                {journalData.additionalNotes.map((note, index) => (
                  <Text key={index} style={styles.workContentDetail}>
                    • {note}
                  </Text>
                ))}
              </>
            )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 100,
    marginRight: 20,
    width: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden', // 추가
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2D3',
  },
  dropdownText: {
    color: '#003D08',
    fontSize: 14,
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#3C8031',
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
    alignItems: 'center',
  },
  overviewText: {
    fontSize: 14,
    color: '#003D08',
    marginLeft: 15,
    marginBottom: 3,
  },
});

import notifee, {AndroidImportance} from '@notifee/react-native';
import {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

export default async function displayNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
) {
  if (Platform.OS === 'android') {
    const channelAnnouncement = await notifee.createChannel({
      id: 'default',
      name: 'push notification',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: message.notification?.title || '알림',
      body: message.notification?.body || '새 메시지가 도착했습니다.',
      android: {
        channelId: channelAnnouncement,
        smallIcon: 'ic_launcher', // 안드로이드용 아이콘
      },
    });
  } else if (Platform.OS === 'ios') {
    // iOS 알림 표시
    await notifee.displayNotification({
      title: message.notification?.title || '알림',
      body: message.notification?.body || '새 메시지가 도착했습니다.',
      ios: {
        sound: 'default', // Use the default iOS notification sound
      },
    });
  }
}

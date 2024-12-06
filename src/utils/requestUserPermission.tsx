import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';

// iOS 권한 요청 함수
const requestIOSPermission = async () => {
  try {
    const authorizationStatus = await messaging().requestPermission({
      sound: true,
      alert: true,
    });

    if (
      authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      console.log('iOS Authorization granted:', authorizationStatus);
      return true; // 권한이 승인된 경우
    } else {
      console.log('iOS Authorization denied.');
      return false; // 권한이 거부된 경우
    }
  } catch (error) {
    console.error('Error requesting iOS permissions:', error);
    return false;
  }
};

// Android POST_NOTIFICATIONS 권한 요청 함수 (Android 13 이상)
const requestAndroidNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (permission) {
      try {
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission denied.');
          return false;
        } else {
          console.log('Notification permission granted.');
          return true;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    } else {
      console.error('POST_NOTIFICATIONS permission is not available.');
      return false;
    }
  } else {
    return true;
    // Android 13 이하에서는 권한 요청 없이 FCM 토큰을 바로 요청
    // await getFCMToken(1); // 바로 FCM 토큰 요청
  }
};

// 메인 권한 요청 함수
export default async function requestUserPermission() {
  let permissionGranted = false;

  if (Platform.OS === 'ios') {
    permissionGranted = await requestIOSPermission();
  } else if (Platform.OS === 'android') {
    permissionGranted = await requestAndroidNotificationPermission();
  }

  if (permissionGranted) {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error fetching FCM token:', error);
      return null;
    }
  } else {
    console.log(
      'Notification permission was not granted, FCM token not requested.',
    );
    return null;
  }
}

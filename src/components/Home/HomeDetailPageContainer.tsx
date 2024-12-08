import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../router/Router.tsx';

type ContainerProps = {
  title: string; // Title of the section (e.g., "기상 정보", "특이사항")
  children: React.ReactNode; // Child components (e.g., <Health />)
  direction?: keyof RootStackParamList; // Navigation direction (e.g., "WeatherDetail")
  fullWidth?: boolean; // Whether the component spans full width
  tailText?: string; // Text at the end of the section
  customHeight?: number; // Custom height for the component
};

export default function HomeDetailPageContainer({
  title,
  children,
  direction,
  fullWidth,
  tailText,
  customHeight,
}: ContainerProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        customHeight !== undefined && {height: customHeight},
      ]}
      activeOpacity={1}
      onPress={() => direction && navigation.navigate(direction)}>
      {/* Section Title */}
      {tailText ? (
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.title}>{tailText}</Text>
        </View>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Child Components */}
      <View style={styles.content}>{children}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: '#003D08',
    borderRadius: 20,
    marginHorizontal: 6,
    height: 180, // Fixed height for all components
    width: '48%', // Default to half width
    marginBottom: 15,
  },
  fullWidth: {
    width: '100%', // Span full width when `fullWidth` is true
    marginHorizontal: 0,
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
    backgroundColor: '#003D08', // Divider color
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

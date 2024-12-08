import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type ContainerProps = {
  title: string; // Title of the section (e.g., "기상 정보", "특이사항")
  children: React.ReactNode; // Child components (e.g., <Health />)
  fullWidth?: boolean; // Whether the component spans full width
};

export default function HomeDetailPageContainer({
  title,
  children,
}: ContainerProps) {
  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Child Components */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: '#003D08',
    borderRadius: 20,
    marginHorizontal: 10,
    height: '100%', // Fixed height for all components
    flex: 1,
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
    alignItems: 'center',
  },
});

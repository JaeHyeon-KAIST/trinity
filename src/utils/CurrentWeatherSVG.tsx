import SunnySVG from '../assets/icon/sunny.svg';
import RainySVG from '../assets/icon/rainy.svg';
import CloudySVG from '../assets/icon/cloudy.svg';
import PartlyCloudySVG from '../assets/icon/partlyCloudy.svg';
import React from 'react';

export const classifyCondition = (condition: string) => {
  const normalizedCondition = condition?.toLowerCase(); // 소문자로 변환
  if (['clear', 'mostly clear', 'hot'].includes(normalizedCondition)) {
    return 'sunny';
  }
  if (
    [
      'cloudy',
      'mostly cloudy',
      'breezy',
      'foggy',
      'haze',
      'smoky',
      'blowing dust',
      'blowing snow',
    ].includes(normalizedCondition)
  ) {
    return 'cloudy';
  }
  if (['partly cloudy'].includes(normalizedCondition)) {
    return 'partlyCloudy';
  }
  if (
    [
      'rain',
      'drizzle',
      'freezing drizzle',
      'freezing rain',
      'sleet',
      'snow',
      'heavy rain',
      'heavy snow',
      'thunderstorms',
      'scatteredthunderstorms',
      'isolatedthunderstorms',
      'wintrymix',
      'hail',
      'tropicalstorm',
      'hurricane',
    ].includes(normalizedCondition)
  ) {
    return 'rainy';
  }
  return 'sunny';
};

export default function CurrentWeatherSVG({
  condition,
  size,
}: {
  condition: string;
  size: number;
}) {
  return (
    <>
      {condition === 'cloudy' && <CloudySVG width={size} height={size} />}
      {condition === 'partlyCloudy' && (
        <PartlyCloudySVG width={size} height={size} />
      )}
      {condition === 'rainy' && <RainySVG width={size} height={size} />}
      {condition === 'sunny' && ( // <SunnySVG width={110} height={110} />
        <SunnySVG width={size} height={size} />
      )}
    </>
  );
}

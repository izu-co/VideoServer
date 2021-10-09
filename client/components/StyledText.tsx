import * as React from 'react';

import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[{ fontFamily: 'Barlow_600SemiBold', color: 'white' }, props.style]} />;
}
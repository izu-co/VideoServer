import { Dimensions } from 'react-native';

const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const normalize = (size:number) => {
  if (SCREEN_WIDTH < 320) {
    size -= 2;
  } else if (SCREEN_WIDTH > 920) {
    size += 2;
  }
  return size;
}

export default normalize;
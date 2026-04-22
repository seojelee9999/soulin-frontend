import { COLOR_MAP, type ColorKey } from '../../types';

interface Props {
  color: ColorKey;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };

export default function ColorDot({ color, size = 'md' }: Props) {
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${sizes[size]}`}
      style={{ backgroundColor: COLOR_MAP[color].main }}
    />
  );
}

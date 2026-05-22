import logo from '../../assets/hero.png';

interface Props {
  size?: number;
}

export default function AgentAvatar({ size = 36 }: Props) {
  return (
    <span
      className="block rounded-full overflow-hidden shrink-0 bg-gray-100"
      style={{ width: size, height: size }}
    >
      <img src={logo} alt="Color Mate" className="w-full h-full object-cover" />
    </span>
  );
}

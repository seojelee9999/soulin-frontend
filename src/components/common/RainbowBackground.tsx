interface Props {
  speed?: number; // 1 = 기본(5~9s), 0.6 = 빠름(3~5.4s), 1.5 = 느림
}

export default function RainbowBackground({ speed = 1 }: Props) {
  return (
    <div
      className="feed-rainbow-bg"
      aria-hidden="true"
      style={{ '--speed': speed } as React.CSSProperties}
    >
      <div className="color-orb color-orb-1" />
      <div className="color-orb color-orb-2" />
      <div className="color-orb color-orb-3" />
      <div className="color-orb color-orb-4" />
      <div className="color-orb color-orb-5" />
    </div>
  );
}

export function BrandMark({ inverted = false, size = 42 }: { inverted?: boolean; size?: number }) {
  return (
    <img
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain', flex: '0 0 auto' }}
      src={`/brand/logo/the-step-${inverted ? 'inverted' : 'primary'}.svg`}
      alt="Habit Shaper"
    />
  );
}

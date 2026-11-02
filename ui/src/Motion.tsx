/**
 * The app's two animations: a 1s linear spinner and the 2.2s ease-in-out sweep
 * that crosses each screen while a critique runs.
 *
 * The built-in drew them with Framer Motion, which the dashboard bundles. This
 * bundle cannot import the host's copy, so it drives the same keyframes through
 * the Web Animations API (`Element.animate`), which needs no library and no CSS
 * keyframe block.
 *
 * The reduced-motion behaviour is still driven by the app's own
 * `useReduceMotion()`: the original CSS did not merely slow the animation down,
 * it swapped the sweep for a flat tint (WCAG 2.3.3, which this app checks for as
 * atom U18). Keeping the branch here preserves that exact substitution.
 */
import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { S } from './styles'

/** Run `keyframes` on the element in `ref` for as long as it is mounted.
 *  `key` names the animation, so a re-render with the same one keeps it running. */
function useLoop(
  ref: React.RefObject<HTMLElement | null>,
  key: string,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  active: boolean,
): void {
  const spec = useRef({ keyframes, options })
  spec.current = { keyframes, options }
  useEffect(() => {
    const el = ref.current
    if (!active || !el || typeof el.animate !== 'function') return
    const animation = el.animate(spec.current.keyframes, spec.current.options)
    return () => animation.cancel()
  }, [ref, key, active])
}

/** Spinner. Renders a still icon when the user asked for reduced motion. */
export function Spinner({ size = 13, reduceMotion, style }: {
  size?: number
  reduceMotion: boolean
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useLoop(ref, 'spin', [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 1000, easing: 'linear', iterations: Infinity }, !reduceMotion)
  if (reduceMotion) return <Loader2 size={size} style={style} />
  return (
    <span ref={ref} style={{ display: 'inline-flex', lineHeight: 0, ...style }}>
      <Loader2 size={size} />
    </span>
  )
}

/**
 * The scan sweep over one waiting screen. `index` staggers the screens so a flow
 * reads as a sequence rather than one synchronised flash.
 */
export function Sweep({ index, reduceMotion }: { index: number; reduceMotion: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLoop(ref, `sweep-${index}`, [{ top: '-32%' }, { top: '100%' }],
    { duration: 2200, easing: 'ease-in-out', iterations: Infinity, delay: index * 350 }, !reduceMotion)
  if (reduceMotion) return <span style={S.sweepStill} />
  return <span ref={ref} style={{ ...S.sweep, top: '-32%' }} />
}

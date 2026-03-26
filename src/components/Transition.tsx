import { useEffect, useRef, useState } from 'react'

interface TransitionProps {
  children: (state: { visible: boolean; status: string; nodeRef?: React.RefObject<HTMLDivElement | null> }) => React.ReactNode
  in?: boolean
  unmount?: boolean
  initial?: boolean
  timeout?: number | { enter: number; exit: number }
}

export function Transition({
  children,
  in: show = true,
  unmount = false,
  initial = true,
  timeout = 0,
}: TransitionProps) {
  const [status, setStatus] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
    initial ? 'exited' : 'entered'
  )
  const [hasEntered, setHasEntered] = useState(!initial)
  const nodeRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const splitTimeout = typeof timeout === 'object'
  const visible = hasEntered && show

  useEffect(() => {
    if (show) {
      if (hasEntered) {
        setStatus('entered')
        return
      }
      setHasEntered(true)
      setStatus('entering')
      const t = splitTimeout ? (timeout as { enter: number }).enter : (timeout as number)
      timeoutRef.current = setTimeout(() => setStatus('entered'), t)
    } else {
      setStatus('exiting')
      const t = splitTimeout ? (timeout as { exit: number }).exit : (timeout as number)
      timeoutRef.current = setTimeout(() => {
        setStatus('exited')
        if (unmount) setHasEntered(false)
      }, t)
    }
    return () => clearTimeout(timeoutRef.current)
  }, [show, timeout, splitTimeout, unmount])

  if (!show && unmount && status === 'exited') return null

  return (
    <div ref={nodeRef} style={{ display: 'contents' }}>
      {children({ visible, status, nodeRef })}
    </div>
  )
}

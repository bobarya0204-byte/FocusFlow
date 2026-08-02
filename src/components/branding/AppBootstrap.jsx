import { useEffect, useState } from 'react'
import BrandedLoader from './BrandedLoader'

function AppBootstrap({ children }) {
  const [phase, setPhase] = useState('loading')

  useEffect(() => {
    const showFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('exiting')
      })
    })

    return () => cancelAnimationFrame(showFrame)
  }, [])

  useEffect(() => {
    if (phase !== 'exiting') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setPhase('ready')
    }, 220)

    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    <>
      {children}
      {phase !== 'ready' ? <BrandedLoader exiting={phase === 'exiting'} /> : null}
    </>
  )
}

export default AppBootstrap

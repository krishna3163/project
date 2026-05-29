import { useEffect, useRef, useState } from 'react'

interface JitsiVideoRoomProps {
  roomName: string
  displayName: string
  email: string
  onReadyToClose: () => void
}

export default function JitsiVideoRoom({ roomName, displayName, email, onReadyToClose }: JitsiVideoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically load the Jitsi Meet external API script
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => {
      setLoading(false)
      if (!(window as any).JitsiMeetExternalAPI) {
        setError('Failed to load Jitsi API.')
        return
      }

      if (!containerRef.current) return

      const domain = 'meet.jit.si'
      const options = {
        roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          email,
          displayName,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
          ],
        },
      }

      const api = new (window as any).JitsiMeetExternalAPI(domain, options)
      apiRef.current = api

      api.addListener('videoConferenceLeft', () => {
        onReadyToClose()
      })
    }
    
    script.onerror = () => {
      setLoading(false)
      setError('Could not reach Jitsi server. Please check your connection.')
    }

    document.body.appendChild(script)

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
      }
      document.body.removeChild(script)
    }
  }, [roomName, displayName, email, onReadyToClose])

  if (error) {
    return (
      <div style={{ padding: 24, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 600, position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading Video Interface...
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

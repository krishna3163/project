import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Loader2, Chrome, Github, Apple, MoreHorizontal } from 'lucide-react'

export default function LoginPage() {
  const { sendOtp, verifyOtp, loading } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otpVal, setOtpVal] = useState('')

  const params = new URLSearchParams(window.location.search)
  const isConcurrent = params.get('concurrent') === 'true'

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      await sendOtp(email)
      toast.success('OTP sent to your email!')
      setStep('otp')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    }
  }, [email, sendOtp])

  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpVal.trim().length !== 6) {
      toast.error('Enter complete 6-digit OTP')
      return
    }
    try {
      await verifyOtp(email, otpVal.trim())
      toast.success('Welcome to PrepNest! 🚀')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
      setOtpVal('')
    }
  }, [email, otpVal, verifyOtp])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#3c3c3c',
      padding: 16
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e1e4e8',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{
            width: 54,
            height: 54,
            marginBottom: 8,
            objectFit: 'cover',
            borderRadius: 12
          }} />
          <h1 style={{
            fontSize: '1.7rem',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>PrepNest</h1>
        </div>

        {isConcurrent && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 12,
            color: '#dc2626',
            textAlign: 'center',
            width: '100%'
          }}>
            <strong>⚠️ Security Alert:</strong> Account logged out due to session limits. Only 1 active device allowed.
          </div>
        )}

        <form onSubmit={step === 'email' ? handleSendOtp : handleVerifyOtp} style={{ width: '100%' }}>
          {step === 'email' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="email"
                placeholder="Username or Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 5,
                  border: '1px solid #c8ccd0',
                  fontSize: 14,
                  outline: 'none',
                  background: '#fefbeb',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.15s ease'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="password"
                placeholder="Enter 6-Digit OTP"
                value={otpVal}
                onChange={e => setOtpVal(e.target.value)}
                maxLength={6}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 5,
                  border: '1px solid #c8ccd0',
                  fontSize: 14,
                  outline: 'none',
                  background: '#fefbeb',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                  letterSpacing: otpVal ? '4px' : 'normal',
                  textAlign: otpVal ? 'center' : 'left'
                }}
              />
            </div>
          )}

          {/* Cloudflare Captcha Simulator Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            padding: '10px 16px',
            margin: '18px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: 56,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 14
              }}>✓</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Success!</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: '#f97316', letterSpacing: '0.2px' }}>CLOUDFLARE</span>
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy</a> • <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Help</a>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 5,
              background: '#4a607a',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#3b4d61'}
            onMouseOut={e => e.currentTarget.style.background = '#4a607a'}
          >
            {loading ? <Loader2 size={16} className="spinner" /> : (step === 'email' ? 'Send OTP' : 'Sign In')}
          </button>
        </form>

        {/* Terms and Links */}
        <div style={{ width: '100%', textAlign: 'center', marginTop: 18, fontSize: 12, color: '#8c8c8c' }}>
          By continuing, you agree to <a href="#" style={{ color: '#007aff', textDecoration: 'none' }}>Terms</a> & <a href="#" style={{ color: '#007aff', textDecoration: 'none' }}>Privacy Policy</a>.
        </div>

        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 20,
          fontSize: 13,
          color: '#505050'
        }}>
          <span style={{ cursor: 'pointer' }} onClick={() => toast('OTP flow does not require traditional passwords.')}>Forgot Password?</span>
          <span style={{ cursor: 'pointer', color: '#007aff', fontWeight: 500 }} onClick={() => { setStep('email'); setOtpVal('') }}>Sign Up</span>
        </div>

        {/* Social Sign In */}
        <div style={{ width: '100%', textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, position: 'relative' }}>
            <span style={{ background: '#ffffff', padding: '0 8px', position: 'relative', zIndex: 1 }}>or you can sign in with</span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e5e7eb', zIndex: 0 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
            <button style={socialBtnStyle} onClick={() => toast('Google auth simulation')}>
              <Chrome size={18} color="#8c8c8c" />
            </button>
            <button style={socialBtnStyle} onClick={() => toast('GitHub auth simulation')}>
              <Github size={18} color="#8c8c8c" />
            </button>
            <button style={socialBtnStyle} onClick={() => toast('Apple auth simulation')}>
              <Apple size={18} color="#8c8c8c" />
            </button>
            <button style={socialBtnStyle} onClick={() => toast('More options')}>
              <MoreHorizontal size={18} color="#8c8c8c" />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const socialBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: 'none',
  background: '#f2f3f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s',
  outline: 'none'
}

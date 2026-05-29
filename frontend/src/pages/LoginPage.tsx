import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { sendOtp, verifyOtp, loading } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otpVal, setOtpVal] = useState('')

  // Captcha State
  const [captchaChecked, setCaptchaChecked] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const isConcurrent = params.get('concurrent') === 'true'

  const handleCaptchaClick = () => {
    if (captchaChecked || captchaLoading) return
    setCaptchaLoading(true)
    setTimeout(() => {
      setCaptchaLoading(false)
      setCaptchaChecked(true)
      toast.success('Captcha verified! 🤖')
    }, 850)
  }

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaChecked) {
      toast.error('Please verify that you are not a robot first!')
      return
    }
    if (!email.trim()) return
    try {
      await sendOtp(email)
      toast.success('OTP sent to your email!')
      setStep('otp')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    }
  }, [email, sendOtp, captchaChecked])

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

          {/* reCAPTCHA Simulator Card (I am not a robot) */}
          <div style={{
            background: '#f9f9f9',
            border: '1px solid #d3d3d3',
            borderRadius: 3,
            padding: '10px 14px',
            margin: '18px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: 74,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={handleCaptchaClick}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  border: captchaChecked ? 'none' : '2px solid #c1c1c1',
                  background: captchaChecked ? 'transparent' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: captchaChecked || captchaLoading ? 'default' : 'pointer',
                  boxShadow: captchaChecked ? 'none' : 'inset 0 1px 1px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                {captchaLoading ? (
                  <div className="spinner" style={{
                    width: 18,
                    height: 18,
                    borderWidth: 2.5,
                    borderStyle: 'solid',
                    borderColor: '#4a90e2 #4a90e2 transparent transparent',
                    borderRadius: '50%'
                  }} />
                ) : captchaChecked ? (
                  <div style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#009a44',
                    fontSize: 26,
                    fontWeight: 'bold',
                    animation: 'popIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>✓</div>
                ) : null}
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#2d2d2d',
                marginLeft: 14,
                fontFamily: 'Roboto, Arial, sans-serif',
                cursor: captchaChecked || captchaLoading ? 'default' : 'pointer',
                userSelect: 'none'
              }} onClick={handleCaptchaClick}>
                I'm not a robot
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                alt="reCAPTCHA logo"
                style={{ width: 28, height: 28, opacity: 0.9, objectFit: 'contain' }}
              />
              <span style={{ fontSize: 8, color: '#9b9b9b', marginTop: 4, fontWeight: 'bold', fontFamily: 'sans-serif' }}>reCAPTCHA</span>
              <div style={{ fontSize: 7, color: '#9b9b9b', marginTop: 1, fontFamily: 'sans-serif' }}>
                <a href="#" style={{ color: '#9b9b9b', textDecoration: 'none' }}>Privacy</a> • <a href="#" style={{ color: '#9b9b9b', textDecoration: 'none' }}>Terms</a>
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
      </div>
      <style>{`
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Shield, ArrowRight, Loader2, Code2 } from 'lucide-react'

export default function LoginPage() {
  const { sendOtp, verifyOtp, loading } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

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
    const otpStr = otp.join('')
    if (otpStr.length !== 6) { toast.error('Enter complete 6-digit OTP'); return }
    try {
      await verifyOtp(email, otpStr)
      toast.success('Welcome to DSA Tracker! 🚀')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    }
  }, [email, otp, verifyOtp])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (!value && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(34,211,238,0.08) 0%, transparent 60%), #080c14',
    }}>
      {/* Floating orbs */}
      <div style={{
        position: 'fixed', top: '10%', left: '5%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(99,102,241,0.05)', filter: 'blur(80px)',
        pointerEvents: 'none', animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(34,211,238,0.04)', filter: 'blur(100px)',
        pointerEvents: 'none', animation: 'float 8s ease-in-out infinite reverse',
      }} />

      <div style={{ width: '100%', maxWidth: 440 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>
            <Code2 size={32} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>DSA Tracker</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
            Your placement preparation companion
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {step === 'email' ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ marginBottom: 4 }}>Get Started</h2>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Enter your email to receive a one-time password
                </p>
              </div>
              <form onSubmit={handleSendOtp}>
                <label className="label" htmlFor="email-input">Email Address</label>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <Mail size={16} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#64748b'
                  }} />
                  <input
                    id="email-input"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: 40 }}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading || !email.trim()}
                  id="btn-send-otp"
                >
                  {loading ? <Loader2 size={18} className="spinner" /> : (
                    <><span>Send OTP</span><ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={20} color="#818cf8" />
                  </div>
                  <div>
                    <h2 style={{ marginBottom: 0 }}>Verify OTP</h2>
                    <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                      Sent to {email}
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleVerifyOtp}>
                <div className="otp-container" style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-input"
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      id={`otp-${i}`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                  disabled={loading}
                  id="btn-verify-otp"
                >
                  {loading ? <Loader2 size={18} className="spinner" /> : 'Verify & Continue'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
                  onClick={() => { setStep('email'); setOtp(['','','','','','']) }}
                >
                  Change Email
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 20 }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

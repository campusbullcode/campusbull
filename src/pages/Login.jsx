import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImage from '../campus-bull-logo.png'
import './Login.css'

export default function Login() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isLogin && !otpStep) {
      // Move to OTP verification step
      setOtpStep(true)
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      if (!isLogin) setOtpStep(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container-new p-6">
      {/* Background Decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full z-0"></div>

      {/* Main Content Container (Asymmetric Layout Shell) */}
      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brand Story & Kinetic Identity */}
        <div className="lg:col-span-5 space-y-8 hidden lg:block">
          <div className="space-y-4">
            <span className="font-headline font-black text-4xl tracking-tighter text-primary-container flex items-center gap-3">
              <img src={logoImage} alt="Campus Bull" className="h-12 w-12 rounded-xl object-contain bg-white" />
              Campus Bull
            </span>
            <h1 className="font-headline font-bold text-6xl leading-[1.1] tracking-tight text-on-surface">
              Master your <br />
              <span className="text-secondary">NEET</span> journey.
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
              Access high-velocity analytics, rank predictors, and expert counseling in one seamless dashboard.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full ring-2 ring-surface bg-surface-container" alt="User avatar 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmvQh47VCXE1Ev4fWh6kMowmNSh0-BUNFQTgL9KxkqmfN7MPsm6tdIb0Gec6GaPsKXWrcwjMXuVJSJcq9ndHxdEWYxMBdwSBPG2hzBIGBREoh-sbXWC7ZQTmKmg-arCEq4Lly_SgVPRjerVdGWO38YKoLF6fU34AmAezgIpa60R3blbP0l-kQmaayu_A9leHMlm2MFLRSysc5C2v7Vn2ZzzpXvfDyRjSFkk9NIxJ_BpMi4Pps7jSXbRcKb56gkIXEaybdAZWNiuPyL" />
              <img className="w-10 h-10 rounded-full ring-2 ring-surface bg-surface-container" alt="User avatar 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBosUoVA3aNbKQNxhC3G_3K7T_IkBCaxVMmRnqv0LENwxqK0RzCJu_-sxF60_cataVHH4r1g2GUs0RsI0_SXteJYpbggTa0PZs44LYvWT-U0-WqmHUGhiCCuGLHlfFxVorWezp0jsbXYZYKE_lzq-kfIypjFXPCt8Tl62zRDopwma9TtDIMNRQdxtLUD8kvqgVZUqGJnX-kFPUbZtQTIBPYxtL8scSW9uBCyGjzOh-0tREPaynGpOeOTlicXiWDTh3LpBz3KxUDjco7" />
              <img className="w-10 h-10 rounded-full ring-2 ring-surface bg-surface-container" alt="User avatar 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASFOrqPpHryAOKX6EycuZXWVOFeAPMFEIlLGA-D8GRlDjSFmbNN_CjmxX5AYE1MVyWsXjKJUCULvibqCz3u30umBUvtg276etUvI-hzkQE-BVom92b4pKTXq9MOZpHt1M9uVIXpcf60wIJxeYKXf2bHnvX3sH3vhnlAkubKWFTBNFVTcD6jU24hQWsdLvI9BCgZNdtm8xHH-GT8xhivHXT_hsFaxWrBwNexfNBcm7ApJeW5OICzVmcLKBmT0rbWuFHM8O97tj3lHep" />
            </div>
            <div className="text-sm font-medium text-on-surface-variant">
              Joined by <span className="text-on-surface font-bold">12k+</span> top rankers
            </div>
          </div>
        </div>

        {/* Right Column: Auth Cards */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-end w-full">
          {/* Auth Module Toggle Navigation */}
          <div className="mb-8 flex bg-surface-container-low p-1 rounded-xl w-fit relative z-20">
            <button
              onClick={() => { setIsLogin(true); setError(''); setOtpStep(false); setOtp(''); }}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-surface-container text-on-surface shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setOtpStep(false); setOtp(''); }}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-surface-container text-on-surface shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Active Card */}
          <div className="w-full max-w-lg glass-panel p-10 rounded-3xl shadow-2xl space-y-8 transition-all duration-500 relative z-20">
            <div className="space-y-2">
              <h2 className="font-headline font-bold text-3xl text-on-surface">
                {isLogin ? 'Welcome back' : 'Create Account'}
              </h2>
              <p className="text-on-surface-variant text-sm">
                {isLogin ? 'Enter your credentials to access your dashboard' : 'Join the elite circle of medical aspirants'}
              </p>
            </div>

            {error && (
              <div className="bg-primary-container/20 border border-primary-container rounded-xl p-4 text-primary text-sm font-semibold">
                {error}
              </div>
            )}

            {/* OTP Step */}
            {otpStep && !isLogin ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="text-center space-y-2 pb-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-primary">sms</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    We've sent a 6-digit OTP to <span className="font-semibold text-on-surface">{formData.phone || formData.email}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Enter OTP</label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-4 text-on-surface text-center text-2xl tracking-[0.5em] placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                    placeholder="------"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
                <button
                  className="w-full bg-kinetic-gradient py-4 rounded-xl font-headline font-bold text-lg text-white shadow-[0_8px_32px_rgba(211,47,47,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                  type="submit"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Go to Dashboard'}
                  {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
                <button type="button" onClick={() => { setOtpStep(false); setOtp('') }} className="w-full text-sm text-on-surface-variant hover:text-on-surface transition-colors py-2">
                  ← Back to Sign Up
                </button>
              </form>
            ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">person</span>
                    <input
                      className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                      placeholder="Jane Doe"
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">mail</span>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                    placeholder="aspirant@campusbull.com"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">phone</span>
                    <input
                      className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                      placeholder="+91 98765 43210"
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
                  {isLogin && (
                    <a className="text-xs font-semibold text-primary hover:text-primary-fixed-dim transition-colors" href="#">Forgot Password?</a>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <span
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 cursor-pointer hover:text-on-surface transition-colors"
                    onClick={() => setShowPassword(v => !v)}
                  >{showPassword ? 'visibility_off' : 'visibility'}</span>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center gap-3 ml-1">
                  <input className="w-5 h-5 rounded bg-surface-container-highest border-none text-primary focus:ring-offset-surface ring-0" id="remember" type="checkbox" />
                  <label className="text-sm text-on-surface-variant font-medium cursor-pointer" htmlFor="remember">Stay logged in for 30 days</label>
                </div>
              )}

              <button
                className="w-full bg-kinetic-gradient py-4 rounded-xl font-headline font-bold text-lg text-white shadow-[0_8px_32px_rgba(211,47,47,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Login to Dashboard' : 'Verify')}
                {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
              </button>
            </form>
            )}

            {isLogin && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/20"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">or continue with</span>
                  <div className="flex-grow border-t border-outline-variant/20"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors font-semibold text-sm border border-outline-variant/10">
                    <img className="w-5 h-5" alt="Google logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7xinVJrXiFfP9k3gDNFkYt-VNtTXKsy0C-kFJwU8VC9mljO5Kkud8DTzCIivReU3i-LOAJ23h2P-0QwOmHZz55L-7NwoBasj-Z2eK3pIj4FeUItT9LqsftvkmNplgYyXO54438yLQMKbdWZipo17ReR3owZDmPyYj0nnOW5mR6s73UQIdfEkKNDG3syAVqj8-HPC4HQQu-LyMR7KQB8_E5xaJVVWTARD6Lde7P_BwV9z4Ap2d6IEmUXEK-3m5TThinLGIgn5p6PQl" />
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-3 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors font-semibold text-sm border border-outline-variant/10">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>ios</span>
                    Apple ID
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 z-10 hidden sm:flex">
        <a className="hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
        <a className="hover:text-on-surface transition-colors" href="#">Terms of Service</a>
        <a className="hover:text-on-surface transition-colors" href="#">Support</a>
      </footer>
    </div>
  )
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatAuthError } from '../../services/authService';
import { CropShieldLogo } from '../brand/CropShieldLogo';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Wheat,
  Globe,
} from 'lucide-react';

interface SignInPageProps {
  onSuccess?: () => void;
  onExploreGuest?: () => void;
  onOpenRegister?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSuccess,
  onExploreGuest,
  onOpenRegister,
}) => {
  const { signIn, signInWithGoogle, resetPassword, register } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isTa = language === 'ta';

  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle standard Email & Password Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      if (mode === 'signin') {
        if (!cleanEmail || !password) {
          throw new Error('missing-fields');
        }
        await signIn(cleanEmail, password);
        onSuccess?.();
      } else {
        if (!cleanEmail) {
          throw new Error('missing-email');
        }
        await resetPassword(cleanEmail);
        setSuccessMsg(
          isTa
            ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.'
            : 'Password reset link sent to your email.'
        );
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      const code = err.code || err.message;
      setErrorCode(code);
      if (err.message === 'missing-fields') {
        setErrorMsg(isTa ? 'அனைத்து தேவையான விவரங்களையும் நிரப்பவும்.' : 'Please fill in all required fields.');
      } else if (err.message === 'missing-email') {
        setErrorMsg(isTa ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your email address.');
      } else {
        setErrorMsg(formatAuthError(code, language));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err.code || err.message;
      setErrorCode(code);
      setErrorMsg(formatAuthError(code, language));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 1-Click Demo Login for quick testing & evaluation
  const handleDemoSignIn = async () => {
    setErrorMsg(null);
    setErrorCode(null);
    setIsLoading(true);
    const demoEmail = 'muthu.farmer@cropshield.in';
    const demoPass = 'Paddy12345';

    try {
      try {
        await signIn(demoEmail, demoPass);
      } catch (signInErr: any) {
        // If the demo account doesn't exist yet in this Firebase project,
        // auto-register it once so 1-click demo always works.
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential'
        ) {
          try {
            await register({
              email: demoEmail,
              password: demoPass,
              displayName: 'Muthu Ramanathan',
              preferredLanguage: language,
              district: 'Thanjavur',
              locality: 'Valangaiman Taluk',
              activeVariety: 'CR 1009 Sub 1',
            });
          } catch (regErr: any) {
            if (regErr.code === 'auth/email-already-in-use') {
              throw new Error(
                language === 'ta'
                  ? 'டெமோ பயனர் கணக்கு ஏற்கனவே உள்ளது, ஆனால் கடவுச்சொல் பொருந்தவில்லை. உங்கள் சொந்த மின்னஞ்சல் மூலம் புதிய பதிவு செய்யவும்.'
                  : 'The demo account already exists with different credentials in Firebase. Please register your own account using the Register tab.'
              );
            }
            throw regErr;
          }
        } else {
          throw signInErr;
        }
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Demo sign-in failed:', err);
      const code = err.code || err.message;
      setErrorCode(code);
      setErrorMsg(formatAuthError(code, language));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3E9] flex flex-col justify-between text-[#17271E]">
      {/* Minimal Top Header */}
      <header className="border-b border-[#DCE4D9] bg-[#F5F3E9]/90 backdrop-blur-xs py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onExploreGuest}
            className="cursor-pointer text-left focus:outline-hidden"
            title="CropShield Home"
          >
            <CropShieldLogo size="sm" showTagline />
          </button>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div
              className="flex items-center bg-white border border-[#DCE4D9] rounded-[8px] p-0.5 text-xs font-mono"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1.5 transition-colors cursor-pointer rounded-[6px] ${
                  language === 'en'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#52665A] hover:text-[#102D24]'
                }`}
              >
                English
              </button>
              <span className="text-[#DCE4D9] select-none" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1.5 transition-colors cursor-pointer rounded-[6px] ${
                  language === 'ta'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#52665A] hover:text-[#102D24]'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {onExploreGuest && (
              <button
                type="button"
                onClick={onExploreGuest}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-[#52665A] hover:text-[#1F6B4A] hover:underline cursor-pointer px-2 py-1"
              >
                <span>{isTa ? 'கள நுண்ணறிவு ஆய்வு →' : 'Explore Platform →'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white border border-[#DCE4D9] rounded-[16px] shadow-lg p-6 sm:p-8">
          {/* Top Metadata */}
          <div className="border-b border-[#DCE4D9] pb-4 mb-6 text-center">
            <span className="text-[11px] font-mono text-[#1F6B4A] uppercase tracking-wider block font-semibold mb-1">
              {isTa ? 'களப்பணி அங்கீகாரம் · வேளாண் வாயில்' : 'FIELDNOTE INTELLIGENCE · SECURE FARMER PORTAL'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102D24]">
              {mode === 'signin' && (isTa ? 'விவசாயி உள்நுழைவு' : 'Farmer Sign In')}
              {mode === 'reset' && (isTa ? 'கடவுச்சொல் மீட்டமைக்க' : 'Reset Password')}
            </h1>
            <p className="text-xs text-[#52665A] mt-1.5 font-sans">
              {mode === 'signin'
                ? isTa
                  ? 'பயிர் நோய் பகுப்பாய்வு மற்றும் தினசரி சந்தை விலைகளை அணுகவும்'
                  : 'Access AI diagnostic logs, real-time mandi prices, and field advisories'
                : isTa
                  ? 'கடவுச்சொல்லை மீட்டமைக்க உங்கள் மின்னஞ்சலை உள்ளிடவும்'
                  : 'Enter your registered email to receive a secure recovery link'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-[#FAF3F2] border border-[#B8423A]/30 text-[#B8423A] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-[10px]">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#B8423A]" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {mode === 'signin' && (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') && onOpenRegister && (
                  <div className="mt-2 pt-2 border-t border-[#B8423A]/20">
                    <button
                      type="button"
                      onClick={onOpenRegister}
                      className="text-xs font-semibold underline hover:text-[#B8423A] cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{isTa ? 'புதிய விவசாயியா? கணக்கை உருவாக்க இங்கே சொடுக்கவும் →' : "Don't have an account yet? Register here →"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-[#EAEFE5] border border-[#70B77E]/50 text-[#17271E] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-[10px]">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#1F6B4A]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SECTION: CONTINUE WITH GOOGLE */}
          {mode === 'signin' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 min-h-[46px] bg-white hover:bg-[#F5F3E9] text-[#17271E] border border-[#DCE4D9] hover:border-[#1F6B4A] rounded-[10px] font-sans font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                aria-label="Continue with Google"
              >
                {isGoogleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1F6B4A]" />
                    <span className="font-mono text-xs">{isTa ? 'கூகிள் இணைக்கிறது...' : 'Connecting to Google...'}</span>
                  </>
                ) : (
                  <>
                    {/* Google G Multi-Color SVG */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span className="font-medium text-[#17271E]">
                      {isTa ? 'கூகிள் மூலம் தொடரவும்' : 'Continue with Google'}
                    </span>
                  </>
                )}
              </button>

              {/* Minimal Section Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#DCE4D9]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-mono">
                  <span className="bg-white px-3 text-[#718176]">
                    {isTa ? 'அல்லது மின்னஞ்சல் மூலம்' : 'or with farmer credentials'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signInEmail" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                {isTa ? 'மின்னஞ்சல் முகவரி (Email Address) *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718176] absolute left-3.5 top-3.5" />
                <input
                  id="signInEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isTa ? 'farmer@cropshield.in' : 'farmer@cropshield.in'}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F5F3E9]/40 border border-[#DCE4D9] text-sm text-[#17271E] font-sans focus:outline-hidden focus:border-[#1F6B4A] rounded-[10px] transition-colors"
                />
              </div>
            </div>

            {mode === 'signin' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="signInPassword" className="block text-xs font-mono text-[#52665A] uppercase">
                    {isTa ? 'கடவுச்சொல் (Password) *' : 'Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-mono text-[#1F6B4A] hover:underline cursor-pointer"
                  >
                    {isTa ? 'மறந்துவிட்டீர்களா?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#718176] absolute left-3.5 top-3.5" />
                  <input
                    id="signInPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F5F3E9]/40 border border-[#DCE4D9] text-sm text-[#17271E] font-sans focus:outline-hidden focus:border-[#1F6B4A] rounded-[10px] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#718176] hover:text-[#102D24] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-mono text-[#1F6B4A] hover:underline cursor-pointer"
                >
                  {isTa ? '← உள்நுழைவுக்குத் திரும்பு' : '← Back to Sign In'}
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="btn-primary w-full py-3 min-h-[46px] rounded-[10px] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isTa ? 'செயலாக்குகிறது...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? isTa
                          ? 'உள்நுழைக'
                          : 'Sign In to Portal'
                        : isTa
                          ? 'மீட்டமைப்பு இணைப்பு அனுப்புக'
                          : 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Reviewer Strip */}
          <div className="mt-6 pt-5 border-t border-[#DCE4D9]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#52665A] uppercase">
                {isTa ? 'மதிப்பீட்டாளர் உடனடி அணுகல்' : 'Instant Reviewer Demo'}
              </span>
              <span className="text-[10px] font-mono text-[#1F6B4A] bg-[#EAEFE5] px-2 py-0.5 rounded-[6px] font-semibold">
                Paddy CR-1009
              </span>
            </div>
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading || isGoogleLoading}
              className="btn-secondary w-full py-2.5 min-h-[44px] rounded-[10px] flex items-center justify-center gap-2 text-xs font-mono"
            >
              <User className="w-3.5 h-3.5 text-[#1F6B4A]" />
              <span>
                {isTa
                  ? 'முன்மாதிரி கணக்கில் நுழைக (Muthu Ramanathan, Thanjavur)'
                  : '1-Click Demo Login (Muthu Ramanathan, Thanjavur)'}
              </span>
            </button>
          </div>

          {/* New Farmer Registration Link */}
          {onOpenRegister && (
            <div className="mt-5 text-center text-xs text-[#52665A]">
              <span>{isTa ? 'புதிய விவசாயியா? ' : 'New to CropShield? '}</span>
              <button
                type="button"
                onClick={onOpenRegister}
                className="font-semibold text-[#1F6B4A] hover:underline cursor-pointer ml-1 inline-flex items-center"
              >
                <span>{isTa ? 'புதிய கணக்கை உருவாக்கவும் →' : 'Register your farm →'}</span>
              </button>
            </div>
          )}

          {/* Guest Explorer Link */}
          {onExploreGuest && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={onExploreGuest}
                className="text-xs font-mono text-[#718176] hover:text-[#102D24] hover:underline cursor-pointer"
              >
                {isTa
                  ? '← உள்நுழையாமல் பொது கள தகவல்களை ஆராயவும்'
                  : '← Explore Public Crop Advisory without signing in'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Bottom Footer */}
      <footer className="border-t border-[#DCE4D9] bg-[#F5F3E9] py-4 px-4 text-center text-xs font-mono text-[#718176]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CropShield AI · Tamil Nadu Agricultural Intelligence & Advisory</span>
          <span>Open-Meteo · TNAU Protocols · Gemini Vision AI</span>
        </div>
      </footer>
    </div>
  );
};

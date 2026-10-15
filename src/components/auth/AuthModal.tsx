import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatAuthError } from '../../services/authService';
import { X, Lock, Mail, User, MapPin, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register' | 'reset';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
}) => {
  const { signIn, signInWithGoogle, register, resetPassword } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [mode, setMode] = useState<'signin' | 'register' | 'reset'>(initialMode);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [district, setDistrict] = useState('Thanjavur');
  const [locality, setLocality] = useState('');
  const [variety, setVariety] = useState('CR 1009 Sub 1');

  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
        onClose();
      } else if (mode === 'register') {
        const cleanName = displayName.trim();
        if (!cleanEmail || !password || !cleanName) {
          throw new Error('missing-fields');
        }
        if (password !== confirmPassword) {
          throw new Error('passwords-mismatch');
        }
        if (password.length < 6) {
          throw new Error('auth/weak-password');
        }
        await register({
          email: cleanEmail,
          password,
          displayName: cleanName,
          preferredLanguage: language,
          district,
          locality: locality.trim(),
          activeVariety: variety,
        });
        setSuccessMsg(isTa ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Farmer account created successfully!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      } else if (mode === 'reset') {
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
      console.error('Auth action failed:', err);
      const code = err.code || err.message;
      setErrorCode(code);
      if (err.message === 'missing-fields') {
        setErrorMsg(isTa ? 'அனைத்து தேவையான விவரங்களையும் நிரப்பவும்.' : 'Please fill in all required fields.');
      } else if (err.message === 'passwords-mismatch') {
        setErrorMsg(isTa ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.');
      } else if (err.message === 'missing-email') {
        setErrorMsg(isTa ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your email address.');
      } else {
        setErrorMsg(formatAuthError(code, language));
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        // If demo user does not exist yet or credential error, auto-register once
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
      onClose();
    } catch (err: any) {
      console.error('Demo sign-in failed:', err);
      const code = err.code || err.message;
      setErrorCode(code);
      setErrorMsg(formatAuthError(code, language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err.code || err.message;
      setErrorCode(code);
      setErrorMsg(formatAuthError(code, language));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B211A]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#DCE4D9] rounded-[16px] max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE4D9] pb-4 mb-6">
          <div>
            <span className="text-xs font-mono text-[#1F6B4A] uppercase tracking-wider block font-semibold">
              FIELDNOTE INTELLIGENCE · AUTHENTICATION
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#102D24] mt-0.5">
              {mode === 'signin' && (isTa ? 'விவசாயி உள்நுழைவு' : 'Farmer Sign In')}
              {mode === 'register' && (isTa ? 'புதிய விவசாயி பதிவு' : 'Register New Farmer')}
              {mode === 'reset' && (isTa ? 'கடவுச்சொல் மீட்டமைக்க' : 'Reset Password')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#52665A] hover:text-[#102D24] p-1.5 cursor-pointer rounded-[8px] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls for Sign In / Register */}
        <div className="flex items-center gap-1 p-1 bg-[#EAEFE5] border border-[#DCE4D9] mb-6 rounded-[10px]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setErrorCode(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-medium rounded-[8px] transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#1F6B4A] text-white shadow-xs'
                : 'text-[#52665A] hover:text-[#102D24]'
            }`}
          >
            {isTa ? 'உள்நுழைக' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setErrorCode(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-medium rounded-[8px] transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[#1F6B4A] text-white shadow-xs'
                : 'text-[#52665A] hover:text-[#102D24]'
            }`}
          >
            {isTa ? 'புதிய பதிவு' : 'Register'}
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-[#FAF3F2] border border-[#B8423A]/30 text-[#B8423A] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-[10px]">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#B8423A]" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {mode === 'signin' && (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') && (
                <div className="mt-2 pt-2 border-t border-[#B8423A]/20">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                      setErrorCode(null);
                    }}
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

        {/* Continue with Google Section */}
        {mode !== 'reset' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 min-h-[46px] bg-white hover:bg-[#F5F3E9] text-[#17271E] border border-[#DCE4D9] hover:border-[#1F6B4A] rounded-[10px] font-sans font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#1F6B4A]" />
                  <span className="font-mono text-xs">{isTa ? 'கூகிள் இணைக்கிறது...' : 'Connecting to Google...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                  <span className="text-[#17271E] font-medium">{isTa ? 'கூகிள் மூலம் தொடரவும்' : 'Continue with Google'}</span>
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DCE4D9]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono">
                <span className="bg-white px-2 text-[#718176]">
                  {isTa ? 'அல்லது மின்னஞ்சல் மூலம்' : 'or with credentials'}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="authDisplayName" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                {isTa ? 'விவசாயி பெயர் (Full Name) *' : 'Farmer Full Name *'}
              </label>
              <div className="relative">
                <input
                  id="authDisplayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Muthu Ramanathan"
                  className="w-full p-3 pl-10 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-sans focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
                />
                <User className="w-4 h-4 text-[#718176] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="authEmail" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
              {isTa ? 'மின்னஞ்சல் முகவரி (Email Address) *' : 'Email Address *'}
            </label>
            <div className="relative">
              <input
                id="authEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@domain.com"
                className="w-full p-3 pl-10 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-mono focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
              />
              <Mail className="w-4 h-4 text-[#718176] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="authPassword" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                {isTa ? 'கடவுச்சொல் (Password) *' : 'Password *'}
              </label>
              <div className="relative">
                <input
                  id="authPassword"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full p-3 pl-10 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-mono focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
                />
                <Lock className="w-4 h-4 text-[#718176] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="authConfirmPassword" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                  {isTa ? 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும் *' : 'Confirm Password *'}
                </label>
                <div className="relative">
                  <input
                    id="authConfirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full p-3 pl-10 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-mono focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
                  />
                  <Lock className="w-4 h-4 text-[#718176] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="authDistrict" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                    {isTa ? 'மாவட்டம் (District) *' : 'District *'}
                  </label>
                  <select
                    id="authDistrict"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-3 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-sans focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
                  >
                    <option value="Thanjavur">Thanjavur</option>
                    <option value="Tiruvarur">Tiruvarur</option>
                    <option value="Mayiladuthurai">Mayiladuthurai</option>
                    <option value="Nagapattinam">Nagapattinam</option>
                    <option value="Cuddalore">Cuddalore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Tiruchirappalli">Tiruchirappalli</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="authLocality" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                    {isTa ? 'கிராமம் / தாலுகா (Village)' : 'Village / Taluk'}
                  </label>
                  <input
                    id="authLocality"
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Needamangalam"
                    className="w-full p-3 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-sans focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="authVariety" className="block text-xs font-mono text-[#52665A] uppercase mb-1">
                  {isTa ? 'முக்கிய நெல் ரகம் (Paddy Variety)' : 'Primary Paddy Variety'}
                </label>
                <select
                  id="authVariety"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full p-3 bg-[#F5F3E9]/40 border border-[#DCE4D9] rounded-[10px] text-sm text-[#17271E] font-sans focus:outline-hidden focus:border-[#1F6B4A] transition-colors"
                >
                  <option value="CR 1009 Sub 1">CR 1009 Sub 1 (Long duration Samba)</option>
                  <option value="BPT 5204 (Samba Mahsuri)">BPT 5204 (Samba Mahsuri)</option>
                  <option value="ADT 45">ADT 45 (Kuruvai)</option>
                  <option value="CO 51">CO 51 (Medium duration)</option>
                  <option value="TKM 13">TKM 13</option>
                  <option value="Karuppu Kavuni">Karuppu Kavuni (Traditional Black)</option>
                </select>
              </div>
            </>
          )}

          {mode === 'signin' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-xs font-mono text-[#1F6B4A] hover:underline cursor-pointer"
              >
                {isTa ? 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?' : 'Forgot password?'}
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 min-h-[46px] rounded-[10px] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isTa ? 'செயலாக்குகிறது...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signin' && (isTa ? 'உள்நுழைக' : 'Sign In')}
                    {mode === 'register' && (isTa ? 'கணக்கை உருவாக்கு' : 'Create Farmer Account')}
                    {mode === 'reset' && (isTa ? 'மீட்டமைப்பு இணைப்பு அனுப்புக' : 'Send Reset Link')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast-Sign-In Strip */}
        <div className="mt-6 pt-5 border-t border-[#DCE4D9]">
          <div className="text-[11px] font-mono text-[#52665A] uppercase mb-2">
            {isTa ? 'மதிப்பீட்டாளர் உடனடி அணுகல் (DEMO LOGIN)' : 'Instant Demo Reviewer Access'}
          </div>
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="btn-secondary w-full py-2.5 min-h-[44px] rounded-[10px] flex items-center justify-center gap-2 text-xs font-mono"
          >
            <User className="w-3.5 h-3.5 text-[#1F6B4A]" />
            <span>
              {isTa ? 'முன்மாதிரி கணக்கில் நுழைக (Muthu Ramanathan, Thanjavur)' : '1-Click Demo Sign In (Muthu Ramanathan, Thanjavur)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

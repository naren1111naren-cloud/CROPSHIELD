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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-[#183B2A] max-w-lg w-full p-6 sm:p-8 shadow-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9DED3] pb-4 mb-6">
          <div>
            <span className="text-xs font-mono text-[#426B43] uppercase tracking-wider block font-semibold">
              FIELDNOTE INTELLIGENCE · AUTHENTICATION
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mt-0.5">
              {mode === 'signin' && (isTa ? 'விவசாயி உள்நுழைவு' : 'Farmer Sign In')}
              {mode === 'register' && (isTa ? 'புதிய விவசாயி பதிவு' : 'Register New Farmer')}
              {mode === 'reset' && (isTa ? 'கடவுச்சொல் மீட்டமைக்க' : 'Reset Password')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#4A584D] hover:text-[#183B2A] p-1.5 cursor-pointer rounded-xs"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls for Sign In / Register */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF9F3] border border-[#D9DED3] mb-6 rounded-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setErrorCode(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#183B2A] text-white'
                : 'text-[#4A584D] hover:text-[#183B2A]'
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
            className={`flex-1 py-2 text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[#183B2A] text-white'
                : 'text-[#4A584D] hover:text-[#183B2A]'
            }`}
          >
            {isTa ? 'புதிய பதிவு' : 'Register'}
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-[#FAF3F2] border border-[#A94338]/40 text-[#A94338] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-xs">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {mode === 'signin' && (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') && (
                <div className="mt-2 pt-2 border-t border-[#A94338]/20">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                      setErrorCode(null);
                    }}
                    className="text-xs font-semibold underline hover:text-[#782820] cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>{isTa ? 'புதிய விவசாயியா? கணக்கை உருவாக்க இங்கே சொடுக்கவும் →' : "Don't have an account yet? Register here →"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-[#FAF9F3] border border-[#426B43]/40 text-[#183B2A] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-xs">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#426B43]" />
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
              className="w-full py-3 px-4 min-h-[46px] bg-white hover:bg-[#F3F5EE] text-[#183B2A] border border-[#D9DED3] hover:border-[#183B2A] rounded-xs font-sans font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#183B2A]" />
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
                  <span>{isTa ? 'கூகிள் மூலம் தொடரவும்' : 'Continue with Google'}</span>
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D9DED3]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono">
                <span className="bg-white px-2 text-[#738275]">
                  {isTa ? 'அல்லது மின்னஞ்சல் மூலம்' : 'or with credentials'}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="authDisplayName" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
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
                  className="w-full p-3 pl-10 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A]"
                />
                <User className="w-4 h-4 text-[#4A584D] absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="authEmail" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
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
                className="w-full p-3 pl-10 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A]"
              />
              <Mail className="w-4 h-4 text-[#4A584D] absolute left-3 top-3.5" />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="authPassword" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
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
                  className="w-full p-3 pl-10 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A]"
                />
                <Lock className="w-4 h-4 text-[#4A584D] absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="authConfirmPassword" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
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
                    className="w-full p-3 pl-10 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A]"
                  />
                  <Lock className="w-4 h-4 text-[#4A584D] absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="authDistrict" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {isTa ? 'மாவட்டம் (District) *' : 'District *'}
                  </label>
                  <select
                    id="authDistrict"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A]"
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
                  <label htmlFor="authLocality" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {isTa ? 'கிராமம் / தாலுகா (Village)' : 'Village / Taluk'}
                  </label>
                  <input
                    id="authLocality"
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Needamangalam"
                    className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="authVariety" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                  {isTa ? 'முக்கிய நெல் ரகம் (Paddy Variety)' : 'Primary Paddy Variety'}
                </label>
                <select
                  id="authVariety"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A]"
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
                className="text-xs font-mono text-[#183B2A] hover:underline cursor-pointer"
              >
                {isTa ? 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?' : 'Forgot password?'}
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 min-h-[48px] text-sm font-semibold tracking-wide text-white bg-[#183B2A] hover:bg-[#122c20] transition-colors rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
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
        <div className="mt-6 pt-5 border-t border-[#D9DED3]">
          <div className="text-[11px] font-mono text-[#4A584D] uppercase mb-2">
            {isTa ? 'மதிப்பீட்டாளர் உடனடி அணுகல் (DEMO LOGIN)' : 'Instant Demo Reviewer Access'}
          </div>
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="w-full py-2.5 min-h-[44px] text-xs font-mono font-medium text-[#183B2A] border border-[#183B2A] bg-[#FAF9F3] hover:bg-[#E5EBDD] rounded-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>
              {isTa ? 'முன்மாதிரி கணக்கில் நுழைக (Muthu Ramanathan, Thanjavur)' : '1-Click Demo Sign In (Muthu Ramanathan, Thanjavur)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

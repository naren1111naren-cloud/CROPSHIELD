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
  const { signIn, register, resetPassword } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [mode, setMode] = useState<'signin' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [district, setDistrict] = useState('Thanjavur');
  const [locality, setLocality] = useState('');
  const [variety, setVariety] = useState('CR 1009 Sub 1');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          throw new Error('missing-fields');
        }
        await signIn(email, password);
        onSuccess?.();
        onClose();
      } else if (mode === 'register') {
        if (!email || !password || !displayName) {
          throw new Error('missing-fields');
        }
        if (password !== confirmPassword) {
          throw new Error('passwords-mismatch');
        }
        if (password.length < 6) {
          throw new Error('auth/weak-password');
        }
        await register({
          email,
          password,
          displayName,
          preferredLanguage: language,
          district,
          locality,
          activeVariety: variety,
        });
        setSuccessMsg(isTa ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Farmer account created successfully!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      } else if (mode === 'reset') {
        if (!email) {
          throw new Error('missing-email');
        }
        await resetPassword(email);
        setSuccessMsg(
          isTa
            ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.'
            : 'Password reset link sent to your email.'
        );
      }
    } catch (err: any) {
      console.error('Auth action failed:', err);
      if (err.message === 'missing-fields') {
        setErrorMsg(isTa ? 'அனைத்து தேவையான விவரங்களையும் நிரப்பவும்.' : 'Please fill in all required fields.');
      } else if (err.message === 'passwords-mismatch') {
        setErrorMsg(isTa ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.');
      } else if (err.message === 'missing-email') {
        setErrorMsg(isTa ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your email address.');
      } else {
        const code = err.code || err.message;
        setErrorMsg(formatAuthError(code, language));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    const demoEmail = 'muthu.farmer@cropshield.in';
    const demoPass = 'Paddy12345';
    try {
      try {
        await signIn(demoEmail, demoPass);
      } catch (signInErr: any) {
        // If demo user does not exist yet, auto-register once
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          await register({
            email: demoEmail,
            password: demoPass,
            displayName: 'Muthu Ramanathan',
            preferredLanguage: language,
            district: 'Thanjavur',
            locality: 'Valangaiman Taluk',
            activeVariety: 'CR 1009 Sub 1',
          });
        } else {
          throw signInErr;
        }
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Demo sign-in failed:', err);
      setErrorMsg(formatAuthError(err.code || err.message, language));
    } finally {
      setIsLoading(false);
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
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-[#FAF9F3] border border-[#426B43]/40 text-[#183B2A] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-xs">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#426B43]" />
            <span>{successMsg}</span>
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

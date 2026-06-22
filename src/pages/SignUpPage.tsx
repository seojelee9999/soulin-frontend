import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as apiSignup, login as apiLogin, sendVerificationCode, verifyCode } from '../api/auth';
import BackButton from '../components/common/BackButton';
import { PASSWORD_MIN_LENGTH } from '../constants/auth';


function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  sanitize,
  blockSpace,
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  sanitize?: (v: string) => string;
  blockSpace?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => {
          const next = sanitize ? sanitize(e.target.value) : e.target.value;
          onChange(next);
        }}
        onKeyDown={(e) => {
          if (blockSpace && e.key === ' ') e.preventDefault();
        }}
        onPaste={(e) => {
          if (!blockSpace) return;
          const text = e.clipboardData.getData('text');
          const cleaned = text.replace(/\s+/g, '');
          if (text !== cleaned) {
            e.preventDefault();
            document.execCommand('insertText', false, cleaned);
          }
        }}
        placeholder={placeholder}
        className="w-full outline-none bg-transparent"
        style={{
          height: 44,
          borderRadius: 8,
          border: '1px solid #d8d8d8',
          padding: '0 14px',
          fontSize: 15,
          fontWeight: 400,
          color: '#131416',
        }}
      />
    </div>
  );
}

function NextButton({ active, onClick, label = '다음', loading = false }: {
  active: boolean;
  onClick: () => void;
  label?: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!active || loading}
      style={{
        width: '100%',
        height: 44,
        borderRadius: 30,
        backgroundColor: active && !loading ? '#000000' : '#e6e6e6',
        color: active && !loading ? '#ffffff' : '#000000',
        fontSize: 16,
        fontWeight: 500,
        border: 'none',
        cursor: active && !loading ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
      }}
    >
      {loading ? '처리 중…' : label}
    </button>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // 초 단위, 0이면 재전송 가능

  const step1Active = email.trim().length > 0 && password.length >= PASSWORD_MIN_LENGTH;
  const step2Active = code.trim().length === 6;
  const step3Active = nickname.trim().length >= 2 && nickname.trim().length <= 10;

  // 재전송 쿨다운 카운트다운 (60초 → 0)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const startResendCooldown = () => setResendCooldown(60);

  const handleStep1Next = async () => {
    if (!step1Active || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendVerificationCode(email.trim());
      setStep(2);
      startResendCooldown();
    } catch {
      setError('인증 코드 발송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await sendVerificationCode(email.trim());
      startResendCooldown();
    } catch {
      setError('재전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleStep2Verify = async () => {
    if (!step2Active || loading) return;
    setError('');
    setLoading(true);
    try {
      await verifyCode(email.trim(), code.trim());
      setStep(3);
    } catch {
      setError('인증 코드가 올바르지 않거나 만료됐어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Done = async () => {
    if (!step3Active || loading) return;
    setError('');
    setLoading(true);
    try {
      await apiSignup({ email: email.trim(), password, userName: nickname.trim() });
      const data = await apiLogin({ email: email.trim(), password });
      login({ userName: data.userName, userId: data.userId });
      navigate('/', { replace: true });
    } catch {
      setError('회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 1) {
      navigate('/login');
    } else if (step === 2) {
      setCode('');
      setStep(1);
    } else {
      setStep(2);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-4">
      <div style={{ paddingTop: 16, paddingBottom: 8 }}>
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div style={{ height: 24 }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', marginBottom: 40, lineHeight: 1.4 }}>
            이메일과 비밀번호를<br />입력해주세요
          </h1>
          <div className="flex flex-col gap-5 mb-10">
            <InputField
              label="이메일 주소"
              type="email"
              value={email}
              onChange={setEmail}
              sanitize={(v) => v.replace(/\s+/g, '')}
              blockSpace
              placeholder="abc@Email.com"
            />
            <InputField
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={`${PASSWORD_MIN_LENGTH}자 이상의 비밀번호`}
            />
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}
          <NextButton active={step1Active} onClick={handleStep1Next} label="인증 코드 받기" loading={loading} />
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ height: 24 }} />
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', lineHeight: 1.4, marginBottom: 8 }}>
              이메일 인증
            </h1>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#222222', lineHeight: 1.5 }}>
              {email}로 6자리 인증 코드를 보냈어요. (5분 내 입력)
            </p>
          </div>
          <div className="mb-4">
            <InputField
              type="tel"
              value={code}
              onChange={setCode}
              sanitize={(v) => v.replace(/\D/g, '').slice(0, 6)}
              blockSpace
              placeholder="인증 코드 6자리"
            />
          </div>
          <div className="flex justify-end mb-10">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: resendCooldown > 0 ? '#aaaaaa' : '#131416',
                background: 'transparent',
                border: 'none',
                padding: '4px 8px',
                cursor: resendCooldown > 0 ? 'default' : 'pointer',
              }}
            >
              {resendCooldown > 0 ? `재전송 (${resendCooldown}초)` : '코드 재전송'}
            </button>
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}
          <NextButton active={step2Active} onClick={handleStep2Verify} label="인증 확인" loading={loading} />
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ height: 24 }} />
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', lineHeight: 1.4, marginBottom: 8 }}>
              어떤 이름으로<br />불릴까요?
            </h1>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#222222' }}>닉네임은 피드에 공개돼요.</p>
          </div>
          <div className="mb-10">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                if (e.target.value.length <= 10) setNickname(e.target.value);
              }}
              placeholder="2~10자 이내"
              className="w-full outline-none bg-transparent"
              style={{
                height: 44,
                borderRadius: 8,
                border: '1px solid #d8d8d8',
                padding: '0 14px',
                fontSize: 15,
                fontWeight: 400,
                color: '#131416',
              }}
            />
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}
          <NextButton active={step3Active} onClick={handleStep3Done} label="완료" loading={loading} />
        </>
      )}
    </div>
  );
}

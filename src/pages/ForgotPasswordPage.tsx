import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from '../api/auth';
import BackButton from '../components/common/BackButton';
import { PASSWORD_MIN_LENGTH } from '../constants/auth';

const PASSWORD_MAX_LENGTH = 72;


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

// axios 에러에서 BE의 code/message 안전 추출
function extractApiError(err: unknown): { code?: string; message?: string } {
  const anyErr = err as { response?: { data?: { code?: string; message?: string } } };
  return {
    code: anyErr?.response?.data?.code,
    message: anyErr?.response?.data?.message,
  };
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // ★ resetToken은 컴포넌트 state(메모리)에만 보관. localStorage/URL에 저장 금지.
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const step1Active = email.trim().length > 0;
  const step2Active = code.trim().length === 6;
  const passwordValid =
    newPassword.length >= PASSWORD_MIN_LENGTH && newPassword.length <= PASSWORD_MAX_LENGTH;
  const step3Active =
    passwordValid && confirmPassword.length > 0 && newPassword === confirmPassword;

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
      await sendPasswordResetCode(email.trim());
      setStep(2);
      startResendCooldown();
    } catch (err) {
      const { message } = extractApiError(err);
      setError(message || '가입된 이메일이 아니거나 발송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await sendPasswordResetCode(email.trim());
      startResendCooldown();
    } catch (err) {
      const { message } = extractApiError(err);
      setError(message || '재전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleStep2Verify = async () => {
    if (!step2Active || loading) return;
    setError('');
    setLoading(true);
    try {
      const { resetToken: token } = await verifyPasswordResetCode(email.trim(), code.trim());
      setResetToken(token);
      setStep(3);
    } catch (err) {
      const { code: apiCode, message } = extractApiError(err);
      if (apiCode === 'VERIFICATION_CODE_EXPIRED') {
        // 코드 만료 → 재발송 가능하게 쿨다운 해제
        setResendCooldown(0);
        setError('인증 코드가 만료됐어요. 코드를 재전송해 주세요.');
      } else if (apiCode === 'VERIFICATION_ATTEMPT_LIMIT') {
        // 시도 한도 초과 → 코드 비우고 재발송 유도
        setCode('');
        setResendCooldown(0);
        setError('인증 시도 횟수가 초과됐어요. 코드를 재전송해 주세요.');
      } else {
        setError(message || '인증 코드가 올바르지 않아요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Done = async () => {
    if (!step3Active || loading) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword({
        resetToken,
        newPassword,
        newPasswordConfirm: confirmPassword,
      });
      alert('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.');
      navigate('/login', { replace: true });
    } catch (err) {
      const { code: apiCode, message } = extractApiError(err);
      if (apiCode === 'INVALID_RESET_TOKEN') {
        // 리셋 토큰 만료/무효 → 이메일 단계부터 다시
        setResetToken('');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResendCooldown(0);
        setStep(1);
        setError('인증이 만료되었어요. 다시 인증해 주세요.');
      } else {
        setError(message || '비밀번호 재설정에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', marginBottom: 8, lineHeight: 1.4 }}>
            비밀번호 재설정
          </h1>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#222222', lineHeight: 1.5, marginBottom: 32 }}>
            가입하신 이메일로 인증 코드를 보내드릴게요.
          </p>
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
          <NextButton active={step2Active} onClick={handleStep2Verify} label="확인" loading={loading} />
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ height: 24 }} />
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', lineHeight: 1.4, marginBottom: 8 }}>
              새 비밀번호 설정
            </h1>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#222222', lineHeight: 1.5 }}>
              새로 사용할 비밀번호를 입력해 주세요.
            </p>
          </div>
          <div className="flex flex-col gap-5 mb-4">
            <InputField
              label="새 비밀번호"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              blockSpace
              placeholder={`${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자 비밀번호`}
            />
            <InputField
              label="새 비밀번호 확인"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              blockSpace
              placeholder="다시 한 번 입력해 주세요"
            />
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>
              비밀번호가 일치하지 않아요.
            </p>
          )}
          {error && (
            <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}
          <div style={{ marginTop: 24 }}>
            <NextButton active={step3Active} onClick={handleStep3Done} label="비밀번호 변경" loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}

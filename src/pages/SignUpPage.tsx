import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { signup as apiSignup, login as apiLogin } from '../api/auth';
import BackButton from '../components/common/BackButton';


function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  const { login } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const step1Active = email.trim().length > 0 && password.length >= 6;
  const step2Active = nickname.trim().length >= 2 && nickname.trim().length <= 10;

  const handleStep1Next = () => {
    if (!step1Active) return;
    setError('');
    setStep(2);
  };

  const handleStep2Done = async () => {
    if (!step2Active || loading) return;
    setError('');
    setLoading(true);
    try {
      await apiSignup({ email: email.trim(), password, userName: nickname.trim() });
      const data = await apiLogin({ email: email.trim(), password });
      login({ userName: data.userName });
      navigate('/', { replace: true });
    } catch {
      setError('회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-4">
      <div style={{ paddingTop: 16, paddingBottom: 8 }}>
        <BackButton onClick={() => (step === 1 ? navigate('/login') : setStep(1))} />
      </div>

      {step === 1 ? (
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
              placeholder="abc@Email.com"
            />
            <InputField
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="6자 이상의 비밀번호"
            />
          </div>
          <NextButton active={step1Active} onClick={handleStep1Next} />
        </>
      ) : (
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
          <NextButton active={step2Active} onClick={handleStep2Done} label="완료" loading={loading} />
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function ChevronLeft() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
      <path d="M9 1L1 8L9 15" stroke="#858585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

function NextButton({ active, onClick, label = '다음' }: { active: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={!active}
      style={{
        width: '100%',
        height: 44,
        borderRadius: 30,
        backgroundColor: active ? '#000000' : '#e6e6e6',
        color: active ? '#ffffff' : '#000000',
        fontSize: 16,
        fontWeight: 500,
        border: 'none',
        cursor: active ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
      }}
    >
      {label}
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

  const step1Active = email.trim().length > 0 && password.length >= 6;
  const step2Active = nickname.trim().length >= 2 && nickname.trim().length <= 10;

  const handleStep1Next = () => {
    if (!step1Active) return;
    setStep(2);
  };

  const handleStep2Done = () => {
    if (!step2Active) return;
    login();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-white px-4">
      {/* 뒤로가기 */}
      <div style={{ paddingTop: 16, paddingBottom: 8 }}>
        <button
          onClick={() => (step === 1 ? navigate('/login') : setStep(1))}
          className="p-1"
        >
          <ChevronLeft />
        </button>
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
          <NextButton active={step2Active} onClick={handleStep2Done} label="완료" />
        </>
      )}
    </div>
  );
}

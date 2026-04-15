import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isActive = email.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    if (!isActive) return;
    login();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-white px-4">
      {/* 상단 여백 */}
      <div style={{ height: 80 }} />

      {/* 제목 */}
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', marginBottom: 40 }}>
        이메일로 로그인하기
      </h1>

      {/* 입력 필드 */}
      <div className="flex flex-col gap-5 mb-10">
        {/* 이메일 */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>이메일 주소</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="abc@Email.com"
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

        {/* 비밀번호 */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상의 비밀번호"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
      </div>

      {/* 로그인 버튼 */}
      <button
        onClick={handleLogin}
        disabled={!isActive}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 30,
          backgroundColor: isActive ? '#000000' : '#e6e6e6',
          color: isActive ? '#ffffff' : '#000000',
          fontSize: 16,
          fontWeight: 500,
          border: 'none',
          cursor: isActive ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          marginBottom: 28,
        }}
      >
        로그인
      </button>

      {/* 계정찾기 | 비밀번호 재설정 */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button style={{ fontSize: 13, color: '#686c6e' }}>계정찾기</button>
        <div style={{ width: 1, height: 9, backgroundColor: '#e0e4e8' }} />
        <button style={{ fontSize: 13, color: '#686c6e' }}>비밀번호 재설정</button>
      </div>

      {/* 회원가입 */}
      <div className="flex items-center justify-center gap-1">
        <span style={{ fontSize: 13, color: '#aaaeb3' }}>아직 스며듦 계정이 없으신가요?</span>
        <button
          onClick={() => navigate('/signup')}
          style={{ fontSize: 13, color: '#222222', fontWeight: 400 }}
        >
          회원가입하기
        </button>
      </div>
    </div>
  );
}

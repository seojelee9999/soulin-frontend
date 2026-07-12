import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isActive = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isActive || loading) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin({ email: email.trim(), password });
      login({ userName: data.userName, userId: data.userId });
      navigate('/', { replace: true });
    } catch {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-4">
      <div style={{ height: 80 }} />

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#222222', marginBottom: 40 }}>
        이메일로 로그인하기
      </h1>

      <div className="flex flex-col gap-5 mb-10">
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>이메일 주소</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
            onKeyDown={(e) => {
              if (e.key === ' ') e.preventDefault();
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              const cleaned = text.replace(/\s+/g, '');
              if (text !== cleaned) {
                e.preventDefault();
                document.execCommand('insertText', false, cleaned);
              }
            }}
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

      {error && (
        <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={!isActive || loading}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 30,
          backgroundColor: isActive && !loading ? '#000000' : '#e6e6e6',
          color: isActive && !loading ? '#ffffff' : '#000000',
          fontSize: 16,
          fontWeight: 500,
          border: 'none',
          cursor: isActive && !loading ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          marginBottom: 28,
        }}
      >
        {loading ? '로그인 중…' : '로그인'}
      </button>

      <div className="flex items-center justify-center mb-4">
        <button
          onClick={() => navigate('/forgot-password')}
          style={{ fontSize: 13, color: '#686c6e' }}
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>

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

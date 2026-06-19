import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/common/BackButton';
import CloseButton from '../components/common/CloseButton';
import { PASSWORD_MIN_LENGTH } from '../constants/auth';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/users';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isActive = current.length > 0 && next.length >= PASSWORD_MIN_LENGTH && confirm.length > 0 && next === confirm;

  const handleSubmit = async () => {
    if (!isActive || loading) return;
    setLoading(true);
    setError('');
    try {
      await changePassword({ currentPassword: current, newPassword: next, newPasswordConfirm: confirm });
      window.alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      logout();
      navigate('/login', { replace: true });
    } catch {
      setError('비밀번호 변경에 실패했어요. 현재 비밀번호를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#000000' }}>비밀번호 변경</span>
        <CloseButton onClick={() => navigate(-1)} />
      </header>

      <div className="flex-1 px-4 pt-8 flex flex-col gap-6">
        {/* 현재 비밀번호 */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>현재 비밀번호</label>
          <div
            className="flex items-center px-4"
            style={{ height: 44, borderRadius: 10, background: '#eeeeee' }}
          >
            <input
              type={showCurrent ? 'text' : 'password'}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 15, color: '#131416' }}
            />
            <button onClick={() => setShowCurrent(!showCurrent)} className="p-1">
              <EyeIcon visible={showCurrent} />
            </button>
          </div>
        </div>

        {/* 새 비밀번호 */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>새 비밀번호</label>
          <div
            className="flex items-center px-4"
            style={{ height: 44, borderRadius: 10, background: '#eeeeee' }}
          >
            <input
              type={showNext ? 'text' : 'password'}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 15, color: '#131416' }}
            />
            <button onClick={() => setShowNext(!showNext)} className="p-1">
              <EyeIcon visible={showNext} />
            </button>
          </div>
          <p style={{ fontSize: 10, fontWeight: 400, color: '#8a8a8a' }}>{`${PASSWORD_MIN_LENGTH}자 이상 입력해주세요`}</p>
        </div>

        {/* 새 비밀번호 확인 */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 14, fontWeight: 400, color: '#131416' }}>새 비밀번호 확인</label>
          <div
            className="flex items-center px-4"
            style={{ height: 44, borderRadius: 10, background: '#eeeeee' }}
          >
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 15, color: '#131416' }}
            />
            <button onClick={() => setShowConfirm(!showConfirm)} className="p-1">
              <EyeIcon visible={showConfirm} />
            </button>
          </div>
        </div>
      </div>

      {/* 변경하기 버튼 */}
      <div className="px-4 pb-8 pt-3 shrink-0">
        {error && (
          <p style={{ fontSize: 13, color: '#F21A14', marginBottom: 12, textAlign: 'center' }}>{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isActive || loading}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 91,
            backgroundColor: isActive && !loading ? '#131416' : '#e6e6e6',
            color: isActive && !loading ? '#ffffff' : '#131416',
            fontSize: 16,
            fontWeight: 500,
            border: 'none',
            cursor: isActive && !loading ? 'pointer' : 'default',
          }}
        >
          {loading ? '변경 중...' : '변경하기'}
        </button>
      </div>
    </div>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="#8a8a8a" strokeWidth="1.5">
      <path strokeLinecap="round" d="M1 6s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" />
      <circle cx="9" cy="6" r="2.5" />
    </svg>
  ) : (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="#8a8a8a" strokeWidth="1.5">
      <path strokeLinecap="round" d="M13.45 9.45A7.93 7.93 0 009 11C4 11 1 7 1 7a14 14 0 013.55-3.45M6.73 3.18A7.07 7.07 0 019 3c5 0 8 4 8 4a14.1 14.1 0 01-1.61 2.05M7.27 7.27A2.5 2.5 0 0011 4.73" />
      <line x1="1" y1="1" x2="17" y2="13" strokeLinecap="round" />
    </svg>
  );
}

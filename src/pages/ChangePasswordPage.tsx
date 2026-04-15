import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = current.length > 0 && next.length >= 8 && confirm.length > 0 && next === confirm;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
          <ChevronLeft />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#000000' }}>비밀번호 변경</span>
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
          <XIcon />
        </button>
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
          <p style={{ fontSize: 10, fontWeight: 400, color: '#8a8a8a' }}>8자 이상 입력해주세요</p>
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
        <button
          disabled={!isActive}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 91,
            backgroundColor: isActive ? '#131416' : '#e6e6e6',
            color: isActive ? '#ffffff' : '#131416',
            fontSize: 16,
            fontWeight: 500,
            border: 'none',
            cursor: isActive ? 'pointer' : 'default',
          }}
        >
          변경하기
        </button>
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
      <path d="M9 1L1 8L9 15" stroke="#858585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
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

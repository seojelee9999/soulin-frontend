import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('닉네임입니다');
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
          <ChevronLeft />
        </button>
        <div className="w-7" />
      </header>

      <div className="flex-1 flex flex-col px-4 pt-6">
        {/* 프로필 이미지 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="rounded-full bg-gray-200 flex items-center justify-center"
              style={{ width: 100, height: 100 }}
            >
              <ImagePlaceholderIcon />
            </div>
            <div
              className="absolute bottom-0 right-0 bg-gray-100 rounded-full flex items-center justify-center"
              style={{ width: 30, height: 30, border: '1.5px solid #e0e0e0' }}
            >
              <ImageIcon />
            </div>
          </div>
        </div>

        {/* 닉네임 */}
        <div className="mb-2">
          <div
            className="flex items-center justify-between px-4"
            style={{
              height: 52,
              borderRadius: 12,
              border: '1px solid #e0e0e0',
            }}
          >
            {editing ? (
              <input
                autoFocus
                value={nickname}
                onChange={(e) => {
                  if (e.target.value.length <= 10) setNickname(e.target.value);
                }}
                onBlur={() => setEditing(false)}
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: 16, fontWeight: 700, color: '#131416' }}
              />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: '#131416' }}>{nickname}</span>
            )}
            <button onClick={() => setEditing(true)} className="p-1">
              <PencilIcon />
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8a8a8a', paddingLeft: 4 }}>
          닉네임은 최소 2자 이상, 최대 10자 이내로 입력해 주세요.
        </p>
      </div>

      {/* 계정 탈퇴 */}
      <div className="flex justify-center pb-12">
        <button style={{ fontSize: 15, fontWeight: 500, color: '#e53935' }}>
          계정 탈퇴
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
function ImagePlaceholderIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

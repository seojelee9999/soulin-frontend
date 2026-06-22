import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, deleteAccount } from '../api/users';
import BackButton from '../components/common/BackButton';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { userName, updateUserName, logout } = useAuth();
  const [nickname, setNickname] = useState(userName ?? '');
  const [editing, setEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setEditing(false);
    const trimmed = nickname.trim();
    // 변경 없거나 유효성 실패면 원복
    if (trimmed === userName || trimmed.length < 2 || trimmed.length > 10) {
      setNickname(userName ?? '');
      return;
    }
    try {
      await updateProfile({ userName: trimmed });
      updateUserName(trimmed);
    } catch (err) {
      console.error('updateProfile failed', err);
      setNickname(userName ?? '');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('deleteAccount failed', err);
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
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
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
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
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          style={{ fontSize: 15, fontWeight: 500, color: '#e53935' }}
        >
          계정 탈퇴
        </button>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[430px] px-8">
            <div className="w-full bg-white rounded-3xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">정말 탈퇴하시겠어요?</p>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                탈퇴하면 작성한 글과 기록이 모두 사라지며 복구할 수 없어요.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-red-500 disabled:opacity-60"
                >
                  탈퇴하기
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleting}
                  className="w-full py-3.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100 disabled:opacity-60"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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

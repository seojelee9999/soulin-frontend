import { useEffect, useState } from 'react';
import { fetchEmotionReport } from '../../api/myPage';
import type { EmotionReport } from '../../types/myPage';

interface Props {
  period: string; // 'YYYY-MM'
}

export default function EmotionReportCard({ period }: Props) {
  const [data, setData] = useState<EmotionReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEmotionReport(period)
      .then((r) => { if (!cancelled) setData(r); })
      .catch(() => { if (!cancelled) setData({ available: false, period, summary: null }); });
    return () => { cancelled = true; };
  }, [period]);

  // 'YYYY-MM' → 'M월' (받은공감 카드와 균형 맞춘 제목)
  const monthLabel = (() => {
    const m = period.match(/^\d{4}-(\d{2})$/);
    return m ? `${Number(m[1])}월 감정 요약` : '감정 요약';
  })();

  return (
    <div
      className="flex-1 flex flex-col p-4 rounded-xl"
      style={{ background: '#f4f4f4', minHeight: 120 }}
    >
      <span style={{ fontSize: 12, color: '#5e5e5e', marginBottom: 8 }}>{monthLabel}</span>
      {data?.available && data.summary ? (
        <p style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5, wordBreak: 'keep-all' }}>
          {data.summary}
        </p>
      ) : (
        <p style={{ fontSize: 11, color: '#8a8a8a', lineHeight: 1.55, wordBreak: 'keep-all' }}>
          리포트 발간을 위한 충분한 데이터가 수집되지 않았습니다. 잠시만 기다려 주세요
        </p>
      )}
    </div>
  );
}

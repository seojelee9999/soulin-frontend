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

  return (
    <div
      className="flex-1 flex flex-col p-3"
      style={{ background: '#f8f8f8', borderRadius: 10, minHeight: 110 }}
    >
      <span style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 6 }}>감정 요약</span>
      {data?.available && data.summary ? (
        <p style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{data.summary}</p>
      ) : (
        <p style={{ fontSize: 11, color: '#8a8a8a', lineHeight: 1.5 }}>
          리포트 발간을 위한 충분한 데이터가 수집되지 않았습니다. 잠시만 기다려 주세요
        </p>
      )}
    </div>
  );
}

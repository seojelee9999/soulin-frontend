export const MODERATION_REASON_KO: Record<string, string> = {
  CENSURE: '비난·비하 표현',
  HATE: '혐오 표현',
  DISCRIMINATION: '차별 표현',
  SEXUAL: '성적 표현',
  VIOLENCE: '폭력적 표현',
  ABUSE: '욕설',
  CRIME: '범죄 관련 표현',
};

export function formatModerationReason(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .map((code) => MODERATION_REASON_KO[code] ?? code)
    .join(', ');
}

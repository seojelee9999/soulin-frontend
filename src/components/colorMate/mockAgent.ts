// ⚠️ DEV 전용 목(mock) 어댑터.
// 4단계에서 이 파일 대신 src/api/colorMate.ts 의 requestAgentTurn 으로 교체된다.
// 시그니처는 requestAgentTurn 과 동일하게 유지(교체 용이).
import type { AgentTurn, Chip, ColorMatePost } from '../../types/colorMate';

type Step = 'difficulty' | 'emotion' | 'complete' | 'style' | 'result';

// 목 진행 상태(sessionId별 step)
const sessionStep = new Map<string, Step>();

function chip(label: string, value?: string, extra?: Partial<Chip>): Chip {
  return { label, value: value ?? label, ...extra };
}

const DIRECT = chip('직접 입력', '직접 입력', { direct: true });

const MOCK_POST: ColorMatePost = {
  title: '말하지 못한 하루',
  content:
    '오늘은 유난히 마음이 무거웠다. 하고 싶은 말이 목 끝까지 차올랐지만, 끝내 꺼내지 못했다. ' +
    '그래도 이렇게 글로 적어두니 조금은 가벼워지는 것 같다.',
  colorKey: 'blue',
  freeColorName: '비 오는 날의 파랑',
};

function turn(text: string, chips: Chip[] | null, opts?: Partial<AgentTurn>): AgentTurn {
  const hasDirect = chips ? chips.some((c) => c.direct) : false;
  const inputEnabled = chips ? hasDirect : true;
  return {
    text,
    chips,
    inputEnabled,
    allowDirectInput: inputEnabled,
    post: null,
    phase: 'mock',
    ...opts,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mockRequestAgentTurn(params: {
  sessionId: string;
  chatInput: string;
}): Promise<AgentTurn> {
  const { sessionId, chatInput } = params;
  await delay(450);

  // 조금 더 대화하고 수정하기 → 추가 질문 후 다음 답변에서 결과 재생성
  if (chatInput === '__refine__') {
    sessionStep.set(sessionId, 'result');
    return turn('좋아, 어떤 부분을 더 다듬고 싶어? 떠오르는 걸 편하게 말해줘.', [
      chip('더 따뜻하게'),
      chip('더 담담하게'),
      DIRECT,
    ]);
  }

  const step = sessionStep.get(sessionId);

  // 첫 턴(자동 요청): 인사 + 글 종류 칩
  if (!step) {
    sessionStep.set(sessionId, 'difficulty');
    return turn('안녕! 나는 Color Mate야. 오늘 어떤 글을 쓰고 싶어?', [
      chip('오늘 있었던 일'),
      chip('속상한 마음'),
      chip('고마운 사람'),
    ]);
  }

  switch (step) {
    case 'difficulty':
      sessionStep.set(sessionId, 'emotion');
      return turn('좋아. 그 일을 떠올리면 어떤 점이 가장 어려웠어?', [
        chip('말을 못 했어'),
        chip('계속 생각나'),
        chip('혼자인 것 같아'),
      ]);

    case 'emotion':
      sessionStep.set(sessionId, 'complete');
      return turn('그랬구나. 그때 마음을 한 단어로 고른다면?', [
        chip('서운함'),
        chip('외로움'),
        chip('답답함'),
        DIRECT,
      ]);

    case 'complete':
      // "더 이야기하기"면 감정 단계를 한 번 더, "좋아"면 스타일로
      if (chatInput === '더 이야기하기') {
        return turn('좋아, 더 들려줘. 그 마음을 한 단어로 더 고른다면?', [
          chip('서운함'),
          chip('외로움'),
          chip('답답함'),
          DIRECT,
        ]);
      }
      sessionStep.set(sessionId, 'style');
      return turn('이야기 잘 들었어. 이제 글로 옮겨볼까?', [
        chip('좋아'),
        chip('더 이야기하기'),
      ]);

    case 'style':
      sessionStep.set(sessionId, 'result');
      return turn('어떤 분위기로 써줄까?', [
        chip('담담하게'),
        chip('따뜻하게'),
        chip('솔직하게'),
        DIRECT,
      ]);

    case 'result':
    default:
      sessionStep.set(sessionId, 'result');
      // 신 spec(STEP 7/8): 결과 턴은 post만, 게시/임시저장 분기는 다음 턴(STEP 8) 칩.
      // mock도 같은 흐름으로: "좋아"는 action 없음(전송) → 다음 호출에서 STEP 8 응답.
      return turn(
        '글이 작성되었어. 확인해봐😊',
        [
          chip('좋아'),
          chip('조금 더 대화하고 수정하기', '__refine__', { action: 'refine' }),
          chip('직접 수정하기'),
        ],
        { post: MOCK_POST },
      );
  }
}

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

type SpeechApiMode = 'standard' | 'webkit' | 'unsupported';

async function installSpeechApi(context: BrowserContext, mode: SpeechApiMode) {
  await context.addInitScript((speechMode) => {
    type ResultLike = {
      resultIndex: number;
      results: Array<{ isFinal: boolean; 0: { transcript: string } }>;
    };

    class FakeUtterance {
      lang = '';
      rate = 1;
      pitch = 1;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;

      constructor(public text: string) {}
    }

    class FakeRecognition {
      lang = '';
      interimResults = false;
      continuous = false;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onresult: ((event: ResultLike) => void) | null = null;
      startCalls = 0;
      stopCalls = 0;
      abortCalls = 0;

      constructor() {
        speechState.recognitions.push(this);
      }

      start() {
        this.startCalls += 1;
        queueMicrotask(() => this.onstart?.());
      }

      stop() {
        this.stopCalls += 1;
        queueMicrotask(() => this.onend?.());
      }

      abort() {
        this.abortCalls += 1;
        queueMicrotask(() => this.onend?.());
      }
    }

    const synthesisTimers = new Set<number>();
    const speechState = {
      recognitions: [] as FakeRecognition[],
      spoken: [] as string[],
      synthesisCancelCalls: 0,
      emitResult(index: number, transcript: string) {
        this.recognitions[index]?.onresult?.({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript } }],
        });
      },
      emitError(index: number, error: string) {
        this.recognitions[index]?.onerror?.({ error });
      },
      emitLateEvents(index: number, transcript: string) {
        const recognition = this.recognitions[index];
        recognition?.onstart?.();
        recognition?.onresult?.({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript } }],
        });
        recognition?.onend?.();
      },
      snapshot() {
        return {
          recognitionCount: this.recognitions.length,
          startCalls: this.recognitions.map((item) => item.startCalls),
          abortCalls: this.recognitions.map((item) => item.abortCalls),
          spoken: [...this.spoken],
          synthesisCancelCalls: this.synthesisCancelCalls,
        };
      },
    };

    const synthesis = {
      cancel() {
        speechState.synthesisCancelCalls += 1;
        synthesisTimers.forEach((timer) => window.clearTimeout(timer));
        synthesisTimers.clear();
      },
      speak(utterance: FakeUtterance) {
        speechState.spoken.push(utterance.text);
        const timer = window.setTimeout(() => {
          synthesisTimers.delete(timer);
          utterance.onend?.();
        }, 20);
        synthesisTimers.add(timer);
      },
    };

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeUtterance,
    });

    try {
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: synthesis,
      });
    } catch {
      Object.defineProperties(window.speechSynthesis, {
        cancel: { configurable: true, value: synthesis.cancel },
        speak: { configurable: true, value: synthesis.speak },
      });
    }

    Object.defineProperty(window, '__speechTest', {
      configurable: true,
      value: speechState,
    });

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: speechMode === 'standard' ? FakeRecognition : undefined,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: speechMode === 'webkit' ? FakeRecognition : undefined,
    });
  }, mode);
}

async function waitForRecognition(page: Page, expectedCount: number) {
  await expect
    .poll(() =>
      page.evaluate(
        (count) =>
          (
            window as Window & {
              __speechTest: { recognitions: Array<{ startCalls: number }> };
            }
          ).__speechTest.recognitions.length >= count,
        expectedCount,
      ),
    )
    .toBe(true);
}

async function emitResult(page: Page, index: number, transcript: string) {
  await page.evaluate(
    ({ recognitionIndex, text }) =>
      (
        window as Window & {
          __speechTest: {
            emitResult: (index: number, transcript: string) => void;
          };
        }
      ).__speechTest.emitResult(recognitionIndex, text),
    { recognitionIndex: index, text: transcript },
  );
}

test.describe('startup screens', () => {
  test('shows the attached screens in order before opening the demo', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByAltText('똑버스 첫 화면')).toBeVisible();
    await page.getByRole('button', { name: '다음 시작 화면' }).click();
    await expect(page.getByAltText('서비스 지역 안내 화면')).toBeVisible();
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByAltText('정류장 안내 화면')).toBeVisible();
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByAltText('비슷한 경로 안내 화면')).toBeVisible();
    await page.getByRole('button', { name: '똑버스 시작하기' }).click();

    await expect(
      page.getByRole('button', { name: '음성으로 목적지 말하기' }),
    ).toBeVisible();
  });
});

test.describe('browser voice call', () => {
  test.beforeEach(async ({ context, page, browserName }) => {
    const mode: SpeechApiMode = browserName === 'webkit' ? 'webkit' : 'standard';
    await installSpeechApi(context, mode);
    await page.goto('/');
    await page.getByRole('button', { name: '다음 시작 화면' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '똑버스 시작하기' }).click();
  });

  test('completes booking and ignores delayed events after ending', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '음성으로 목적지 말하기' }).click();

    const callDialog = page.getByRole('dialog', {
      name: '화성시 AI 똑버스 상담원',
    });
    await expect(callDialog).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __speechTest: { spoken: string[] };
              }
            ).__speechTest.spoken,
        ),
      )
      .toContain('반갑습니다. 화성시 AI 똑버스입니다. 어디로 가시나요?');

    await waitForRecognition(page, 1);
    await expect(callDialog).toContainText('천천히 말씀해 주세요');

    await emitResult(page, 0, '메가MGC커피 봉담점 가줘');
    await expect(callDialog).toContainText('메가MGC커피 봉담점');

    await waitForRecognition(page, 2);
    await expect(callDialog).toContainText('호출해도 괜찮을까요?');

    await emitResult(page, 1, '네');
    await expect(callDialog).not.toBeVisible();
    await expect(page.getByText('배차가 확정되었습니다')).toBeVisible();
    await expect(page.getByText('9분 후 탑승', { exact: true })).toBeVisible();
    await expect(
      page.getByText('메가MGC커피 봉담점', { exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: '처음으로 돌아가기' }).click();
    await page.getByRole('button', { name: '음성으로 목적지 말하기' }).click();
    await waitForRecognition(page, 3);
    await page.getByRole('button', { name: '통화 종료' }).click();
    await expect(callDialog).not.toBeVisible();

    await page.evaluate(() =>
      (
        window as Window & {
          __speechTest: {
            emitLateEvents: (index: number, transcript: string) => void;
          };
        }
      ).__speechTest.emitLateEvents(2, '늦게 도착한 목적지 가줘'),
    );
    await page.waitForTimeout(500);

    await expect(callDialog).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: '음성으로 목적지 말하기' }),
    ).toBeVisible();
    await expect(page.getByText('배차가 확정되었습니다')).not.toBeVisible();

    const snapshot = await page.evaluate(
      () =>
        (
          window as Window & {
            __speechTest: {
              snapshot: () => {
                recognitionCount: number;
                abortCalls: number[];
              };
            };
          }
        ).__speechTest.snapshot(),
    );
    expect(snapshot.recognitionCount).toBe(3);
    expect(snapshot.abortCalls[2]).toBeGreaterThan(0);
  });

  test('shows microphone permission denial guidance', async ({ page }) => {
    await page.getByRole('button', { name: '음성으로 목적지 말하기' }).click();
    await waitForRecognition(page, 1);

    await page.evaluate(() =>
      (
        window as Window & {
          __speechTest: {
            emitError: (index: number, error: string) => void;
          };
        }
      ).__speechTest.emitError(0, 'not-allowed'),
    );

    await expect(page.getByRole('status')).toHaveText(
      '마이크 권한이 거부되었습니다. 브라우저 주소창에서 마이크 권한을 허용해 주세요.',
    );
    const callDialog = page.getByRole('dialog', {
      name: '화성시 AI 똑버스 상담원',
    });
    await expect(callDialog).toContainText('AI 안내 중');
    await expect(callDialog).not.toContainText('천천히 말씀해 주세요');
  });

  test('recovers from a recognition error with one new listening session', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '음성으로 목적지 말하기' }).click();
    await waitForRecognition(page, 1);

    await page.evaluate(() =>
      (
        window as Window & {
          __speechTest: {
            emitError: (index: number, error: string) => void;
          };
        }
      ).__speechTest.emitError(0, 'no-speech'),
    );

    await expect(page.getByRole('status')).toHaveText(
      '음성을 인식하지 못했습니다. 한 번 더 또박또박 말씀해 주세요.',
    );
    const callDialog = page.getByRole('dialog', {
      name: '화성시 AI 똑버스 상담원',
    });
    await expect(callDialog).toContainText('AI 안내 중');
    await expect(callDialog).not.toContainText('천천히 말씀해 주세요');

    await page.getByRole('button', { name: '마이크 재실행' }).click();
    await waitForRecognition(page, 2);
    await expect(callDialog).toContainText('천천히 말씀해 주세요');

    const retrySnapshot = await page.evaluate(
      () =>
        (
          window as Window & {
            __speechTest: {
              snapshot: () => {
                recognitionCount: number;
                startCalls: number[];
                abortCalls: number[];
              };
            };
          }
        ).__speechTest.snapshot(),
    );
    expect(retrySnapshot.recognitionCount).toBe(2);
    expect(retrySnapshot.startCalls).toEqual([1, 1]);
    expect(retrySnapshot.abortCalls[0]).toBeGreaterThan(0);

    await emitResult(page, 1, '메가MGC커피 봉담점 가줘');
    await expect(callDialog).toContainText('호출해도 괜찮을까요?');
    await waitForRecognition(page, 3);

    const completedSnapshot = await page.evaluate(
      () =>
        (
          window as Window & {
            __speechTest: {
              snapshot: () => {
                recognitionCount: number;
                startCalls: number[];
                abortCalls: number[];
              };
            };
          }
        ).__speechTest.snapshot(),
    );
    expect(completedSnapshot.recognitionCount).toBe(3);
    expect(completedSnapshot.startCalls).toEqual([1, 1, 1]);
  });

  test('hands off after three general recognition failures', async ({ page }) => {
    await page.getByRole('button', { name: '음성으로 목적지 말하기' }).click();
    await waitForRecognition(page, 1);

    const callDialog = page.getByRole('dialog', {
      name: '화성시 AI 똑버스 상담원',
    });
    for (let index = 0; index < 3; index += 1) {
      await page.evaluate(
        ({ recognitionIndex }) =>
          (
            window as Window & {
              __speechTest: {
                emitError: (index: number, error: string) => void;
              };
            }
          ).__speechTest.emitError(recognitionIndex, 'no-speech'),
        { recognitionIndex: index },
      );
      if (index < 2) {
        await page.getByRole('button', { name: '마이크 재실행' }).click();
        await waitForRecognition(page, index + 2);
      }
    }

    await expect(callDialog).not.toBeVisible();
    const interventionDialog = page.getByRole('dialog', {
      name: '상담원 도움이 필요합니다',
    });
    await expect(interventionDialog).toBeVisible();
    await expect(interventionDialog).toContainText('인식 실패 3회');
    await page.getByRole('button', { name: '상담원 바로 연결' }).click();
    await expect(interventionDialog).not.toBeVisible();
    await expect(page.getByRole('status')).toHaveText(
      '상담원 연결을 요청했습니다. 곧 통화가 이어집니다.',
    );
  });
});

test.describe('unsupported browser guidance', () => {
  test.beforeEach(async ({ context, page }) => {
    await installSpeechApi(context, 'unsupported');
    await page.goto('/');
    await page.getByRole('button', { name: '다음 시작 화면' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '똑버스 시작하기' }).click();
  });

  test('explains that Chrome is required without entering listening state', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '음성으로 목적지 말하기' }).click();

    await expect(page.getByRole('status')).toHaveText(
      '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome에서 다시 시도해 주세요.',
    );
    const callDialog = page.getByRole('dialog', {
      name: '화성시 AI 똑버스 상담원',
    });
    await expect(callDialog).toBeVisible();
    await expect(callDialog).toContainText('AI 안내 중');
    await expect(callDialog).not.toContainText('천천히 말씀해 주세요');
    await expect(page.getByText('배차가 확정되었습니다')).not.toBeVisible();
  });
});

test.describe('administrator recovery', () => {
  test('connects a failed voice call to a human agent', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '다음 시작 화면' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '똑버스 시작하기' }).click();

    await page.getByRole('button', { name: '관리자 모드' }).first().click();
    await expect(page.getByRole('heading', { name: 'AI 관제센터' })).toBeVisible();
    await expect(page.getByText('운영자 조연재')).toBeVisible();
    await page.getByRole('button', { name: '인식 실패 케이스 확인' }).click();

    const dialog = page.getByRole('dialog', {
      name: '상담원 도움이 필요합니다',
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('인식 실패 3회');
    await page.getByRole('button', { name: '상담원 바로 연결' }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('status')).toHaveText(
      '상담원 연결을 요청했습니다. 곧 통화가 이어집니다.',
    );
  });
});
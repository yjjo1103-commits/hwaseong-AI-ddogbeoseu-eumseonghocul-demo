import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Bot,
  CarFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LocateFixed,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Navigation,
  Phone,
  PhoneOff,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Signal,
  Sparkles,
  UserRound,
  UsersRound,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type UserFlow = 'idle' | 'listening' | 'confirm' | 'booked' | 'payment';
type PaymentMethod = 'cash' | 'app';
type CallStage = 'intro' | 'listening' | 'confirm' | 'approval';
type ListeningPurpose = 'destination' | 'approval';

const startupScreens = [
  {
    src: `${import.meta.env.BASE_URL}onboarding/home.png`,
    alt: '똑버스 첫 화면',
  },
  {
    src: `${import.meta.env.BASE_URL}onboarding/guide-route.png`,
    alt: '서비스 지역 안내 화면',
  },
  {
    src: `${import.meta.env.BASE_URL}onboarding/guide-stop.png`,
    alt: '정류장 안내 화면',
  },
  {
    src: `${import.meta.env.BASE_URL}onboarding/guide-shared-route.png`,
    alt: '비슷한 경로 안내 화면',
  },
] as const;

function StartupSequence({ onComplete }: { onComplete: () => void }) {
  const [screenIndex, setScreenIndex] = useState(0);
  const isFirstScreen = screenIndex === 0;
  const isLastScreen = screenIndex === startupScreens.length - 1;
  const screen = startupScreens[screenIndex];

  const goNext = () => {
    if (isLastScreen) {
      onComplete();
      return;
    }
    setScreenIndex((current) => current + 1);
  };

  return (
    <main className="startup-sequence" aria-label="똑버스 시작 안내">
      <div className="startup-screen">
        <img className="startup-screen-image" src={screen.src} alt={screen.alt} />
        <button
          type="button"
          className={`startup-next-hitbox ${isFirstScreen ? 'startup-next-hitbox-first' : ''}`}
          onClick={goNext}
          aria-label={
            isFirstScreen
              ? '다음 시작 화면'
              : isLastScreen
                ? '똑버스 시작하기'
                : '다음'
          }
        >
          <span className="sr-only">
            {isFirstScreen ? '다음 시작 화면' : isLastScreen ? '시작하기' : '다음'}
          </span>
        </button>
        {!isFirstScreen && (
          <button
            type="button"
            className="startup-skip-hitbox"
            onClick={onComplete}
            aria-label="건너뛰기"
          >
            <span className="sr-only">건너뛰기</span>
          </button>
        )}
      </div>
    </main>
  );
}

function Home() {
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [flow, setFlow] = useState<UserFlow>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [period, setPeriod] = useState('오늘');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'handoff'>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callStage, setCallStage] = useState<CallStage>('intro');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeCallRef = useRef(false);
  const callSessionRef = useRef(0);
  const callTimersRef = useRef<number[]>([]);

  const clearCallTimers = () => {
    callTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    callTimersRef.current = [];
  };

  const scheduleForCall = (callback: () => void, delay: number, session: number) => {
    const timer = window.setTimeout(() => {
      callTimersRef.current = callTimersRef.current.filter((item) => item !== timer);
      if (!activeCallRef.current || callSessionRef.current !== session) return;
      callback();
    }, delay);
    callTimersRef.current.push(timer);
  };

  useEffect(() => {
    if (!isReading) return;
    const timer = window.setTimeout(() => setIsReading(false), 3300);
    return () => window.clearTimeout(timer);
  }, [isReading]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!isCallOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCallOpen]);

  useEffect(() => {
    return () => {
      activeCallRef.current = false;
      callSessionRef.current += 1;
      clearCallTimers();
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakKorean = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      onEnd?.();
    };
    utterance.onend = finish;
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') finish();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = (purpose: ListeningPurpose = 'destination', session = callSessionRef.current) => {
    if (!activeCallRef.current || callSessionRef.current !== session) return;
    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ??
      (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setNotice('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome에서 다시 시도해 주세요.');
      setCallStage(purpose === 'approval' ? 'confirm' : 'intro');
      return;
    }

    const recognition = new SpeechRecognition();
    let completedResult = false;
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      if (completedResult) return;
      if (!activeCallRef.current || callSessionRef.current !== session) {
        recognition.abort();
        return;
      }
      if (purpose === 'destination') {
        setTranscript('');
        setFinalTranscript('');
      }
      setFlow('listening');
      setCallStage(purpose === 'approval' ? 'approval' : 'listening');
    };
    recognition.onresult = (event) => {
      if (!activeCallRef.current || callSessionRef.current !== session) return;
      let liveText = '';
      let completedText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        liveText += text;
        if (event.results[i].isFinal) completedText += text;
      }
      if (liveText.trim()) setTranscript(liveText.trim());
      if (completedText.trim()) {
        completedResult = true;
        const spokenText = completedText.trim();
        if (purpose === 'approval') {
          if (/^(응|네|예|그래|좋아요|맞아요|호출해줘|호출해주세요)[.!? ]*$/i.test(spokenText)) {
            confirmBooking();
          } else {
            setNotice('호출하려면 “네” 또는 “응”이라고 말씀해 주세요.');
            setFlow('confirm');
            setCallStage('confirm');
            speakKorean('잘 듣지 못했어요. 호출하려면 네 또는 응이라고 말씀해 주세요.', () => {
              scheduleForCall(() => startListening('approval', session), 350, session);
            });
          }
          recognition.stop();
          return;
        }
        const spokenDestination = spokenText;
        setFinalTranscript(spokenDestination);
        setTranscript(spokenDestination);
        setFlow('confirm');
        setCallStage('confirm');
        const destination = extractDestination(spokenDestination);
        recognition.stop();
        scheduleForCall(() => {
          speakKorean(
            `동남메리트아파트에서 ${destination}까지, 1명 호출할까요?`,
            () => {
              if (!activeCallRef.current || callSessionRef.current !== session) return;
              setCallStage('approval');
              scheduleForCall(() => startListening('approval', session), 350, session);
            },
          );
        }, 180, session);
      }
    };
    recognition.onerror = (event) => {
      if (!activeCallRef.current || callSessionRef.current !== session) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setNotice('마이크 권한이 거부되었습니다. 브라우저 주소창에서 마이크 권한을 허용해 주세요.');
      } else if (event.error === 'audio-capture') {
        setNotice('마이크를 찾을 수 없습니다. 마이크 연결 상태를 확인해 주세요.');
      } else {
        setNotice('음성을 인식하지 못했습니다. 한 번 더 또박또박 말씀해 주세요.');
      }
      setFlow('idle');
      setCallStage(purpose === 'approval' ? 'confirm' : 'intro');
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      setFlow((current) => (current === 'listening' ? 'idle' : current));
      recognitionRef.current = null;
    };

    recognitionRef.current?.abort();
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setNotice('마이크를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setFlow('idle');
      setCallStage(purpose === 'approval' ? 'confirm' : 'intro');
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setFlow('idle');
    if (isCallOpen) setCallStage(callStage === 'approval' ? 'approval' : 'intro');
  };

  const retryListening = () => {
    setFlow('idle');
    setTranscript('');
    setFinalTranscript('');
    restartCallMic();
  };

  const openVoiceCall = () => {
    clearCallTimers();
    const session = callSessionRef.current + 1;
    callSessionRef.current = session;
    activeCallRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setTranscript('');
    setFinalTranscript('');
    setFlow('idle');
    setCallStage('intro');
    setIsCallOpen(true);
    speakKorean('반갑습니다. 화성시 AI 똑버스입니다. 어디로 가시나요?', () => {
      scheduleForCall(() => startListening('destination', session), 350, session);
    });
  };

  const closeVoiceCall = () => {
    activeCallRef.current = false;
    callSessionRef.current += 1;
    clearCallTimers();
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setIsCallOpen(false);
    setCallStage('intro');
    setFlow('idle');
    setTranscript('');
    setFinalTranscript('');
  };

  const restartCallMic = () => {
    clearCallTimers();
    const session = callSessionRef.current + 1;
    callSessionRef.current = session;
    activeCallRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setFlow('idle');
    const purpose = callStage === 'confirm' || callStage === 'approval' ? 'approval' : 'destination';
    setCallStage(purpose === 'approval' ? 'approval' : 'listening');
    scheduleForCall(() => startListening(purpose, session), 80, session);
  };

  const confirmBooking = () => {
    activeCallRef.current = false;
    callSessionRef.current += 1;
    clearCallTimers();
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setIsCallOpen(false);
    setCallStage('intro');
    setFlow('booked');
    setNotice('차량을 찾았습니다. 9분 후 탑승할 수 있습니다.');
  };

  const goBackToBooking = () => {
    setFlow('booked');
  };

  const resetUserFlow = () => {
    activeCallRef.current = false;
    callSessionRef.current += 1;
    clearCallTimers();
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setIsCallOpen(false);
    setFlow('idle');
    setCallStage('intro');
    setTranscript('');
    setFinalTranscript('');
    setPaymentMethod('cash');
  };

  const connectAgent = () => {
    setInterventionOpen(false);
    setAgentConnected(true);
    setNotice('상담원 연결을 요청했습니다. 곧 통화가 이어집니다.');
  };

  return (
    <div className="app-noise min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex min-h-[100dvh]">
        <aside
          className={`${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:relative md:translate-x-0`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[0_8px_18px_hsl(183_57%_67%/.2)]">
                  <Radio size={23} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="font-display text-[17px] font-bold leading-none tracking-[-.04em]">똑버스</p>
                  <p className="mt-1 text-[11px] font-semibold tracking-[.12em] text-[hsl(var(--sidebar-foreground)/.58)]">
                    HWASEONG AI MOBILITY
                  </p>
                </div>
              </div>
              <div className="mb-8 flex items-center gap-2 rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.5)] px-3 py-2 text-[11px] font-semibold text-[hsl(var(--sidebar-foreground)/.76)]">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />
                AI 운영 시스템 정상
              </div>
            </div>
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg p-1 text-[hsl(var(--sidebar-foreground)/.65)] md:hidden"
            >
              <X size={19} />
            </button>
          </div>

          <nav className="space-y-2" aria-label="주요 메뉴">
            <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.42)]">
              서비스 보기
            </p>
            <ModeNavButton
              active={mode === 'user'}
              icon={Phone}
              label="사용자 모드"
              onClick={() => {
                setMode('user');
                setMobileNavOpen(false);
              }}
            />
            <ModeNavButton
              active={mode === 'admin'}
              icon={LayoutDashboard}
              label="관리자 모드"
              onClick={() => {
                setMode('admin');
                setMobileNavOpen(false);
              }}
            />
          </nav>

          <div className="mt-auto hidden rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.45)] p-4 md:block">
            <div className="mb-3 flex items-center gap-2 text-[hsl(var(--sidebar-primary))]">
              <ShieldCheck size={17} />
              <span className="text-xs font-bold">안심 운영 원칙</span>
            </div>
            <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.58)]">
              잘 들리지 않아도 괜찮습니다. AI가 세 번 확인하면 상담원이 이어받습니다.
            </p>
          </div>
          <p className="mt-6 text-[10px] font-semibold tracking-[.12em] text-[hsl(var(--sidebar-foreground)/.35)]">
            화성특례시 교통정책과 · 2024
          </p>
        </aside>

        {mobileNavOpen && (
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-30 bg-[hsl(204_68%_14%/.45)] md:hidden"
          />
        )}

        <main className="min-w-0 flex-1">
          <header className="flex min-h-[76px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.9)] px-4 backdrop-blur-md sm:px-8 lg:px-11">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="메뉴 열기"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] md:hidden"
              >
                <Menu size={21} />
              </button>
              <div>
                <p className="text-[11px] font-bold tracking-[.13em] text-[hsl(var(--primary))]">화성 AI 똑버스</p>
                <h1 className="mt-0.5 text-lg font-extrabold tracking-[-.04em] sm:text-xl">
                  {mode === 'user' ? '음성으로 부르는 똑버스' : 'AI 관제센터'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="mode-tabs hidden items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setMode('user')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${mode === 'user' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                >
                  사용자 모드
                </button>
                <button
                  type="button"
                  onClick={() => setMode('admin')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${mode === 'admin' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                >
                  관리자 모드
                </button>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] lg:flex">
                <Clock3 size={14} className="text-[hsl(var(--primary))]" /> 2024년 6월 18일 화요일
              </div>
              <button
                type="button"
                onClick={() => setNotice('똑버스 이용이 어려우시면 031-000-0000으로 연락해 주세요.')}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]"
                aria-label="도움말"
              >
                <CircleHelp size={19} />
              </button>
              <div className="hidden h-9 w-px bg-[hsl(var(--border))] sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-xs font-black text-[hsl(var(--accent-foreground))]">김</div>
                <span className="text-xs font-bold">운영자 김서윤</span>
                <ChevronDown size={14} className="text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>
          </header>

          {mode === 'user' ? (
            <UserMode
              flow={flow}
              transcript={transcript}
              finalTranscript={finalTranscript}
              paymentMethod={paymentMethod}
              isReading={isReading}
              agentConnected={agentConnected}
              onStartListening={openVoiceCall}
              onStopListening={stopListening}
              onRetry={retryListening}
              onConfirm={confirmBooking}
              onNextPayment={() => setFlow('payment')}
              onBackBooking={goBackToBooking}
              onPaymentChange={setPaymentMethod}
              onFinish={() => setNotice(`호출하기 ${paymentMethod === 'cash' ? '현장결제' : '앱결제'} 1,650원을 선택했습니다.`)}
              onReset={resetUserFlow}
              onRead={() => setIsReading(true)}
            />
          ) : (
            <AdminMode
              period={period}
              setPeriod={setPeriod}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onIntervention={() => setInterventionOpen(true)}
            />
          )}
        </main>
      </div>

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[70] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-[hsl(var(--sidebar))] px-4 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground))] shadow-[0_12px_30px_hsl(204_68%_14%/.24)]"
        >
          <Check size={17} className="shrink-0 text-[hsl(var(--sidebar-primary))]" />
          <span>{notice}</span>
        </div>
      )}

      {isCallOpen && (
        <VoiceCallModal
          stage={callStage}
          transcript={transcript}
          finalTranscript={finalTranscript}
          onEnd={closeVoiceCall}
          onRestart={restartCallMic}
          onApprove={confirmBooking}
        />
      )}

      {interventionOpen && <InterventionDialog onClose={() => setInterventionOpen(false)} onConnect={connectAgent} />}
    </div>
  );
}

function ModeNavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Phone;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${active ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`}
    >
      <Icon size={18} />
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary-foreground))]" />}
    </button>
  );
}

type UserModeProps = {
  flow: UserFlow;
  transcript: string;
  finalTranscript: string;
  paymentMethod: PaymentMethod;
  isReading: boolean;
  agentConnected: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onRetry: () => void;
  onConfirm: () => void;
  onNextPayment: () => void;
  onBackBooking: () => void;
  onPaymentChange: (method: PaymentMethod) => void;
  onFinish: () => void;
  onReset: () => void;
  onRead: () => void;
};

function UserMode({
  flow,
  transcript,
  finalTranscript,
  paymentMethod,
  isReading,
  agentConnected,
  onStartListening,
  onStopListening,
  onRetry,
  onConfirm,
  onNextPayment,
  onBackBooking,
  onPaymentChange,
  onFinish,
  onReset,
  onRead,
}: UserModeProps) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8 lg:px-11">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="rise-in">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary))]">
            <Sparkles size={14} /> 어르신을 위한 쉬운 호출
          </div>
          <h2 className="max-w-2xl text-balance font-display text-3xl font-bold leading-[1.18] tracking-[-.06em] sm:text-4xl">
            목적지를 말하면,
            <br />
            <span className="text-[hsl(var(--primary))]">똑버스가 찾아옵니다.</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            지도에서 출발지를 확인하고, 마이크 버튼을 눌러 가고 싶은 곳을 편하게 말씀해 주세요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /> 실시간 시연 화면
          <span className="mx-1 h-1 w-1 rounded-full bg-[hsl(var(--border))]" />
          <span className="font-mono-display">VOICE / 02</span>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(390px,480px)_minmax(0,1fr)]">
        <div className="mobile-frame mx-auto w-full max-w-[430px] overflow-hidden rounded-[34px] border-[7px] border-[hsl(224_30%_18%)] bg-white shadow-[0_26px_70px_hsl(224_30%_18%/.2)]">
          <div className="mobile-status-bar flex items-center justify-between bg-white px-5 pb-1 pt-3 text-[11px] font-bold text-slate-900">
            <span>8:37</span>
            <div className="flex items-center gap-1.5">
              <Signal size={12} strokeWidth={2.8} />
              <span className="text-[10px]">Wi-Fi</span>
              <span className="h-3 w-5 rounded-[3px] border border-slate-700 p-[1px]"><span className="block h-full w-3/4 rounded-[1px] bg-slate-800" /></span>
            </div>
          </div>
          <div className="map-surface relative h-[270px] overflow-hidden">
            <div className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
              <ArrowLeft size={22} />
            </div>
            <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md">
              <MoreHorizontal size={22} />
            </div>
            <div className="map-label map-label-one">동남메리트아파트</div>
            <div className="map-label map-label-two">봉담읍 행정복지센터</div>
            <div className="map-label map-label-three">대호프라자</div>
            <div className="map-road map-road-one" />
            <div className="map-road map-road-two" />
            <div className="map-road map-road-three" />
            <div className="map-road map-road-four" />
            <div className="map-park map-park-one" />
            <div className="map-park map-park-two" />
            <div className="map-pin">
              <div className="map-pin-bubble"><UserRound size={15} /> 여기서 출발</div>
              <div className="map-pin-dot"><MapPin size={22} fill="currentColor" /></div>
            </div>
            <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
              <LocateFixed size={20} />
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-[10px] font-bold text-slate-600 shadow-md">
              <Navigation size={12} fill="currentColor" /> 현 위치
            </div>
          </div>

          <div className="bottom-sheet relative bg-white px-4 pb-5 pt-4">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center gap-3">
              <div className="bus-thumbnail"><CarFront size={28} /></div>
              <div>
                <p className="text-[12px] font-bold text-[#2563eb]">화성시 봉담읍</p>
                <h3 className="mt-0.5 text-[20px] font-extrabold tracking-[-.04em] text-slate-900">
                  차량을 호출하세요
                </h3>
              </div>
            </div>

            {flow === 'payment' ? (
              <PaymentPanel paymentMethod={paymentMethod} onChange={onPaymentChange} onFinish={onFinish} onBack={onBackBooking} />
            ) : flow === 'booked' ? (
              <BookingPanel destination={extractDestination(finalTranscript)} onNext={onNextPayment} onReset={onReset} />
            ) : (
              <>
                <div className="rounded-2xl border-2 border-[#2563eb]/75 bg-white p-3.5 shadow-[0_5px_16px_rgba(37,99,235,.08)]">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-[#1e3a8a]"><MapPin size={19} /></div>
                    <p className="text-[16px] font-bold text-slate-800">출발지: 동남메리트아파트 101동</p>
                  </div>
                  <div className="pt-3">
                    <VoiceCallButton
                      flow={flow}
                      transcript={transcript}
                      onStart={onStartListening}
                      onStop={onStopListening}
                    />
                  </div>
                </div>

                {(flow === 'listening' || flow === 'confirm') && (
                  <VoiceConversation
                    flow={flow}
                    transcript={transcript}
                    finalTranscript={finalTranscript}
                    onConfirm={onConfirm}
                    onRetry={onRetry}
                  />
                )}

                <div className="mt-3 flex items-center gap-2 px-1 text-[12px] font-semibold text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100"><HomeIcon /></span>
                  집 추가
                  <span className="ml-auto text-[11px] text-slate-400">음성으로도 목적지를 입력할 수 있어요</span>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#effaf6] px-4 py-3 text-[12px]">
                  <ShieldCheck size={21} className="text-emerald-500" />
                  <div><p className="font-extrabold text-slate-800">AI 안심 호출</p><p className="text-slate-500">한 번 더 확인하고 안전하게 배차합니다</p></div>
                </div>
              </>
            )}
          </div>
          <div className="mobile-home-indicator mx-auto mb-2 h-1 w-24 rounded-full bg-slate-900" />
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          <div className="rounded-[26px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] shadow-[0_20px_50px_hsl(204_42%_26%/.1)] sm:p-7">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-extrabold tracking-[.16em] text-[hsl(var(--sidebar-primary))]">VOICE ASSISTANT</p>
                <h3 className="mt-2 text-xl font-extrabold tracking-[-.05em]">말하기만 하면 돼요</h3>
              </div>
              <Mic size={21} className="text-[hsl(var(--accent))]" />
            </div>
            <div className="space-y-5">
              {[
                ['01', '출발지 확인', '지도 위 파란 핀으로 지금 위치를 확인해요'],
                ['02', '목적지 말하기', '마이크를 누르고 “봉담 마트 가줘”라고 말해요'],
                ['03', '한 번 더 확인', 'AI가 들은 목적지와 요금을 다시 읽어드려요'],
              ].map(([number, title, copy]) => (
                <div className="flex gap-3" key={number}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-accent))] font-mono-display text-sm text-[hsl(var(--sidebar-primary))]">{number}</div>
                  <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.56)]">{copy}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-7 border-t border-[hsl(var(--sidebar-border))] pt-5">
              <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.58)]">
                음성 인식이 어려울 때는 <span className="font-bold text-[hsl(var(--accent))]">상담원이 바로 이어받습니다.</span>
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_12px_30px_hsl(204_42%_26%/.05)] sm:p-7">
            <div className="flex items-start justify-between">
              <div><p className="text-[11px] font-extrabold tracking-[.16em] text-[hsl(var(--primary))]">DEMO GUIDE</p><h3 className="mt-2 text-xl font-extrabold tracking-[-.05em]">발표 시연 순서</h3></div>
              <MessageCircle size={21} className="text-[hsl(var(--primary))]" />
            </div>
            <div className="mt-6 space-y-3 text-sm font-bold text-slate-700">
              <p className="rounded-xl bg-[hsl(var(--secondary))] px-4 py-3">1. 마이크 버튼을 눌러 권한 허용</p>
              <p className="rounded-xl bg-[hsl(var(--secondary))] px-4 py-3">2. “메가MGC커피 봉담점 가줘”라고 말하기</p>
              <p className="rounded-xl bg-[hsl(var(--secondary))] px-4 py-3">3. 예, 호출해주세요 → 다음 → 결제</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              <Accessibility size={16} className="text-[hsl(var(--primary))]" /> 모든 버튼은 키보드와 스크린리더를 지원합니다
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HomeIcon() {
  return <span className="block h-2.5 w-3.5 rounded-t-sm bg-slate-400" />;
}

function VoiceCallButton({
  flow,
  transcript,
  onStart,
  onStop,
}: {
  flow: UserFlow;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
}) {
  const listening = flow === 'listening';
  return (
    <button
      type="button"
      aria-label={listening ? '음성 인식 중지' : '음성으로 목적지 말하기'}
      onClick={listening ? onStop : onStart}
      className={`voice-cta group flex min-h-[76px] w-full items-center gap-3 rounded-xl px-4 text-left transition-all ${listening ? 'voice-listening bg-[#2563eb] text-white' : 'bg-[#eff6ff] text-[#1e3a8a] hover:bg-[#dbeafe]'}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${listening ? 'bg-white text-[#2563eb]' : 'bg-[#2563eb] text-white'} shadow-sm`}>
        {listening ? <span className="sound-wave flex h-6 items-end gap-1">{[1, 2, 3, 4, 5].map((bar) => <i key={bar} className="h-5 w-1 rounded-full bg-current" />)}</span> : <Mic size={25} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-extrabold">{listening ? '음성을 듣고 있습니다...' : '음성으로 목적지 말하기'}</span>
        <span className={`mt-1 block truncate text-[12px] ${listening ? 'text-white/80' : 'text-slate-500'}`}>
          {listening ? (transcript || '예: “봉담 마트 가줘”') : "예: “봉담 마트 가줘”"}
        </span>
      </span>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${listening ? 'bg-white/15' : 'bg-white'}`}><ArrowRight size={17} /></span>
    </button>
  );
}

function VoiceConversation({
  flow,
  transcript,
  finalTranscript,
  onConfirm,
  onRetry,
}: {
  flow: 'listening' | 'confirm';
  transcript: string;
  finalTranscript: string;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const destination = extractDestination(finalTranscript || transcript);
  return (
    <div className="voice-dialog rise-in mt-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_8px_24px_rgba(37,99,235,.1)]">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb]"><Bot size={15} /></span>
        AI 똑버스
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> 실시간</span>
      </div>
      {flow === 'listening' ? (
        <div>
          <p className="rounded-xl rounded-tl-sm bg-slate-50 px-3.5 py-3 text-[14px] font-semibold leading-6 text-slate-700">
            목적지를 듣고 있어요. 천천히 말씀해 주세요.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#eff6ff] px-3 py-2.5 text-[13px] font-bold text-[#2563eb]">
            <span className="listening-dot" />
            <span className="truncate">{transcript || '말씀하신 내용이 여기에 표시됩니다'}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl rounded-tl-sm bg-slate-50 px-3.5 py-3 text-[14px] font-semibold leading-6 text-slate-700">
            동남메리트아파트에서 <span className="font-extrabold text-[#2563eb]">'{destination}'</span>까지 똑버스를 배차할까요?
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={onRetry} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={14} /> 다시 말하기</button>
            <button type="button" onClick={onConfirm} className="flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-3 py-2.5 text-[13px] font-extrabold text-white shadow-[0_5px_12px_rgba(37,99,235,.2)] hover:bg-blue-700"><Check size={15} /> 예, 호출해주세요</button>
          </div>
        </>
      )}
    </div>
  );
}

function VoiceCallModal({
  stage,
  transcript,
  finalTranscript,
  onEnd,
  onRestart,
  onApprove,
}: {
  stage: CallStage;
  transcript: string;
  finalTranscript: string;
  onEnd: () => void;
  onRestart: () => void;
  onApprove: () => void;
}) {
  const destination = extractDestination(finalTranscript || transcript);
  const isListening = stage === 'listening' || stage === 'approval';
  const isApproval = stage === 'approval';
  const stageLabel = stage === 'intro'
    ? 'AI 안내 중'
    : stage === 'confirm'
      ? '목적지 확인 중'
      : isApproval
        ? '호출 여부를 확인 중'
        : '듣고 있는 중';

  return (
    <div className="voice-call-modal fixed inset-0 z-[80] flex items-stretch justify-center bg-[#071b46]/90 p-0 sm:items-center sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-call-title"
        className="voice-call-panel relative flex min-h-[100dvh] w-full max-w-[560px] flex-col overflow-hidden bg-[linear-gradient(155deg,#0b2b72_0%,#08205a_48%,#06143f_100%)] px-5 pb-6 pt-5 text-white shadow-[0_30px_80px_rgba(2,15,52,.4)] sm:min-h-[720px] sm:rounded-[32px] sm:px-8 sm:pb-8 sm:pt-7"
      >
        <div className="flex items-center justify-between text-white/70">
          <span className="font-mono-display text-[11px] tracking-[.16em]">HWASEONG AI MOBILITY</span>
          <button
            type="button"
            onClick={onEnd}
            aria-label="통화 화면 닫기"
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-7 flex flex-col items-center text-center sm:mt-9">
          <div className="voice-agent-avatar phone-ring flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-white/20 bg-[#3e7bff] shadow-[0_14px_30px_rgba(27,86,210,.4)]">
            <Bot size={42} strokeWidth={1.7} />
          </div>
          <p className="mt-5 text-[12px] font-bold tracking-[.14em] text-[#b9d3ff]">AI VOICE ASSISTANT</p>
          <h2 id="voice-call-title" className="mt-2 text-[25px] font-black tracking-[-.05em] sm:text-[30px]">
            화성시 AI 똑버스 상담원
          </h2>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-bold text-white/70">
            <span className={`h-2.5 w-2.5 rounded-full ${isListening ? 'bg-[#67e8f9] pulse-dot' : 'bg-[#9db9ed]'}`} />
            {stageLabel}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center sm:py-10">
          <div className={`call-wave mb-8 flex h-16 items-center justify-center gap-1.5 ${isListening ? 'call-wave-active' : ''}`} aria-label={isListening ? '음성 듣는 중' : 'AI 음성 안내 중'}>
            {[22, 38, 54, 32, 68, 44, 76, 42, 60, 30, 48, 24].map((height, index) => (
              <span key={index} style={{ height: `${height}px` }} />
            ))}
          </div>

          {stage === 'intro' && (
            <p className="voice-call-caption max-w-[440px] font-extrabold leading-[1.55] tracking-[-.045em] text-white">
              반갑습니다.<br />화성시 AI 똑버스입니다.<br />어디로 가시나요?
            </p>
          )}

          {stage === 'listening' && (
            <div className="max-w-[470px]">
              <p className="text-[17px] font-bold text-[#b9d3ff]">천천히 말씀해 주세요</p>
              <p className="voice-call-caption mt-4 min-h-[92px] font-black leading-[1.45] tracking-[-.055em] text-white">
                {transcript || '말씀하신 내용이 여기에 표시됩니다'}
              </p>
            </div>
          )}

          {stage === 'confirm' && (
            <div className="max-w-[480px]">
              <p className="text-[16px] font-bold text-[#b9d3ff]">잘 들었어요</p>
              <p className="voice-call-caption mt-4 font-black leading-[1.5] tracking-[-.05em] text-white">
                동남메리트아파트에서<br />
                <span className="text-[#7dd3fc]">{destination}</span>까지,<br />
                1명 호출할까요?
              </p>
            </div>
          )}

          {stage === 'approval' && (
            <div className="max-w-[480px]">
              <p className="text-[16px] font-bold text-[#b9d3ff]">호출해도 괜찮을까요?</p>
              <p className="voice-call-caption mt-4 font-black leading-[1.5] tracking-[-.05em] text-white">
                “네” 또는 “응”이라고<br />말씀해 주세요
              </p>
              <p className="mt-4 text-[15px] font-semibold text-white/60">아래 버튼을 눌러 바로 호출할 수도 있어요</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/15 pt-5">
          {(stage === 'confirm' || stage === 'approval') && (
            <button
              type="button"
              onClick={onApprove}
              className="mb-4 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[18px] font-black text-[#16449e] shadow-[0_10px_24px_rgba(0,0,0,.16)] transition-transform hover:-translate-y-0.5"
            >
              <Check size={21} strokeWidth={3} /> 호출 확인
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onEnd}
              className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-3 text-[16px] font-extrabold text-white shadow-[0_8px_18px_rgba(239,68,68,.22)] transition-colors hover:bg-[#dc2626]"
            >
              <PhoneOff size={20} /> 통화 종료
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-white/13 px-3 text-[16px] font-extrabold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20"
            >
              <Mic size={20} /> 마이크 재실행
            </button>
          </div>
          <p className="mt-4 text-center text-[12px] font-semibold text-white/45">음성 안내 속도는 어르신이 듣기 편하도록 천천히 설정되어 있습니다</p>
        </div>
      </div>
    </div>
  );
}

function extractDestination(spokenText: string) {
  const fallback = '메가MGC커피 화성봉담2지구점';
  if (!spokenText.trim()) return fallback;
  const cleaned = spokenText
    .replace(/(으로|로)?\s*(가줘|가 주세요|가주세요|가고 싶어요|가고 싶어|데려다 줘|데려다줘|부탁해요|부탁해)\s*[.!?]?$/i, '')
    .replace(/^(목적지는|목적지|저는)\s*/i, '')
    .trim();
  return cleaned || fallback;
}

function BookingPanel({ destination, onNext, onReset }: { destination: string; onNext: () => void; onReset: () => void }) {
  return (
    <div className="booking-panel rise-in">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-emerald-600"><Check size={17} /> 배차가 확정되었습니다</div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2 text-[13px] font-bold text-slate-500"><span>동남메리트아파트</span><ArrowRight size={15} className="shrink-0 text-[#2563eb]" /><span className="max-w-[130px] truncate text-right">{destination}</span></div>
        <div className="mt-4 flex items-end justify-between">
          <div><p className="text-[28px] font-black tracking-[-.06em] text-slate-900">9분 후 탑승</p><p className="mt-1 text-[13px] font-semibold text-slate-500">예상 요금 · <span className="text-slate-800">1,650원</span></p></div>
          <div className="bus-mini-icon"><CarFront size={25} /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">차량번호</p><p className="mt-1 font-extrabold text-slate-800">경기70바 1234</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">탑승 인원</p><p className="mt-1 font-extrabold text-slate-800">성인 1명</p></div>
        </div>
      </div>
      <button type="button" onClick={onNext} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-3.5 text-[16px] font-extrabold text-white shadow-[0_8px_16px_rgba(37,99,235,.2)] hover:bg-blue-700">다음 <ArrowRight size={18} /></button>
      <button type="button" onClick={onReset} className="mt-3 flex w-full items-center justify-center gap-1 text-[12px] font-bold text-slate-400 hover:text-slate-600"><RefreshCw size={13} /> 처음으로 돌아가기</button>
    </div>
  );
}

function PaymentPanel({
  paymentMethod,
  onChange,
  onFinish,
  onBack,
}: {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <div className="payment-panel rise-in">
      <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-[12px] font-bold text-slate-500"><ArrowLeft size={14} /> 배차 정보</button>
      <h4 className="text-[20px] font-extrabold tracking-[-.04em] text-slate-900">결제수단을 선택해 주세요</h4>
      <p className="mt-1 text-[13px] text-slate-500">이동 요금은 1,650원입니다.</p>
      <div className="mt-5 grid gap-2">
        {[
          { id: 'cash' as const, title: '현장결제', copy: '탑승 후 기사님께 결제', icon: CreditCard },
          { id: 'app' as const, title: '앱결제', copy: '등록된 카드로 바로 결제', icon: Phone },
        ].map(({ id, title, copy, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onChange(id)} className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${paymentMethod === id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-slate-100 bg-slate-50'}`}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMethod === id ? 'bg-[#2563eb] text-white' : 'bg-white text-slate-400'}`}><Icon size={19} /></span>
            <span><span className="block text-[14px] font-extrabold text-slate-800">{title}</span><span className="mt-0.5 block text-[12px] text-slate-500">{copy}</span></span>
            {paymentMethod === id && <Check size={18} className="ml-auto text-[#2563eb]" />}
          </button>
        ))}
      </div>
      <button type="button" onClick={onFinish} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-3.5 text-[16px] font-extrabold text-white shadow-[0_8px_16px_rgba(37,99,235,.2)] hover:bg-blue-700">호출하기 1,650원 <ArrowRight size={18} /></button>
    </div>
  );
}

type AdminRow = { id: string; time: string; caller: string; route: string; status: 'success' | 'handoff'; duration: string; confidence: string };
const rows: AdminRow[] = [
  { id: 'a1', time: '14:02:18', caller: '김*자 · 75세 · 남양읍', route: '남양읍 행정복지센터 → 봉담 마트', status: 'success', duration: '00:42', confidence: '98.4%' },
  { id: 'a2', time: '14:01:47', caller: '이*수 · 68세 · 봉담읍', route: '동탄역 → 병점 홈플러스', status: 'success', duration: '00:38', confidence: '96.1%' },
  { id: 'a3', time: '14:00:55', caller: '박*희 · 82세 · 향남읍', route: '향남읍사무소 → 발안시장', status: 'handoff', duration: '01:26', confidence: '—' },
  { id: 'a4', time: '13:59:31', caller: '최*호 · 71세 · 송산면', route: '송산면사무소 → 사강시장', status: 'success', duration: '00:51', confidence: '94.7%' },
  { id: 'a5', time: '13:58:12', caller: '정*순 · 77세 · 봉담읍', route: '봉담읍사무소 → 수원역', status: 'success', duration: '00:44', confidence: '97.8%' },
];

function AdminMode({ period, setPeriod, statusFilter, setStatusFilter, onIntervention }: { period: string; setPeriod: (value: string) => void; statusFilter: 'all' | 'success' | 'handoff'; setStatusFilter: (value: 'all' | 'success' | 'handoff') => void; onIntervention: () => void }) {
  const filteredRows = useMemo(() => statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter), [statusFilter]);
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10 lg:px-11">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary))]"><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /> LIVE · AI 관제</div><h2 className="font-display text-3xl font-bold tracking-[-.06em] sm:text-4xl">오늘의 이동을<br /><span className="text-[hsl(var(--primary))]">조용히 지키고 있습니다.</span></h2><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">AI가 듣고, 확인하고, 필요한 순간 사람에게 연결합니다.</p></div><div className="flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">{['오늘', '어제', '이번 주'].map((item) => <button type="button" key={item} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${period === item ? 'bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>{item}</button>)}</div></div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Phone} eyebrow="총 음성호출" value="1,240건" change="+8.2%" detail={`${period} 누적`} accent="blue" />
        <Kpi icon={Sparkles} eyebrow="AI 자동 처리율" value="88.5%" change="+2.4%p" detail="목표 85% 초과" accent="aqua" />
        <Kpi icon={Clock3} eyebrow="평균 대기시간" value="0초" change="즉시 연결" detail="지난달 12초" accent="amber" />
        <Kpi icon={CarFront} eyebrow="운영 절감액" value="약 450만 원/일" change="+14.8%" detail="상담원 운영 대비" accent="green" />
      </div>
      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
        <section className="soft-grid relative min-h-[245px] overflow-hidden rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(195_43%_97%)] p-5 sm:p-7"><div className="relative z-10 flex items-start justify-between"><div><p className="text-[11px] font-extrabold tracking-[.15em] text-[hsl(var(--primary))]">NETWORK PULSE</p><h3 className="mt-2 text-lg font-extrabold tracking-[-.04em]">화성 이동 네트워크</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">지금 운행 중인 똑버스 38대</p></div><div className="flex items-center gap-2 rounded-full bg-[hsl(var(--card)/.9)] px-3 py-1.5 text-[11px] font-bold shadow-sm"><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /> 실시간</div></div><div className="relative mt-6 h-[115px]"><div className="absolute left-[7%] top-[58%] h-px w-[86%] rotate-[-8deg] bg-[hsl(var(--primary)/.35)]" /><div className="absolute left-[14%] top-[24%] h-px w-[74%] rotate-[13deg] bg-[hsl(var(--primary)/.25)]" /><div className="absolute left-[28%] top-[66%] h-px w-[40%] rotate-[23deg] bg-[hsl(var(--accent)/.65)]" />{[['남양', '18%', '49%', 'blue'], ['봉담', '42%', '25%', 'aqua'], ['동탄', '70%', '64%', 'amber'], ['향남', '83%', '26%', 'green'], ['송산', '27%', '78%', 'blue']].map(([name, left, top, color]) => { const colorValue = color === 'blue' ? 'hsl(var(--primary))' : color === 'aqua' ? 'hsl(var(--sidebar-primary))' : color === 'amber' ? 'hsl(var(--accent))' : 'hsl(var(--chart-4))'; return <div key={name} className="absolute" style={{ left, top }}><div className="h-3 w-3 rounded-full border-2 border-[hsl(var(--card))] shadow-[0_0_0_5px_hsl(var(--primary)/.16)]" style={{ backgroundColor: colorValue }} /><span className="absolute left-4 top-[-4px] whitespace-nowrap text-[10px] font-extrabold text-[hsl(var(--muted-foreground))]">{name}</span></div>; })}</div><div className="absolute bottom-5 left-5 flex items-center gap-4 text-[10px] font-bold text-[hsl(var(--muted-foreground))] sm:left-7"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> 운행 중</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> 호출 배차</span></div></section>
        <section className="rounded-[26px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]"><div className="flex items-start justify-between"><div><p className="text-[11px] font-extrabold tracking-[.15em] text-[hsl(var(--sidebar-primary))]">HUMAN IN THE LOOP</p><h3 className="mt-2 text-lg font-extrabold tracking-[-.04em]">도움이 필요한 통화</h3></div><LifeBuoy size={20} className="text-[hsl(var(--accent))]" /></div><div className="mt-6 flex items-end justify-between"><div><p className="font-mono-display text-5xl font-bold">03</p><p className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/.56)]">상담원 이관 대기</p></div><div className="h-16 w-32"><div className="flex h-full items-end gap-1.5">{[35, 52, 41, 73, 58, 80, 68, 91, 76, 86, 64, 78].map((height, index) => <span key={index} className={`w-full rounded-t-sm ${index > 8 ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--sidebar-primary)/.55)]'}`} style={{ height: `${height}%` }} />)}</div></div></div><button type="button" onClick={onIntervention} className="mt-6 flex w-full items-center justify-between rounded-xl bg-[hsl(var(--sidebar-accent))] px-4 py-3 text-xs font-bold text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent)/.8)]">인식 실패 케이스 확인 <ArrowRight size={15} className="text-[hsl(var(--accent))]" /></button></section>
      </div>
      <section className="overflow-hidden rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="flex flex-col justify-between gap-4 border-b border-[hsl(var(--border))] px-5 py-5 sm:flex-row sm:items-center sm:px-7"><div><div className="flex items-center gap-2"><h3 className="text-lg font-extrabold tracking-[-.04em]">실시간 통화 모니터링</h3><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /></div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">AI가 처리 중인 통화를 한눈에 확인합니다.</p></div><div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))] p-1">{[['all', '전체'], ['success', 'AI 처리'], ['handoff', '이관 필요']].map(([value, label]) => <button type="button" key={value} onClick={() => setStatusFilter(value as 'all' | 'success' | 'handoff')} className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold ${statusFilter === value ? 'bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{label}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[hsl(var(--border))] text-[10px] font-extrabold tracking-[.1em] text-[hsl(var(--muted-foreground))]"><th className="px-5 py-3.5 sm:px-7">호출 시간</th><th className="px-3 py-3.5">사용자</th><th className="px-3 py-3.5">STT 요약</th><th className="px-3 py-3.5">AI 신뢰도</th><th className="px-3 py-3.5">상태</th><th className="px-5 py-3.5 sm:px-7" /></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id} className="border-b border-[hsl(var(--border)/.7)] text-xs last:border-0 hover:bg-[hsl(var(--muted)/.45)]"><td className="px-5 py-4 font-mono-display font-bold sm:px-7">{row.time}</td><td className="px-3 py-4 font-semibold text-[hsl(var(--muted-foreground))]">{row.caller}</td><td className="max-w-[270px] truncate px-3 py-4 font-bold">{row.route}</td><td className="px-3 py-4 font-mono-display font-bold">{row.confidence}</td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${row.status === 'success' ? 'bg-[hsl(var(--chart-4)/.13)] text-[hsl(var(--chart-4))]' : 'bg-[hsl(var(--accent)/.35)] text-[hsl(var(--accent-foreground))]'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{row.status === 'success' ? 'AI 처리 완료' : '상담원 이관 필요'}</span></td><td className="px-5 py-4 text-right sm:px-7"><button type="button" aria-label={`${row.time} 통화 상세`} onClick={onIntervention} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{filteredRows.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center"><Radio size={23} className="mb-3 text-[hsl(var(--muted-foreground))]" /><p className="text-sm font-bold">해당 상태의 통화가 없습니다</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">다른 필터를 선택해 보세요.</p></div>}</div></section>
    </div>
  );
}

function Kpi({ icon: Icon, eyebrow, value, change, detail, accent }: { icon: typeof Phone; eyebrow: string; value: string; change: string; detail: string; accent: string }) {
  const colorMap: Record<string, string> = { blue: 'hsl(var(--primary))', aqua: 'hsl(var(--sidebar-primary))', amber: 'hsl(var(--accent-foreground))', green: 'hsl(var(--chart-4))' };
  return <div className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_6px_20px_hsl(204_42%_26%/.035)]"><div className="flex items-start justify-between"><div><p className="text-[11px] font-extrabold tracking-[.08em] text-[hsl(var(--muted-foreground))]">{eyebrow}</p><p className="mt-3 font-mono-display text-[25px] font-bold tracking-[-.04em]">{value}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${colorMap[accent]}22`, color: colorMap[accent] }}><Icon size={18} /></div></div><div className="mt-4 flex items-center justify-between gap-2 text-[10px] font-bold"><span style={{ color: colorMap[accent] }}>{change}</span><span className="text-[hsl(var(--muted-foreground))]">{detail}</span></div></div>;
}

function InterventionDialog({ onClose, onConnect }: { onClose: () => void; onConnect: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[hsl(204_68%_14%/.52)] p-0 sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="intervention-title" className="rise-in w-full max-w-[480px] rounded-t-[28px] bg-[hsl(var(--card))] p-6 shadow-[0_25px_70px_hsl(204_68%_14%/.25)] sm:rounded-[28px] sm:p-7"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--accent)/.34)] text-[hsl(var(--accent-foreground))]"><LifeBuoy size={22} /></div><div><p className="text-[11px] font-extrabold tracking-[.13em] text-[hsl(var(--accent-foreground))]">HUMAN SUPPORT</p><h2 id="intervention-title" className="mt-1 text-lg font-extrabold tracking-[-.04em]">상담원 도움이 필요합니다</h2></div></div><button type="button" aria-label="대화상자 닫기" onClick={onClose} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"><X size={19} /></button></div><div className="mt-7 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(195_43%_97%)] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">통화 ID · #HX-240618-031</span><span className="rounded-full bg-[hsl(var(--accent)/.36)] px-2 py-1 text-[10px] font-extrabold text-[hsl(var(--accent-foreground))]">인식 실패 3회</span></div><p className="text-sm font-bold leading-6">“목적지를 정확히 듣지 못했습니다.”<br /><span className="font-normal text-[hsl(var(--muted-foreground))]">AI가 이용자의 말씀을 세 번 확인했지만 확신이 낮습니다.</span></p></div><div className="mt-5 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Phone size={15} /></div><span>이용자에게는 “잠시만 기다려 주세요”라고 안내 중</span></div><div className="mt-7 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]">나중에 연결</button><button type="button" onClick={onConnect} className="flex-[1.4] rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-extrabold text-[hsl(var(--primary-foreground))] shadow-[0_8px_16px_hsl(199_78%_34%/.18)] transition-transform hover:-translate-y-0.5"><span className="flex items-center justify-center gap-2"><Headphones size={17} /> 상담원 바로 연결</span></button></div></div></div>;
}

function Router() {
  const [showStartup, setShowStartup] = useState(true);
  return (
    <>
      {showStartup && <StartupSequence onComplete={() => setShowStartup(false)} />}
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
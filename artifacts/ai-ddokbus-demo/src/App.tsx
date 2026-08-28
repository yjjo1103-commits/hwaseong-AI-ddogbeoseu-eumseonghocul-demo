import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight,
  Bot,
  CarFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Mic,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Radio,
  Settings2,
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

function Home() {
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [callStage, setCallStage] = useState(-1);
  const [isRinging, setIsRinging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [period, setPeriod] = useState('오늘');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'handoff'>('all');

  useEffect(() => {
    if (!isReading) return;
    const timer = window.setTimeout(() => setIsReading(false), 3300);
    return () => window.clearTimeout(timer);
  }, [isReading]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const startCall = () => {
    setIsRinging(true);
    setCallStage(-1);
    window.setTimeout(() => {
      setIsRinging(false);
      setCallStage(0);
    }, 1400);
  };

  const advanceCall = () => {
    setCallStage((stage) => Math.min(stage + 1, 4));
  };

  const resetCall = () => {
    setCallStage(-1);
    setIsRinging(false);
    setIsReading(false);
    setAgentConnected(false);
  };

  const connectAgent = () => {
    setInterventionOpen(false);
    setAgentConnected(true);
    setNotice('상담원 연결을 요청했습니다. 곧 통화가 이어집니다.');
  };

  return (
    <div className="app-noise min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex min-h-[100dvh]">
        <aside className={`${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:relative md:translate-x-0`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[0_8px_18px_hsl(183_57%_67%/.2)]">
                  <Radio size={23} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="font-display text-[17px] font-bold leading-none tracking-[-.04em]">똑버스</p>
                  <p className="mt-1 text-[11px] font-semibold tracking-[.12em] text-[hsl(var(--sidebar-foreground)/.58)]">HWASEONG AI MOBILITY</p>
                </div>
              </div>
              <div className="mb-8 flex items-center gap-2 rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.5)] px-3 py-2 text-[11px] font-semibold text-[hsl(var(--sidebar-foreground)/.76)]">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />
                AI 운영 시스템 정상
              </div>
            </div>
            <button type="button" aria-label="메뉴 닫기" data-testid="button-close-mobile-nav" onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1 text-[hsl(var(--sidebar-foreground)/.65)] md:hidden">
              <X size={19} />
            </button>
          </div>

          <nav className="space-y-2" aria-label="주요 메뉴">
            <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.42)]">서비스 보기</p>
            <button type="button" data-testid="button-nav-user-mode" onClick={() => { setMode('user'); setMobileNavOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${mode === 'user' ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
              <PhoneCall size={18} /> 사용자 모드
              {mode === 'user' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary-foreground))]" />}
            </button>
            <button type="button" data-testid="button-nav-admin-mode" onClick={() => { setMode('admin'); setMobileNavOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${mode === 'admin' ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
              <LayoutDashboard size={18} /> 관리자 모드
              {mode === 'admin' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary-foreground))]" />}
            </button>
          </nav>

          <div className="mt-auto hidden rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.45)] p-4 md:block">
            <div className="mb-3 flex items-center gap-2 text-[hsl(var(--sidebar-primary))]">
              <ShieldCheck size={17} />
              <span className="text-xs font-bold">안심 운영 원칙</span>
            </div>
            <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.58)]">잘 들리지 않아도 괜찮습니다. AI가 세 번 확인하면 상담원이 이어받습니다.</p>
          </div>
          <p className="mt-6 text-[10px] font-semibold tracking-[.12em] text-[hsl(var(--sidebar-foreground)/.35)]">화성특례시 교통정책과 · 2024</p>
        </aside>

        {mobileNavOpen && <button type="button" aria-label="메뉴 닫기" data-testid="button-mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-30 bg-[hsl(204_68%_14%/.45)] md:hidden" />}

        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.84)] px-5 backdrop-blur-md sm:px-8 lg:px-11">
            <div className="flex items-center gap-3">
              <button type="button" aria-label="메뉴 열기" data-testid="button-open-mobile-nav" onClick={() => setMobileNavOpen(true)} className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] md:hidden">
                <Menu size={21} />
              </button>
              <div>
                <p className="text-[11px] font-bold tracking-[.13em] text-[hsl(var(--primary))]">화성 AI 똑버스</p>
                <h1 className="mt-0.5 text-lg font-extrabold tracking-[-.04em] sm:text-xl">{mode === 'user' ? '음성호출 데모' : 'AI 관제센터'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] sm:flex">
                <Clock3 size={14} className="text-[hsl(var(--primary))]" /> 2024년 6월 18일 화요일
              </div>
              <button type="button" data-testid="button-help" onClick={() => setNotice('똑버스 이용이 어려우시면 031-000-0000으로 연락해 주세요.')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]" aria-label="도움말">
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
            <UserMode callStage={callStage} isRinging={isRinging} isReading={isReading} agentConnected={agentConnected} onStart={startCall} onNext={advanceCall} onReset={resetCall} onRead={() => setIsReading(true)} />
          ) : (
            <AdminMode period={period} setPeriod={setPeriod} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onIntervention={() => setInterventionOpen(true)} />
          )}
        </main>
      </div>

      {notice && <div data-testid="status-notice" className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-[hsl(var(--sidebar))] px-4 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground))] shadow-[0_12px_30px_hsl(204_68%_14%/.24)]"><Check size={17} className="text-[hsl(var(--sidebar-primary))]" />{notice}</div>}

      {interventionOpen && <InterventionDialog onClose={() => setInterventionOpen(false)} onConnect={connectAgent} />}
    </div>
  );
}

type UserModeProps = {
  callStage: number;
  isRinging: boolean;
  isReading: boolean;
  agentConnected: boolean;
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
  onRead: () => void;
};

function UserMode({ callStage, isRinging, isReading, agentConnected, onStart, onNext, onReset, onRead }: UserModeProps) {
  const stageItems = ['AI 인사', '이용자 말씀', 'AI 확인', '이용자 확인', '호출 완료'];
  const activeStep = callStage < 0 ? 0 : callStage;
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10 lg:px-11">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="rise-in">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary))]">
            <Sparkles size={14} /> 처음이어도 괜찮아요
          </div>
          <h2 className="max-w-2xl text-balance font-display text-3xl font-bold leading-[1.18] tracking-[-.06em] sm:text-4xl lg:text-[46px]">말로 부르는 버스,<br /><span className="text-[hsl(var(--primary))]">마음 놓고 이동하세요.</span></h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">전화 한 통이면 목적지를 듣고, 확인하고, 똑버스가 찾아갑니다. 아래에서 실제 통화 흐름을 체험해 보세요.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /> 시뮬레이션 환경
          <span className="mx-1 h-1 w-1 rounded-full bg-[hsl(var(--border))]" />
          <span className="font-mono-display">VOICE / 01</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.34fr)_minmax(330px,.66fr)]">
        <section className="relative overflow-hidden rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_20px_50px_hsl(204_42%_26%/.08)]">
          <div className="absolute right-0 top-0 h-52 w-52 translate-x-1/4 -translate-y-1/4 rounded-full bg-[hsl(var(--secondary))] blur-3xl" />
          <div className="relative border-b border-[hsl(var(--border))] px-5 py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold tracking-[.16em] text-[hsl(var(--muted-foreground))]">SIMULATED CALL</p>
                <h3 className="mt-1 text-lg font-extrabold tracking-[-.04em]">AI 똑버스 음성호출</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                <Signal size={13} className="text-[hsl(var(--chart-4))]" /> 연결 안정
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1">
              {stageItems.map((label, index) => <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors ${callStage >= index ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>{callStage > index ? <Check size={14} /> : index + 1}</div>
                <span className={`hidden truncate text-[11px] font-bold sm:block ${callStage >= index ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>{label}</span>
                {index < 4 && <div className={`mx-1 h-px min-w-2 flex-1 ${callStage > index ? 'bg-[hsl(var(--primary)/.45)]' : 'bg-[hsl(var(--border))]'}`} />}
              </div>)}
            </div>
          </div>

          <div className="relative min-h-[470px] bg-[hsl(195_43%_97%)] px-5 py-6 sm:px-8">
            {callStage < 0 && !isRinging && <div className="flex min-h-[415px] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_15px_30px_hsl(199_78%_34%/.22)]"><Phone size={35} /></div>
              <p className="text-lg font-extrabold tracking-[-.04em]">전화로 똑버스를 불러보세요</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">버튼을 누르면 AI가 먼저 인사합니다.<br />마이크 없이도 통화 흐름을 편하게 확인할 수 있어요.</p>
              <button type="button" data-testid="button-start-call" onClick={onStart} className="mt-7 flex items-center gap-3 rounded-2xl bg-[hsl(var(--primary))] px-6 py-4 text-base font-extrabold text-[hsl(var(--primary-foreground))] shadow-[0_10px_20px_hsl(199_78%_34%/.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0">
                <PhoneCall size={20} /> AI 똑버스 전화 시작
              </button>
            </div>}

            {isRinging && <div className="flex min-h-[415px] flex-col items-center justify-center text-center">
              <div className="phone-ring mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><PhoneCall size={34} /></div>
              <p className="text-xl font-extrabold tracking-[-.05em]">AI 똑버스에 연결 중입니다</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">잠시만 기다려 주세요</p>
              <div className="sound-wave mt-7 flex h-8 items-end gap-1.5">
                {[1, 2, 3, 4, 5].map((bar) => <span key={bar} className="h-8 w-1.5 rounded-full bg-[hsl(var(--primary))]" />)}
              </div>
            </div>}

            {callStage >= 0 && !isRinging && <ConversationStage callStage={callStage} agentConnected={agentConnected} isReading={isReading} onRead={onRead} />}
          </div>
          {callStage >= 0 && !isRinging && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 sm:px-8">
            <button type="button" data-testid="button-reset-call" onClick={onReset} className="text-xs font-bold text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline">처음부터 다시 보기</button>
            {callStage < 4 ? <button type="button" data-testid="button-next-call-stage" onClick={onNext} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-extrabold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5">다음 단계 <ArrowRight size={16} /></button> : <div className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--chart-4))]"><Check size={17} /> 호출이 접수되었습니다</div>}
          </div>}
        </section>

        <aside className="flex flex-col gap-6">
          <div className="rounded-[28px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] shadow-[0_20px_50px_hsl(204_42%_26%/.1)] sm:p-7">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-extrabold tracking-[.16em] text-[hsl(var(--sidebar-primary))]">HOW IT WORKS</p>
                <h3 className="mt-2 text-xl font-extrabold tracking-[-.05em]">세 단계면 충분합니다</h3>
              </div>
              <Zap size={19} className="text-[hsl(var(--accent))]" />
            </div>
            <div className="space-y-5">
              {[{ icon: PhoneCall, title: '전화 연결', copy: '화면의 버튼으로 AI 똑버스와 연결' }, { icon: Mic, title: '편하게 말하기', copy: '출발지와 목적지를 자연스럽게 말씀' }, { icon: Check, title: '한 번 더 확인', copy: 'AI가 들은 내용을 다시 읽어드림' }].map(({ icon: Icon, title, copy }, index) => <div className="flex gap-3" key={title}>
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]">{index + 1}<Icon size={14} className="absolute -right-1 -top-1 rounded-full bg-[hsl(var(--sidebar))] p-0.5" /></div>
                <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.56)]">{copy}</p></div>
              </div>)}
            </div>
            <div className="mt-7 border-t border-[hsl(var(--sidebar-border))] pt-5">
              <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.58)]">AI가 세 번 연속 알아듣지 못하면 <span className="font-bold text-[hsl(var(--accent))]">상담원이 바로 이어받습니다.</span></p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <UsersRound size={19} className="mb-4 text-[hsl(var(--primary))]" /><p className="font-mono-display text-2xl font-bold">1,240</p><p className="mt-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">오늘 호출 건수</p>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <Headphones size={19} className="mb-4 text-[hsl(var(--accent-foreground))]" /><p className="font-mono-display text-2xl font-bold">88.5<span className="text-base">%</span></p><p className="mt-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">AI 자동 처리율</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConversationStage({ callStage, agentConnected, isReading, onRead }: { callStage: number; agentConnected: boolean; isReading: boolean; onRead: () => void }) {
  if (agentConnected) return <div className="flex min-h-[415px] flex-col items-center justify-center text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--chart-4)/.16)] text-[hsl(var(--chart-4))]"><Headphones size={32} /></div><p className="text-xl font-extrabold">상담원에게 연결되었습니다</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">김지훈 상담원이 통화를 이어받습니다.</p></div>;
  if (callStage === 4) return <div className="rise-in min-h-[415px]"><div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--chart-4)/.15)] text-[hsl(var(--chart-4))]"><Check size={21} /></div><div><p className="text-lg font-extrabold">호출이 완료되었습니다</p><p className="text-xs font-semibold text-[hsl(var(--chart-4))]">오늘 오후 2시 · 1명</p></div></div><div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><p className="text-[11px] font-bold tracking-[.12em] text-[hsl(var(--muted-foreground))]">BOARDING DETAILS</p><div className="mt-3 flex items-center gap-3 text-base font-extrabold"><span>남양읍 행정복지센터</span><ArrowRight size={17} className="text-[hsl(var(--primary))]" /><span>봉담 마트</span></div></div><div className="grid grid-cols-2 gap-px bg-[hsl(var(--border))] sm:grid-cols-4"><InfoCell label="탑승 위치" value="센터 정문 앞" /><InfoCell label="도착 예정" value="10분 뒤" /><InfoCell label="차량 번호" value="경기70바 1234" /><InfoCell label="기사님" value="이정호 · 010-••••-2451" /></div></div><button type="button" data-testid="button-read-aloud" onClick={onRead} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--primary)/.3)] px-4 py-3 text-sm font-extrabold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--secondary))] ${isReading ? 'bg-[hsl(var(--secondary))]' : 'bg-[hsl(var(--card))]'}`}><Volume2 size={17} />{isReading ? '안내 내용을 읽고 있습니다' : '안내 내용 다시 듣기'}{isReading && <span className="sound-wave ml-1 flex h-4 items-end gap-0.5">{[1, 2, 3].map((bar) => <i key={bar} className="h-4 w-0.5 rounded-full bg-[hsl(var(--primary))]" />)}</span>}</button></div>;
  return <div className="rise-in flex min-h-[415px] flex-col justify-end gap-4 pb-3"><div className="flex items-center gap-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))]"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Bot size={14} /></div> AI 똑버스</div>{callStage >= 0 && <div className="max-w-[86%] rounded-2xl rounded-tl-sm bg-[hsl(var(--card))] px-4 py-3 text-sm font-semibold leading-6 shadow-sm">{callStage === 0 && '안녕하세요. 화성 AI 똑버스입니다. 어디로 모실까요?'}{callStage >= 1 && '안녕하세요. 화성 AI 똑버스입니다. 어디로 모실까요?'}</div>}{callStage >= 1 && <><div className="mt-2 flex items-center justify-end gap-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))]">이용자 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><UserRound size={14} /></div></div><div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold leading-6 text-[hsl(var(--primary-foreground))] shadow-sm">남양읍 행정복지센터에서 봉담 마트로 가고 싶어요.</div></>}{callStage >= 2 && <><div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))]"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Bot size={14} /></div> AI 똑버스</div><div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-[hsl(var(--card))] px-4 py-3 text-sm font-semibold leading-6 shadow-sm">남양읍 행정복지센터에서 봉담 마트로, 오늘 오후 2시에 한 분 맞으실까요?</div></>}{callStage >= 3 && <><div className="mt-2 flex items-center justify-end gap-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))]">이용자 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><UserRound size={14} /></div></div><div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold leading-6 text-[hsl(var(--primary-foreground))] shadow-sm">응, 맞아.</div></>}</div>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="bg-[hsl(var(--card))] px-4 py-4"><p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>;
}

type AdminRow = { id: string; time: string; caller: string; route: string; status: 'success' | 'handoff'; duration: string; confidence: string };
const rows: AdminRow[] = [
  { id: 'a1', time: '14:02:18', caller: '031-••••-4821', route: '남양읍 행정복지센터 → 봉담 마트', status: 'success', duration: '00:42', confidence: '98.4%' },
  { id: 'a2', time: '14:01:47', caller: '031-••••-1903', route: '동탄역 → 병점 홈플러스', status: 'success', duration: '00:38', confidence: '96.1%' },
  { id: 'a3', time: '14:00:55', caller: '031-••••-7712', route: '향남읍사무소 → 발안시장', status: 'handoff', duration: '01:26', confidence: '—' },
  { id: 'a4', time: '13:59:31', caller: '031-••••-3384', route: '송산면사무소 → 사강시장', status: 'success', duration: '00:51', confidence: '94.7%' },
  { id: 'a5', time: '13:58:12', caller: '031-••••-6208', route: '봉담읍사무소 → 수원역', status: 'success', duration: '00:44', confidence: '97.8%' },
];

function AdminMode({ period, setPeriod, statusFilter, setStatusFilter, onIntervention }: { period: string; setPeriod: (value: string) => void; statusFilter: 'all' | 'success' | 'handoff'; setStatusFilter: (value: 'all' | 'success' | 'handoff') => void; onIntervention: () => void }) {
  const filteredRows = useMemo(() => statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter), [statusFilter]);
  return <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10 lg:px-11">
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary))]"><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /> LIVE · AI 관제</div><h2 className="font-display text-3xl font-bold tracking-[-.06em] sm:text-4xl">오늘의 이동을<br /><span className="text-[hsl(var(--primary))]">조용히 지키고 있습니다.</span></h2><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">AI가 듣고, 확인하고, 필요한 순간 사람에게 연결합니다.</p></div><div className="flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">{['오늘', '어제', '이번 주'].map((item) => <button type="button" key={item} data-testid={`button-period-${item}`} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${period === item ? 'bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>{item}</button>)}</div></div>

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi icon={PhoneCall} eyebrow="총 음성호출" value="1,240건" change="+8.2%" detail={`${period} 누적`} accent="blue" />
      <Kpi icon={Sparkles} eyebrow="AI 자동 처리율" value="88.5%" change="+2.4%p" detail="목표 85% 초과" accent="aqua" />
      <Kpi icon={Clock3} eyebrow="평균 대기시간" value="0초" change="즉시 연결" detail="지난달 12초" accent="amber" />
      <Kpi icon={CarFront} eyebrow="운영 절감액" value="약 450만 원/일" change="+14.8%" detail="상담원 운영 대비" accent="green" />
    </div>

    <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
      <section className="soft-grid relative min-h-[245px] overflow-hidden rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(195_43%_97%)] p-5 sm:p-7">
        <div className="relative z-10 flex items-start justify-between"><div><p className="text-[11px] font-extrabold tracking-[.15em] text-[hsl(var(--primary))]">NETWORK PULSE</p><h3 className="mt-2 text-lg font-extrabold tracking-[-.04em]">화성 이동 네트워크</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">지금 운행 중인 똑버스 38대</p></div><div className="flex items-center gap-2 rounded-full bg-[hsl(var(--card)/.9)] px-3 py-1.5 text-[11px] font-bold shadow-sm"><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /> 실시간</div></div>
        <div className="relative mt-6 h-[115px]"><div className="absolute left-[7%] top-[58%] h-px w-[86%] rotate-[-8deg] bg-[hsl(var(--primary)/.35)]" /><div className="absolute left-[14%] top-[24%] h-px w-[74%] rotate-[13deg] bg-[hsl(var(--primary)/.25)]" /><div className="absolute left-[28%] top-[66%] h-px w-[40%] rotate-[23deg] bg-[hsl(var(--accent)/.65)]" />{[['남양', '18%', '49%', 'blue'], ['봉담', '42%', '25%', 'aqua'], ['동탄', '70%', '64%', 'amber'], ['향남', '83%', '26%', 'green'], ['송산', '27%', '78%', 'blue']].map(([name, left, top, color]) => { const colorValue = color === 'blue' ? 'hsl(var(--primary))' : color === 'aqua' ? 'hsl(var(--sidebar-primary))' : color === 'amber' ? 'hsl(var(--accent))' : 'hsl(var(--chart-4))'; return <div key={name} className="absolute" style={{ left, top }}><div className="h-3 w-3 rounded-full border-2 border-[hsl(var(--card))] shadow-[0_0_0_5px_hsl(var(--primary)/.16)]" style={{ backgroundColor: colorValue }} /><span className="absolute left-4 top-[-4px] whitespace-nowrap text-[10px] font-extrabold text-[hsl(var(--muted-foreground))]">{name}</span></div>; })}</div>
        <div className="absolute bottom-5 left-5 flex items-center gap-4 text-[10px] font-bold text-[hsl(var(--muted-foreground))] sm:left-7"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> 운행 중</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> 호출 배차</span></div>
      </section>
      <section className="rounded-[26px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]"><div className="flex items-start justify-between"><div><p className="text-[11px] font-extrabold tracking-[.15em] text-[hsl(var(--sidebar-primary))]">HUMAN IN THE LOOP</p><h3 className="mt-2 text-lg font-extrabold tracking-[-.04em]">도움이 필요한 통화</h3></div><LifeBuoy size={20} className="text-[hsl(var(--accent))]" /></div><div className="mt-6 flex items-end justify-between"><div><p className="font-mono-display text-5xl font-bold">03</p><p className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/.56)]">상담원 이관 대기</p></div><div className="h-16 w-32"><div className="flex h-full items-end gap-1.5">{[35, 52, 41, 73, 58, 80, 68, 91, 76, 86, 64, 78].map((height, index) => <span key={index} className={`w-full rounded-t-sm ${index > 8 ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--sidebar-primary)/.55)]'}`} style={{ height: `${height}%` }} />)}</div></div></div><button type="button" data-testid="button-open-intervention" onClick={onIntervention} className="mt-6 flex w-full items-center justify-between rounded-xl bg-[hsl(var(--sidebar-accent))] px-4 py-3 text-xs font-bold text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent)/.8)]">인식 실패 케이스 확인 <ArrowRight size={15} className="text-[hsl(var(--accent))]" /></button></section>
    </div>

    <section className="overflow-hidden rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="flex flex-col justify-between gap-4 border-b border-[hsl(var(--border))] px-5 py-5 sm:flex-row sm:items-center sm:px-7"><div><div className="flex items-center gap-2"><h3 className="text-lg font-extrabold tracking-[-.04em]">실시간 통화 모니터링</h3><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" /></div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">AI가 처리 중인 통화를 한눈에 확인합니다.</p></div><div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))] p-1">{[['all', '전체'], ['success', 'AI 처리'], ['handoff', '이관 필요']].map(([value, label]) => <button type="button" key={value} data-testid={`button-filter-${value}`} onClick={() => setStatusFilter(value as 'all' | 'success' | 'handoff')} className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold ${statusFilter === value ? 'bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{label}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-[hsl(var(--border))] text-[10px] font-extrabold tracking-[.1em] text-[hsl(var(--muted-foreground))]"><th className="px-5 py-3.5 sm:px-7">시간</th><th className="px-3 py-3.5">발신 번호</th><th className="px-3 py-3.5">이동 경로</th><th className="px-3 py-3.5">AI 신뢰도</th><th className="px-3 py-3.5">처리 시간</th><th className="px-3 py-3.5">상태</th><th className="px-5 py-3.5 sm:px-7" /></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id} data-testid={`row-call-${row.id}`} className="border-b border-[hsl(var(--border)/.7)] text-xs last:border-0 hover:bg-[hsl(var(--muted)/.45)]"><td className="px-5 py-4 font-mono-display font-bold sm:px-7">{row.time}</td><td className="px-3 py-4 font-semibold text-[hsl(var(--muted-foreground))]">{row.caller}</td><td className="max-w-[260px] truncate px-3 py-4 font-bold">{row.route}</td><td className="px-3 py-4 font-mono-display font-bold">{row.confidence}</td><td className="px-3 py-4 font-mono-display text-[hsl(var(--muted-foreground))]">{row.duration}</td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${row.status === 'success' ? 'bg-[hsl(var(--chart-4)/.13)] text-[hsl(var(--chart-4))]' : 'bg-[hsl(var(--accent)/.35)] text-[hsl(var(--accent-foreground))]'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{row.status === 'success' ? 'AI 처리 완료' : '상담원 이관 필요'}</span></td><td className="px-5 py-4 text-right sm:px-7"><button type="button" aria-label={`${row.time} 통화 상세`} data-testid={`button-call-detail-${row.id}`} onClick={onIntervention} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{filteredRows.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center"><Radio size={23} className="mb-3 text-[hsl(var(--muted-foreground))]" /><p className="text-sm font-bold">해당 상태의 통화가 없습니다</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">다른 필터를 선택해 보세요.</p></div>}</div></section>
  </div>;
}

function Kpi({ icon: Icon, eyebrow, value, change, detail, accent }: { icon: typeof PhoneCall; eyebrow: string; value: string; change: string; detail: string; accent: string }) {
  const colorMap: Record<string, string> = { blue: 'hsl(var(--primary))', aqua: 'hsl(var(--sidebar-primary))', amber: 'hsl(var(--accent-foreground))', green: 'hsl(var(--chart-4))' };
  return <div className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_6px_20px_hsl(204_42%_26%/.035)]"><div className="flex items-start justify-between"><div><p className="text-[11px] font-extrabold tracking-[.08em] text-[hsl(var(--muted-foreground))]">{eyebrow}</p><p className="mt-3 font-mono-display text-[25px] font-bold tracking-[-.04em]">{value}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${colorMap[accent]}22`, color: colorMap[accent] }}><Icon size={18} /></div></div><div className="mt-4 flex items-center justify-between gap-2 text-[10px] font-bold"><span style={{ color: colorMap[accent] }}>{change}</span><span className="text-[hsl(var(--muted-foreground))]">{detail}</span></div></div>;
}

function InterventionDialog({ onClose, onConnect }: { onClose: () => void; onConnect: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[hsl(204_68%_14%/.52)] p-0 sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="intervention-title" className="rise-in w-full max-w-[480px] rounded-t-[28px] bg-[hsl(var(--card))] p-6 shadow-[0_25px_70px_hsl(204_68%_14%/.25)] sm:rounded-[28px] sm:p-7"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--accent)/.34)] text-[hsl(var(--accent-foreground))]"><LifeBuoy size={22} /></div><div><p className="text-[11px] font-extrabold tracking-[.13em] text-[hsl(var(--accent-foreground))]">HUMAN SUPPORT</p><h2 id="intervention-title" className="mt-1 text-lg font-extrabold tracking-[-.04em]">상담원 도움이 필요합니다</h2></div></div><button type="button" aria-label="대화상자 닫기" data-testid="button-close-intervention" onClick={onClose} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"><X size={19} /></button></div><div className="mt-7 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(195_43%_97%)] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">통화 ID · #HX-240618-031</span><span className="rounded-full bg-[hsl(var(--accent)/.36)] px-2 py-1 text-[10px] font-extrabold text-[hsl(var(--accent-foreground))]">인식 실패 3회</span></div><p className="text-sm font-bold leading-6">“목적지를 정확히 듣지 못했습니다.”<br /><span className="font-normal text-[hsl(var(--muted-foreground))]">AI가 이용자의 말씀을 세 번 확인했지만 확신이 낮습니다.</span></p></div><div className="mt-5 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Phone size={15} /></div><span>이용자에게는 “잠시만 기다려 주세요”라고 안내 중</span></div><div className="mt-7 flex gap-3"><button type="button" data-testid="button-cancel-intervention" onClick={onClose} className="flex-1 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]">나중에 연결</button><button type="button" data-testid="button-connect-agent" onClick={onConnect} className="flex-[1.4] rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-extrabold text-[hsl(var(--primary-foreground))] shadow-[0_8px_16px_hsl(199_78%_34%/.18)] transition-transform hover:-translate-y-0.5"><span className="flex items-center justify-center gap-2"><Headphones size={17} /> 상담원 바로 연결</span></button></div></div></div>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
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

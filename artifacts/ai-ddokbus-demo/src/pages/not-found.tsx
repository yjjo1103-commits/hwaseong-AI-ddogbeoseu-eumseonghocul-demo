import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] px-5">
      <div className="w-full max-w-md rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-[0_20px_50px_hsl(204_42%_26%/.08)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><AlertCircle size={27} /></div>
        <p className="text-[11px] font-extrabold tracking-[.15em] text-[hsl(var(--primary))]">DDOKBUS ROUTE</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-.05em]">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">요청하신 화면이 없거나 이동되었습니다.</p>
        <button type="button" data-testid="button-go-home" onClick={() => setLocation('/')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-extrabold text-[hsl(var(--primary-foreground))]"><ArrowLeft size={16} /> 처음 화면으로</button>
      </div>
    </div>
  );
}

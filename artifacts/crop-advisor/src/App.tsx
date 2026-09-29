import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ArrowRight, BarChart3, BookOpen, Check, ChevronRight, CircleAlert, Clock3, Leaf, LogOut, Menu, Mountain, Plus, Search, ShieldCheck, Sprout, Sun, Trash2, UserRound, X } from 'lucide-react';
import {
  AdvisoryInput,
  AdvisoryInputFarmingObjective,
  AdvisoryInputIrrigationAvailability,
  AdvisoryInputLandUnit,
  AdvisoryInputSeason,
  RecommendedCrop,
  getGetAdvisoryQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetProfileQueryKey,
  getHealthCheckQueryKey,
  getListAdvisoriesQueryKey,
  useCreateAdvisory,
  useDeleteAdvisory,
  useGetAdvisory,
  useGetDashboardSummary,
  useGetProfile,
  useHealthCheck,
  useListAdvisories,
  useUpdateProfile,
} from '@workspace/api-client-react';
import type { AdvisorySummary } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const appearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: {
    colorPrimary: '#315341', colorForeground: '#27352b', colorMutedForeground: '#6b766b',
    colorBackground: '#fbfaf5', colorInput: '#f5f3ea', colorInputForeground: '#27352b',
    colorDanger: '#a9463c', colorNeutral: '#d9d6c8', fontFamily: 'Manrope, sans-serif', borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fbfaf5] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#27352b] font-bold', headerSubtitle: 'text-[#6b766b]',
    socialButtonsBlockButtonText: 'text-[#27352b]', formFieldLabel: 'text-[#27352b]', footerActionLink: 'text-[#315341] font-bold',
    footerActionText: 'text-[#6b766b]', dividerText: 'text-[#6b766b]', formButtonPrimary: 'bg-[#315341] hover:bg-[#3c654e]',
    formFieldInput: 'bg-[#f5f3ea] text-[#27352b] border-[#d9d6c8]', socialButtonsBlockButton: 'border-[#d9d6c8] bg-[#fbfaf5]',
    main: 'bg-transparent', alertText: 'text-[#a9463c]',
  },
} as any;

function BrandMark({ light = false }: { light?: boolean }) {
  return <Link href="/" className="cw-focus flex items-center gap-3" data-testid="link-brand">
    <span className={`grid h-10 w-10 place-items-center rounded-[13px] ${light ? 'bg-[#e4b85c] text-[#315341]' : 'bg-[#315341] text-[#f7f5ed]'}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20V7M12 12c-3.8 0-6-2.2-6-5.5C9.8 6.5 12 8.7 12 12Zm0 3c3.8 0 6-2.2 6-5.5-3.8 0-6 2.2-6 5.5Z" /><path d="M5 20h14" /></svg>
    </span>
    <span className={`cw-serif text-[1.15rem] font-bold tracking-[-.03em] ${light ? 'text-[#f7f5ed]' : 'text-[#315341]'}`}>CropWise</span>
  </Link>;
}

function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return <main className="min-h-[100dvh] overflow-hidden">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
      <BrandMark />
      <div className="flex items-center gap-3">
        <Link href="/sign-in" className="cw-focus rounded-full px-4 py-2 text-sm font-bold text-[#315341]" data-testid="link-sign-in">Sign in</Link>
        <Link href="/sign-up" className="cw-btn cw-btn-primary cw-focus rounded-full px-5 py-2.5 text-sm font-bold" data-testid="link-sign-up">Create account</Link>
      </div>
    </header>
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.06fr_.94fr] lg:px-10 lg:pb-28 lg:pt-20">
      <div className="cw-rise">
        <div className="cw-mono mb-6 flex items-center gap-2 text-[.68rem] font-bold text-[#b86f45]"><span className="h-px w-8 bg-[#b86f45]" />Practical guidance for the next growing season</div>
        <h1 className="cw-serif max-w-2xl text-5xl font-bold leading-[.98] tracking-[-.055em] text-[#315341] sm:text-7xl">Make each acre a little more <em className="text-[#b86f45]">knowable.</em></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-[#6b766b]">CropWise turns your farm conditions into clear crop recommendations you can understand, compare, and act on.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/sign-up" className="cw-btn cw-btn-primary cw-focus inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold" data-testid="button-start-advisory">Start with your farm <ArrowRight className="h-4 w-4" /></Link>
          <a href="#how-it-works" className="cw-focus rounded-full px-3 py-3.5 text-sm font-bold text-[#315341]" data-testid="link-how-it-works">See how it works</a>
        </div>
        <div className="mt-12 flex flex-wrap gap-7 text-sm text-[#6b766b]">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#b86f45]" />Explainable recommendations</span>
          <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-[#b86f45]" />Built for the field</span>
        </div>
      </div>
      <div className="cw-rise cw-rise-2 relative mx-auto w-full max-w-[560px]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e4b85c]/35 blur-3xl" />
        <div className="relative overflow-hidden rounded-[2.3rem] border border-[#d8d5c5] bg-[#dfe5d4] p-4 shadow-[0_30px_70px_-34px_rgba(49,83,65,.55)]">
          <div className="relative h-[420px] overflow-hidden rounded-[1.8rem] bg-[#839a73]">
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(155deg, transparent 35%, rgba(43,75,54,.5) 35.2%, transparent 35.6%), linear-gradient(165deg, transparent 53%, rgba(43,75,54,.35) 53.2%, transparent 53.6%), linear-gradient(175deg, transparent 72%, rgba(43,75,54,.4) 72.2%, transparent 72.6%)' }} />
            <div className="absolute right-8 top-8 grid h-20 w-20 place-items-center rounded-full bg-[#f3ce74] shadow-[0_0_0_14px_rgba(243,206,116,.15)]"><Sun className="h-8 w-8 text-[#b86f45]" /></div>
            <div className="absolute bottom-0 left-0 right-0 h-44 bg-[#536c4b]" style={{ clipPath: 'polygon(0 30%, 18% 16%, 38% 28%, 54% 7%, 71% 24%, 85% 12%, 100% 27%, 100% 100%, 0 100%)' }} />
            <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/40 bg-[#f7f5ed]/90 p-5 backdrop-blur">
              <div className="flex items-center justify-between"><span className="cw-mono text-[.6rem] font-bold text-[#6b766b]">Field note / 01</span><span className="rounded-full bg-[#dfe9d5] px-2 py-1 text-[.66rem] font-bold text-[#315341]">Good fit</span></div>
              <div className="mt-4 flex items-end justify-between"><div><p className="cw-serif text-3xl font-bold text-[#315341]">Sorghum</p><p className="mt-1 text-xs text-[#6b766b]">For warm, rain-fed soil</p></div><span className="cw-mono text-2xl font-medium text-[#b86f45]">86%</span></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#d9d6c8]"><div className="h-full w-[86%] rounded-full bg-[#b86f45]" /></div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-[#d8d5c5] bg-[#fbfaf5] px-4 py-3 shadow-lg sm:block"><p className="cw-mono text-[.58rem] text-[#6b766b]">Updated for your conditions</p><p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#315341]"><Check className="h-4 w-4 text-[#b86f45]" />Clear next steps</p></div>
      </div>
    </section>
    <section id="how-it-works" className="border-y border-[#d9d6c8] bg-[#e9eadc]/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
        <div><div className="cw-mono text-[.68rem] font-bold text-[#b86f45]">A quieter way to decide</div><h2 className="cw-serif mt-4 max-w-sm text-4xl font-bold leading-tight text-[#315341]">Less guessing. More growing.</h2></div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[['01','Tell us about your field','Soil, weather, water, and what you grew last.'],['02','See the reasoning','Every crop comes with conditions, trade-offs, and risks.'],['03','Take the next step','Save advisories and return when the season changes.']].map(([n,t,d]) => <div key={n} className="cw-rise"><span className="cw-mono text-xs text-[#b86f45]">{n}</span><h3 className="cw-serif mt-4 text-xl font-bold text-[#315341]">{t}</h3><p className="mt-2 text-sm leading-6 text-[#6b766b]">{d}</p></div>)}
        </div>
      </div>
    </section>
    <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm text-[#6b766b] sm:flex-row lg:px-10"><BrandMark /><span>Advice shaped around your field, not the other way around.</span></footer>
  </main>;
}

function SignInPage() { return <AuthFrame><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthFrame>; }
function SignUpPage() { return <AuthFrame><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthFrame>; }
function AuthFrame({ children }: { children: ReactNode }) { return <main className="grid min-h-[100dvh] place-items-center bg-[#e9eadc] px-4 py-8"><div className="absolute left-6 top-6"><BrandMark /></div><div className="w-full max-w-[440px] rounded-3xl border border-[#d9d6c8] bg-[#fbfaf5] p-2 shadow-2xl">{children}</div></main>; }

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/advisory/new', label: 'New advisory', icon: Plus },
  { href: '/history', label: 'History', icon: Clock3 },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const [location] = useLocation();
  const initials = (user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'C').toUpperCase();
  return <div className="min-h-[100dvh] lg:grid lg:grid-cols-[240px_1fr]">
    <aside className={`fixed inset-y-0 left-0 z-30 w-[240px] bg-[#315341] px-5 py-6 text-[#f7f5ed] transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><BrandMark light /><button onClick={() => setOpen(false)} className="cw-focus rounded-lg p-2 lg:hidden" data-testid="button-close-menu"><X className="h-5 w-5" /></button></div>
      <div className="mt-14"><p className="cw-mono mb-3 px-3 text-[.58rem] text-[#b7c5b0]">Your workspace</p>{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`cw-focus mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${location === href ? 'bg-[#e4b85c] text-[#315341]' : 'text-[#dce5d7] hover:bg-white/10'}`} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}><Icon className="h-[17px] w-[17px]" />{label}</Link>)}</div>
      <div className="absolute bottom-6 left-5 right-5 border-t border-white/15 pt-5"><button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="cw-focus flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#dce5d7] hover:bg-white/10" data-testid="button-sign-out"><LogOut className="h-[17px] w-[17px]" />Sign out</button></div>
    </aside>
    {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-[#315341]/30 lg:hidden" data-testid="button-menu-overlay" />}
    <div className="min-w-0">
      <header className="flex h-[76px] items-center justify-between border-b border-[#d9d6c8] bg-[#f7f5ed]/75 px-5 backdrop-blur lg:px-10"><button onClick={() => setOpen(true)} className="cw-focus rounded-lg p-2 lg:hidden" data-testid="button-open-menu"><Menu className="h-5 w-5 text-[#315341]" /></button><div className="hidden text-sm text-[#6b766b] lg:block">A clear view of what your field needs next.</div><div className="ml-auto flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-bold text-[#315341]" data-testid="text-user-name">{user?.firstName || 'Farmer'}</span><span className="block text-[.68rem] text-[#6b766b]">Field workspace</span></span><Link href="/profile" className="cw-focus grid h-9 w-9 place-items-center rounded-full bg-[#e4b85c] text-sm font-bold text-[#315341]" data-testid="link-profile-avatar">{initials}</Link></div></header>
      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  </div>;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingState label="Checking your field workspace" />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <AppShell>{children}</AppShell>;
}

function LoadingState({ label = 'Loading' }: { label?: string }) { return <div className="grid min-h-[50vh] place-items-center"><div className="w-full max-w-md space-y-3 px-5"><div className="cw-skeleton h-3 w-28 rounded-full bg-[#d9d6c8]" /><div className="cw-skeleton h-10 w-3/4 rounded-xl bg-[#e4e1d6]" /><p className="cw-mono mt-5 text-[.65rem] text-[#6b766b]">{label}</p></div></div>; }
function ErrorState({ message = 'We could not load this field view.' }: { message?: string }) { return <div className="cw-card rounded-2xl p-8 text-center"><CircleAlert className="mx-auto h-8 w-8 text-[#b86f45]" /><h2 className="cw-serif mt-4 text-2xl font-bold text-[#315341]">A small weather front</h2><p className="mx-auto mt-2 max-w-sm text-sm text-[#6b766b]">{message}</p><button onClick={() => window.location.reload()} className="cw-btn cw-btn-primary mt-6 rounded-full px-5 py-2.5 text-sm font-bold" data-testid="button-retry">Try again</button></div>; }

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="cw-mono text-[.66rem] font-bold text-[#b86f45]">{eyebrow}</div><h1 className="cw-serif mt-2 text-4xl font-bold tracking-[-.04em] text-[#315341] sm:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b766b]">{description}</p>}</div>{action}</div>; }

function Score({ value }: { value: number }) { return <div className="flex items-center gap-3"><div className="h-2 w-20 overflow-hidden rounded-full bg-[#e3dfd2]"><div className="h-full rounded-full bg-[#b86f45]" style={{ width: `${value}%` }} /></div><span className="cw-mono text-[.68rem] font-bold text-[#b86f45]">{value}%</span></div>; }
function AdvisoryCard({ advisory }: { advisory: AdvisorySummary }) { return <Link href={`/advisory/${advisory.id}`} className="cw-focus cw-card group block rounded-2xl p-5 transition-transform hover:-translate-y-0.5" data-testid={`card-advisory-${advisory.id}`}><div className="flex items-start justify-between gap-3"><div><p className="cw-mono text-[.6rem] text-[#6b766b]">{advisory.season} · {advisory.location}</p><h3 className="cw-serif mt-2 text-2xl font-bold text-[#315341]">{advisory.farmName}</h3></div><ChevronRight className="h-5 w-5 text-[#b86f45] transition-transform group-hover:translate-x-1" /></div><div className="mt-6 flex items-end justify-between"><div><p className="text-xs text-[#6b766b]">Best fit</p><p className="mt-1 font-bold text-[#315341]">{advisory.topCrop}</p></div><Score value={advisory.suitabilityScore} /></div><p className="cw-mono mt-5 text-[.58rem] text-[#929b8d]">{new Date(advisory.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p></Link>; }

function Dashboard() {
  const summary = useGetDashboardSummary();
  const health = useHealthCheck({ query: { staleTime: 60_000, queryKey: getHealthCheckQueryKey() } });
  if (summary.isLoading) return <LoadingState label="Gathering your field notes" />;
  if (summary.isError) return <ErrorState />;
  const data = summary.data;
  const firstName = data?.profile?.firstName || data?.profile?.displayName?.split(' ')[0] || 'there';
  return <div className="cw-rise"><PageHeading eyebrow="Overview" title={`Good morning, ${firstName}.`} description="Your recent recommendations, in one calm place." action={<Link href="/advisory/new" className="cw-btn cw-btn-primary cw-focus inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold" data-testid="button-new-advisory"><Plus className="h-4 w-4" />New advisory</Link>} />
    <div className="mb-8 flex items-center gap-2 text-xs text-[#6b766b]"><span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-[#b86f45]' : 'bg-[#769766]'}`} />{health.isError ? 'Field guidance service is waking up' : 'Guidance service is ready'}</div>
    <section className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
      <div className="relative overflow-hidden rounded-3xl bg-[#315341] p-7 text-[#f7f5ed] sm:p-9"><div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border-[26px] border-[#e4b85c]/20" /><div className="relative"><p className="cw-mono text-[.64rem] text-[#b7c5b0]">Your advisory practice</p><div className="mt-5 flex items-end gap-4"><span className="cw-serif text-7xl font-bold leading-none text-[#e4b85c]" data-testid="text-advisory-count">{data?.advisoryCount ?? 0}</span><span className="max-w-[100px] pb-1 text-sm leading-5 text-[#dce5d7]">field notes saved so far</span></div><p className="mt-8 max-w-sm text-sm leading-6 text-[#c7d3c2]">Every note adds context to your next decision. Keep a short record of what your land is telling you.</p></div></div>
      <div className="cw-card rounded-3xl p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="cw-mono text-[.64rem] text-[#6b766b]">Your default profile</p><h2 className="cw-serif mt-3 text-2xl font-bold text-[#315341]" data-testid="text-profile-display">{data?.profile?.displayName || 'Your profile'}</h2></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9eadc] text-[#315341]"><UserRound className="h-5 w-5" /></div></div><p className="mt-5 truncate text-sm text-[#6b766b]" data-testid="text-profile-email">{data?.profile?.email}</p><Link href="/profile" className="cw-focus mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#b86f45]" data-testid="link-edit-profile">Edit profile <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><div className="cw-mono text-[.64rem] text-[#b86f45]">Recent notes</div><h2 className="cw-serif mt-2 text-3xl font-bold text-[#315341]">What you have been considering</h2></div><Link href="/history" className="cw-focus hidden text-sm font-bold text-[#315341] sm:block" data-testid="link-view-history">View all</Link></div>{data?.recentAdvisories?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.recentAdvisories.map(a => <AdvisoryCard key={a.id} advisory={a} />)}</div> : <EmptyState />}</section>
  </div>;
}

function EmptyState() { return <div className="cw-card rounded-3xl border-dashed p-10 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9eadc] text-[#315341]"><Sprout className="h-6 w-6" /></div><h3 className="cw-serif mt-5 text-2xl font-bold text-[#315341]">Your first field note is waiting</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b766b]">Share a few conditions from your farm and we will help you think through what could grow next.</p><Link href="/advisory/new" className="cw-btn cw-btn-primary mt-6 inline-flex rounded-full px-5 py-3 text-sm font-bold" data-testid="button-empty-new">Create an advisory</Link></div>; }

const initialForm: AdvisoryInput = { farmName: '', stateRegion: '', district: '', soilType: '', soilPh: 6.5, averageTemperature: 25, averageRainfall: 700, humidity: 60, irrigationAvailability: 'reliable', season: 'kharif', landSize: 1, landUnit: 'acres', previousCrop: '', farmingObjective: 'general', preferredCrop: '', additionalNotes: '' };
function NewAdvisory() {
  const [, setLocation] = useLocation();
  const create = useCreateAdvisory();
  const qc = useQueryClient();
  const [form, setForm] = useState<AdvisoryInput>(initialForm);
  const [error, setError] = useState('');
  const update = (key: keyof AdvisoryInput, value: string | number) => setForm(current => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); setError(''); if (!form.farmName || !form.stateRegion || !form.district || !form.soilType || !form.previousCrop) { setError('Please fill in the farm, location, soil, and previous crop fields.'); return; } create.mutate({ data: form }, { onSuccess: advisory => { qc.invalidateQueries({ queryKey: getListAdvisoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation(`/advisory/${advisory.id}`); }, onError: () => setError('We could not generate this note. Check your connection and try again.') }); };
  const selectOptions = (key: keyof AdvisoryInput) => key === 'irrigationAvailability' ? Object.values(AdvisoryInputIrrigationAvailability) : key === 'season' ? Object.values(AdvisoryInputSeason) : key === 'landUnit' ? Object.values(AdvisoryInputLandUnit) : Object.values(AdvisoryInputFarmingObjective);
  return <div className="cw-rise"><PageHeading eyebrow="New advisory" title="Start with the field." description="A few grounded details help us make the recommendation useful, not generic." /><form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_330px]">
    <div className="space-y-5">
      <FormSection title="Place & soil" number="01"><div className="grid gap-4 sm:grid-cols-2"><Field label="Farm name" required value={form.farmName} onChange={v => update('farmName', v)} placeholder="e.g. North Ridge" testId="input-farm-name" /><Field label="State / region" required value={form.stateRegion} onChange={v => update('stateRegion', v)} placeholder="e.g. Maharashtra" testId="input-state-region" /><Field label="District" required value={form.district} onChange={v => update('district', v)} placeholder="e.g. Nashik" testId="input-district" /><Field label="Soil type" required value={form.soilType} onChange={v => update('soilType', v)} placeholder="e.g. Sandy loam" testId="input-soil-type" /><Field label="Soil pH" type="number" value={form.soilPh} onChange={v => update('soilPh', Number(v))} testId="input-soil-ph" /></div></FormSection>
      <FormSection title="Weather & water" number="02"><div className="grid gap-4 sm:grid-cols-3"><Field label="Avg. temperature (°C)" type="number" value={form.averageTemperature} onChange={v => update('averageTemperature', Number(v))} testId="input-temperature" /><Field label="Annual rainfall (mm)" type="number" value={form.averageRainfall} onChange={v => update('averageRainfall', Number(v))} testId="input-rainfall" /><Field label="Humidity (%)" type="number" value={form.humidity} onChange={v => update('humidity', Number(v))} testId="input-humidity" /></div><SelectField label="Irrigation availability" value={form.irrigationAvailability} options={selectOptions('irrigationAvailability')} onChange={v => update('irrigationAvailability', v)} testId="select-irrigation" /></FormSection>
      <FormSection title="Growing plan" number="03"><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Season" value={form.season} options={selectOptions('season')} onChange={v => update('season', v)} testId="select-season" /><Field label="Land size" type="number" value={form.landSize} onChange={v => update('landSize', Number(v))} testId="input-land-size" /><SelectField label="Land unit" value={form.landUnit} options={selectOptions('landUnit')} onChange={v => update('landUnit', v)} testId="select-land-unit" /><Field label="Previous crop" required value={form.previousCrop} onChange={v => update('previousCrop', v)} placeholder="e.g. Cotton" testId="input-previous-crop" /><SelectField label="Farming objective" value={form.farmingObjective} options={selectOptions('farmingObjective')} onChange={v => update('farmingObjective', v)} testId="select-objective" /><Field label="Preferred crop (optional)" value={form.preferredCrop || ''} onChange={v => update('preferredCrop', v)} placeholder="Leave open to suggestions" testId="input-preferred-crop" /></div><label className="cw-label mt-4">Additional notes<textarea className="cw-input min-h-[110px] resize-y" value={form.additionalNotes || ''} onChange={e => update('additionalNotes', e.target.value)} placeholder="Anything distinctive about this field or the coming season?" data-testid="input-additional-notes" /></label></FormSection>
    </div>
    <aside className="h-fit space-y-4 xl:sticky xl:top-6"><div className="cw-card rounded-2xl p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9eadc] text-[#315341]"><ShieldCheck className="h-5 w-5" /></div><div><h3 className="font-bold text-[#315341]">A grounded answer</h3><p className="text-xs text-[#6b766b]">Based on your conditions</p></div></div><p className="mt-5 text-sm leading-6 text-[#6b766b]">Your details stay attached to this advisory, so you can see exactly why a crop was recommended.</p><div className="mt-5 space-y-3 border-t border-[#e5e1d6] pt-5 text-xs text-[#6b766b]"><p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#b86f45]" />No one-size-fits-all lists</p><p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#b86f45]" />Risks and precautions included</p></div></div>{error && <div className="rounded-2xl border border-[#dca69c] bg-[#f7e7e2] p-4 text-sm leading-5 text-[#8f3f36]" data-testid="status-advisory-error">{error}</div>}<button disabled={create.isPending} className="cw-btn cw-btn-primary cw-focus flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold disabled:cursor-wait disabled:opacity-60" data-testid="button-generate-advisory">{create.isPending ? 'Reading your conditions…' : 'Generate advisory'}<ArrowRight className="h-4 w-4" /></button><Link href="/dashboard" className="cw-focus block text-center text-sm font-bold text-[#6b766b]" data-testid="link-cancel-advisory">Cancel</Link></aside>
  </form></div>;
}

function FormSection({ title, number, children }: { title: string; number: string; children: ReactNode }) { return <section className="cw-card rounded-2xl p-5 sm:p-7"><div className="mb-6 flex items-start gap-4"><span className="cw-mono grid h-8 w-8 place-items-center rounded-lg bg-[#e9eadc] text-[.62rem] font-bold text-[#b86f45]">{number}</span><div><h2 className="cw-serif text-2xl font-bold text-[#315341]">{title}</h2><p className="mt-1 text-xs text-[#6b766b]">Tell us what you know. Estimates are okay.</p></div></div>{children}</section>; }
function Field({ label, value, onChange, type = 'text', placeholder, required, testId }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; testId: string }) { return <label className="cw-label">{label}{required && <span className="ml-1 text-[#b86f45]">*</span>}<input required={required} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="cw-input mt-1.5" data-testid={testId} /></label>; }
function SelectField({ label, value, options, onChange, testId }: { label: string; value: string; options: string[]; onChange: (v: string) => void; testId: string }) { return <label className="cw-label mt-4">{label}<select value={value} onChange={e => onChange(e.target.value)} className="cw-input mt-1.5" data-testid={testId}>{options.map(option => <option key={option} value={option}>{option.replace('-', ' ')}</option>)}</select></label>; }

function AdvisoryDetail() {
  const { id } = useParams<{ id: string }>();
  const advisory = useGetAdvisory(Number(id));
  if (advisory.isLoading) return <LoadingState label="Opening your field note" />;
  if (advisory.isError || !advisory.data) return <ErrorState message="That advisory could not be found." />;
  const item = advisory.data;
  return <div className="cw-rise"><Link href="/history" className="cw-focus mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#6b766b]" data-testid="link-back-history">← Back to history</Link><div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="cw-mono text-[.66rem] font-bold text-[#b86f45]">{item.season} · {item.location}</div><h1 className="cw-serif mt-3 text-5xl font-bold tracking-[-.05em] text-[#315341]">{item.farmName}</h1><p className="mt-3 text-sm text-[#6b766b]">Created {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p></div><div className="cw-card rounded-2xl p-5"><p className="cw-mono text-[.6rem] text-[#6b766b]">Best fit</p><div className="mt-2 flex items-center gap-4"><span className="cw-serif text-2xl font-bold text-[#315341]">{item.topCrop}</span><Score value={item.suitabilityScore} /></div></div></div><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="space-y-5"><section className="rounded-3xl bg-[#315341] p-7 text-[#f7f5ed] sm:p-9"><p className="cw-mono text-[.62rem] text-[#b7c5b0]">The read on your field</p><p className="cw-serif mt-5 max-w-3xl text-2xl leading-9">{item.result.summary}</p></section><section className="cw-card rounded-2xl p-6 sm:p-8"><div className="mb-6 flex items-center justify-between"><div><div className="cw-mono text-[.62rem] text-[#b86f45]">Recommended crops</div><h2 className="cw-serif mt-2 text-3xl font-bold text-[#315341]">What could work here</h2></div><Sprout className="h-7 w-7 text-[#b86f45]" /></div><div className="space-y-4">{item.result.recommendedCrops.map((crop, index) => <CropRecommendation key={crop.name} crop={crop} index={index} />)}</div></section></div><div className="space-y-5"><ConditionsCard conditions={item.farmConditions} /><ListCard title="General precautions" icon={<ShieldCheck className="h-5 w-5" />} items={item.result.generalPrecautions} /><ListCard title="Suggested next steps" icon={<ArrowRight className="h-5 w-5" />} items={item.result.suggestedNextSteps} />{item.result.expertConsultationRecommended && <div className="rounded-2xl border border-[#dfbd82] bg-[#fbf1d8] p-5 text-sm leading-6 text-[#6a5527]" data-testid="status-expert-recommended"><strong className="block text-[#6a5527]">Consider local expertise</strong>This note suggests speaking with an agricultural expert for advice specific to your farm.</div>}<div className="rounded-2xl border border-[#d9d6c8] bg-[#f1f0e7] p-5 text-xs leading-5 text-[#6b766b]" data-testid="text-safety-note"><strong className="mb-1 block text-[#315341]">Safety note</strong>{item.result.safetyNote}</div></div></div></div>;
}
function CropRecommendation({ crop, index }: { crop: RecommendedCrop; index: number }) { const [open, setOpen] = useState(index === 0); return <div className="overflow-hidden rounded-2xl border border-[#e3dfd2]"><button onClick={() => setOpen(!open)} className="cw-focus flex w-full items-center justify-between gap-4 p-5 text-left" data-testid={`button-crop-${crop.name}`}><div className="flex items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9eadc] text-sm font-bold text-[#315341]">0{index + 1}</span><div><h3 className="cw-serif text-xl font-bold text-[#315341]">{crop.name}</h3><p className="mt-1 text-xs text-[#6b766b]">{crop.whyItFits}</p></div></div><Score value={crop.suitabilityScore} /></button>{open && <div className="grid gap-5 border-t border-[#e3dfd2] bg-[#faf9f3] p-5 text-sm sm:grid-cols-2"><Info title="Growing conditions" value={crop.growingConditions.join(' · ')} /><Info title="Soil considerations" value={crop.soilConsiderations} /><Info title="Water requirements" value={crop.waterRequirements} /><Info title="Nutrients" value={crop.nutrientConsiderations} /><Info title="Potential risks" value={crop.potentialRisks.join(' · ')} /><Info title="Preventive measures" value={crop.preventiveMeasures.join(' · ')} /></div>}</div>; }
function Info({ title, value }: { title: string; value: string }) { return <div><p className="cw-mono text-[.58rem] text-[#b86f45]">{title}</p><p className="mt-1.5 leading-6 text-[#6b766b]">{value}</p></div>; }
function ConditionsCard({ conditions }: { conditions: AdvisoryInput }) { return <section className="cw-card rounded-2xl p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9eadc] text-[#315341]"><Mountain className="h-5 w-5" /></div><h2 className="cw-serif text-2xl font-bold text-[#315341]">Field conditions</h2></div><div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">{[['Soil', conditions.soilType],['pH', conditions.soilPh],['Temperature', `${conditions.averageTemperature}°C`],['Rainfall', `${conditions.averageRainfall} mm`],['Humidity', `${conditions.humidity}%`],['Water', conditions.irrigationAvailability],['Land', `${conditions.landSize} ${conditions.landUnit}`],['Previous crop', conditions.previousCrop]].map(([label, value]) => <div key={label}><p className="text-xs text-[#929b8d]">{label}</p><p className="mt-1 font-bold capitalize text-[#315341]">{value}</p></div>)}</div></section>; }
function ListCard({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) { return <section className="cw-card rounded-2xl p-6"><div className="flex items-center gap-3 text-[#b86f45]">{icon}<h2 className="cw-serif text-2xl font-bold text-[#315341]">{title}</h2></div><ul className="mt-5 space-y-3 text-sm leading-6 text-[#6b766b]">{items.map((item, i) => <li key={i} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b86f45]" />{item}</li>)}</ul></section>; }

function History() {
  const list = useListAdvisories();
  const del = useDeleteAdvisory();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  if (list.isLoading) return <LoadingState label="Gathering your field history" />;
  if (list.isError) return <ErrorState />;
  const items = useMemo(() => (list.data || []).filter(a => `${a.farmName} ${a.location} ${a.topCrop}`.toLowerCase().includes(query.toLowerCase())), [list.data, query]);
  const remove = (id: number) => { if (!window.confirm('Delete this advisory? This cannot be undone.')) return; del.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAdvisoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } }); };
  return <div className="cw-rise"><PageHeading eyebrow="History" title="Your field notes." description="A running record of the conditions and crops you have considered." action={<Link href="/advisory/new" className="cw-btn cw-btn-primary cw-focus inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold" data-testid="button-history-new"><Plus className="h-4 w-4" />New advisory</Link>} /><div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-[#929b8d]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search farms, places, crops" className="cw-input pl-10" data-testid="input-history-search" /></div>{items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <div key={item.id} className="relative"><AdvisoryCard advisory={item} /><button onClick={() => remove(item.id)} disabled={del.isPending} className="cw-focus absolute bottom-5 right-5 rounded-lg p-2 text-[#929b8d] hover:bg-[#f7e7e2] hover:text-[#a9463c]" data-testid={`button-delete-advisory-${item.id}`} aria-label={`Delete ${item.farmName}`}><Trash2 className="h-4 w-4" /></button></div>)}</div> : <div className="cw-card rounded-3xl border-dashed p-12 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#b86f45]" /><h2 className="cw-serif mt-4 text-2xl font-bold text-[#315341]">{query ? 'No matching notes' : 'No field notes yet'}</h2><p className="mt-2 text-sm text-[#6b766b]">{query ? 'Try another farm, place, or crop.' : 'Your saved advisories will gather here.'}</p></div>}</div>;
}

function ProfilePage() {
  const profile = useGetProfile();
  const update = useUpdateProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  useEffect(() => {
    if (profile.data) setForm({ firstName: profile.data.firstName || '', lastName: profile.data.lastName || '' });
  }, [profile.data]);
  if (profile.isLoading) return <LoadingState label="Opening your profile" />;
  if (profile.isError || !profile.data) return <ErrorState />;
  const save = (event: FormEvent) => { event.preventDefault(); update.mutate({ data: form }, { onSuccess: value => { qc.setQueryData(getGetProfileQueryKey(), value); qc.invalidateQueries({ queryKey: getGetProfileQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } }); };
  return <div className="cw-rise max-w-3xl"><PageHeading eyebrow="Profile" title="Your field identity." description="Keep your name current so your workspace feels like yours." /><section className="cw-card rounded-2xl p-6 sm:p-8"><div className="mb-8 flex items-center gap-4 border-b border-[#e5e1d6] pb-7"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e4b85c] text-xl font-bold text-[#315341]">{(profile.data.displayName?.[0] || 'C')}</div><div><h2 className="cw-serif text-2xl font-bold text-[#315341]" data-testid="text-profile-name">{profile.data.displayName}</h2><p className="mt-1 text-sm text-[#6b766b]" data-testid="text-profile-email-detail">{profile.data.email}</p></div></div><form onSubmit={save} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} testId="input-profile-first-name" /><Field label="Last name" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} testId="input-profile-last-name" /></div><div className="flex items-center justify-between gap-4 pt-3"><p className="text-xs text-[#929b8d]">Email changes are managed through your sign-in provider.</p><button disabled={update.isPending} className="cw-btn cw-btn-primary cw-focus inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60" data-testid="button-save-profile">{update.isPending ? 'Saving…' : 'Save changes'}<Check className="h-4 w-4" /></button></div>{update.isSuccess && <p className="text-sm font-semibold text-[#527346]" data-testid="status-profile-saved">Profile saved.</p>}{update.isError && <p className="text-sm text-[#a9463c]" data-testid="status-profile-error">Could not save your profile.</p>}</form></section></div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Landing} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/advisory/new"><Protected><NewAdvisory /></Protected></Route><Route path="/advisory/:id"><Protected><AdvisoryDetail /></Protected></Route><Route path="/history"><Protected><History /></Protected></Route><Route path="/profile"><Protected><ProfilePage /></Protected></Route><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function ClerkRoutes() { const [, setLocation] = useLocation(); return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} routerPush={to => setLocation(to.replace(basePath, '') || '/')} routerReplace={to => setLocation(to.replace(basePath, '') || '/', { replace: true })}><Router /></ClerkProvider>; }
function App() { return <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><ClerkRoutes /></WouterRouter></QueryClientProvider>; }

export default App;
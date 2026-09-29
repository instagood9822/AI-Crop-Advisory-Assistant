import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#e9eadc] px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#315341] text-[#e4b85c]"><Compass className="h-8 w-8" /></div>
        <p className="cw-mono mt-8 text-[.68rem] font-bold text-[#b86f45]">Unmapped field</p>
        <h1 className="cw-serif mt-3 text-5xl font-bold tracking-[-.05em] text-[#315341]" data-testid="text-not-found-title">This path has gone fallow.</h1>
        <p className="mt-4 text-sm leading-6 text-[#6b766b]">The page you are looking for is not part of this field. Let us take you back to familiar ground.</p>
        <Link href="/" className="cw-btn cw-btn-primary cw-focus mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold" data-testid="link-not-found-home"><ArrowLeft className="h-4 w-4" />Back to CropWise</Link>
      </div>
    </div>
  );
}

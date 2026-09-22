import { checkoutAction } from './actions';

export default function SubscribePage() {
  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY;
  const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#0a0a0a] to-black p-4 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-4xl py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Subscribe to track your performance, join the monthly draws, and automatically give back to your favorite charities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-2">Monthly</h2>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold text-emerald-400">$19</span>
              <span className="text-white/60">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-white/80">
                <span className="text-emerald-400 mr-3 text-xl">✓</span> Access to all tracking features
              </li>
              <li className="flex items-center text-white/80">
                <span className="text-emerald-400 mr-3 text-xl">✓</span> Automated charity contributions
              </li>
              <li className="flex items-center text-white/80">
                <span className="text-emerald-400 mr-3 text-xl">✓</span> Eligible for monthly draws
              </li>
            </ul>
            <form action={checkoutAction}>
              <input type="hidden" name="priceId" value={monthlyPriceId} />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98]">
                Subscribe Monthly
              </button>
            </form>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white/10 backdrop-blur-xl border border-emerald-500/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
              SAVE $38
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Yearly</h2>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold text-emerald-400">$190</span>
              <span className="text-white/60">/year</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-white/80">
                <span className="text-emerald-400 mr-3 text-xl">✓</span> All Monthly features
              </li>
              <li className="flex items-center text-white/80">
                <span className="text-emerald-400 mr-3 text-xl">✓</span> Two months completely free
              </li>
              <li className="flex items-center text-white/80">
                <span className="text-emerald-400 mr-3 text-xl">✓</span> VIP entry status in draws
              </li>
            </ul>
            <form action={checkoutAction}>
              <input type="hidden" name="priceId" value={yearlyPriceId} />
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-[0.98]">
                Subscribe Yearly
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

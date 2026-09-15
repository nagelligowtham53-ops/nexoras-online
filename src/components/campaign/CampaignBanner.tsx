import { Link } from "@tanstack/react-router";
import { Gift, Timer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCampaign } from "./CampaignProvider";

export function CampaignBanner() {
  const { active, campaign } = useCampaign();
  if (!active || !campaign?.referralEnabled) return null;
  return (
    <section className="campaign-banner" aria-labelledby="campaign-title">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          <span className="campaign-badge">🪔 Ganesh Utsav 2026</span>
          <h2 id="campaign-title" className="mt-3 font-display text-2xl font-bold sm:text-3xl">{campaign.bannerTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">{campaign.bannerMessage}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2"><Gift className="h-4 w-4 text-campaign-gold" /> 8 AI Credits for every successful referral</span>
            <span className="inline-flex items-center gap-2"><Gift className="h-4 w-4 text-campaign-gold" /> 5 AI Credits for every new user who joins through a referral</span>
          </div>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"><Timer className="h-3.5 w-3.5" /> {campaign.bannerDeadline}</p>
        </div>
        <Link to="/refer"><Button size="lg" className="campaign-cta">Refer & Earn <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </section>
  );
}

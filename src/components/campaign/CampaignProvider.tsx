import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getActiveCampaign } from "@/lib/campaign.functions";
import { isDistractionFreePath, type PublicCampaign } from "@/lib/campaign";

const CampaignContext = createContext<{ campaign: PublicCampaign | null; active: boolean; quiet: boolean }>({ campaign: null, active: false, quiet: false });

export function CampaignProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const getCampaign = useServerFn(getActiveCampaign);
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);

  useEffect(() => {
    let mounted = true;
    getCampaign().then((value) => { if (mounted) setCampaign(value); }).catch(() => { if (mounted) setCampaign(null); });
    return () => { mounted = false; };
  }, [getCampaign]);

  const value = useMemo(() => ({
    campaign,
    active: campaign?.status === "active",
    quiet: isDistractionFreePath(location.pathname),
  }), [campaign, location.pathname]);

  useEffect(() => {
    const festive = value.active && value.campaign?.themeEnabled;
    document.documentElement.classList.toggle("campaign-ganesh", Boolean(festive));
    document.documentElement.classList.toggle("campaign-quiet", Boolean(festive && value.quiet));
    return () => {
      document.documentElement.classList.remove("campaign-ganesh", "campaign-quiet");
    };
  }, [value.active, value.campaign?.themeEnabled, value.quiet]);

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() { return useContext(CampaignContext); }

import { useCampaign } from "./CampaignProvider";

export function CampaignDecor() {
  const { active, campaign, quiet } = useCampaign();
  if (!active || !campaign?.themeEnabled) return null;
  if (quiet) return <div className="campaign-quiet-badge" role="status">🪔 Ganesh Utsav 2026</div>;
  return (
    <div className="campaign-decor" aria-hidden="true">
      <span className="campaign-diya campaign-diya-left">🪔</span>
      <span className="campaign-diya campaign-diya-right">🪔</span>
      <span className="campaign-flower campaign-flower-one">✺</span>
      <span className="campaign-flower campaign-flower-two">✺</span>
      <span className="campaign-particle campaign-particle-one" />
      <span className="campaign-particle campaign-particle-two" />
      <span className="campaign-particle campaign-particle-three" />
    </div>
  );
}

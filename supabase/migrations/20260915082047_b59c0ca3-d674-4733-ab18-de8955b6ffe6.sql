CREATE OR REPLACE FUNCTION public.active_campaign()
RETURNS TABLE(id uuid, slug text, name text, timezone text, starts_at timestamptz, ends_at timestamptz, status text, referral_enabled boolean, theme_enabled boolean, referrer_reward integer, referred_reward integer, banner_title text, banner_message text, banner_deadline text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.id, c.slug, c.name, c.timezone, c.starts_at, c.ends_at,
         public.campaign_runtime_status(c.starts_at, c.ends_at, c.enabled),
         c.referral_enabled, c.theme_enabled, c.referrer_reward, c.referred_reward,
         c.banner_title, c.banner_message, c.banner_deadline
  FROM public.campaigns c
  WHERE c.enabled AND now() >= c.starts_at AND now() < c.ends_at
  ORDER BY c.starts_at DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.finalize_referral_for_user(p_user_id uuid)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.referrals%ROWTYPE; c public.campaigns%ROWTYPE; verified boolean; daily_count integer; lifetime_count integer;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User required'; END IF;
  SELECT * INTO r FROM public.referrals WHERE referred_user_id = p_user_id FOR UPDATE;
  IF r.id IS NULL THEN RETURN 'none'; END IF;
  IF r.status = 'successful' THEN RETURN 'successful'; END IF;
  IF r.status IN ('rejected','reversed') THEN RETURN r.status; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = r.campaign_id;
  SELECT (email_confirmed_at IS NOT NULL) INTO verified FROM auth.users WHERE id = p_user_id;
  IF coalesce((c.eligibility_rules->>'require_email_verification')::boolean, true) AND NOT coalesce(verified, false) THEN RETURN 'pending'; END IF;
  IF r.referrer_user_id = p_user_id THEN
    UPDATE public.referrals SET status='rejected', eligibility_status='ineligible', rejection_reason='self_referral' WHERE id=r.id;
    INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(c.id,p_user_id,'referral_rejected',r.id);
    RETURN 'rejected';
  END IF;
  IF NOT c.enabled OR NOT c.referral_enabled OR r.created_at < c.starts_at OR r.created_at >= c.ends_at THEN
    UPDATE public.referrals SET status='rejected', eligibility_status='ineligible', rejection_reason='campaign_inactive_at_signup' WHERE id=r.id;
    INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(c.id,p_user_id,'referral_rejected',r.id);
    RETURN 'rejected';
  END IF;
  SELECT count(*) INTO lifetime_count FROM public.referrals WHERE referrer_user_id=r.referrer_user_id AND campaign_id=r.campaign_id AND status='successful';
  SELECT count(*) INTO daily_count FROM public.referrals WHERE referrer_user_id=r.referrer_user_id AND campaign_id=r.campaign_id AND status='successful' AND successful_at >= date_trunc('day', now() AT TIME ZONE c.timezone) AT TIME ZONE c.timezone;
  IF lifetime_count >= coalesce((c.eligibility_rules->>'max_successful_per_referrer')::integer,100) OR daily_count >= coalesce((c.eligibility_rules->>'max_successful_per_referrer_per_day')::integer,20) THEN
    UPDATE public.referrals SET status='rejected', eligibility_status='ineligible', rejection_reason='reward_limit_reached' WHERE id=r.id;
    INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(c.id,p_user_id,'referral_rejected',r.id);
    RETURN 'rejected';
  END IF;
  INSERT INTO public.credit_balances(user_id) VALUES(r.referrer_user_id),(r.referred_user_id) ON CONFLICT(user_id) DO NOTHING;
  PERFORM 1 FROM public.credit_balances WHERE user_id IN(r.referrer_user_id,r.referred_user_id) ORDER BY user_id FOR UPDATE;
  INSERT INTO public.credit_transactions(user_id,amount,transaction_type,referral_id,description,idempotency_key) VALUES
    (r.referrer_user_id,c.referrer_reward,'referral_reward',r.id,c.name || ' successful referral reward','referrer:' || r.id::text),
    (r.referred_user_id,c.referred_reward,'referral_bonus',r.id,c.name || ' new user referral bonus','referred:' || r.id::text);
  UPDATE public.credit_balances SET balance=balance+c.referrer_reward,lifetime_earned=lifetime_earned+c.referrer_reward,updated_at=now() WHERE user_id=r.referrer_user_id;
  UPDATE public.credit_balances SET balance=balance+c.referred_reward,lifetime_earned=lifetime_earned+c.referred_reward,updated_at=now() WHERE user_id=r.referred_user_id;
  UPDATE public.referrals SET status='successful',eligibility_status='rewarded',successful_at=now(),rejection_reason=NULL WHERE id=r.id;
  INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id,metadata) VALUES
    (c.id,p_user_id,'referral_verified',r.id,'{}'::jsonb),
    (c.id,r.referrer_user_id,'referral_successful',r.id,'{}'::jsonb),
    (c.id,r.referrer_user_id,'credits_awarded',r.id,jsonb_build_object('amount',c.referrer_reward,'type','referral_reward')),
    (c.id,r.referred_user_id,'credits_awarded',r.id,jsonb_build_object('amount',c.referred_reward,'type','referral_bonus'));
  RETURN 'successful';
EXCEPTION WHEN unique_violation THEN
  IF EXISTS(SELECT 1 FROM public.referrals WHERE id=r.id AND status='successful') THEN RETURN 'successful'; END IF;
  RAISE;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_referral_for_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_referral_for_user(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_my_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_referral_code(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_referral_share() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_my_referral() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_referral_dashboard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_campaign_dashboard(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_update_campaign(uuid,boolean,boolean,boolean,timestamptz,timestamptz,integer,integer,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_my_referral_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_referral_share() TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_my_referral() TO service_role;
GRANT EXECUTE ON FUNCTION public.my_referral_dashboard() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_campaign_dashboard(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_campaign(uuid,boolean,boolean,boolean,timestamptz,timestamptz,integer,integer,text,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

DROP FUNCTION public.finalize_my_referral();
DROP FUNCTION public.ensure_my_referral_code();
DROP FUNCTION public.record_referral_share();
DROP FUNCTION public.my_referral_dashboard();
DROP FUNCTION public.admin_campaign_dashboard(uuid);
DROP FUNCTION public.admin_update_campaign(uuid,boolean,boolean,boolean,timestamptz,timestamptz,integer,integer,text,text,text,jsonb);
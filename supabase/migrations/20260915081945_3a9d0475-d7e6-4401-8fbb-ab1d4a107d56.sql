CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  referral_enabled boolean NOT NULL DEFAULT false,
  theme_enabled boolean NOT NULL DEFAULT false,
  referrer_reward integer NOT NULL DEFAULT 0 CHECK (referrer_reward >= 0),
  referred_reward integer NOT NULL DEFAULT 0 CHECK (referred_reward >= 0),
  banner_title text NOT NULL DEFAULT '',
  banner_message text NOT NULL DEFAULT '',
  banner_deadline text NOT NULL DEFAULT '',
  eligibility_rules jsonb NOT NULL DEFAULT '{"require_email_verification":true,"max_successful_per_referrer":100,"max_successful_per_referrer_per_day":20}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_valid_window CHECK (ends_at > starts_at)
);
GRANT SELECT ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read enabled campaigns" ON public.campaigns FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Admins read all campaigns" ON public.campaigns FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER campaigns_touch_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX referral_codes_code_ci_key ON public.referral_codes (upper(code));
CREATE POLICY "Users read own referral code" ON public.referral_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  referrer_user_id uuid NOT NULL REFERENCES public.profiles(id),
  referred_user_id uuid NOT NULL REFERENCES public.profiles(id),
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','successful','rejected','reversed')),
  eligibility_status text NOT NULL DEFAULT 'awaiting_verification' CHECK (eligibility_status IN ('awaiting_verification','eligible','ineligible','rewarded')),
  rejection_reason text,
  successful_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id),
  CONSTRAINT referrals_no_self_referral CHECK (referrer_user_id <> referred_user_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read related referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
CREATE INDEX referrals_referrer_created_idx ON public.referrals (referrer_user_id, created_at DESC);
CREATE INDEX referrals_campaign_status_idx ON public.referrals (campaign_id, status, created_at DESC);
CREATE TRIGGER referrals_touch_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.credit_balances (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned integer NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_spent integer NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credit balance" ON public.credit_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount integer NOT NULL CHECK (amount <> 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('referral_reward','referral_bonus','ai_usage','admin_adjustment','reversal')),
  referral_id uuid REFERENCES public.referrals(id),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','reversed')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credit transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX credit_transactions_user_created_idx ON public.credit_transactions (user_id, created_at DESC);
CREATE INDEX credit_transactions_referral_idx ON public.credit_transactions (referral_id) WHERE referral_id IS NOT NULL;

CREATE TABLE public.campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('code_generated','referral_shared','referral_signup','referral_verified','referral_successful','referral_rejected','credits_awarded','campaign_participation')),
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_events TO authenticated;
GRANT ALL ON public.campaign_events TO service_role;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read campaign events" ON public.campaign_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX campaign_events_daily_idx ON public.campaign_events (campaign_id, occurred_on, event_type);

CREATE OR REPLACE FUNCTION public.campaign_runtime_status(p_starts_at timestamptz, p_ends_at timestamptz, p_enabled boolean)
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE WHEN NOT p_enabled THEN 'disabled' WHEN now() < p_starts_at THEN 'scheduled' WHEN now() >= p_ends_at THEN 'ended' ELSE 'active' END;
$$;
REVOKE ALL ON FUNCTION public.campaign_runtime_status(timestamptz, timestamptz, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.campaign_runtime_status(timestamptz, timestamptz, boolean) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.active_campaign()
RETURNS TABLE(id uuid, slug text, name text, timezone text, starts_at timestamptz, ends_at timestamptz, status text, referral_enabled boolean, theme_enabled boolean, referrer_reward integer, referred_reward integer, banner_title text, banner_message text, banner_deadline text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.slug, c.name, c.timezone, c.starts_at, c.ends_at,
         public.campaign_runtime_status(c.starts_at, c.ends_at, c.enabled),
         c.referral_enabled, c.theme_enabled, c.referrer_reward, c.referred_reward,
         c.banner_title, c.banner_message, c.banner_deadline
  FROM public.campaigns c
  WHERE c.enabled AND now() >= c.starts_at AND now() < c.ends_at
  ORDER BY c.starts_at DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.active_campaign() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_campaign() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE generated text;
BEGIN
  LOOP
    generated := 'NEX-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE upper(code) = generated);
  END LOOP;
  RETURN generated;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;

CREATE OR REPLACE FUNCTION public.ensure_my_referral_code()
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); existing_code text; generated text; active_campaign_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT code INTO existing_code FROM public.referral_codes WHERE user_id = uid;
  IF existing_code IS NOT NULL THEN RETURN existing_code; END IF;
  LOOP
    generated := 'NEX-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 6));
    BEGIN
      INSERT INTO public.referral_codes(user_id, code) VALUES (uid, generated) RETURNING code INTO existing_code;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      SELECT code INTO existing_code FROM public.referral_codes WHERE user_id = uid;
      IF existing_code IS NOT NULL THEN EXIT; END IF;
    END;
  END LOOP;
  SELECT id INTO active_campaign_id FROM public.campaigns WHERE enabled AND now() >= starts_at AND now() < ends_at ORDER BY starts_at DESC LIMIT 1;
  IF active_campaign_id IS NOT NULL THEN
    INSERT INTO public.campaign_events(campaign_id, user_id, event_type) VALUES (active_campaign_id, uid, 'code_generated');
  END IF;
  RETURN existing_code;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_my_referral_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_referral_code() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS TABLE(valid boolean, campaign_name text, referrer_reward integer, referred_reward integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE enabled AND referral_enabled AND now() >= starts_at AND now() < ends_at ORDER BY starts_at DESC LIMIT 1;
  IF c.id IS NULL OR p_code IS NULL OR length(btrim(p_code)) > 32 THEN
    RETURN QUERY SELECT false, NULL::text, 0, 0; RETURN;
  END IF;
  RETURN QUERY SELECT EXISTS(SELECT 1 FROM public.referral_codes rc WHERE upper(rc.code) = upper(btrim(p_code)) AND rc.status = 'active'), c.name, c.referrer_reward, c.referred_reward;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_referral_share()
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); campaign_id_value uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT id INTO campaign_id_value FROM public.campaigns WHERE enabled AND referral_enabled AND now() >= starts_at AND now() < ends_at ORDER BY starts_at DESC LIMIT 1;
  IF campaign_id_value IS NOT NULL THEN
    INSERT INTO public.campaign_events(campaign_id, user_id, event_type) VALUES (campaign_id_value, uid, 'referral_shared');
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.record_referral_share() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_referral_share() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.finalize_my_referral()
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); r public.referrals%ROWTYPE; c public.campaigns%ROWTYPE; verified boolean; daily_count integer; lifetime_count integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO r FROM public.referrals WHERE referred_user_id = uid FOR UPDATE;
  IF r.id IS NULL THEN RETURN 'none'; END IF;
  IF r.status = 'successful' THEN RETURN 'successful'; END IF;
  IF r.status IN ('rejected','reversed') THEN RETURN r.status; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = r.campaign_id;
  SELECT (email_confirmed_at IS NOT NULL) INTO verified FROM auth.users WHERE id = uid;
  IF coalesce((c.eligibility_rules->>'require_email_verification')::boolean, true) AND NOT coalesce(verified, false) THEN RETURN 'pending'; END IF;
  IF r.referrer_user_id = uid THEN
    UPDATE public.referrals SET status='rejected', eligibility_status='ineligible', rejection_reason='self_referral' WHERE id=r.id;
    INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(c.id,uid,'referral_rejected',r.id);
    RETURN 'rejected';
  END IF;
  IF NOT c.enabled OR NOT c.referral_enabled OR r.created_at < c.starts_at OR r.created_at >= c.ends_at THEN
    UPDATE public.referrals SET status='rejected', eligibility_status='ineligible', rejection_reason='campaign_inactive_at_signup' WHERE id=r.id;
    INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(c.id,uid,'referral_rejected',r.id);
    RETURN 'rejected';
  END IF;
  SELECT count(*) INTO lifetime_count FROM public.referrals WHERE referrer_user_id=r.referrer_user_id AND campaign_id=r.campaign_id AND status='successful';
  SELECT count(*) INTO daily_count FROM public.referrals WHERE referrer_user_id=r.referrer_user_id AND campaign_id=r.campaign_id AND status='successful' AND successful_at >= date_trunc('day', now() AT TIME ZONE c.timezone) AT TIME ZONE c.timezone;
  IF lifetime_count >= coalesce((c.eligibility_rules->>'max_successful_per_referrer')::integer, 100) OR daily_count >= coalesce((c.eligibility_rules->>'max_successful_per_referrer_per_day')::integer, 20) THEN
    UPDATE public.referrals SET status='rejected', eligibility_status='ineligible', rejection_reason='reward_limit_reached' WHERE id=r.id;
    INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(c.id,uid,'referral_rejected',r.id);
    RETURN 'rejected';
  END IF;
  INSERT INTO public.credit_balances(user_id) VALUES (r.referrer_user_id), (r.referred_user_id) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.credit_balances WHERE user_id IN (r.referrer_user_id,r.referred_user_id) ORDER BY user_id FOR UPDATE;
  INSERT INTO public.credit_transactions(user_id, amount, transaction_type, referral_id, description, idempotency_key)
  VALUES
    (r.referrer_user_id, c.referrer_reward, 'referral_reward', r.id, c.name || ' successful referral reward', 'referrer:' || r.id::text),
    (r.referred_user_id, c.referred_reward, 'referral_bonus', r.id, c.name || ' new user referral bonus', 'referred:' || r.id::text);
  UPDATE public.credit_balances SET balance=balance+c.referrer_reward, lifetime_earned=lifetime_earned+c.referrer_reward, updated_at=now() WHERE user_id=r.referrer_user_id;
  UPDATE public.credit_balances SET balance=balance+c.referred_reward, lifetime_earned=lifetime_earned+c.referred_reward, updated_at=now() WHERE user_id=r.referred_user_id;
  UPDATE public.referrals SET status='successful', eligibility_status='rewarded', successful_at=now(), rejection_reason=NULL WHERE id=r.id;
  INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id,metadata) VALUES
    (c.id,uid,'referral_verified',r.id,'{}'::jsonb),
    (c.id,r.referrer_user_id,'referral_successful',r.id,'{}'::jsonb),
    (c.id,r.referrer_user_id,'credits_awarded',r.id,jsonb_build_object('amount',c.referrer_reward,'type','referral_reward')),
    (c.id,r.referred_user_id,'credits_awarded',r.id,jsonb_build_object('amount',c.referred_reward,'type','referral_bonus'));
  RETURN 'successful';
EXCEPTION WHEN unique_violation THEN
  IF EXISTS (SELECT 1 FROM public.referrals WHERE id=r.id AND status='successful') THEN RETURN 'successful'; END IF;
  RAISE;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_my_referral() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_my_referral() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_referral_dashboard()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); referral_code text; result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  referral_code := public.ensure_my_referral_code();
  SELECT jsonb_build_object(
    'code', referral_code,
    'balance', coalesce((SELECT balance FROM public.credit_balances WHERE user_id=uid),0),
    'creditsEarned', coalesce((SELECT sum(amount) FROM public.credit_transactions WHERE user_id=uid AND transaction_type='referral_reward' AND status='confirmed'),0),
    'successful', (SELECT count(*) FROM public.referrals WHERE referrer_user_id=uid AND status='successful'),
    'pending', (SELECT count(*) FROM public.referrals WHERE referrer_user_id=uid AND status='pending'),
    'history', coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'status',x.status,'reward',CASE WHEN x.status='successful' THEN c.referrer_reward ELSE NULL END,'createdAt',x.created_at,'successfulAt',x.successful_at) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.referrals WHERE referrer_user_id=uid ORDER BY created_at DESC LIMIT 50) x JOIN public.campaigns c ON c.id=x.campaign_id),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.my_referral_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_dashboard() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_campaign_dashboard(p_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin role required'; END IF;
  SELECT jsonb_build_object(
    'generatedCodes',(SELECT count(*) FROM public.campaign_events WHERE campaign_id=p_campaign_id AND event_type='code_generated'),
    'shares',(SELECT count(*) FROM public.campaign_events WHERE campaign_id=p_campaign_id AND event_type='referral_shared'),
    'signups',(SELECT count(*) FROM public.referrals WHERE campaign_id=p_campaign_id),
    'successful',(SELECT count(*) FROM public.referrals WHERE campaign_id=p_campaign_id AND status='successful'),
    'pending',(SELECT count(*) FROM public.referrals WHERE campaign_id=p_campaign_id AND status='pending'),
    'rejected',(SELECT count(*) FROM public.referrals WHERE campaign_id=p_campaign_id AND status='rejected'),
    'creditsAwarded',(SELECT coalesce(sum((metadata->>'amount')::integer),0) FROM public.campaign_events WHERE campaign_id=p_campaign_id AND event_type='credits_awarded'),
    'conversionRate',(SELECT CASE WHEN count(*)=0 THEN 0 ELSE round(100.0*count(*) FILTER (WHERE status='successful')/count(*),1) END FROM public.referrals WHERE campaign_id=p_campaign_id),
    'participants',(SELECT count(DISTINCT user_id) FROM public.campaign_events WHERE campaign_id=p_campaign_id),
    'daily',coalesce((SELECT jsonb_agg(jsonb_build_object('date',d.occurred_on,'signups',d.signups,'successful',d.successful) ORDER BY d.occurred_on) FROM (SELECT occurred_on,count(*) FILTER(WHERE event_type='referral_signup') signups,count(*) FILTER(WHERE event_type='referral_successful') successful FROM public.campaign_events WHERE campaign_id=p_campaign_id GROUP BY occurred_on) d),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_campaign_dashboard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_campaign_dashboard(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_update_campaign(p_id uuid, p_enabled boolean, p_referral_enabled boolean, p_theme_enabled boolean, p_starts_at timestamptz, p_ends_at timestamptz, p_referrer_reward integer, p_referred_reward integer, p_banner_title text, p_banner_message text, p_banner_deadline text, p_eligibility_rules jsonb)
RETURNS public.campaigns LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.campaigns;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin role required'; END IF;
  IF p_ends_at <= p_starts_at OR p_referrer_reward < 0 OR p_referred_reward < 0 OR p_referrer_reward > 1000 OR p_referred_reward > 1000 THEN RAISE EXCEPTION 'Invalid campaign configuration'; END IF;
  UPDATE public.campaigns SET enabled=p_enabled, referral_enabled=p_referral_enabled, theme_enabled=p_theme_enabled, starts_at=p_starts_at, ends_at=p_ends_at, referrer_reward=p_referrer_reward, referred_reward=p_referred_reward, banner_title=left(p_banner_title,160), banner_message=left(p_banner_message,500), banner_deadline=left(p_banner_deadline,160), eligibility_rules=p_eligibility_rules WHERE id=p_id RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_campaign(uuid,boolean,boolean,boolean,timestamptz,timestamptz,integer,integer,text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_campaign(uuid,boolean,boolean,boolean,timestamptz,timestamptz,integer,integer,text,text,text,jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE normalized_code text; matched_code public.referral_codes%ROWTYPE; active_campaign public.campaigns%ROWTYPE; new_referral_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.credit_balances(user_id) VALUES (new.id) ON CONFLICT (user_id) DO NOTHING;
  normalized_code := upper(btrim(coalesce(new.raw_user_meta_data->>'referral_code','')));
  IF normalized_code <> '' THEN
    SELECT * INTO active_campaign FROM public.campaigns WHERE enabled AND referral_enabled AND now() >= starts_at AND now() < ends_at ORDER BY starts_at DESC LIMIT 1;
    SELECT * INTO matched_code FROM public.referral_codes WHERE upper(code)=normalized_code AND status='active';
    IF active_campaign.id IS NOT NULL AND matched_code.id IS NOT NULL AND matched_code.user_id <> new.id THEN
      INSERT INTO public.referrals(campaign_id,referrer_user_id,referred_user_id,referral_code_id)
      VALUES(active_campaign.id,matched_code.user_id,new.id,matched_code.id)
      ON CONFLICT(referred_user_id) DO NOTHING RETURNING id INTO new_referral_id;
      IF new_referral_id IS NOT NULL THEN
        INSERT INTO public.campaign_events(campaign_id,user_id,event_type,referral_id) VALUES(active_campaign.id,new.id,'referral_signup',new_referral_id);
      END IF;
    END IF;
  END IF;
  RETURN new;
END;
$$;

INSERT INTO public.campaigns(slug,name,timezone,starts_at,ends_at,enabled,referral_enabled,theme_enabled,referrer_reward,referred_reward,banner_title,banner_message,banner_deadline,eligibility_rules)
VALUES('ganesh-utsav-2026','Nexoras Ganesh Utsav 2026','Asia/Kolkata','2026-09-15 00:00:00 Asia/Kolkata','2026-09-26 00:00:00 Asia/Kolkata',true,true,true,8,5,'Celebrate Ganesh Utsav with Nexoras 🎉','Refer friends. Earn AI Credits. Learn, practice and achieve more together.','Ganesh Utsav Referral Rewards end September 25','{"require_email_verification":true,"max_successful_per_referrer":100,"max_successful_per_referrer_per_day":20}'::jsonb)
ON CONFLICT(slug) DO UPDATE SET name=excluded.name,timezone=excluded.timezone,starts_at=excluded.starts_at,ends_at=excluded.ends_at,enabled=excluded.enabled,referral_enabled=excluded.referral_enabled,theme_enabled=excluded.theme_enabled,referrer_reward=excluded.referrer_reward,referred_reward=excluded.referred_reward,banner_title=excluded.banner_title,banner_message=excluded.banner_message,banner_deadline=excluded.banner_deadline,eligibility_rules=excluded.eligibility_rules;
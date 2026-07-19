import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

type OAuthNS = {
  getAuthorizationDetails: (id: string) => Promise<{
    data: {
      client?: { name?: string; redirect_uris?: string[] } | null;
      scopes?: string[];
      redirect_url?: string;
      redirect_to?: string;
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
};

function oauthNs(): OAuthNS {
  return (supabase.auth as unknown as { oauth: OAuthNS }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { redirect: next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthNs().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
      return data;
    }
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">Authorization error</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setError(null);
    setBusy(approve ? "approve" : "deny");
    const { data, error } = approve
      ? await oauthNs().approveAuthorization(authorization_id)
      : await oauthNs().denyAuthorization(authorization_id);
    if (error) {
      setBusy(null);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(null);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <div className="glass-strong rounded-2xl border border-border/60 p-8 shadow-elegant">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              Connect {clientName} to Nexoras
            </h1>
            <p className="text-xs text-muted-foreground">Authorize third-party access to your account</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          This lets <span className="font-medium text-foreground">{clientName}</span> use Nexoras as you.
          It can call this app's enabled tools while you are signed in.
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          <li className="rounded-lg border border-border/60 bg-background/40 p-3">
            Share your basic profile and email address.
          </li>
          <li className="rounded-lg border border-border/60 bg-background/40 p-3">
            Read your Nexoras profile, practice sessions, and question bank as you.
          </li>
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          This does not bypass Nexoras permissions or backend policies. You can revoke access anytime.
        </p>

        {error ? (
          <p role="alert" className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => decide(true)}
            disabled={busy !== null}
            className="flex-1 bg-gradient-primary text-primary-foreground shadow-glow"
          >
            {busy === "approve" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => decide(false)}
            disabled={busy !== null}
            className="flex-1"
          >
            {busy === "deny" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Cancel connection
          </Button>
        </div>
      </div>
    </main>
  );
}

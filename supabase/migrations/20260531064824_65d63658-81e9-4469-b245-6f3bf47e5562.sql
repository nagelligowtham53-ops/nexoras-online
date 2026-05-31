
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'AI',
  author text NOT NULL DEFAULT 'Nexoras Team',
  read_time text NOT NULL DEFAULT '6 min',
  cover text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_title text,
  meta_description text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read live posts"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    OR (status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= now())
  );

CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX blog_posts_status_published_idx
  ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_category_idx
  ON public.blog_posts (category);

-- ============ 1. Syllabus hierarchy ============
CREATE TABLE IF NOT EXISTS public.syllabus_chapters (
  id text PRIMARY KEY,
  subject text NOT NULL,
  class_level smallint NOT NULL CHECK (class_level IN (11,12)),
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  in_jee_main boolean NOT NULL DEFAULT false,
  in_jee_advanced boolean NOT NULL DEFAULT false,
  in_neet boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject, class_level, name)
);
GRANT SELECT ON public.syllabus_chapters TO anon, authenticated;
GRANT ALL ON public.syllabus_chapters TO service_role;
ALTER TABLE public.syllabus_chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Syllabus is public" ON public.syllabus_chapters;
CREATE POLICY "Syllabus is public" ON public.syllabus_chapters FOR SELECT TO anon, authenticated USING (true);
DROP TRIGGER IF EXISTS syllabus_chapters_touch ON public.syllabus_chapters;
CREATE TRIGGER syllabus_chapters_touch BEFORE UPDATE ON public.syllabus_chapters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.syllabus_chapter_aliases (
  alias text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES public.syllabus_chapters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.syllabus_chapter_aliases TO anon, authenticated;
GRANT ALL ON public.syllabus_chapter_aliases TO service_role;
ALTER TABLE public.syllabus_chapter_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Aliases are public" ON public.syllabus_chapter_aliases;
CREATE POLICY "Aliases are public" ON public.syllabus_chapter_aliases FOR SELECT TO anon, authenticated USING (true);

-- ============ 2. Question bank metadata ============
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS chapter_id text REFERENCES public.syllabus_chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'original_practice',
  ADD COLUMN IF NOT EXISTS exam_session text,
  ADD COLUMN IF NOT EXISTS paper text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS license_status text NOT NULL DEFAULT 'original';

CREATE INDEX IF NOT EXISTS questions_chapter_id_idx ON public.questions (chapter_id);
CREATE INDEX IF NOT EXISTS questions_exams_idx ON public.questions USING gin (exams);
CREATE INDEX IF NOT EXISTS questions_subject_class_idx ON public.questions (subject, class_level);
CREATE INDEX IF NOT EXISTS questions_source_type_idx ON public.questions (source_type);

-- source_type validation via trigger (data dependent, keeps imports honest)
CREATE OR REPLACE FUNCTION public.validate_question_source()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.source_type NOT IN ('previous_year','official_exam','licensed_bank','ncert_based','original_practice') THEN
    RAISE EXCEPTION 'Invalid source_type: %', NEW.source_type;
  END IF;
  IF NEW.source_type IN ('previous_year','official_exam') AND NEW.year IS NULL THEN
    RAISE EXCEPTION 'Previous-year / official questions require a year';
  END IF;
  NEW.is_pyq := NEW.source_type IN ('previous_year','official_exam');
  NEW.is_ncert := NEW.is_ncert OR NEW.source_type = 'ncert_based';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS questions_validate_source ON public.questions;
CREATE TRIGGER questions_validate_source BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.validate_question_source();

-- ============ 3. Official chapter seed (reference data, not questions) ============
INSERT INTO public.syllabus_chapters (id, subject, class_level, name, order_index, in_jee_main, in_jee_advanced, in_neet) VALUES
-- Physics 11
('phy11-units-measurements','Physics',11,'Units and Measurements',1,true,true,true),
('phy11-kinematics','Physics',11,'Kinematics',2,true,true,true),
('phy11-laws-of-motion','Physics',11,'Laws of Motion',3,true,true,true),
('phy11-work-energy-power','Physics',11,'Work, Energy and Power',4,true,true,true),
('phy11-rotational-motion','Physics',11,'Rotational Motion and System of Particles',5,true,true,true),
('phy11-gravitation','Physics',11,'Gravitation',6,true,true,true),
('phy11-properties-solids-liquids','Physics',11,'Mechanical Properties of Solids and Liquids',7,true,true,true),
('phy11-thermodynamics','Physics',11,'Thermodynamics',8,true,true,true),
('phy11-kinetic-theory','Physics',11,'Kinetic Theory of Gases',9,true,true,true),
('phy11-oscillations','Physics',11,'Oscillations',10,true,true,true),
('phy11-waves','Physics',11,'Waves',11,true,true,true),
('phy11-experimental-skills','Physics',11,'Experimental Skills',12,true,false,false),
-- Physics 12
('phy12-electrostatics','Physics',12,'Electrostatics and Capacitance',1,true,true,true),
('phy12-current-electricity','Physics',12,'Current Electricity',2,true,true,true),
('phy12-magnetic-effects','Physics',12,'Magnetic Effects of Current and Magnetism',3,true,true,true),
('phy12-emi-ac','Physics',12,'Electromagnetic Induction and Alternating Currents',4,true,true,true),
('phy12-em-waves','Physics',12,'Electromagnetic Waves',5,true,false,true),
('phy12-optics','Physics',12,'Optics (Ray and Wave)',6,true,true,true),
('phy12-dual-nature','Physics',12,'Dual Nature of Matter and Radiation',7,true,true,true),
('phy12-atoms-nuclei','Physics',12,'Atoms and Nuclei',8,true,true,true),
('phy12-electronic-devices','Physics',12,'Electronic Devices and Semiconductors',9,true,false,true),
-- Chemistry 11
('chem11-basic-concepts','Chemistry',11,'Some Basic Concepts in Chemistry',1,true,true,true),
('chem11-atomic-structure','Chemistry',11,'Atomic Structure',2,true,true,true),
('chem11-chemical-bonding','Chemistry',11,'Chemical Bonding and Molecular Structure',3,true,true,true),
('chem11-chemical-thermodynamics','Chemistry',11,'Chemical Thermodynamics',4,true,true,true),
('chem11-equilibrium','Chemistry',11,'Equilibrium',5,true,true,true),
('chem11-redox','Chemistry',11,'Redox Reactions',6,true,true,true),
('chem11-periodicity','Chemistry',11,'Classification of Elements and Periodicity in Properties',7,true,true,true),
('chem11-s-block','Chemistry',11,'s-Block Elements',8,true,true,true),
('chem11-p-block-13-14','Chemistry',11,'p-Block Elements (Group 13 and 14)',9,true,true,true),
('chem11-organic-basics','Chemistry',11,'Some Basic Principles of Organic Chemistry',10,true,true,true),
('chem11-hydrocarbons','Chemistry',11,'Hydrocarbons',11,true,true,true),
('chem11-purification','Chemistry',11,'Purification and Characterisation of Organic Compounds',12,true,false,false),
('chem11-states-of-matter','Chemistry',11,'States of Matter and Gaseous State',13,false,true,false),
-- Chemistry 12
('chem12-solutions','Chemistry',12,'Solutions',1,true,true,true),
('chem12-electrochemistry','Chemistry',12,'Electrochemistry',2,true,true,true),
('chem12-chemical-kinetics','Chemistry',12,'Chemical Kinetics',3,true,true,true),
('chem12-d-f-block','Chemistry',12,'d- and f-Block Elements',4,true,true,true),
('chem12-coordination','Chemistry',12,'Co-ordination Compounds',5,true,true,true),
('chem12-haloalkanes','Chemistry',12,'Organic Compounds Containing Halogens',6,true,true,true),
('chem12-oxygen-organic','Chemistry',12,'Organic Compounds Containing Oxygen',7,true,true,true),
('chem12-nitrogen-organic','Chemistry',12,'Organic Compounds Containing Nitrogen',8,true,true,true),
('chem12-biomolecules','Chemistry',12,'Biomolecules',9,true,true,true),
('chem12-p-block-15-18','Chemistry',12,'p-Block Elements (Group 15 to 18)',10,true,true,true),
('chem12-practical-chemistry','Chemistry',12,'Principles Related to Practical Chemistry',11,true,false,false),
('chem12-solid-state','Chemistry',12,'Solid State',12,false,true,false),
('chem12-surface-chemistry','Chemistry',12,'Surface Chemistry',13,false,true,false),
('chem12-polymers','Chemistry',12,'Polymers',14,false,true,false),
-- Mathematics 11
('math11-sets-relations-functions','Mathematics',11,'Sets, Relations and Functions',1,true,true,false),
('math11-complex-quadratic','Mathematics',11,'Complex Numbers and Quadratic Equations',2,true,true,false),
('math11-permutations-combinations','Mathematics',11,'Permutations and Combinations',3,true,true,false),
('math11-binomial','Mathematics',11,'Binomial Theorem and Its Applications',4,true,true,false),
('math11-sequence-series','Mathematics',11,'Sequence and Series',5,true,true,false),
('math11-trigonometry','Mathematics',11,'Trigonometry',6,true,true,false),
('math11-straight-lines','Mathematics',11,'Straight Lines',7,true,true,false),
('math11-conic-sections','Mathematics',11,'Conic Sections',8,true,true,false),
('math11-3d-intro','Mathematics',11,'Introduction to Three Dimensional Geometry',9,true,true,false),
('math11-limits-derivatives','Mathematics',11,'Limits and Derivatives',10,true,true,false),
('math11-statistics-probability','Mathematics',11,'Statistics and Probability',11,true,true,false),
-- Mathematics 12
('math12-matrices-determinants','Mathematics',12,'Matrices and Determinants',1,true,true,false),
('math12-inverse-trigonometric','Mathematics',12,'Inverse Trigonometric Functions',2,true,true,false),
('math12-continuity-differentiability','Mathematics',12,'Limit, Continuity and Differentiability',3,true,true,false),
('math12-application-derivatives','Mathematics',12,'Application of Derivatives',4,true,true,false),
('math12-integral-calculus','Mathematics',12,'Integral Calculus',5,true,true,false),
('math12-differential-equations','Mathematics',12,'Differential Equations',6,true,true,false),
('math12-vector-algebra','Mathematics',12,'Vector Algebra',7,true,true,false),
('math12-three-d-geometry','Mathematics',12,'Three Dimensional Geometry',8,true,true,false),
('math12-probability','Mathematics',12,'Probability',9,true,true,false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, subject = EXCLUDED.subject, class_level = EXCLUDED.class_level,
  order_index = EXCLUDED.order_index, in_jee_main = EXCLUDED.in_jee_main,
  in_jee_advanced = EXCLUDED.in_jee_advanced, in_neet = EXCLUDED.in_neet;

-- NEET Biology chapters carried over from the existing NCERT list
INSERT INTO public.syllabus_chapters (id, subject, class_level, name, order_index, in_neet)
SELECT 'bio' || c.class_level || '-' || regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g'),
       'Biology', c.class_level, c.name, c.ord, true
FROM (VALUES
 (11,'The Living World',1),(11,'Biological Classification',2),(11,'Plant Kingdom',3),(11,'Animal Kingdom',4),
 (11,'Morphology of Flowering Plants',5),(11,'Anatomy of Flowering Plants',6),(11,'Structural Organisation in Animals',7),
 (11,'Cell: The Unit of Life',8),(11,'Biomolecules',9),(11,'Cell Cycle & Cell Division',10),
 (11,'Photosynthesis in Higher Plants',11),(11,'Respiration in Plants',12),(11,'Plant Growth & Development',13),
 (11,'Breathing & Exchange of Gases',14),(11,'Body Fluids & Circulation',15),(11,'Excretory Products',16),
 (11,'Locomotion & Movement',17),(11,'Neural Control & Coordination',18),(11,'Chemical Coordination & Integration',19),
 (12,'Sexual Reproduction in Flowering Plants',1),(12,'Human Reproduction',2),(12,'Reproductive Health',3),
 (12,'Principles of Inheritance & Variation',4),(12,'Molecular Basis of Inheritance',5),(12,'Evolution',6),
 (12,'Human Health & Disease',7),(12,'Microbes in Human Welfare',8),(12,'Biotechnology — Principles & Processes',9),
 (12,'Biotechnology & Its Applications',10),(12,'Organisms & Populations',11),(12,'Ecosystem',12),
 (12,'Biodiversity & Conservation',13)
) AS c(class_level, name, ord)
ON CONFLICT (id) DO NOTHING;

-- Aliases: identity for every canonical name, plus legacy names already in the bank
INSERT INTO public.syllabus_chapter_aliases (alias, chapter_id)
SELECT lower(name), id FROM public.syllabus_chapters
ON CONFLICT (alias) DO NOTHING;

INSERT INTO public.syllabus_chapter_aliases (alias, chapter_id) VALUES
('units & measurements','phy11-units-measurements'),
('motion in a straight line','phy11-kinematics'),
('motion in a plane','phy11-kinematics'),
('system of particles & rotational motion','phy11-rotational-motion'),
('work, energy & power','phy11-work-energy-power'),
('mechanical properties of solids','phy11-properties-solids-liquids'),
('mechanical properties of fluids','phy11-properties-solids-liquids'),
('thermal properties of matter','phy11-thermodynamics'),
('kinetic theory','phy11-kinetic-theory'),
('electric charges & fields','phy12-electrostatics'),
('electrostatic potential & capacitance','phy12-electrostatics'),
('moving charges & magnetism','phy12-magnetic-effects'),
('magnetism & matter','phy12-magnetic-effects'),
('electromagnetic induction','phy12-emi-ac'),
('alternating current','phy12-emi-ac'),
('electromagnetic waves','phy12-em-waves'),
('ray optics','phy12-optics'),
('wave optics','phy12-optics'),
('dual nature of radiation & matter','phy12-dual-nature'),
('atoms','phy12-atoms-nuclei'),
('nuclei','phy12-atoms-nuclei'),
('semiconductor electronics','phy12-electronic-devices'),
('some basic concepts of chemistry','chem11-basic-concepts'),
('structure of atom','chem11-atomic-structure'),
('classification of elements & periodicity','chem11-periodicity'),
('chemical bonding & molecular structure','chem11-chemical-bonding'),
('equilibrium','chem11-equilibrium'),
('redox reactions','chem11-redox'),
('hydrocarbons','chem11-hydrocarbons'),
('organic chemistry — basic principles','chem11-organic-basics'),
('s-block elements','chem11-s-block'),
('p-block elements (group 13–14)','chem11-p-block-13-14'),
('coordination compounds','chem12-coordination'),
('haloalkanes & haloarenes','chem12-haloalkanes'),
('alcohols, phenols & ethers','chem12-oxygen-organic'),
('aldehydes, ketones & carboxylic acids','chem12-oxygen-organic'),
('amines','chem12-nitrogen-organic'),
('p-block elements (group 15–18)','chem12-p-block-15-18'),
('sets','math11-sets-relations-functions'),
('relations & functions','math11-sets-relations-functions'),
('relations & functions (advanced)','math11-sets-relations-functions'),
('trigonometric functions','math11-trigonometry'),
('complex numbers & quadratic equations','math11-complex-quadratic'),
('permutations & combinations','math11-permutations-combinations'),
('binomial theorem','math11-binomial'),
('sequences & series','math11-sequence-series'),
('introduction to 3d geometry','math11-3d-intro'),
('limits & derivatives','math11-limits-derivatives'),
('statistics','math11-statistics-probability'),
('probability','math11-statistics-probability'),
('matrices','math12-matrices-determinants'),
('determinants','math12-matrices-determinants'),
('continuity & differentiability','math12-continuity-differentiability'),
('application of derivatives','math12-application-derivatives'),
('integrals','math12-integral-calculus'),
('application of integrals','math12-integral-calculus'),
('probability (advanced)','math12-probability')
ON CONFLICT (alias) DO NOTHING;

-- Subject-scoped alias resolution for names that exist in two subjects
UPDATE public.questions q
SET chapter_id = c.id, class_level = c.class_level
FROM public.syllabus_chapters c
WHERE q.chapter_id IS NULL
  AND c.subject = q.subject
  AND lower(c.name) = lower(q.chapter);

UPDATE public.questions q
SET chapter_id = c.id, class_level = c.class_level
FROM public.syllabus_chapter_aliases a
JOIN public.syllabus_chapters c ON c.id = a.chapter_id
WHERE q.chapter_id IS NULL
  AND a.alias = lower(q.chapter)
  AND c.subject = q.subject;

-- Chemistry/Physics 'Thermodynamics' collides across subjects; resolve explicitly
UPDATE public.questions SET chapter_id = 'chem11-chemical-thermodynamics', class_level = 11
WHERE chapter_id IS NULL AND subject = 'Chemistry' AND lower(chapter) = 'thermodynamics';
UPDATE public.questions SET chapter_id = 'phy11-thermodynamics', class_level = 11
WHERE chapter_id IS NULL AND subject = 'Physics' AND lower(chapter) = 'thermodynamics';
UPDATE public.questions SET chapter_id = 'chem12-biomolecules', class_level = 12
WHERE chapter_id IS NULL AND subject = 'Chemistry' AND lower(chapter) = 'biomolecules';

-- Keep the display chapter name in sync with the canonical syllabus name
UPDATE public.questions q SET chapter = c.name
FROM public.syllabus_chapters c
WHERE q.chapter_id = c.id AND q.chapter <> c.name;

-- Existing seeded rows are original practice content; label them honestly
UPDATE public.questions SET source_type = CASE
  WHEN is_pyq THEN 'previous_year'
  WHEN is_ncert THEN 'ncert_based'
  ELSE 'original_practice' END
WHERE source_type = 'original_practice';

-- ============ 4. Fix read access (root cause of "0 questions") ============
-- The client reads questions_public, a security_invoker view, so readers need
-- column-level SELECT on the base table. Answer columns stay ungranted.
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (
  id, exams, class_level, subject, chapter, chapter_id, topic, subtopic, ncert_unit,
  difficulty, question_type, year, source, source_type, exam_session, paper, language,
  source_reference, license_status, is_pyq, is_ncert, marks, negative_marks,
  time_estimate_seconds, question_text, options, concepts, tags, external_id,
  image_url, created_at, updated_at
) ON public.questions TO anon, authenticated;
-- Admin write paths (RLS policies already restrict these to admins)
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;

DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public WITH (security_invoker = true) AS
SELECT id, exams, class_level, subject, chapter, chapter_id, topic, subtopic, ncert_unit,
       difficulty, question_type, year, source, source_type, exam_session, paper, language,
       source_reference, license_status, is_pyq, is_ncert, marks, negative_marks,
       time_estimate_seconds, question_text, options, concepts, tags, external_id,
       image_url, created_at, updated_at
FROM public.questions;
GRANT SELECT ON public.questions_public TO anon, authenticated;
GRANT ALL ON public.questions_public TO service_role;

-- ============ 5. Accurate counting / selection RPCs ============
CREATE OR REPLACE FUNCTION public.exam_chapter_counts(p_exam text, p_classes smallint[] DEFAULT NULL)
RETURNS TABLE(chapter_id text, subject text, class_level smallint, chapter_name text,
              total bigint, pyq bigint, ncert bigint, original bigint,
              easy bigint, medium bigint, hard bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.id, c.subject, c.class_level, c.name,
         count(q.id),
         count(q.id) FILTER (WHERE q.source_type IN ('previous_year','official_exam')),
         count(q.id) FILTER (WHERE q.source_type = 'ncert_based'),
         count(q.id) FILTER (WHERE q.source_type = 'original_practice'),
         count(q.id) FILTER (WHERE q.difficulty = 'Easy'),
         count(q.id) FILTER (WHERE q.difficulty = 'Medium'),
         count(q.id) FILTER (WHERE q.difficulty = 'Hard')
  FROM public.syllabus_chapters c
  LEFT JOIN public.questions q
    ON q.chapter_id = c.id AND p_exam = ANY(q.exams)
  WHERE (p_exam = 'JEE Main' AND c.in_jee_main)
     OR (p_exam = 'JEE Advanced' AND c.in_jee_advanced)
     OR (p_exam = 'NEET' AND c.in_neet)
  AND (p_classes IS NULL OR c.class_level = ANY(p_classes))
  GROUP BY c.id, c.subject, c.class_level, c.name, c.order_index
  ORDER BY c.subject, c.class_level, c.order_index;
$$;
GRANT EXECUTE ON FUNCTION public.exam_chapter_counts(text, smallint[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.practice_availability(
  p_exam text,
  p_classes smallint[] DEFAULT NULL,
  p_chapter_ids text[] DEFAULT NULL,
  p_subjects text[] DEFAULT NULL,
  p_difficulties text[] DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_question_types text[] DEFAULT NULL
) RETURNS bigint
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT count(*) FROM public.questions q
  WHERE p_exam = ANY(q.exams)
    AND q.chapter_id IS NOT NULL
    AND (p_classes IS NULL OR q.class_level = ANY(p_classes))
    AND (p_chapter_ids IS NULL OR q.chapter_id = ANY(p_chapter_ids))
    AND (p_subjects IS NULL OR q.subject = ANY(p_subjects))
    AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
    AND (p_source_types IS NULL OR q.source_type = ANY(p_source_types))
    AND (p_question_types IS NULL OR q.question_type = ANY(p_question_types));
$$;
GRANT EXECUTE ON FUNCTION public.practice_availability(text, smallint[], text[], text[], text[], text[], text[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.practice_questions(
  p_exam text,
  p_classes smallint[] DEFAULT NULL,
  p_chapter_ids text[] DEFAULT NULL,
  p_subjects text[] DEFAULT NULL,
  p_difficulties text[] DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_question_types text[] DEFAULT NULL,
  p_limit integer DEFAULT 25
) RETURNS SETOF public.questions_public
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT v.* FROM public.questions_public v
  JOIN public.questions q ON q.id = v.id
  WHERE p_exam = ANY(q.exams)
    AND q.chapter_id IS NOT NULL
    AND (p_classes IS NULL OR q.class_level = ANY(p_classes))
    AND (p_chapter_ids IS NULL OR q.chapter_id = ANY(p_chapter_ids))
    AND (p_subjects IS NULL OR q.subject = ANY(p_subjects))
    AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
    AND (p_source_types IS NULL OR q.source_type = ANY(p_source_types))
    AND (p_question_types IS NULL OR q.question_type = ANY(p_question_types))
  ORDER BY random()
  LIMIT greatest(1, least(p_limit, 300));
$$;
GRANT EXECUTE ON FUNCTION public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer) TO anon, authenticated;

-- ============ 6. Admin diagnostics ============
CREATE OR REPLACE FUNCTION public.admin_question_bank_health()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;
  SELECT jsonb_build_object(
    'total', count(*),
    'jee_main', count(*) FILTER (WHERE 'JEE Main' = ANY(exams)),
    'jee_advanced', count(*) FILTER (WHERE 'JEE Advanced' = ANY(exams)),
    'neet', count(*) FILTER (WHERE 'NEET' = ANY(exams)),
    'class_11', count(*) FILTER (WHERE class_level = 11),
    'class_12', count(*) FILTER (WHERE class_level = 12),
    'physics', count(*) FILTER (WHERE subject = 'Physics'),
    'chemistry', count(*) FILTER (WHERE subject = 'Chemistry'),
    'mathematics', count(*) FILTER (WHERE subject = 'Mathematics'),
    'biology', count(*) FILTER (WHERE subject = 'Biology'),
    'previous_year', count(*) FILTER (WHERE source_type IN ('previous_year','official_exam')),
    'ncert_based', count(*) FILTER (WHERE source_type = 'ncert_based'),
    'original_practice', count(*) FILTER (WHERE source_type = 'original_practice'),
    'licensed_bank', count(*) FILTER (WHERE source_type = 'licensed_bank'),
    'missing_chapter_id', count(*) FILTER (WHERE chapter_id IS NULL),
    'missing_answer', count(*) FILTER (WHERE correct_answer IS NULL OR correct_answer = 'null'::jsonb),
    'missing_options', count(*) FILTER (WHERE question_type = 'single_correct' AND (options IS NULL OR jsonb_array_length(options) < 2)),
    'invalid_subject', count(*) FILTER (WHERE subject NOT IN (SELECT DISTINCT subject FROM public.syllabus_chapters))
  ) INTO result FROM public.questions;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_question_bank_health() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_chapter_health()
RETURNS TABLE(chapter_id text, chapter_name text, subject text, class_level smallint,
              jee_main bigint, jee_advanced bigint, neet bigint,
              pyq bigint, ncert bigint, original bigint, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;
  RETURN QUERY
  SELECT c.id, c.name, c.subject, c.class_level,
         count(q.id) FILTER (WHERE 'JEE Main' = ANY(q.exams)),
         count(q.id) FILTER (WHERE 'JEE Advanced' = ANY(q.exams)),
         count(q.id) FILTER (WHERE 'NEET' = ANY(q.exams)),
         count(q.id) FILTER (WHERE q.source_type IN ('previous_year','official_exam')),
         count(q.id) FILTER (WHERE q.source_type = 'ncert_based'),
         count(q.id) FILTER (WHERE q.source_type = 'original_practice'),
         count(q.id)
  FROM public.syllabus_chapters c
  LEFT JOIN public.questions q ON q.chapter_id = c.id
  GROUP BY c.id, c.name, c.subject, c.class_level, c.order_index
  ORDER BY c.subject, c.class_level, c.order_index;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_chapter_health() TO authenticated;
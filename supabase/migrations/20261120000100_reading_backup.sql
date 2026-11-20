-- Phase 4 schema preparation. This migration does not enable the unfinished sync client.
CREATE SEQUENCE public.ra_revision_seq AS bigint;

CREATE TABLE public.ra_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  display_name text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, revision bigint NOT NULL DEFAULT 0
);
CREATE TABLE public.ra_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL CHECK (length(trim(title)) > 0), author text NOT NULL DEFAULT '',
  total_pages integer NOT NULL CHECK (total_pages > 0), base_page integer NOT NULL DEFAULT 0,
  daily_target integer NOT NULL CHECK (daily_target > 0), status text NOT NULL CHECK (status IN ('reading','planned','completed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 0, UNIQUE(owner_id, id), CHECK(base_page >= 0 AND base_page <= total_pages)
);
CREATE TABLE public.ra_daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id), book_id uuid NOT NULL,
  reading_date date NOT NULL, target integer NOT NULL CHECK (target > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 0, UNIQUE(owner_id, book_id, reading_date), FOREIGN KEY(owner_id, book_id) REFERENCES public.ra_books(owner_id, id)
);
CREATE TABLE public.ra_reading_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id), book_id uuid NOT NULL,
  reading_date date NOT NULL, start_page integer NOT NULL, end_page integer NOT NULL, reflection text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 0, FOREIGN KEY(owner_id, book_id) REFERENCES public.ra_books(owner_id, id),
  CHECK(start_page >= 0 AND end_page > start_page)
);
CREATE TABLE public.ra_reading_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id), book_id uuid NOT NULL,
  reading_date date NOT NULL, reflection text NOT NULL DEFAULT '', status text NOT NULL CHECK(status IN ('draft','ready')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 0, FOREIGN KEY(owner_id, book_id) REFERENCES public.ra_books(owner_id, id)
);
CREATE TABLE public.ra_sync_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id), device_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 0, UNIQUE(owner_id, device_id)
);

CREATE FUNCTION public.ra_stamp_record() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id <> OLD.owner_id OR NEW.id <> OLD.id THEN RAISE EXCEPTION 'record identity is immutable'; END IF;
    IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN RAISE EXCEPTION 'deleted records cannot be restored'; END IF;
    NEW.created_at := OLD.created_at;
  ELSE
    NEW.created_at := now();
  END IF;
  NEW.updated_at := now(); NEW.revision := nextval('public.ra_revision_seq'); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.ra_stamp_record() FROM PUBLIC;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ra_profiles','ra_books','ra_daily_goals','ra_reading_logs','ra_reading_reports','ra_sync_metadata'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY own_select ON public.%I FOR SELECT TO authenticated USING ((select auth.uid()) = owner_id)', t);
    EXECUTE format('CREATE POLICY own_insert ON public.%I FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = owner_id)', t);
    EXECUTE format('CREATE POLICY own_update ON public.%I FOR UPDATE TO authenticated USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id)', t);
    EXECUTE format('CREATE TRIGGER stamp_record BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.ra_stamp_record()', t);
    EXECUTE format('CREATE INDEX %I ON public.%I(owner_id, revision)', t || '_owner_revision', t);
    -- Writes stay disabled until conditional-write and conflict handling exist.
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

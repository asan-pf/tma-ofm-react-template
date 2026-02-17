-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.comments (
    id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
    user_id integer,
    location_id integer,
    content text NOT NULL,
    is_approved boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url text,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT comments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.favorites (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id integer NOT NULL,
    location_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT favorites_pkey PRIMARY KEY (id),
    CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT favorites_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.locations (
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    user_id integer,
    name character varying NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    category character varying NOT NULL CHECK (
        category::text = ANY (
            ARRAY ['grocery'::character varying, 'restaurant-bar'::character varying, 'other'::character varying]::text []
        )
    ),
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url text,
    website_url text,
    schedules text,
    CONSTRAINT locations_pkey PRIMARY KEY (id),
    CONSTRAINT locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ratings (
    id integer NOT NULL DEFAULT nextval('ratings_id_seq'::regclass),
    user_id integer,
    location_id integer,
    stars integer NOT NULL CHECK (
        stars >= 1
        AND stars <= 5
    ),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_pkey PRIMARY KEY (id),
    CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT ratings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    telegram_id character varying NOT NULL UNIQUE,
    nickname character varying NOT NULL,
    avatar_url text,
    role character varying DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
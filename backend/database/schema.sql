CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    telegram_id character varying NOT NULL UNIQUE,
    nickname character varying NOT NULL,
    avatar_url text,
    role character varying DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.locations (
    id SERIAL PRIMARY KEY,
    user_id integer,
    name character varying NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    website_url text,
    image_url text,
    schedules text,
    type character varying NOT NULL CHECK (
        type::text = ANY (
            ARRAY ['permanent'::character varying, 'temporary'::character varying]::text []
        )
    ),
    category character varying NOT NULL CHECK (
        category::text = ANY (
            ARRAY ['grocery'::character varying, 'restaurant-bar'::character varying, 'other'::character varying]::text []
        )
    ),
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS locations_user_unique
ON public.locations(user_id)
WHERE user_id IS NOT NULL;

CREATE TABLE public.comments (
    id SERIAL PRIMARY KEY,
    user_id integer,
    location_id integer,
    content text NOT NULL,
    is_approved boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT comments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.ratings (
    id SERIAL PRIMARY KEY,
    user_id integer,
    location_id integer,
    stars integer NOT NULL CHECK (
        stars >= 1
        AND stars <= 5
    ),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT ratings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.favorites (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT favorites_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE,
    CONSTRAINT favorites_unique_user_location UNIQUE (user_id, location_id)
);

@AGENTS.md
Đây là dữ liệu của dữ án, khi tạo code xin hãy viết dựa theo cấu trúc SQL này.
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.amenities (
  amenity_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  amenity_name text NOT NULL,
  CONSTRAINT amenities_pkey PRIMARY KEY (amenity_id)
);
CREATE TABLE public.favorites (
  favority_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id uuid,
  post_id text,
  favority_created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (favority_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT favorites_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id)
);
CREATE TABLE public.locations (
  location_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  city text NOT NULL,
  district text NOT NULL,
  ward text NOT NULL,
  CONSTRAINT locations_pkey PRIMARY KEY (location_id)
);
CREATE TABLE public.posts (
  post_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  room_id text,
  post_title text NOT NULL,
  user_id uuid,
  post_created_at timestamp with time zone DEFAULT now(),
  post_update_at timestamp with time zone,
  post_expired_at timestamp with time zone,
  CONSTRAINT posts_pkey PRIMARY KEY (post_id),
  CONSTRAINT posts_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.reviews (
  review_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id uuid,
  room_id text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  review_created_at timestamp with time zone DEFAULT now(),
  review_updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (review_id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT reviews_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id)
);
CREATE TABLE public.roomamenities (
  room_amenities_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  room_id text,
  amenity_id text,
  CONSTRAINT roomamenities_pkey PRIMARY KEY (room_amenities_id),
  CONSTRAINT roomamenities_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id),
  CONSTRAINT roomamenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(amenity_id)
);
CREATE TABLE public.roomimages (
  image_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  room_id text,
  image_url text NOT NULL,
  is_360 boolean DEFAULT false,
  CONSTRAINT roomimages_pkey PRIMARY KEY (image_id),
  CONSTRAINT roomimages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id)
);
CREATE TABLE public.rooms (
  room_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  room_description text,
  room_price double precision NOT NULL,
  room_area real,
  location_id text,
  latitude double precision,
  longitude double precision,
  owner_id uuid,
  room_status boolean DEFAULT true,
  room_type_id text,
  room_created_at timestamp with time zone DEFAULT now(),
  vr_url text,
  CONSTRAINT rooms_pkey PRIMARY KEY (room_id),
  CONSTRAINT rooms_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(location_id),
  CONSTRAINT rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id),
  CONSTRAINT rooms_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.roomtypes(room_type_id)
);
CREATE TABLE public.roomtypes (
  room_type_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  room_type_name text NOT NULL,
  room_type_description text,
  CONSTRAINT roomtypes_pkey PRIMARY KEY (room_type_id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL UNIQUE,
  user_phone text,
  user_role text DEFAULT 'renter'::text CHECK (user_role = ANY (ARRAY['owner'::text, 'renter'::text])),
  user_created_at timestamp with time zone DEFAULT now(),
  user_avatar text,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
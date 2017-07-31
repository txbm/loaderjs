CREATE TABLE IF NOT EXISTS characters (
  id uuid NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  backstory text NULL,
  species varchar(100) NOT NULL,
  home_planet varchar(100) NULL
);

CREATE TABLE IF NOT EXISTS characters_friends (
  character_from_id uuid NOT NULL,
  character_to_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS characters_episodes (
  episode_id uuid NOT NULL,
  character_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id uuid NOT NULL UNIQUE,
  num integer NOT NULL,
  name varchar(100) NOT NULL,
  year integer NOT NULL
);

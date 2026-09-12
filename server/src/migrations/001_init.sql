CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  username      citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'player')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rankings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  status            text NOT NULL CHECK (status IN ('draft', 'drawn')) DEFAULT 'draft',
  start_month       date NOT NULL,            -- always the 1st of the month
  matches_per_month int  NOT NULL DEFAULT 3 CHECK (matches_per_month BETWEEN 1 AND 10),
  points_win        int  NOT NULL DEFAULT 300,
  points_loss       int  NOT NULL DEFAULT 100,
  points_wo         int  NOT NULL DEFAULT -100,
  created_by        uuid NOT NULL REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  drawn_at          timestamptz
);

CREATE TABLE ranking_participants (
  ranking_id uuid NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed       int,                              -- position after the draw shuffle
  PRIMARY KEY (ranking_id, user_id)
);

CREATE TABLE matches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id       uuid NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
  round_number     int  NOT NULL,
  month            date NOT NULL,              -- always the 1st of the month
  player1_id       uuid NOT NULL REFERENCES users(id),
  player2_id       uuid NOT NULL REFERENCES users(id),
  status           text NOT NULL CHECK (status IN ('pending', 'reported', 'confirmed')) DEFAULT 'pending',
  result_type      text CHECK (result_type IN ('played', 'wo')),
  winner_id        uuid REFERENCES users(id),
  wo_player_ids    uuid[] NOT NULL DEFAULT '{}',
  sets             jsonb,
  reported_by      uuid REFERENCES users(id),
  reported_at      timestamptz,
  confirmed_by     uuid REFERENCES users(id),
  confirmed_at     timestamptz,
  resolved_by      text CHECK (resolved_by IN ('players', 'admin', 'system')),
  rejection_reason text,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (player1_id <> player2_id)
);
CREATE INDEX matches_ranking_idx ON matches (ranking_id, month, round_number);
CREATE INDEX matches_players_idx ON matches (player1_id, player2_id);

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  ranking_id uuid REFERENCES rankings(id) ON DELETE CASCADE,
  match_id   uuid REFERENCES matches(id) ON DELETE CASCADE,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, read_at, created_at DESC);

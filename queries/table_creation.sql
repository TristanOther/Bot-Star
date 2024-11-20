CREATE TABLE IF NOT EXISTS users(
    user_id TEXT PRIMARY KEY UNIQUE,
    tracking_enabled TEXT NOT NULL CHECK(tracking_enabled IN ("public", "private", "disabled")),
    cstarter_good_votes INTEGER NOT NULL DEFAULT 0,
    cstarter_bad_votes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_logs(
    user_id TEXT NOT NULL,
    presence TEXT NOT NULL CHECK(presence = "online" OR presence = "idle" OR presence = "dnd" OR presence = "offline"),
    status TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    mobile BOOLEAN NOT NULL CHECK(mobile IN (0, 1)),
    desktop BOOLEAN NOT NULL CHECK(desktop IN (0, 1)),
    web BOOLEAN NOT NULL CHECK(web IN (0, 1))
);

CREATE TABLE IF NOT EXISTS counters(
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    counter_type TEXT NOT NULL CHECK(counter_type = "members" OR counter_type = "bots" OR counter_type = "all")
);

CREATE TABLE IF NOT EXISTS role_selectors(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    footer TEXT,
    color TEXT,
    roles TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_starters(
    cstarter TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    good_votes TEXT,
    bad_votes TEXT
);

CREATE TABLE IF NOT EXISTS tic_tac_toe(
    challenger INTEGER NOT NULL,
    challenged INTEGER NOT NULL,
    first_player INTEGER NOT NULL,
    board_state TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users(
    user_id TEXT PRIMARY KEY UNIQUE,
    tracking_enabled TEXT NOT NULL CHECK(tracking_enabled IN ("public", "private", "disabled"))
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
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    roles TEXT NOT NULL
);
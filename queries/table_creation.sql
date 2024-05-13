CREATE TABLE IF NOT EXISTS users(
    user_id TEXT PRIMARY KEY UNIQUE,
    tracking_enabled BOOLEAN NOT NULL CHECK(tracking_enabled IN (0, 1))
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
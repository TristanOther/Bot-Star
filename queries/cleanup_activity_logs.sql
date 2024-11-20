DELETE FROM activity_logs
WHERE rowid IN(
    SELECT t1.rowid
    FROM activity_logs t1
    JOIN activity_logs t2
    ON t1.user_id = t2.user_id
    AND t1.rowid > t2.rowid
    AND t1.presence == t2.presence
    AND t1.status == t2.status
    AND t1.mobile == t2.mobile
    AND t1.desktop == t2.desktop
    AND t1.web == t2.web
    AND ABS(t1.timestamp - t2.timestamp) <= 1000
);
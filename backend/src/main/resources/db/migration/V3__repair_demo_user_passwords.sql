-- V3__repair_demo_user_passwords.sql: Correct BCrypt password hash for seeded demo accounts
-- Standard demo password is: Password123!

UPDATE users 
SET password_hash = '$2a$10$BN/bslFU4vp3waNIPtjTuuGdES2djqMCuqD2b7ymRyG.vrEbq/0Ae'
WHERE id IN (1, 2, 3, 4, 5) 
  AND password_hash = '$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W';

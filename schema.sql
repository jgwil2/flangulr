DROP TABLE IF EXISTS entries;
CREATE TABLE entries(
  id integer PRIMARY KEY autoincrement,
  title text NOT NULL,
  text text NOT NULL
);
DROP TABLE IF EXISTS users;
CREATE TABLE users(
  id integer PRIMARY KEY autoincrement,
  name text NOT NULL,
  password text NOT NULL
);
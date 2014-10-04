DROP TABLE IF EXISTS entries;
CREATE TABLE entries(
  id integer primary key autoincrement,
  title text NOT NULL,
  text text NOT NULL
);
DROP TABLE IF EXISTS users;
CREATE TABLE users(
  id integer primary key autoincrement,
  name text NOT NULL,
  password text NOT NULL
);
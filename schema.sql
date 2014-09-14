DROP TABLE IF EXISTS entries;
CREATE TABLE entries(
  id integer primary key autoincrement,
  title text NOT NULL,
  text text NOT NULL
);

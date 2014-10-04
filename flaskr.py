import os
import sqlite3
from contextlib import closing
from flask import Flask, request, session, g, redirect, url_for, \
  abort, render_template, flash

DATABASE = 'tmp/flaskr.db'
DEBUG = True
SECRET_KEY = 'development_key'
USERNAME = 'admin'
PASSWORD = 'default'

app = Flask(__name__)
app.config.from_object(__name__)

def connect_db():
  return sqlite3.connect(app.config['DATABASE'])

def init_db():
  with closing(connect_db()) as db:
    with app.open_resource('schema.sql', mode='r') as f:
      db.cursor().executescript(f.read())
    db.commit()

@app.before_request
def before_request():
  g.db = connect_db()

@app.teardown_request
def teardown_request(exception):
  db = getattr(g, 'db', None)
  if db is not None:
    db.close()

@app.route('/')
def show_entries():
  cur = g.db.execute('SELECT id, title, text FROM entries ORDER BY id DESC')
  entries = [dict(id=row[0], title=row[1], text=row[2]) for row in cur.fetchall()]
  return render_template('show_entries.html', entries=entries)

@app.route('/register', methods=['GET', 'POST'])
def register_user():
  if request.method == 'POST':
    user_name = request.form['name']
    pass_word = request.form['password']

    # check if username is already in database and return error
    cur = g.db.execute('SELECT name, password FROM users WHERE name=?',
        [user_name])
    user = [dict(name=row[0], password=row[1]) for row in cur.fetchall()]
    if len(user) > 0:
      error = 'Username already registered'
      return render_template('register_user.html', error=error)

    # if no username comes up, insert new
    g.db.execute('INSERT INTO users (name, password) VALUES (?, ?)',
        [user_name, pass_word])
    g.db.commit()
    flash('You have successfully registered')
    return redirect(url_for('login'))

  return render_template('register_user.html')

@app.route('/add', methods=['POST'])
def add_entry():
  if not session.get('logged_in'):
    abort(401)
  g.db.execute('INSERT INTO entries (title, text) VALUES (?, ?)',
      [request.form['title'], request.form['text']])
  g.db.commit()
  flash('New entry was successfully posted')
  return redirect(url_for('show_entries'))

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_entry(id):
  if not session.get('logged_in'):
    abort(401)

  # if entry is updated, update database and return message
  if request.method == 'POST':
    g.db.execute('UPDATE entries SET title=?, text=? WHERE id=?', 
        [request.form['title'], request.form['text'], id])
    g.db.commit()
    flash('Entry ' + str(id) + ' was successfully modified')
    return redirect(url_for('show_entries'))

  cur = g.db.execute('SELECT id, title, text FROM entries WHERE id=?', [id])
  entry = [dict(id=row[0], title=row[1], text=row[2]) for row in cur.fetchall()]
  return render_template('edit_entry.html', entry=entry[0])

@app.route('/delete', methods=['POST'])
def delete_entry():
  if not session.get('logged_in'):
    abort(401)

  # if entry is deleted, delete from database
  g.db.execute('DELETE FROM entries WHERE id=?', [request.form['id']])
  g.db.commit()
  flash('Entry ' + str(request.form['id']) + ' was successfully deleted')
  return redirect(url_for('show_entries'))

@app.route('/login', methods=['GET', 'POST'])
def login():
  error = None

  # if login attempted, check for errors and log in or return error
  if request.method == 'POST':
    if request.form['username'] != app.config['USERNAME']:
      error = 'Invalid username'
    elif request.form['password'] != app.config['PASSWORD']:
      error = 'Invalid password'
    else:
      session['logged_in'] = True
      flash('You were logged in')
      return redirect(url_for('show_entries'))

  return render_template('login.html', error=error)

@app.route('/logout')
def logout():
  session.pop('logged_in', None)
  flash('You were logged out')
  return redirect(url_for('show_entries'))

if __name__ == '__main__':
  app.run(debug=True)

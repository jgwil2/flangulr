import os
import sqlite3
from contextlib import closing
from flask import Flask, request, session, g, redirect, url_for, \
    abort, render_template, jsonify

DATABASE = 'tmp/flangulr.db'
DEBUG = True
SECRET_KEY = 'development_key'

app = Flask(__name__)
app.config.from_object(__name__)

# database connection
def connect_db():
    return sqlite3.connect(app.config['DATABASE'])

# reset database
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

# registration page
@app.route('/api/users', methods=['POST'])
def register_user():
    content = request.get_json()
    user_name = content['username']
    pass_word = content['password']
    
    # check if username is already in database and return error
    cur = g.db.execute('SELECT name FROM users WHERE name=?',
            [user_name])
    user = [dict(name=row[0]) for row in cur.fetchall()]
    if len(user) > 0:
        error = 'Username already registered'
        return jsonify(message='Username already registered'), 422

    # if no username comes up, insert new and log in
    g.db.execute('INSERT INTO users (name, password) VALUES (?, ?)',
            [user_name, pass_word])
    g.db.commit()
    cur = g.db.execute('SELECT id FROM users WHERE name=?',
            [user_name])
    user = [dict(id=row[0]) for row in cur.fetchall()]
    session['logged_in'] = True
    session['username'] = user_name
    session['id'] = user[0]['id']
    return jsonify(message='You have successfuly registered')

# get all posts
@app.route('/api/posts', methods=['GET'])
def get_entries():
    cur = g.db.execute(
        'SELECT entries.id, title, text, users.id, name '
        'FROM entries, users '
        'WHERE user_id = users.id '
        'ORDER BY entries.id DESC'
    )
    entries = [dict(id=row[0], title=row[1], text=row[2], 
            user=row[3], name=row[4]) for row in cur.fetchall()]
    return jsonify(entries=entries)

# add entry url
@app.route('/api/posts', methods=['POST'])
def add_entry():
    if not session.get('logged_in'):
        abort(401)
    content = request.get_json()
    g.db.execute('INSERT INTO entries (title, text, user_id) VALUES (?, ?, ?)',
            [content['title'], content['text'], session.get('id')])
    g.db.commit()
    # return most recently added row from this cursor
    cur = g.db.execute(
        'SELECT entries.id, title, text, users.id, name '
        'FROM entries, users '
        'WHERE user_id = users.id AND entries.id = LAST_INSERT_ROWID()')
    entry = [dict(id=row[0], title=row[1], text=row[2], 
            user=row[3], name=row[4]) for row in cur.fetchall()]
    # TODO How can I make entry a normal dict and not list?
    return jsonify(message='New entry was successfully posted',
        entry=entry[0])

# edit entry page
@app.route('/api/posts/<int:id>', methods=['PUT'])
def edit_entry(id):
    content = request.get_json()
    if (not session.get('logged_in') or 
        not content['user'] == session.get('id')):
        abort(401)
    # if entry is updated, update database and return message
    g.db.execute('UPDATE entries SET title=?, text=? WHERE id=?', 
            [content['title'], content['text'], content['id']])
    g.db.commit()
    return jsonify(
        message='Entry {0} was successfully modified'.format(str(id)))

# delete page url
@app.route('/api/posts/<int:id>', methods=['DELETE'])
def delete_entry(id):
    cur = g.db.execute('SELECT user_id FROM entries WHERE id=?', [id])
    entry = [dict(user_id=row[0]) for row in cur.fetchall()]
    if (not session.get('logged_in') or 
        not entry[0]['user_id'] == session.get('id')):
        abort(401)
    # if entry is deleted, delete from database
    g.db.execute('DELETE FROM entries WHERE id=?', [id])
    g.db.commit()
    return jsonify(
        message='Entry {0} was successfully deleted'.format(str(id)))

# login page
@app.route('/auth/login', methods=['POST'])
def login():
    error = None
    # if login attempted, check for errors and log in or return error
    content = request.get_json()
    user_name = content['username']
    pass_word = content['password']
    cur = g.db.execute('SELECT id, name, password FROM users WHERE name=?',
            [user_name])
    user = [dict(id=row[0], name=row[1], password=row[2])
            for row in cur.fetchall()]
    # if username is in database, check against password
    if len(user) > 0:
        if user[0]['password'] == pass_word:
            session['logged_in'] = True
            session['username'] = user_name
            session['id'] = user[0]['id']
            return jsonify(user=user_name, message='You were logged in')
        else:
            error = 'Invalid password'
    else:
        error = 'Invalid username'

    return jsonify(message=error), 401

# logout
@app.route('/auth/logout', methods=['GET'])
def logout():
    session.pop('logged_in', None)
    return jsonify(message='You were logged out')

# index page
@app.route('/')
@app.route('/register')
@app.route('/login')
@app.route('/add')
@app.route('/edit/<int:id>')
def serve_app(id=''):
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)

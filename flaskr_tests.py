import os
import flaskr
import unittest
import tempfile

class FlaskrTestCase(unittest.TestCase):

    def setUp(self):
        self.db_fd, flaskr.app.config['DATABASE'] = tempfile.mkstemp()
        flaskr.app.config['TESTING'] = True
        self.app = flaskr.app.test_client()
        flaskr.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(flaskr.app.config['DATABASE'])

    def register(self, username, password):
        return self.app.post('/register', data = dict(
            username = username,
            password = password
            ), follow_redirects = True)

    def login(self, username, password):
        return self.app.post('/login', data = dict(
            username = username,
            password = password
            ), follow_redirects = True)

    def logout(self):
        return self.app.get('/logout', follow_redirects = True)

    def test_empty_db(self):
        rv = self.app.get('/')
        assert "Unbelievable. There's nothing here yet." in rv.data

    def test_register_logout_login(self):
        rv = self.register('admin', 'default')
        assert "You have successfully registered" in rv.data
        assert "Welcome, admin" in rv.data
        rv = self.logout()
        assert "You were logged out" in rv.data
        rv = self.login('admin', 'default')
        assert "You were logged in" in rv.data
        assert "Welcome, admin" in rv.data

    def test_register_add(self):
        self.register('admin', 'default')
        rv = self.app.post('/add', data = dict(
            title = '<Hello>',
            text = '<strong>HTML</strong> allowed here',
            ), follow_redirects = True)
        assert "Unbelievable. There's nothing here yet." not in rv.data
        assert "&lt;Hello&gt;" in rv.data
        assert "<strong>HTML</strong> allowed here" in rv.data

if __name__ == '__main__':
    unittest.main()
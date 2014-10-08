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

    def add(self, title, text):
        return self.app.post('/add', data = dict(
            title = title,
            text = text
            ), follow_redirects = True)

    def modify(self, id, title, text):
        return self.app.post('/edit/%d' %(id), data = dict(
            title = title,
            text = text
            ), follow_redirects = True)

    def delete(self, id):
        return self.app.post('/delete', data = dict(
            id = id
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

    def test_add(self):
        self.register('admin', 'default')
        rv = self.add('<Hello>', '<strong>HTML</strong> allowed here')
        assert "Unbelievable. There's nothing here yet." not in rv.data
        assert "&lt;Hello&gt;" in rv.data
        assert "<strong>HTML</strong> allowed here" in rv.data

    def test_modify(self):
        self.register('admin', 'default')
        self.add('<Test Post>', '<p>This is a test</p>')
        rv = self.modify(1, '<New Test Post>', '<p>This is a test 2</p>')
        assert "&lt;New Test Post&gt;" in rv.data
        assert "<p>This is a test 2</p>" in rv.data

    def test_delete(self):
        self.register('admin', 'default')
        self.add('<Test Post>', '<p>This is a test</p>')
        rv = self.delete(1)
        assert "Unbelievable. There's nothing here yet." in rv.data

if __name__ == '__main__':
    unittest.main()
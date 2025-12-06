// User.js
class User {
    constructor(name) {
        this.name = name;
    }
}

// AuthService.js
// import User from './User'; // Simulated import

class AuthService {
    login(username, password) {
        if (password === '123456') { // Hardcoded secret
            return new User(username);
        }
        return null;
    }
}

// App.js
// import AuthService from './AuthService';

function main() {
    const auth = new AuthService();
    const user = auth.login('admin', '123456');
    console.log(user);
}

main();

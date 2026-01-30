const fs = require("fs");
const bcrypt = require("bcryptjs");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node create-user.js <username> <password> [--role admin|user]");
  process.exit(1);
}

const username = args[0];
const password = args[1];
const roleArg = args[2];
const role = roleArg === "--role" && args[3] ? args[3] : "user";

const usersFile = "./data/users.json";
let users = {};

if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile));
}

if (users[username]) {
  console.log("User already exists!");
  process.exit(1);
}

users[username] = {
  password: bcrypt.hashSync(password, 12),
  role: role,
  permissions: {
    chat: true,
    upload: role === "admin",         // admins can upload
    delete_messages: role === "admin",
    delete_files: role === "admin",
    add_users: role === "admin"
  }
};

fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log(`User "${username}" created successfully with role "${role}"`);

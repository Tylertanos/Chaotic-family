const fs = require("fs");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: node delete-user.js <username>");
  process.exit(1);
}

const username = args[0];
const usersFile = "./data/users.json";

if (!fs.existsSync(usersFile)) {
  console.log("Users file not found!");
  process.exit(1);
}

let users = JSON.parse(fs.readFileSync(usersFile));

if (!users[username]) {
  console.log(`User "${username}" does not exist`);
  process.exit(1);
}

delete users[username];
fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log(`User "${username}" deleted successfully`);

const fs = require("fs");

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("Usage: node set-permission.js <username> <permission> <true|false>");
  process.exit(1);
}

const [username, permission, value] = args;
const boolValue = value === "true";

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

if (!users[username].permissions.hasOwnProperty(permission)) {
  console.log(`Permission "${permission}" does not exist`);
  process.exit(1);
}

users[username].permissions[permission] = boolValue;

fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log(`Permission "${permission}" for user "${username}" set to ${boolValue}`);

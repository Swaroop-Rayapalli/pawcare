const bcrypt = require('bcrypt');
const fs = require('fs');
const u1 = bcrypt.hashSync('Myfirst3768#', 10);
const adm = bcrypt.hashSync('admin345', 10);
fs.writeFileSync('d:\\Web_Projects\\PetCare\\hashes.txt', `U1:${u1}\nADM:${adm}`);

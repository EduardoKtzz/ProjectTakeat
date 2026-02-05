const bcrypt = require("bcrypt");

(async () => {
  const senha = process.argv[2];
  if (!senha) {
    console.log("Uso: node scripts/hash.js SUA_SENHA");
    process.exit(1);
  }
  const hash = await bcrypt.hash(senha, 10);
  console.log(hash);
})();

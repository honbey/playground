let VAULT_THR = 300;

while (true) {
  const vault = getBuilding("vault1");
  const unloader = getBuilding("unloader1");

  // solid items id: 0 - 15 / 21
  for (let i = 0; i < 16; ) {
    const type = lookup.item(i);
    if (vault[type] > VAULT_THR) {
      control.config(unloader, type);
      VAULT_THR = 100;
    } else {
      i++;
      VAULT_THR = 300;
      control.config(unloader, Items.copper);
    }
  }
}

const VERSION = 0.4;
print`Version: ${VERSION}
Author: Honbey
Desc: Control units to carry ammos from Core to WAR frontier.
  Switch1 as a on-off
  Switch2 controls whether to bind new units whose flag is 0
  Cell1 is not used now
  Soreter1 controls which ammo to carry
  Vault1 is default magazine, you can link more vaults, it's link is 5
`;

const DEBUG = 0;

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

// control whether to flag units
const switch2 = getBuilding("switch2");
// want ammo
const sorter = getBuilding("sorter1");

let found: boolean, cX: number, cY: number, core: AnyBuilding;

// initialize
if (Vars.unit === undefined) {
  unitBind(Units.flare);
  [found, cX, cY, core] = unitLocate.building({ group: "core", enemy: false });
  if (found) {
    unitControl.unbind();
  } else {
    endScript();
  }
}

let BIND_NUM = 8;

let firstUnit: any = undefined,
  counter: number = 0;

const amount = Vars.unit.itemCapacity;
// Insure get every vault
let i = 0;
const baseFlag =
  Math.floor(Vars.thisx) * 10000 + Math.floor(Vars.thisy) * 10 + 1;
while (i < Vars.links && getBuilding("switch1").enabled) {
  const vault = getLink(i);
  if (vault.type !== Blocks.vault) {
    i++;
    continue;
  }

  unitBind(Units.flare);

  if (Vars.unit.dead) {
    i++;
    continue;
  } else if (Vars.unit.flag === baseFlag) {
    if (DEBUG) {
      print`[gray]LOG: Sorter config: ${sorter.config}[white]\n`;
      print`[gray]LOG: Total items in Vault(Link #${i}): ${vault.totalItems}[white]\n`;
      print`[gray]LOG: Unit Counter: ${counter}[white]\n`;
    }
    if (
      sorter.config !== undefined &&
      (vault[sorter.config] < vault.itemCapacity ||
        vault[sorter.config] === undefined)
    ) {
      if (
        Vars.unit.firstItem === undefined ||
        (Vars.unit.firstItem === sorter.config &&
          Vars.unit.totalItems < amount &&
          !unitControl.within({ x: vault.x, y: vault.y, radius: 15 }))
      ) {
        unitControl.approach({ x: cX, y: cY, radius: 8 });
        // @ts-ignore
        unitControl.itemTake(core, sorter.config, amount);
      } else if (Vars.unit.firstItem !== sorter.config) {
        // don't waste
        unitControl.approach({ x: cX, y: cY, radius: 8 });
        unitControl.itemDrop(core, amount);
        // unitControl.itemDrop(Blocks.air, amount)
      } else {
        unitControl.approach({ x: vault.x, y: vault.y, radius: 8 });
        unitControl.itemDrop(vault, amount);
      }
      print`${Vars.unit} is carrying *[red]${sorter.config}[white]* `;
      print`to ${vault}[red](Link #${i})[white]...\n`;
    } else {
      // if (vault[sorter.config] === vault.itemCapacity) i++
      unitControl.approach({ x: cX, y: cY, radius: 8 });
      i++;
    }
  } else if (
    Vars.unit.flag === 0 &&
    counter <= BIND_NUM &&
    switch2.enabled === true
  ) {
    if (counter === 0) {
      firstUnit = Vars.unit;
    } else if (firstUnit !== Vars.unit && counter < BIND_NUM) {
    } else {
      //counter = 0
      //firstUnit = undefined
      continue;
    }
    counter += 1;
    unitControl.flag(baseFlag);
  } else {
    // unitControl.unbind()
    continue;
  }

  if (i === Vars.links) i = 0;

  printFlush();

  // if (core === undefined) break carry
}

// const rebind: number = getVar("@counter")
// if (found) asm`set @counter ${rebind}`

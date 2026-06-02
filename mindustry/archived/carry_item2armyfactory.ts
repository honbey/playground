const DEBUG = 0;

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

// control whether to flag units
const switch2 = getBuilding("switch2");

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
const baseFlag =
  Math.floor(Vars.thisx) * 10000 + Math.floor(Vars.thisy) * 10 + 1;
while (getBuilding("switch1").enabled) {
  const factory = getLink(2);
  unitBind(Units.flare);

  let item1: ItemSymbol = Items.silicon;
  let item2: ItemSymbol, item3: ItemSymbol, item4: ItemSymbol;
  let item1C: number, item2C: number, item3C: number, item4C: number;

  if (factory.type === Blocks.tetrativeReconstructor) {
    item1C = 2000;
    item2 = Items.plastanium;
    item2C = 1200;
    item3 = Items.surgeAlloy;
    item3C = 1000;
    item4 = Items.phaseFabric;
    item4C = 700;
  } else if (factory.type === Blocks.exponentialReconstructor) {
    item1C = 1700;
    item2 = Items.titanium;
    item2C = 1500;
    item3 = Items.plastanium;
    item3C = 1300;
  } else if (factory.type === Blocks.multiplicativeReconstructor) {
    item1C = 260;
    item2 = Items.titanium;
    item2C = 160;
    item3 = Items.metaglass;
    item3C = 80;
  }

  if (Vars.unit.dead) {
    continue;
  } else if (Vars.unit.flag === baseFlag) {
    if (DEBUG) {
      print`[gray]LOG: Total items in Vault(Link #0): ${factory.totalItems}[white]\n`;
      print`[gray]LOG: Unit Counter: ${counter}[white]\n`;
    }
    if (
      item1 !== undefined &&
      (factory[item1] < item1C || factory[item1] === undefined)
    ) {
      carry(item1, factory);
    } else if (
      item2 !== undefined &&
      (factory[item2] < item2C || factory[item2] === undefined)
    ) {
      carry(item2, factory);
    } else if (
      item3 !== undefined &&
      (factory[item3] < item3C || factory[item3] === undefined)
    ) {
      carry(item3, factory);
    } else if (
      item4 !== undefined &&
      (factory[item4] < item4C || factory[item4] === undefined)
    ) {
      carry(item4, factory);
    } else {
      // if (vault[sorter.config] === vault.itemCapacity) i++
      unitControl.approach({ x: cX, y: cY, radius: 8 });
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
}

function carry(item: ItemSymbol, building: AnyBuilding) {
  if (
    Vars.unit.firstItem === undefined ||
    (Vars.unit.firstItem === item &&
      Vars.unit.totalItems < amount &&
      !unitControl.within({ x: building.x, y: building.y, radius: 15 }))
  ) {
    unitControl.approach({ x: cX, y: cY, radius: 8 });
    // @ts-ignore
    unitControl.itemTake(core, item, amount);
  } else if (Vars.unit.firstItem !== item) {
    // don't waste
    unitControl.approach({ x: cX, y: cY, radius: 8 });
    unitControl.itemDrop(core, amount);
    // unitControl.itemDrop(Blocks.air, amount)
  } else {
    unitControl.approach({ x: building.x, y: building.y, radius: 8 });
    unitControl.itemDrop(building, amount);
    // xtodo count how many items have been carried
  }
  print`${Vars.unit} is carrying *[red]${item}[white]* `;
  print`to ${building}[red](Link #0)[white]...\n`;
}

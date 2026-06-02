/**
 * Filename: windswept_islands_t.ts
 * Author: Honbey
 * Desc: Logic for sector Windswept Islands
 * Date: 2024-05-27
 * Editor: https://mlogjs.github.io/mlogjs/editor.html
 * ***ARCHIVED***
 **/

const DEBUG = 0;
let startTime: number,
  endTime: number,
  totalTimeIndex: number,
  avgCostTimeIndex: number;

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

let _: any, __: any, cX: number, cY: number, core: AnyBuilding;
let impactVault: AnyBuilding, thoriumVault: AnyBuilding;

if (Vars.unit !== undefined) {
  [_, cX, cY, core] = unitLocate.building({ group: "core", enemy: false });
} else {
  [cX, cY] = [200, 200];
}

const mBank = getBuilding("bank1");
const $ = new Memory(mBank, 512);
const arc = getBuilding("arc1");
const baseFlag = Math.floor(Vars.thisx) * 10000 + Math.floor(Vars.thisy) * 10;

/** Memory Index */
const firstRunFlag = 0;
const runCounter = 1;
const mineSwitchIndex = 2;
const impactVaultSwitchIndex = 3;
const impactVaultThreshold1Index = 4;
const impactVaultThreshold2Index = 5;
const impactVaultX = 6;
const impactVaultY = 7;
const thoriumVaultX = 8;
const thoriumVaultY = 9;

if (impactVault === undefined) {
  impactVault = unitControl.getBlock($[impactVaultX], $[impactVaultY])[1];
}
if (thoriumVault === undefined) {
  thoriumVault = unitControl.getBlock($[thoriumVaultX], $[thoriumVaultY])[1];
}

if (DEBUG) {
  print`[gray]LOG: DEBUG MODE[white]\n`;
  startTime = Vars.time;
  totalTimeIndex = 511;
  avgCostTimeIndex = 510;
}

print`[blue]Windswept Islands\n[white]
  Played Time: ${Math.ceil(Vars.minute)} minutes
  Main Output:
             
  Core  Info:
    Position: [${core.x}, ${core.y}]
    Item Capacity: ${core.itemCapacity}
    Total Items: ${core.totalItems}
    Health: ${core.health}
  Processor Info:
    Type: ${Vars.this}
    Health: ${Vars.this.health},
    [sky]Cryofluid: ${Math.ceil(Vars.this.cryofluid)}[white]`;

printFlush(getBuilding("message5"));

/**
  Memory Allocation
    Index 0 to identify first run
    Index 1 to identify run time(s)
    Index 2 mine switch flag
      0x1: copper
      0x2: lead
      0x3: sand / dark sand
      0x4: scrap
      0x5: coal
      0x6: titanium
 */
if ($[firstRunFlag] == 0) {
  // initialize
  $[firstRunFlag] = 1;
  $[mineSwitchIndex] = 0x1;
  $[impactVaultSwitchIndex] = 0x1;
  $[impactVaultThreshold1Index] = 300;
  $[impactVaultThreshold2Index] = 800;
  $[impactVaultX] = 180;
  $[impactVaultY] = 195;
  $[thoriumVaultX] = 256;
  $[thoriumVaultY] = 329;
  $[runCounter] = 1;
} else {
  $[runCounter] += 1;
}

// item full rate of core
const copperInCore = core.copper / core.itemCapacity;
const leadInCore = core.lead / core.itemCapacity;
const sandInCore = core.sand / core.itemCapacity;
const scrapInCore = core.scrap / core.itemCapacity;
// threshold
// min item capacity
const minItemRate = 0.3;
// max item capacity
const maxItemRate = 0.99;

/*********************************** Mono Logic *********************************/
unitBind(Units.mono);

const monoItemCapacity = 20;

// the unit is alive and not binded by other processor
if (Vars.unit.dead) {
  unitControl.unbind();
} else if (baseFlag < Vars.unit.flag && Vars.unit.flag < baseFlag + 9) {
  monoOp();
} else if (Vars.unit.flag == 0) {
  /**
      Group 1 - 4 by coordinate (if map size less than 999 x 999)
            ^           (999, 999)
            |  2     1
            |     *
            |  3     4
     (0, 0) |----------->

      flag x1 x2 x3 y1 y2 y3 G
           -  -  -  -  -  -  -
     */
  if (Vars.unit.x > Vars.thisx && Vars.unit.y > Vars.thisy) {
    unitControl.flag(baseFlag + 1);
  } else if (Vars.unit.x < Vars.thisx && Vars.unit.y > Vars.thisy) {
    unitControl.flag(baseFlag + 2);
  } else if (Vars.unit.x < Vars.thisx && Vars.unit.y < Vars.thisy) {
    unitControl.flag(baseFlag + 3);
  } else {
    // if (Vars.unit.x > Vars.thisx && Vars.unit.y < Vars.thisy)
    unitControl.unbind(); // only need 3 groups
  }
} else {
  unitControl.unbind();
}

function monoOp() {
  const flag = Math.floor(Vars.unit.flag - baseFlag);
  switch (flag) {
    case 1:
      printUnitInfo();
      // Mine
      // if (countUnits(1, 6, false)) {
      //     monoMine()
      // }
      mining(Items.copper);
      printFlush(getBuilding("message1"));
      break;
    case 2:
      printUnitInfo();
      //if (countUnits(2, 4, false)) {
      // if (copperInCore < minItemRate
      //     || leadInCore < minItemRate
      //     || sandInCore < minItemRate
      //     || scrapInCore < minItemRate) {
      //     monoMine(minItemRate * 2.5)
      // } else {
      //     unitControl.idle()
      // }
      // monoMine()
      mining(Items.lead);
      //}
      printFlush(getBuilding("message2"));
      break;
    case 3:
      printUnitInfo();
      if (countUnits(3, 2, false)) {
        monoTransForImpact();
      }
      printFlush(getBuilding("message3"));
      break;
    default:
      unitControl.unbind();
  }
}

// core.itemCapacity threshold
function monoMine(threshold: number = maxItemRate) {
  if (DEBUG) {
    print`[gray]LOG: Mine Switch - ${$[mineSwitchIndex]}[white]\n`;
    print`[gray]LOG: Copper in C - ${copperInCore}[white]\n`;
    print`[gray]LOG: Lead in C - ${leadInCore}[white]\n`;
  }
  switch ($[mineSwitchIndex]) {
    case 0x1:
      if (copperInCore <= threshold) {
        mining(Items.copper, monoItemCapacity);
      } else {
        $[mineSwitchIndex] += 1;
      }
      break;
    case 0x2:
      if (leadInCore <= threshold) {
        mining(Items.lead, monoItemCapacity);
      } else {
        $[mineSwitchIndex] += 1;
      }
      break;
    case 0x3:
      if (sandInCore <= threshold) {
        mining(Items.sand, monoItemCapacity);
      } else {
        $[mineSwitchIndex] += 1;
      }
      break;
    case 0x4:
      if (scrapInCore <= threshold) {
        mining(Items.scrap);
      } else {
        $[mineSwitchIndex] += 1;
      }
      break;
    default:
      $[mineSwitchIndex] = 0x1;
      unitControl.unbind();
  }
}

function monoTransForImpact() {
  if (DEBUG) {
    print`[gray]LOG: Vault Switch - ${$[impactVaultSwitchIndex]}[white]\n`;
    print`[gray]LOG: Vault 1 - ${impactVault}[white]\n`;
    print`[gray]LOG: Vault 2 - ${thoriumVault}[white]\n`;
    print`[gray]LOG: Threshold 1 - ${$[impactVaultThreshold1Index]}\n`;
    print`[gray]LOG: Threshold 2 - ${$[impactVaultThreshold2Index]}\n`;
    print`[gray]LOG: Ti in V1 - ${impactVault[Items.titanium]}\n`;
    print`[gray]LOG: Th in V1 - ${impactVault[Items.thorium]}\n`;
  }
  if (impactVault === undefined) {
    unitControl.move($[impactVaultX], $[impactVaultY]);
  }
  switch ($[impactVaultSwitchIndex]) {
    case 0x1:
      if (impactVault[Items.titanium] > $[impactVaultThreshold1Index]) {
        $[impactVaultThreshold1Index] = 100;
        impact2Dest(
          Items.titanium,
          thoriumVault,
          $[thoriumVaultX],
          $[thoriumVaultY],
        );
      } else {
        $[impactVaultThreshold1Index] = 360;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x2:
      if (impactVault[Items.thorium] > $[impactVaultThreshold1Index]) {
        $[impactVaultThreshold1Index] = 20;
        impact2Dest(
          Items.thorium,
          thoriumVault,
          $[thoriumVaultX],
          $[thoriumVaultY],
        );
      } else {
        $[impactVaultThreshold1Index] = 360;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x3:
      if (impactVault[Items.copper] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.copper, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x4:
      if (impactVault[Items.lead] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.lead, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x5:
      if (impactVault[Items.sand] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.sand, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x6:
      if (impactVault[Items.coal] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.coal, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x7:
      if (impactVault[Items.pyratite] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.pyratite, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x8:
      if (impactVault[Items.sporePod] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.sporePod, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    case 0x9:
      if (impactVault[Items.graphite] > $[impactVaultThreshold2Index]) {
        $[impactVaultThreshold1Index] = 500;
        impact2Dest(Items.graphite, core, cX, cY);
      } else {
        $[impactVaultThreshold2Index] = 800;
        $[impactVaultSwitchIndex] += 1;
      }
      break;
    default:
      $[impactVaultSwitchIndex] = 0x1;
  }
}

function impact2Dest(
  item: ItemSymbol,
  dest: AnyBuilding,
  bx: number,
  by: number,
) {
  if (
    Vars.unit.firstItem === undefined ||
    (Vars.unit.firstItem == item && Vars.unit.totalItems < 20)
  ) {
    takeFromStorage(impactVault, item, 20, $[impactVaultX], $[impactVaultY]);
  } else if (Vars.unit.firstItem != item) {
    drop2Building(impactVault, 20, $[impactVaultX], $[impactVaultY]);
  } else {
    drop2Building(dest, 20, bx, by);
  }
}

function mining(item: ItemSymbol, amount: number = 20) {
  print`[forest]  Mining State: ${item}[white]\n`;
  const [found, x, y] = unitLocate.ore(item);
  if (!found) {
    print`[red]WARNING: Can not find ore ${item}[white]\n`;
    $[mineSwitchIndex] += 1;
  } else if (
    Vars.unit.firstItem === undefined ||
    (Vars.unit.totalItems < amount && Vars.unit.firstItem == item)
  ) {
    unitControl.approach({ x, y, radius: 6 });
    unitControl.mine(x, y);
  } else if (Vars.unit.firstItem != item) {
    unitControl.move(Vars.unit.x + 10, Vars.unit.y + 10);
    unitControl.itemDrop(Blocks.air, amount);
  } else {
    drop2Core(amount);
  }
}

function drop2Core(amount: number = 20) {
  if (/** full then drop */ core.itemCapacity == core[Vars.unit.firstItem]) {
    unitControl.itemDrop(Blocks.air, amount);
  } else {
    unitControl.approach({ x: cX, y: cY, radius: 6 });
    unitControl.itemDrop(core, amount);
  }
}

function drop2Building(
  building: AnyBuilding,
  amount: number = 20,
  bx: number,
  by: number,
) {
  let x: number, y: number;
  if (building === undefined) {
    (x = bx), (y = by);
  } else {
    x = building.x;
    y = building.y;
  }
  /** full(95%) then drop to core */
  const fullRate = building[Vars.unit.firstItem] / building.itemCapacity;
  if (fullRate > 0.98) {
    drop2Core();
  } else {
    unitControl.approach({ x, y, radius: 3 });
    unitControl.itemDrop(building, amount);
  }
}

function takeFromStorage(
  building: AnyBuilding,
  type: ItemSymbol,
  amount: number = 20,
  bx,
  by,
) {
  let x: number, y: number;
  if (building === undefined) {
    [x, y] = [bx, by];
  } else {
    [x, y] = [building.x, building.y];
  }
  unitControl.approach({ x, y, radius: 3 });
  unitControl.itemTake(building, type, amount);
}

function countUnits(gid: number = 1, n: number = 1, reset: boolean = false) {
  // INFO: must reset all group or will have unexpectional case
  if (reset) {
    unitControl.flag(baseFlag + gid);
    control.shoot({ building: arc, x: 0, y: 0, shoot: false });
    return false;
  }

  if (Vars.unit.flag > baseFlag + gid) {
    if (Vars.unit.dead) {
      arc.shootX - Math.pow(10, n);
      unitControl.unbind;
    } /** TODO */
    return true;
  }

  if (arc.shootX === undefined) {
    control.shoot({ building: arc, x: 0, y: 0, shoot: false });
    return false;
  }

  const counter = getFlagPos(arc.shootX, n);
  if (DEBUG) {
    print`[gray]LOG: Counter - ${counter}[white]\n`;
  }

  const unitA = radar({
    building: arc,
    filters: ["ally", "attacker", "flying"],
    order: true,
    sort: "distance",
  });

  if (Math.abs(unitA.flag - Math.floor(unitA.flag)) > 0) {
    if (DEBUG) {
      print`[gray]LOG: The radar unit has been counted[white]\n`;
    }
    return true;
  }

  if (
    unitControl.within({ x: arc.x, y: arc.y, radius: arc.range }) &&
    unitA.flag == baseFlag + gid
  ) {
    control.shoot({
      building: arc,
      x: arc.shootX + Math.pow(10, n),
      y: 0,
      shoot: false,
    });
    unitControl.flag(baseFlag + gid + (counter + 1) / 100);
    if (DEBUG) {
      print`[gray]LOG: Set fraction flag[white]\n`;
    }
    return true;
  } else {
    if (DEBUG) {
      print`[gray]LOG: Approach Arc[white]\n`;
    }
    unitControl.approach({ x: arc.x, y: arc.y, radius: Math.rand(6) });
    return false;
  }
}

function getFlagPos(n: number, pos: number) {
  const digit1 = Math.floor(n / Math.pow(10, pos)) % 10;
  const digit2 = Math.floor(n / Math.pow(10, pos + 1)) % 10;
  return digit2 * 10 + digit1;
}

function printUnitInfo() {
  print`Unit Info (${Math.floor(Vars.unit.x)}, ${Math.floor(Vars.unit.y)}),
  Health: ${Vars.unit.health}
  First Item: ${Vars.unit.firstItem}
  Total Items: ${Vars.unit.totalItems}
  [red]Flag: ${Vars.unit.flag}[white]
`;
}

if (DEBUG) {
  const endTime = Vars.time;
  const costTime = Math.ceil(endTime - startTime);
  $[totalTimeIndex] += costTime;
  if ($[totalTimeIndex] > 0xfff) {
    $[avgCostTimeIndex] = Math.ceil($[totalTimeIndex] / $[runCounter]);
    // INFO: run counter is rest in debug mode
    $[runCounter] = 0;
    $[totalTimeIndex] = 0;
  }
  print`[gray]LOG: Cost Time - ${costTime}ms[white]\n`;
  print`[gray]LOG: Avg Cost Time - ${$[avgCostTimeIndex]}ms[white]\n`;
  printFlush(getBuilding("message6"));
}

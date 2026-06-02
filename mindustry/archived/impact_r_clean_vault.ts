/**
 * Filename: impact_r_clean_vault.ts
 * Author: Honbey
 * Desc: Logic for my 3 Impact Reactor Schematics
 * Date: 2024-05-25
 * Editor: https://mlogjs.github.io/mlogjs/editor.html
 * ***DEPRECATED*** ***ARCHIVED***
 **/

const [tx, ty] = [428, 317];

const mCell = getBuilding("cell1");
const memory = new Memory(mCell, 64);

asm`write 428 cell1 5`;
asm`write 317 cell1 6`;

const vault = getBuilding("vault1");
const unloader = getBuilding("unloader1");
const message = getBuilding("message1");
print`Cell: ${mCell}
Vault: ${vault}
Unloader: ${unloader}
Message: ${message}
memory[1](0xa): ${memory[1]}
memory[2](0xb): ${memory[2]}`;

// if some threshold has changed in code, uncomment this to initialize
// memory[0] = 0

if (memory[0] == 0) {
  memory[0]++;
  // initialize
  memory[1] = 0xa1;
  // titanium and thorium logic, those two items that transfer by units howerver
  // others by Incinerator so can be parallel ran
  memory[2] = 0xb1;

  // common threshold
  memory[3] = 300;

  // titanium threshold
  memory[4] = 700;

  // thorium reactor input storage coordinate ([5], [6]) -> (x, y)
  memory[5] = tx;
  memory[6] = ty;
  // thorium threshold
  memory[7] = 300;
}

function setUld(
  n: number = 1,
  item: ItemSymbol = Items.copper,
  amount: number = 300,
) {
  // control.enabled(unloader, false)
  memory[1] += n;
  memory[3] = amount;
  control.config(unloader, item);
}

switch (memory[1]) {
  /**
     copper
       drop by Incinerator
       about 4.3 / s (41.6% of 0.72 / s * 6)
     */
  /**
    case 0xa1:
        if (vault[Items.copper] > 300) {
            setUld(0, Items.copper)
        } else {
            setUld()
        }
        break
     */
  /**
        don't judge amount of copper to reduce codes line,
        and this case just self-add then next
     */
  case 0xa1:
    memory[1] += 1;
  /**
     graphite
       drop by Incinerator
       about 2.54 / s (16.6% of 0.19 / s * 6 + 20% of 0.8 / s)
     */
  case 0xa2:
    if (vault[Items.graphite] > memory[3]) {
      // setUld(0, Items.graphite)
      memory[3] = 20;
      control.config(unloader, Items.graphite);
    } else {
      setUld();
    }
    break;
  /*
     lead
       for Pyratite Mixer, surplus drop by Incinerator
       about 2.58 / s (25 % of 0.43 / s * 6)
     */
  case 0xa3:
    if (vault[Items.lead] > memory[3]) {
      memory[3] = 20;
      control.config(unloader, Items.lead);
    } else {
      setUld();
    }
    break;
  /*
     sand
       for Pyratite Mixer, surplus drop by Incinerator
       about 3.1 / s (40 % of 1.6 / s + 1.5 / s)
     */
  case 0xa4:
    if (vault[Items.sand] > memory[3]) {
      memory[3] = 20;
      control.config(unloader, Items.sand);
    } else {
      setUld();
    }
    break;
  /**
     coal
       for Pyratite Mixer, surplus drop by Incinerator
       about 0.66 / s (33% of 2 / s)
     */
  case 0xa5:
    if (vault[Items.coal] > memory[3]) {
      memory[3] = 20;
      control.config(unloader, Items.coal);
    } else {
      setUld();
    }
    break;
  /**
     spore pod
       for Blast Mixer, surplus drop by Incinerator
       about 1.8 / s (theoritical) (0.6 / s * 3)
      */
  case 0xa6:
    if (vault[Items.sporePod] > memory[3]) {
      memory[3] = 100;
      control.config(unloader, Items.sporePod);
    } else {
      setUld();
    }
    break;
  /**
     pyratite
       for Blast Mixer, output of two Pyratite, surplus drop by Incinerator
       about of 1.5 / s (theoritical) (0.75 / s * 2)
      */
  case 0xa7:
    if (vault[Items.pyratite] > memory[3]) {
      memory[3] = 200;
      control.config(unloader, Items.pyratite);
    } else {
      setUld();
    }
    break;
  /*
     blastCompound
       NULL
     */
  // case 0xb:
  default:
    control.config(unloader, Items.copper);
    memory[1] = 0xa1;
  // or set an unimpossible output Items
}

/*********************************** Unit ********************************/

unitBind(Units.mono);
// unitControl.flag(Vars.thisx * 1000 + Vars.thisy)

unitOP(Vars.unit.firstItem);

switch (memory[2]) {
  /**
     titanium
       supply to cryofluid, surplus to core by units
       about 2.54 / s (16.6% of 0.19 / s * 6 + 20% of 0.8 / s)
     */
  case 0xb1:
    if (vault[Items.titanium] > memory[4]) {
      memory[4] = 20;
      unitOP(Items.titanium);
    } else {
      memory[4] = 700;
      memory[2] += 1;
    }
    break;
  /**
     thorium
       all output to Reactor (near Vault)
       about 0.8 / s (20% of 0.8 / s)
     */
  case 0xb2:
    if (vault[Items.thorium] > memory[7]) {
      memory[7] = 20;
      unitOP(Items.thorium);
    } else {
      memory[7] = 300;
      memory[2] += 1;
    }
    break;
  /* TODO: drop other excess items
    case 0xb3:
        if (vault.graphite > 300) {
            // const chooseType = Math.max(vault[Items.copper], vault[Items.graphite])
            unitOP(Items.graphite)
        } else {
            memory[2] += 1
        }*/
  default:
    memory[2] = 0xb1;
}

function dropToCore(amount: number = 20) {
  const [_, x, y, core] = unitLocate.building({ group: "core", enemy: false });
  if (/** full then drop */ core.itemCapacity == core[Vars.unit.firstItem]) {
    unitControl.itemDrop(Blocks.air, amount);
  } else {
    unitControl.approach({ x, y, radius: 3 });
    unitControl.itemDrop(core, amount);
  }
}

function dropToBuilding(building: AnyBuilding, amount: number = 20) {
  /** full(95%) then drop to core */
  const fullRate = building[Vars.unit.firstItem] / building.itemCapacity;
  if (fullRate > 0.95) {
    dropToCore();
  } else {
    unitControl.approach({ x: building.x, y: building.y, radius: 3 });
    unitControl.itemDrop(building, amount);
  }
}

function takeFromStorage(type: ItemSymbol, amount: number = 20) {
  const { x, y } = vault;
  unitControl.approach({ x, y, radius: 3 });
  unitControl.itemTake(vault, type, amount);
}

function myPrint(v: any) {
  print`[red][${v}]\n[white]`;
}

function unitOP(item: ItemSymbol) {
  // no item in bag or has titanium / thorium
  if (
    Vars.unit.totalItems == 0 ||
    Vars.unit.firstItem == Items.titanium ||
    Vars.unit.firstItem == Items.thorium
  ) {
    /* full of titanium */
    if (Vars.unit.totalItems == 20 && Vars.unit.firstItem == Items.titanium) {
      dropToCore();
    } /* full of thorium*/ else if (
      Vars.unit.totalItems == 20 &&
      Vars.unit.firstItem == Items.thorium
    ) {
      const [_, trStorage, __] = unitControl.getBlock(memory[5], memory[6]);
      // TODO: can't get building in (x, y)?
      if (trStorage === undefined)
        unitControl.approach({ x: memory[5], y: memory[6], radius: 3 });
      else dropToBuilding(trStorage);
    } /* has titanium / thorium */ else {
      // else if (Vars.unit.totalItems < 20) {
      takeFromStorage(item);
    }
  } /* others items */ else {
    dropToCore();
  }
}

printFlush();

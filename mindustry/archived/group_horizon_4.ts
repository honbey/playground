print("[blue]Horizon Logic V0.03\n[white]");
// print`Units in Group 1: ${getFlagPos(arc.shootX, 6)}`
print`Processor Info:
type: ${Vars.this}, health: ${Vars.this.health},
[blue]cryofluid: ${Vars.this.cryofluid}[white],
thisx: ${Math.floor(Vars.thisx)}, thisy: ${Math.floor(Vars.thisy)},
`;

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

printFlush(getBuilding("message5"));

const rebind: number = getVar("@counter");
unitBind(Units.horizon);

const arc = getBuilding("arc1");
const baseFlag = Math.floor(Vars.thisx) * 10000 + Math.floor(Vars.thisy) * 10;

// the unit is alive and not binded by other processor
if (Vars.unit.dead) {
  unitControl.unbind();
} else if (baseFlag < Vars.unit.flag && Vars.unit.flag < baseFlag + 9) {
  unitOP();
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
    unitControl.flag(baseFlag + 4);
  }
} else {
  unitControl.unbind();
}

function unitOP() {
  const flag = Math.floor(Vars.unit.flag - baseFlag);
  switch (flag) {
    case 1:
      // const [_, x, y, core] = unitLocate.building({ group: "core", enemy: false })
      // unitControl.approach({ x, y, radius: 5 })
      const hasCount1: boolean = countUnits(1, 6, false);
      if (hasCount1) {
        horizonAttack(500, 300);
      }
      printUnitInfo();
      printFlush(getBuilding("message1"));
      break;
    case 2:
      const hasCount2: boolean = countUnits(2, 4, false);
      if (hasCount2) {
        unitControl.move(Vars.thisx - 15, Vars.thisy + 15);
      }
      printUnitInfo();
      printFlush(getBuilding("message2"));
      break;
    case 3:
      const hasCount3: boolean = countUnits(3, 2, false);
      if (hasCount3) {
        unitControl.move(Vars.thisx - 15, Vars.thisy - 15);
      }
      printUnitInfo();
      printFlush(getBuilding("message3"));
      break;
    case 4:
      const hasCount4: boolean = countUnits(4, 0, false);
      if (hasCount4) {
        unitControl.move(Vars.thisx + 15, Vars.thisy - 15);
      }
      printUnitInfo();
      printFlush(getBuilding("message4"));
      break;
    default:
      unitControl.unbind();
  }
}

function countUnits(gid: number = 1, n: number = 1, reset: boolean = false) {
  if (reset) {
    unitControl.flag(baseFlag + gid);
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
    control.shoot({ building: arc, x: 0, y: 0, shoot: true });
    return false;
  }

  const counter = getFlagPos(arc.shootX, n);

  const unitA = radar({
    building: arc,
    filters: ["ally", "attacker", "flying"],
    order: true,
    sort: "distance",
  });

  if (Math.abs(unitA.flag - Math.floor(unitA.flag)) > 0) return true;

  if (
    unitControl.within({ x: arc.x, y: arc.y, radius: arc.range }) &&
    unitA.flag == baseFlag + gid
  ) {
    control.shoot({
      building: arc,
      x: arc.shootX + Math.pow(10, n),
      y: 0,
      shoot: true,
    });
    unitControl.flag(baseFlag + gid + (counter + 1) / 100);
    return true;
  } else {
    unitControl.approach({ x: arc.x, y: arc.y, radius: Math.rand(6) });
    return false;
  }
}

function horizonAttack(x: number, y: number) {
  if (unitControl.within({ x, y, radius: 3 })) {
    const [rX1, rY1] = [Math.rand(2), Math.rand(2)];
    const [rX2, rY2] = [Math.rand(2), Math.rand(2)];
    const [rX, rY] = [Math.max(rX1, rX2), Math.max(rY1, rY2)];
    unitControl.approach({ x: x + rX, y: y + rY, radius: 1 });
    // unitControl.target({ x: x + rX, y: y + rY, shoot: true })
    unitControl.targetp({ unit: Vars.unit, shoot: true });
  } else {
    unitControl.approach({ x: x, y: y, radius: 1 });
    // unitControl.target({ x: x, y: y, shoot: true })
    unitControl.targetp({ unit: Vars.unit, shoot: true });
  }
}

function getFlagPos(n: number, pos: number) {
  const digit1 = Math.floor(n / Math.pow(10, pos)) % 10;
  const digit2 = Math.floor(n / Math.pow(10, pos + 1)) % 10;
  return digit2 * 10 + digit1;
}

function printUnitInfo() {
  print`Unit Info:
x: ${Math.floor(Vars.unit.x)}, y: ${Math.floor(Vars.unit.y)},
health: ${Vars.unit.health}, controlled: ${Vars.unit.controlled},
shoting: ${Vars.unit.shooting}, [red]flag: ${Vars.unit.flag}[white]
`;
}

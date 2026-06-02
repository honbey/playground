const repairPoint = getBuilding("point1");

const TEST = "enemy"; // ally or enemy

let NUM = 12;
let unitType: UnitSymbol = Units.dagger;

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

let firstUnit: any = undefined,
  unitCount: number = 0;
const baseFlag = Math.floor(Vars.thisx) * 10000 + Math.floor(Vars.thisy) * 10;

while (true) {
  // @ts-ignore
  unitBind(unitType);

  if (unitCount < NUM) {
    unitControl.approach({ x: Vars.thisx, y: Vars.thisy, radius: 10 });
  }

  if (Vars.unit === undefined) break;

  print`Counting ${Vars.unit}... `;
  print`${unitCount}\n`;
  printFlush();

  if (unitCount === 0) {
    firstUnit = Vars.unit;
    unitCount += 1;
  } else if (Vars.unit !== firstUnit) {
    unitCount += 1;
  } else {
    break;
  }
}

firstUnit == undefined;
const maxHealth = NUM * Vars.unit.maxHealth;
let currHealth = 0;
let oldRate = 0;

while (unitCount >= NUM) {
  const enemy = unitRadar({
    filters: [TEST, "any", "any"],
    order: true,
    sort: "distance",
  });

  const rebind: number = getVar("@counter");
  unitBind(unitType);

  if (Vars.unit.health / Vars.unit.maxHealth < 0.5) {
    unitControl.approach({ x: repairPoint.x, y: repairPoint.y, radius: 6 });
  } else if (enemy !== undefined && !enemy.dead) {
    unitControl.approach({
      x: enemy.x,
      y: enemy.y,
      radius: Vars.unit.range - 1,
    });
    // unitControl.target({ x: unit.x, y: unit.y, shoot: true })
  } else if (Vars.unit.health === Vars.unit.maxHealth) {
    asm`ucontrol autoPathfind 0 0 0 0 0`;
    // unitControl.approach({ x: Vars.thisx, y: Vars.thisy, radius: 20 })
  }

  oldRate = currHealth / maxHealth;
  if (currHealth === 0) {
    firstUnit = Vars.unit;
    currHealth += Vars.unit.health;
  } else if (Vars.unit !== firstUnit) {
    currHealth += Vars.unit.health;
  } else {
    if (oldRate < 0.75) {
      endScript();
    }
    print`Ally - Helath Rete: ${oldRate}\n`;
    print`Enemy: ${enemy} (${Math.floor(enemy.x)}, ${Math.floor(enemy.y)})\n`;
    print` Health: ${enemy.health} , Max Helath: ${enemy.maxHealth}\n`;
    printFlush();
    currHealth = 0;
  }

  if (
    enemy !== undefined &&
    !enemy.dead &&
    Math.sqrt(
      Math.pow(enemy.x - Vars.unit.x, 2) + Math.pow(enemy.y - Vars.unit.y, 2),
    ) <
      Vars.unit.range + 15
  ) {
    unitControl.targetp({ unit: enemy, shoot: true });
    asm`set @counter ${rebind}`;
  }
}

let MAX = 24;

const factory = getBuilding("factory2");

let firstUnit: any = undefined,
  unitCount: number = 0;

print`Counting ${factory.config}...\n`;

count: while (factory.config !== undefined) {
  // @ts-ignore
  unitBind(factory.config);

  if (Vars.unit === undefined) break count;

  if (unitCount === 0 && Vars.unit.health > 0) {
    firstUnit = Vars.unit;
    unitCount += 1;
  } else if (Vars.unit !== firstUnit && Vars.unit.health > 0) {
    unitCount += 1;
  } else {
    print`unitCount: ${unitCount}\n`;
    printFlush();
    break count;
  }
}

control.enabled(factory, unitCount >= MAX ? false : true);
// wait(1)

const DEBUG = 0;
const TEST = "enemy"; // ally or enemy

const generator = getBuilding("generator1");
const node = getBuilding("node1");
// const repairPoint = getBuilding("point1")

const mender1 = getBuilding("mender1");
const mender2 = getBuilding("mender2");
const mender3 = getBuilding("mender3");

const enemy = radar({
  building: Vars.this,
  filters: [TEST, "any", "any"],
  order: true,
  sort: "distance",
});

control.enabled(mender1, enemy === undefined ? false : true);
control.enabled(mender2, enemy === undefined ? false : true);
control.enabled(mender3, enemy === undefined ? false : true);

if (node.powerNetStored > 45000) {
  control.enabled(generator, false);
} else if (node.powerNetStored < 10000) {
  control.enabled(generator, true);
}

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

const switch2 = getBuilding("switch2");

for (let i = 2; i < Vars.links; i++) {
  const turret = getLink(i);
  const unit = radar({
    building: turret,
    filters: ["enemy", "any", "any"],
    order: switch2.enabled,
    sort: "distance",
  });
  control.shootp({
    building: turret,
    unit,
    shoot: true,
  });
}

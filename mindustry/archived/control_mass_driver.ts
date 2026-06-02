for (let i = 0; i < Vars.links; i++) {
  const building = getLink(i);
  if (building.type !== Blocks.massDriver) continue;
  control.enabled(
    building,
    building.totalItems >= building.itemCapacity ? true : false,
  );
}

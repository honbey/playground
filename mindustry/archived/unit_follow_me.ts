/**
 * Filename: unit_follow_me.ts
 * Author: Honbey
 * Desc: Let unit follow me more stable
 * Date: 2024-05-28
 * Editor: https://mlogjs.github.io/mlogjs/editor.html
 **/

const { enabled } = getBuilding("switch1");
if (!enabled) endScript();

const player = unitRadar({
  filters: ["player", "any", "any"],
  order: true,
  sort: "distance",
});

function freeToBind() {
  unitBind(Units.flare);
  if (Vars.unit.flag == 0) {
    // set flag or other
  } else {
    unitControl.unbind();
  }
}

const rebind: number = getVar("@counter");
freeToBind();

//            player   logic
// controlled 2        1
// controller flare    processor
if (player != undefined && !player.dead && player.controlled == 2) {
  unitControl.approach({ x: player.x, y: player.y, radius: 5 });
  unitControl.targetp({ unit: player, shoot: false });
  // function return cost an address
  asm`set @counter ${rebind + 1}`;
} else {
  // locate core and go to
  endScript;
}

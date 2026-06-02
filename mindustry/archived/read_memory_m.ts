/**
 * Filename: read_memory_m.ts
 * Author: Honbey
 * Desc: Read and Display Memory Cell/Bank by Message
 * Date: 2024-05-29
 * Editor: https://mlogjs.github.io/mlogjs/editor.html
 **/

const switch1 = getBuilding("switch1");
const switch2 = getBuilding("switch2");
const memory = getLink(3);

print`[gray]Traverse a Memory Cell(Bank) - \n`;

const size = memory.type === Blocks.memoryCell ? 64 : 512;
const cell = new Memory(memory, size);

const totalPages = size / 8;

let page: number;

if (switch1.enabled) {
  page = (page - 1 + 8) % totalPages;
  control.enabled(switch1, false);
}

if (switch2.enabled) {
  page = (page + 1) % totalPages;
  control.enabled(switch2, false);
}

page = Math.max(page, 0);
print`${page + 1} / ${totalPages}[white]\n`;

draw.clear(0, 0, 0);
if (memory.dead === false) {
  for (let i = page * 8; i < (page + 1) * 8; i++) {
    print`Memory[${i}]:   [red]${cell[i]}[white]\n`;
  }
  printFlush();
  drawFlush();
}

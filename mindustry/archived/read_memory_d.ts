/**
 * Filename: read_memory_d.ts
 * Author: Honbey
 * Desc: Read and Display Memory Cell/Bank by Display
 * Date: 2024-05-29
 * Editor: https://mlogjs.github.io/mlogjs/editor.html
 **/

const switch1 = getBuilding("switch1");
const switch2 = getBuilding("switch2");
const memory = getLink(3);

// print`[gray]Traverse a Memory Cell(Bank) - \n`

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
// print`${page + 1} / ${totalPages}[white]\n`

draw.clear(0, 0, 0);
if (memory.dead === false) {
  for (let i = page * 8; i < (page + 1) * 8; i++) {
    //print`Memory[${i}]:   [red]${cell[i]}[white]\n`
    show(i, cell[i]);
  }
  // printFlush()
  drawFlush();
}

// small display 80 x 80
function show(i: number, n: number) {
  draw.color(119, 136, 153);
  let w1 = i < 10 ? 1 : Math.floor(Math.log10(i)) + 1;
  let w2 = n < 10 ? 1 : Math.floor(Math.log10(n)) + 1;
  let [x, y] = [12, 70 - (i % 8) * 10];
  for (let w = 0; w < w1; w++, x -= 6, i = Math.idiv(i, 10)) {
    showNum(i % 10, x, y);
  }

  showColon(18, y);

  draw.color(220, 20, 60);
  x = 74;
  for (let w = 0; w < w2; w++, x -= 6, n = Math.idiv(n, 10)) {
    showNum(n % 10, x, y);
  }
}

function showNum(n: number, x: number, y: number) {
  switch (n) {
    case 0:
      show0(x, y);
      break;
    case 1:
      show1(x, y);
      break;
    case 2:
      show2(x, y);
      break;
    case 3:
      show3(x, y);
      break;
    case 4:
      show4(x, y);
      break;
    case 5:
      show5(x, y);
      break;
    case 6:
      show6(x, y);
      break;
    case 7:
      show7(x, y);
      break;
    case 8:
      show8(x, y);
      break;
    case 9:
      show9(x, y);
      break;
  }
}

function showColon(x: number, y: number) {
  draw.lineRect({ x: x, y: y + 3, width: 1, height: 1 });
  draw.lineRect({ x: x, y: y + 5, width: 1, height: 1 });
}

function show0(x: number, y: number) {
  draw.lineRect({ x: x, y: y, width: 5, height: 9 });
}

function show1(x: number, y: number) {
  draw.rect({ x: x + 1, y: y, width: 3, height: 1 });
  draw.rect({ x: x + 2, y: y + 1, width: 1, height: 8 });
  draw.rect({ x: x + 1, y: y + 7, width: 1, height: 1 });
}

function show2(x: number, y: number) {
  draw.rect({ x: x, y: y, width: 5, height: 1 });
  draw.rect({ x: x, y: y + 1, width: 1, height: 3 });
  draw.rect({ x: x, y: y + 4, width: 5, height: 1 });
  draw.rect({ x: x + 4, y: y + 5, width: 1, height: 3 });
  draw.rect({ x: x, y: y + 8, width: 5, height: 1 });
}

function show3(x: number, y: number) {
  draw.rect({ x: x, y: y, width: 5, height: 1 });
  draw.rect({ x: x + 4, y: y + 1, width: 1, height: 7 });
  draw.rect({ x: x, y: y + 4, width: 5, height: 1 });
  draw.rect({ x: x, y: y + 8, width: 5, height: 1 });
}

function show4(x: number, y: number) {
  draw.rect({ x: x + 4, y: y, width: 1, height: 9 });
  draw.rect({ x: x, y: y + 4, width: 4, height: 1 });
  draw.rect({ x: x, y: y + 5, width: 1, height: 4 });
}

function show5(x: number, y: number) {
  draw.rect({ x: x, y: y, width: 5, height: 1 });
  draw.rect({ x: x + 4, y: y + 1, width: 1, height: 3 });
  draw.rect({ x: x, y: y + 4, width: 5, height: 1 });
  draw.rect({ x: x, y: y + 5, width: 1, height: 3 });
  draw.rect({ x: x, y: y + 8, width: 5, height: 1 });
}

function show6(x: number, y: number) {
  draw.lineRect({ x: x, y: y, width: 5, height: 5 });
  draw.rect({ x: x, y: y + 5, width: 1, height: 3 });
  draw.rect({ x: x, y: y + 8, width: 5, height: 1 });
}

function show7(x: number, y: number) {
  draw.rect({ x: x + 4, y: y, width: 1, height: 9 });
  draw.rect({ x: x, y: y + 8, width: 4, height: 1 });
}

function show8(x: number, y: number) {
  draw.lineRect({ x: x, y: y, width: 5, height: 5 });
  draw.lineRect({ x: x, y: y + 4, width: 5, height: 5 });
}

function show9(x: number, y: number) {
  draw.rect({ x: x, y: y, width: 5, height: 1 });
  draw.rect({ x: x + 4, y: y + 1, width: 1, height: 3 });
  draw.lineRect({ x: x, y: y + 4, width: 5, height: 5 });
}

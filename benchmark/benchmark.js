// @ts-check

const { Suite } = require("benchmark");
const { Option } = require("../lib/cjs");

const randSeq = [];
for (let i = 0; i < 1001; i++) {
  randSeq.push(Math.random());
}

let randIndex;
function nextRand() {
  randIndex = (randIndex + 1) % randSeq.length;
  return randSeq[randIndex];
}

function makeA() {
  return nextRand() > 0.1 ? "a" : undefined;
}

function convertAToB(a) {
  return a + "b";
}

function convertBToC(b) {
  return nextRand() > 0.1 ? b + "c" : undefined;
}

function convertCToD(c) {
  return nextRand() > 0.1 ? c + "d" : undefined;
}

let logBuffer;
function log(s) {
  // Always concatenate a dummy string to avoid the penalizing Option for making
  // slightly longer messages.
  logBuffer += "lorem ipsum dolor sit amet";
}

new Suite("the suite", {
  onCycle() {
    randIndex = 0;
    logBuffer = "";
  },
})
  .add("naive", () => {
    const a = makeA();
    if (a === undefined) {
      return undefined;
    }
    const b = convertAToB(a);
    const c = convertBToC(b);
    log(`After converting to C: ${c}`);
    if (c === null) {
      return undefined;
    }
    convertCToD(c);
  })
  .add("with Option", () => {
    Option.fromNullable(makeA())
      .map(convertAToB)
      .map(convertBToC)
      .nonNullable()
      .tap((c) => log(`After converting to C: ${c}`))
      .map(convertCToD)
      .nonNullable()
      .toNullable();
  })
  .on("cycle", (event) => {
    const benchmark = event.target;
    console.log(benchmark.toString());
  })
  .on("complete", (event) => {
    const suite = event.currentTarget;
    const fastestOption = suite.filter("fastest").map("name");
    console.log(`The fastest option is ${fastestOption}`);
  })
  .run();

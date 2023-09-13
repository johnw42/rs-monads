const fs = require("node:fs");

function main() {
  for (const arg of process.argv.slice(2)) {
    processFile(arg);
  }
}

function matchDefinition(line) {
  let m = /^ *(?:export )?(?:function|const|(type|interface)) ([a-zA-Z]+)/.exec(
    line,
  );
  if (m) {
    let [, keyword, ident] = m;
    return keyword ? "type " + ident : ident;
  }
  m = /^ *([a-zA-Z]+),$/.exec(line);
  if (m) {
    return m[1];
  }
  return null;
}

function processFile(fileName) {
  console.log(fileName);
  const lines = fs.readFileSync(fileName, { encoding: "utf-8" }).split("\n");
  const comments = new Map();
  let state = "searching";
  let comment;
  let indent;
  const linesOut = [];
  let lineNo = 0;
  for (const line of lines) {
    const die = () => {
      throw Error(`Failed at line number ${lineNo} in state ${state}: ${line}`);
    };
    const insertCopy = () => {
      const id = matchDefinition(line);
      if (!id) die();
      const comment = comments.get(id);
      if (comment) {
        linesOut.push(...comment.map((line) => indent + line));
      }
      state = "searching";
    };
    ++lineNo;
    let keepLine = true;
    switch (state) {
      case "searching":
        if (line.trim() === "/**") {
          comment = [line];
          state = "saving_comment";
          break;
        }
        const m = /^( *)\/\/ *@copy-comment/.exec(line);
        if (m) {
          indent = m[1];
          state = "pre_insert_comment";
        }
        break;
      case "saving_comment": {
        comment.push(line);
        if (line.includes("*/")) {
          state = "after_comment";
        }
        break;
      }
      case "after_comment": {
        const id = matchDefinition(line);
        if (id) {
          comments.set(id, comment);
        }
        state = "searching";
        break;
      }
      case "pre_insert_comment": {
        if (line.trim() === "/**") {
          keepLine = false;
          state = "deleting_comment";
        } else {
          insertCopy();
        }
        break;
      }
      case "deleting_comment": {
        keepLine = false;
        if (line.endsWith("*/")) {
          state = "deleted_comment";
        }
        break;
      }
      case "deleted_comment": {
        insertCopy();
        break;
      }
    }
    if (keepLine) {
      linesOut.push(line);
    }
  }

  fs.writeFileSync(fileName, linesOut.join("\n"));
}

main();

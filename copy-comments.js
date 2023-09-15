const fs = require("node:fs");

function main() {
  for (const arg of process.argv.slice(2)) {
    processFile(arg);
  }
}

function matchDefinition(line, forTarget = false) {
  let m = /^ *(?:export )?(?:function|const|(type|interface)) ([a-zA-Z]+)/.exec(
    line,
  );
  if (m) {
    let [, keyword, ident] = m;
    return keyword ? "type " + ident : ident;
  }
  m =
    /^ *(?:[a-zA-Z]+\.[a-zA-Z]+) *= ([a-zA-Z]+);$/.exec(line) ||
    /^ *([a-zA-Z]+)(?:: ([a-zA-Z]+))?,$/.exec(line);
  if (m) {
    return forTarget && m[2] ? m[2] : m[1];
  }
  return undefined;
}

function parseDirective(line) {
  const m = /^( *)\/\/ *@copy-comment(?: ((?:type )?[a-zA-Z]+))?/.exec(line);
  if (m) {
    return { indent: m[1], name: m[2] };
  }
  return undefined;
}

function trace(...args) {
  //console.log(...args);
}

function processFile(fileName) {
  console.log(fileName);
  const lines = fs.readFileSync(fileName, { encoding: "utf-8" }).split("\n");
  const comments = new Map();
  let state = "searching";
  let comment;
  let indent;
  let toCopyFrom;
  const linesOut = [];
  let lineNo = 0;

  for (const line of lines) {
    ++lineNo;
    trace(lineNo, state, line);

    const die = () => {
      throw Error(
        `Failed at line number ${lineNo} in state ${state}: \`${line}\``,
      );
    };

    const insertCopy = () => {
      const name = toCopyFrom || matchDefinition(line, true);
      trace("inserting comment from", name);
      if (!name) die();
      const comment = comments.get(name);
      if (comment) {
        linesOut.push(...comment.map((line) => indent + line));
      }
      state = "searching";
    };

    let keepLine = true;

    switch (state) {
      case "searching":
        if (line.trim() === "/**") {
          comment = [line];
          state = "saving_comment";
          break;
        }
        const directive = parseDirective(line);
        if (directive) {
          indent = directive.indent;
          toCopyFrom = directive.name;
          state = "after_directive";
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
        const name = matchDefinition(line);
        if (name) {
          comments.set(name, comment);
        }
        state = "searching";
        break;
      }

      case "after_directive": {
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

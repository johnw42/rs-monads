const fs = require("node:fs");

function main() {
  for (const arg of process.argv.slice(2)) {
    processFile(arg);
  }
}

let tracing = false;
function trace(...args) {
  if (tracing) {
    console.log(...args);
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

function parseCopyCommentDirective(line) {
  const m = /^( *)\/\/ *@copy-comment(?: ((?:type )?[a-zA-Z]+))?/.exec(line);
  if (m) {
    return { indent: m[1], name: m[2] };
  }
  return undefined;
}

function parseCopyTestDirective(line) {
  const m = /^( *)\/\/ *@copy-test ([a-zA-Z]+)/.exec(line);
  if (m) {
    return { indent: m[1], name: m[2] };
  }
  return undefined;
}

function parseTestHeader(line) {
  const m = /^((?: *))test\("([^"]+)",/.exec(line);
  if (m) {
    return { indent: m[1], testName: m[2] };
  }
  return undefined;
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
  let inputTestName;
  let outputTestName;
  let testLines;

  for (const line of lines) {
    ++lineNo;
    tracing ||= line.includes("andThen");
    tracing = true;
    trace(lineNo, state, `"${line}"`);

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

    const insertTestCopy = () => {
      trace("inserting copy of test", inputTestName);
      for (const line of testLines) {
        linesOut.push(line.replace(inputTestName, outputTestName));
      }
    };

    let keepLine = true;

    switch (state) {
      case "searching":
        if (line.trim() === "/**") {
          comment = [line];
          state = "savingComment";
          break;
        }

        const testHeader = parseTestHeader(line);
        if (testHeader) {
          inputTestName = testHeader.testName;
          indent = testHeader.indent;
          testLines = [line];
          state = "savingTestLines";
        }

        const commentDirective = parseCopyCommentDirective(line);
        if (commentDirective) {
          indent = commentDirective.indent;
          toCopyFrom = commentDirective.name;
          state = "afterCommentDirective";
        }

        const testDirective = parseCopyTestDirective(line);
        if (testDirective) {
          indent = testDirective.indent;
          outputTestName = testDirective.name;
          state = "afterTestDirective";
        }

        break;

      case "savingComment": {
        comment.push(line);
        if (line.includes("*/")) {
          state = "afterComment";
        }
        break;
      }

      case "afterComment": {
        const name = matchDefinition(line);
        if (name) {
          comments.set(name, comment);
        }
        state = "searching";
        break;
      }

      case "afterCommentDirective": {
        if (line.trim() === "/**") {
          keepLine = false;
          state = "deletingComment";
        } else {
          insertCopy();
        }
        break;
      }

      case "deletingComment": {
        keepLine = false;
        if (line.endsWith("*/")) {
          state = "deletedComment";
        }
        break;
      }

      case "deletedComment": {
        insertCopy();
        break;
      }

      case "savingTestLines": {
        testLines.push(line);
        if (line === indent + "});") {
          state = "searching";
        }
        break;
      }

      case "afterTestDirective": {
        if (parseTestHeader(line)) {
          keepLine = false;
          state = "deletingTest";
        } else {
          insertTestCopy();
          state = "searching";
        }
        break;
      }

      case "deletingTest": {
        keepLine = false;
        if (line === indent + "});") {
          insertTestCopy();
          state = "searching";
        }
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

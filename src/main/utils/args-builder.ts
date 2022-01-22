const argsBuilder = (args: string): string[] => {
  args = args || "";
  const arr = [];

  let current: string | null = null;
  let quoted = null;
  let quoteType = null;

  function addCurrent() {
    if (current) {
      // trim extra whitespace on the current arg
      arr.push(current.trim());
      current = null;
    }
  }

  // remove escaped newlines
  args = args.replace(/\\\n/g, "");

  for (let i = 0; i < args.length; i++) {
    const c = args.charAt(i);

    if (c === " ") {
      if (quoted) {
        quoted += c;
      } else {
        addCurrent();
      }
    } else if (c === "'" || c === '"') {
      if (quoted) {
        quoted += c;
        // only end this arg if the end quote is the same type as start quote
        if (quoteType === c) {
          // make sure the quote is not escaped
          if (quoted.charAt(quoted.length - 2) !== "\\") {
            arr.push(quoted);
            quoted = null;
            quoteType = null;
          }
        }
      } else {
        addCurrent();
        quoted = c;
        quoteType = c;
      }
    } else {
      if (quoted) {
        quoted += c;
      } else {
        if (current) {
          current += c;
        } else {
          current = c;
        }
      }
    }
  }

  addCurrent();

  return arr;
};

export default argsBuilder;

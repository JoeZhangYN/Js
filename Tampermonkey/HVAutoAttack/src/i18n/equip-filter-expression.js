const TOKEN_RE = /\s*(true|false|\d+(?:\.\d+)?|&&|\|\||<=|>=|===|==|<|>|!|\(|\))/y;

function tokenizeExpression(expression) {
  const tokens = [];
  let index = 0;
  while (index < expression.length) {
    TOKEN_RE.lastIndex = index;
    const match = TOKEN_RE.exec(expression);
    if (!match) throw new Error("Invalid Filter");
    tokens.push(match[1]);
    index = TOKEN_RE.lastIndex;
  }
  return tokens;
}

function toValue(token) {
  if (token === "true") return true;
  if (token === "false") return false;
  const value = Number(token);
  if (!Number.isFinite(value)) throw new Error("Invalid Filter");
  return value;
}

function compare(left, operator, right) {
  if (operator === "<") return left < right;
  if (operator === ">") return left > right;
  if (operator === "<=") return left <= right;
  if (operator === ">=") return left >= right;
  if (operator === "==" || operator === "===") return left === right;
  throw new Error("Invalid Filter");
}

export function evaluateEquipFilterExpression(expression) {
  const tokens = tokenizeExpression(expression);
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(expected) {
    const token = tokens[index];
    if (expected && token !== expected) throw new Error("Invalid Filter");
    index += 1;
    return token;
  }

  function parsePrimary() {
    if (peek() === "!") {
      consume("!");
      return !parsePrimary();
    }
    if (peek() === "(") {
      consume("(");
      const value = parseOr();
      consume(")");
      return value;
    }
    if (peek() == null) throw new Error("Invalid Filter");
    const left = toValue(consume());
    if (["<", ">", "<=", ">=", "==", "==="].includes(peek())) {
      const operator = consume();
      if (peek() == null) throw new Error("Invalid Filter");
      return compare(left, operator, toValue(consume()));
    }
    return Boolean(left);
  }

  function parseAnd() {
    let value = parsePrimary();
    while (peek() === "&&") {
      consume("&&");
      value = Boolean(value) && Boolean(parsePrimary());
    }
    return value;
  }

  function parseOr() {
    let value = parseAnd();
    while (peek() === "||") {
      consume("||");
      value = Boolean(value) || Boolean(parseAnd());
    }
    return value;
  }

  const value = parseOr();
  if (index !== tokens.length) throw new Error("Invalid Filter");
  return Boolean(value);
}

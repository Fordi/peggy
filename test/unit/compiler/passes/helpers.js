"use strict";

const { GrammarError } = require("../../../../lib/peg");
const parser = require("../../../../lib/parser");
const Session = require("../../../../lib/compiler/session");

module.exports = function(chai, utils) {
  const Assertion = chai.Assertion;

  chai.use(require("chai-like"));

  Assertion.addMethod("changeAST", function(grammar, props, options) {
    options = options !== undefined ? options : {};

    const ast = parser.parse(grammar, options);

    utils.flag(this, "object")(ast, options, new Session({
      error(stage, ...args) { throw new GrammarError(...args); },
    }));

    new Assertion(ast).like(props);
  });

  Assertion.addMethod("haveErrors", function(grammar, props) {
    const ast = parser.parse(grammar);

    const session = new Session();
    utils.flag(this, "object")(ast, {}, session);

    switch (typeof props) {
      case "number":
        new Assertion(session.errors).equal(props);
        break;
      case "object":
        new Assertion(session.problems).like(props);
        break;
      default:
        break;
    }
  });

  Assertion.addMethod("reportError", function(grammar, props) {
    const ast = parser.parse(grammar);

    let passed = false;
    let result = undefined;

    try {
      utils.flag(this, "object")(ast, {}, new Session({
        error(stage, ...args) { throw new GrammarError(...args); },
      }));
      passed = true;
    } catch (e) {
      result = e;
    }

    this.assert(
      !passed,
      "expected #{this} to report an error but it didn't",
      "expected #{this} to not report an error but #{act} was reported",
      null,
      result
    );

    if (!passed && props !== undefined) {
      Object.keys(props).forEach(key => {
        new Assertion(result).to.have.property(key)
          .that.is.deep.equal(props[key]);
      });
    }
  });
};

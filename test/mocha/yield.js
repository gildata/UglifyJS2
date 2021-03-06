var UglifyJS = require("../node");
var assert = require("assert");

describe("Yield", function() {
    it("Should not delete statements after yield", function() {
        var js = 'function *foo(bar) { yield 1; yield 2; return 3; }';
        var result = UglifyJS.minify(js);
        assert.strictEqual(result.code, 'function*foo(e){return yield 1,yield 2,3}');
    });

    it("Should not allow yield as labelIdentifier within generators", function() {
        var js = "function* g() {yield: 1}"
        var test = function() {
            UglifyJS.parse(js);
        }
        var expect = function(e) {
            return e instanceof UglifyJS.JS_Parse_Error &&
                e.message === "Yield cannot be used as label inside generators";
        }
        assert.throws(test, expect);
    });

    it("Should not allow yield* followed by a semicolon in generators", function() {
        var js = "function* test() {yield*\n;}";
        var test = function() {
            UglifyJS.parse(js);
        }
        var expect = function(e) {
            return e instanceof UglifyJS.JS_Parse_Error &&
                e.message === "Unexpected token: punc (;)";
        }
        assert.throws(test, expect);
    });

    it("Should not allow yield with next token star on next line", function() {
        var js = "function* test() {yield\n*123;}";
        var test = function() {
            UglifyJS.parse(js);
        }
        var expect = function(e) {
            return e instanceof UglifyJS.JS_Parse_Error &&
                e.message === "Unexpected token: operator (*)";
        }
        assert.throws(test, expect);
    });

    it("Should be able to compress its expression", function() {
        assert.strictEqual(
            UglifyJS.minify("function *f() { yield 3-4; }", {compress: true}).code,
            "function*f(){yield-1}"
        );
    });

    it("Should keep undefined after yield without compression if found in ast", function() {
        assert.strictEqual(
            UglifyJS.minify("function *f() { yield undefined; yield; yield* undefined; yield void 0}", {compress: false}).code,
            "function*f(){yield undefined;yield;yield*undefined;yield void 0}"
        );
    });

    it("Should be able to drop undefined after yield if necessary with compression", function() {
        assert.strictEqual(
            UglifyJS.minify("function *f() { yield undefined; yield; yield* undefined; yield void 0}", {compress: true}).code,
            "function*f(){yield,yield,yield*void 0,yield}"
        );
    });

    it("Should not allow yield to be used as symbol, identifier or shorthand property outside generators in strict mode", function() {
        var tests = [
            // Fail in as_symbol
            '"use strict"; import yield from "bar";',
            '"use strict"; yield = 123;',
            '"use strict"; yield: "123";',
            '"use strict"; for(;;){break yield;}',
            '"use strict"; for(;;){continue yield;}',
            '"use strict"; function yield(){}',
            '"use strict"; function foo(...yield){}',
            '"use strict"; try { new Error("")} catch (yield) {}',
            '"use strict"; var yield = "foo";',
            '"use strict"; class yield {}',

            // Fail in maybe_assign
            '"use strict"; var foo = yield;',
            '"use strict"; var foo = bar = yield',

            // Fail in as_property_name
            '"use strict"; var foo = {yield};',
        ];

        var fail = function(e) {
            return e instanceof UglifyJS.JS_Parse_Error &&
                /^Unexpected yield identifier (?:as parameter )?inside strict mode/.test(e.message);
        }

        var test = function(input) {
            return function() {
                UglifyJS.parse(input);
            }
        }

        for (var i = 0; i < tests.length; i++) {
            assert.throws(test(tests[i]), fail, tests[i]);
        }
    });

    it("Should allow yield to be used as class/object property name", function() {
        var input = [
            '"use strict";',
            "({yield:42});",
            "({yield(){}});",
            "(class{yield(){}});",
            "class C{yield(){}}",
        ].join("");
        assert.strictEqual(UglifyJS.minify(input, { compress: false }).code, input);
    });
});

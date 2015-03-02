describe('ngProvide - basic usage', function() {
  var ngProvide;
  var proxyquire = require('proxyquire');
  var sinon = require('sinon');

  beforeEach(function (){
    ngProvide = require('../../src/index');
  });

  it('will not create sourcemap by default', function() {
    var input = [
      'var c, d;',
      '// @ngProvide',
      'var a = "a", b = "b";'
    ].join('\n');
    var output = ngProvide(input);
    expect(output.code).to.equal([
      'var c, d;',
      '',
      '// @ngProvide',
      'var a, b;',
      '',
      "beforeEach(function() {",
      "  angular.mock.module(function($provide) {",
      "    a = \"a\";",
      "    b = \"b\";",
      "    $provide.value(\"a\", a);",
      "    $provide.value(\"b\", b);",
      "  });",
      "});"
    ].join('\n'));

    expect(output.map).to.equal(undefined);
  });

  it('will work on assignment', function(){
    var input = [
      "var a, b;",
      "// @ngProvide",
      "a = \"a\";",
      "",
      "b = \"b\""
    ].join("\n");
    var output = ngProvide(input);

    var expected = [
      "var a, b;",
      "// @ngProvide",
      "beforeEach(function() {",
      "  angular.mock.module(function($provide) {",
      "    a = \"a\";",
      "    $provide.value(\"a\", a);",
      "  });",
      "});",
      "",
      "b = \"b\""
    ].join("\n");

    expect(output.code).to.equal(expected);
  });

  it('will create a sourcemap if sourceFileName is set', function() {
    var input = [
      'var c, d;',
      '// @ngProvide',
      'var a = "a", b = "b";'
    ].join('\n');
    var output = ngProvide(input,{sourceFileName:'src.js'});
    expect(output.code).to.equal([
      'var c, d;',
      '',
      '// @ngProvide',
      'var a, b;',
      '',
      "beforeEach(function() {",
      "  angular.mock.module(function($provide) {",
      "    a = \"a\";",
      "    b = \"b\";",
      "    $provide.value(\"a\", a);",
      "    $provide.value(\"b\", b);",
      "  });",
      "});"
    ].join('\n'));
    expect(!!output.map).to.equal(true);
  });

});
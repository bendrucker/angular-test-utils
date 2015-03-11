module.exports = create;

var types = require('recast').types;
var n = types.namedTypes;
var b = types.builders;
var assert = require('assert');
var util = require('util');

function create(regexp) {
  assert(util.isRegExp(regexp), 'regexp required');
  var hasAnnotation = require('./hasAnnotation')(regexp);

  return function(node) {
    types.visit(node, {
      visitFunctionDeclaration: function(path) {
        var node = path.node;
        if (hasAnnotation(node)) {

          var id = node.id;

          path.get('body').get('body').unshift(pushThisStatement(id));

          // strip name from function so it does not shadow the array variable
          var controllerFunc = b.functionExpression(
            null,
            node.params,
            node.body
          );

          var varDecl = variableDeclarationInitToEmptyArray(id);
          varDecl.comments = node.comments;

          path.replace(
            varDecl,
            controllerReplacementCode(
              addDirectiveSuffix(id.name),
              controllerFunc
            )
          );

          return false;
        }
        this.traverse(path);
      }
    });
  };
}

// <id>.push(this);
function pushThisStatement(id) {
  return pushStatement(id, b.thisExpression());
}

// <arrayId>.push(<valueId);
function pushStatement(arrayId, valueId) {
  return b.expressionStatement(
    b.callExpression(
      b.memberExpression(
        arrayId,
        ipush,
        false
      ),
      [valueId]
    )
  );
}

// var <id> = [];
function variableDeclarationInitToEmptyArray(id) {
  n.Identifier.assert(id);
  return b.variableDeclaration(
    'var',
    [b.variableDeclarator(
      id,
      b.arrayExpression([])
    )]
  );
}

function controllerReplacementCode(directiveName, newController) {
  assert('string' === typeof directiveName, 'directiveName must be a string');
  n.Function.assert(newController);

  // directive.controller = <newController>
  var controllerAssignment = b.expressionStatement(
    b.assignmentExpression(
      '=',
      b.memberExpression(
        idirective,
        icontroller,
        false
      ),
      newController
    )
  );

  // function($delegate) {
  //   var directive= $delegate[0];
  //   <controllerAssignment>
  //   return $delegate
  // }
  var decoratorCallback = b.functionExpression(null, [i$delegate],
    b.blockStatement([
      sDirectiveDeclare,
      controllerAssignment,
      b.returnStatement(i$delegate)
    ])
  );

  // function($provide) {
  //   $provide.decorator("<directiveName>", <decoratorCallback>);
  // }
  var moduleCallback = b.functionExpression(null, [i$provide],
    b.blockStatement([
      b.expressionStatement(
        b.callExpression(
          m$provideDecorator,
          [b.literal(directiveName), decoratorCallback]
        )
      )
    ])
  );

  // beforeEach(angular.mock.module(<moduleCallback>))
  return b.expressionStatement(
    b.callExpression(
      ibeforeEach,
      [b.callExpression(
        mAngularMockModule,
        [moduleCallback]
      )]
    )
  );
}

function addDirectiveSuffix(name) {
  var controllerSuffixRegExp = /Directive$/;
  if (name.match(controllerSuffixRegExp)) {
    return name;
  }
  return name + 'Directive';
}

// cached identifiers
var idirective   = b.identifier('directive');
var i$delegate   = b.identifier('$delegate');
var icontroller  = b.identifier('controller');
var i$provide    = b.identifier('$provide');
var iangular     = b.identifier('angular');
var imock        = b.identifier('mock');
var imodule      = b.identifier('module');
var iinject      = b.identifier('inject');
var ibeforeEach  = b.identifier('beforeEach');
var idecorator   = b.identifier('decorator');
var ipush        = b.identifier('push');
var i$scope      = b.identifier('$scope');
var i$element    = b.identifier('$element');
var i$attrs      = b.identifier('$attrs');
var i$transclude = b.identifier('$transclude');

// angular.mock
var mAngularMock = b.memberExpression(iangular, imock, false);

// angular.mock.module
var mAngularMockModule = b.memberExpression(mAngularMock, imodule, false);

// $provide.decorator
var m$provideDecorator = b.memberExpression(i$provide, idecorator, false);

// var directive = $delegate[0];
var sDirectiveDeclare = b.variableDeclaration(
  'var',
  [
    b.variableDeclarator(
      idirective,
      b.memberExpression(i$delegate, b.literal(0), true)
    )
  ]
);
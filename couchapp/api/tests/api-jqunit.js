"use strict";
var fluid = require("infusion");
var jqUnit = fluid.require("jqUnit");

jqUnit.module("Couch API Unit Tests");

// We have to load our reduce function manually because couch does not support modules that can be used with "require".
var fs = require("fs");
var reduceContent = fs.readFileSync(__dirname + "/../views/combined/reduce.js", { "encoding": "utf-8"});
var reducer;
eval("reducer = " + reduceContent);

jqUnit.test("Testing reduce function (single reduce pass, tree <- leaf)...",function(){
    var data    = [{"uniqueId": "foo", "type": "term"},{"uniqueId":"bar", "type":"alias", "aliasOf": "foo"}];
    var output  = reducer(["foo","foo"], data, false);

    jqUnit.assertDeepEq("There should be one merged record...", {"foo": { "uniqueId": "foo", "type": "term", "aliases": [ {"uniqueId": "bar", "type": "alias", "aliasOf": "foo"} ] }}, output);
});

jqUnit.test("Testing reduce function (single reduce pass, leaf <- tree)...",function(){
    var data    = [{"uniqueId":"bar", "type":"alias", "aliasOf": "foo"},{"uniqueId": "foo", "type": "term"}];
    var output  = reducer(["foo","foo"], data, false);

    jqUnit.assertDeepEq("There should be one merged record...", {"foo": { "uniqueId": "foo", "type": "term", "aliases": [ {"uniqueId": "bar", "type": "alias", "aliasOf": "foo"} ] }}, output);
});

jqUnit.test("Testing reduce function (single reduce pass, multiple interleaved trees and leaves)...",function(){
    var data    = [{"uniqueId": "baz", "type": "term"},{"uniqueId":"bar", "type":"alias", "aliasOf": "foo"},{"uniqueId": "foo", "type": "term"},{"uniqueId":"qux", "type":"alias", "aliasOf": "baz"}];
    var output  = reducer(["baz","foo","foo","baz"], data, false);

    jqUnit.assertDeepEq("Interleaved records should be merged...", {"foo": { "uniqueId": "foo", "type": "term", "aliases": [ {"uniqueId": "bar", "type": "alias", "aliasOf": "foo"} ] }, "baz": { "uniqueId": "baz", "type": "term", "aliases": [ {"uniqueId": "qux", "type": "alias", "aliasOf": "baz"} ] }}, output);
});

jqUnit.test("Testing rereduce function, one record split between sets...",function(){
    var data    = [
        {"foo": { "uniqueId": "foo", "type": "term"}},
        {"foo": { "aliases": [ {"uniqueId": "bar", "type": "alias", "aliasOf": "foo"} ] }}
    ];

    var output  = reducer(null, data, true);

    jqUnit.assertDeepEq("There should be one merged record...", {"foo": { "uniqueId": "foo", "type": "term", "aliases": [ {"uniqueId": "bar", "type": "alias", "aliasOf": "foo"} ] }}, output);
});



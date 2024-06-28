import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseKey } from '../built/EnviromentHelper.js';

const a = {
    myNull: '${{ null }}',
    myBoolean: '${{ false }}',
    myIntegerNumber: '${{ 711 }}',
    myFloatNumber: '${{ -9.2 }}',
    myHexNumber: '${{ 0xff }}',
    myExponentialNumber: '${{ -2.99e-2 }}',
    myString: 'Mona the Octocat',
    myStringInBraces: "${{ 'It''s open source!' }}",
    myEnvironmentVar: "${{ env.msg }}"
}

const r = /.*\${{([^}]*)}}.*/gs;

test('should be null', ()  =>{
    assert.equal(parseKey(a.myNull.replace(r, '$1')),null);
});

test('should be false', ()  =>{
    assert.equal(parseKey(a.myBoolean.replace(r, '$1')),false);
});

test('should be 711', ()  =>{
    assert.equal(parseKey(a.myIntegerNumber.replace(r, '$1')),711);
});

test('should be -9.2', ()  =>{
    assert.equal(parseKey(a.myFloatNumber.replace(r, '$1')),-9.2);
});

test('should be 255', ()  =>{
    assert.equal(parseKey(a.myHexNumber.replace(r, '$1')),255);
});

test('should be -0.0299', ()  =>{
    assert.equal(parseKey(a.myExponentialNumber.replace(r, '$1')),-0.0299);
});

test('should be "Mona the Octocat"', ()  =>{
    assert.equal(parseKey(a.myString.replace(r, '$1')),'Mona the Octocat');
});

test('should be "It\'s open source!"', ()  =>{
    assert.equal(parseKey(a.myStringInBraces.replace(r, '$1')),"It's open source!");
});

// 

test('should be null', ()  =>{
    assert.equal(replaceExpression(a.myNull),null);
});

test('should be false', ()  =>{
    assert.equal(replaceExpression(a.myBoolean),false);
});

test('should be 711', ()  =>{
    assert.equal(replaceExpression(a.myIntegerNumber),711);
});

test('should be -9.2', ()  =>{
    assert.equal(replaceExpression(a.myFloatNumber),-9.2);
});

test('should be 255', ()  =>{
    assert.equal(replaceExpression(a.myHexNumber),255);
});

test('should be -0.0299', ()  =>{
    assert.equal(replaceExpression(a.myExponentialNumber),-0.0299);
});

test('should be "Mona the Octocat"', ()  =>{
    assert.equal(replaceExpression(a.myString),'Mona the Octocat');
});

test('should be "It\'s open source!"', ()  =>{
    assert.equal(replaceExpression(a.myStringInBraces),"It's open source!");
});


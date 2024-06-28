import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { parseKey,replaceExpression } from '../built/EnviromentHelper.js';

const a = {
    myNull: '${{ null }}',
    myBoolean: '${{ false }}',
    myIntegerNumber: '${{ 711 }}',
    myFloatNumber: '${{ -9.2 }}',
    myHexNumber: '${{ 0xff }}',
    myExponentialNumber: '${{ -2.99e-2 }}',
    myString: 'Mona the Octocat',
    myStringInBraces: "${{ 'It''s open source!' }}",
    myEnvironmentVar: "${{ env.msg }}",
    myExpression: "${{ 1 < 2 && ( true || false ) == true && 'shown' || 'not shown' }}"
}

describe ('parseKey', () => {
    const r = /.*\${{([^}]*)}}.*/gs;

    test('parseKey should be null', ()  =>{
        assert.equal(parseKey(a.myNull.replace(r, '$1')),null);
    });

    test('parseKey should be false', ()  =>{
        assert.equal(parseKey(a.myBoolean.replace(r, '$1')),false);
    });

    test('parseKey should be 711', ()  =>{
        assert.equal(parseKey(a.myIntegerNumber.replace(r, '$1')),711);
    });

    test('parseKey should be -9.2', ()  =>{
        assert.equal(parseKey(a.myFloatNumber.replace(r, '$1')),-9.2);
    });

    test('parseKey should be 255', ()  =>{
        assert.equal(parseKey(a.myHexNumber.replace(r, '$1')),255);
    });

    test('parseKey should be -0.0299', ()  =>{
        assert.equal(parseKey(a.myExponentialNumber.replace(r, '$1')),-0.0299);
    });

    test('parseKey should be "It\'s open source!"', ()  =>{
        assert.equal(parseKey(a.myStringInBraces.replace(r, '$1')),"It's open source!");
    });

    let myMsg = "My message!"

    test('parseKey should be ' + myMsg, ()  =>{
        assert.equal(parseKey(a.myEnvironmentVar.replace(r, '$1'), {msg: myMsg}),myMsg);
    });

    test('parseKey should be "shown"', ()  =>{
        assert.equal(parseKey(a.myExpression.replace(r, '$1')),"shown");
    });
});

// 
describe ('replaceExpression', () => {
    test('replaceExpression should be null', ()  =>{
        assert.equal(replaceExpression(a.myNull),null);
    });

    test('replaceExpression should be false', ()  =>{
        assert.equal(replaceExpression(a.myBoolean),false);
    });

    test('replaceExpression should be 711', ()  =>{
        assert.equal(replaceExpression(a.myIntegerNumber),711);
    });

    test('replaceExpression should be -9.2', ()  =>{
        assert.equal(replaceExpression(a.myFloatNumber),-9.2);
    });

    test('replaceExpression should be 255', ()  =>{
        assert.equal(replaceExpression(a.myHexNumber),255);
    });

    test('replaceExpression should be -0.0299', ()  =>{
        assert.equal(replaceExpression(a.myExponentialNumber),-0.0299);
    });

    test('replaceExpression should be "Mona the Octocat"', ()  =>{
        assert.equal(replaceExpression(a.myString),'Mona the Octocat');
    });

    test('replaceExpression should be "It\'s open source!"', ()  =>{
        assert.equal(replaceExpression(a.myStringInBraces),"It's open source!");
    });

    let myMsg = "My message!"

    test('replaceExpression should be ' + myMsg, ()  =>{
        assert.equal(replaceExpression(a.myEnvironmentVar, {msg: myMsg}),myMsg);
    });

    test('replaceExpression should be "shown"', ()  =>{
        assert.equal(replaceExpression(a.myExpression),"shown");
    });
});
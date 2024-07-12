import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { EnviromentHelper } from '../built/EnviromentHelper.js';

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
    myExpression: "${{ 1 < 2 && ( true || false ) == true && 'shown' || 'not shown' }}",
    myNegatedExpression: "${{ !(true) }}",
    myNegatedExpression2: "${{ !(env.TEST) }}"
}

describe ('EnviromentHelper.replaceEnvVariables', () => {
    test('Test true', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.TRUE',{TRUE: 'true'}),true);
    });
    test('Test false', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.FALSE',{FALSE: 'false'}),false);
    });
    test('Test null', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.NULL',{NULL: 'null'}),null);
    });
    test('Test 1', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '1'}),1);
    });
    test('Test -1', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '-1'}),-1);
    });
    test('Test 0xff', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '0xff'}),255);
    });
    test('Test -2.99e-2', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '-2.99e-2'}),-0.0299);
    });
    test('Test some text', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('env.SOME_TEXT',{SOME_TEXT:'some text'}),'some text');
    });
    test('Test github context', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('github.text',{GITHUB_TEXT:'github text'}),'github text');
    });
    test('Test runner context', ()  =>{
        assert.equal(EnviromentHelper.replaceEnvVariables('runner.text',{RUNNER_TEXT:'runner text'}),'runner text');
    });
    test('Test vars context', ()  =>{
        EnviromentHelper.vars = {TEXT:'vars text'};
        assert.equal(EnviromentHelper.replaceEnvVariables('vars.TEXT',{}),'vars text');
    });
    test('Test secrets context', ()  =>{
        EnviromentHelper.secrets = {TEXT:'secrets text'};
        assert.equal(EnviromentHelper.replaceEnvVariables('secrets.TEXT',{}),'secrets text');
    });
});

describe ('EnviromentHelper.parseKey', () => {
    const r = EnviromentHelper.statementMatcher;
    test('EnviromentHelper.parseKey should be null', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myNull.replace(r, '$1')),null);
    });

    test('EnviromentHelper.parseKey should be false', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myBoolean.replace(r, '$1')),false);
    });

    test('EnviromentHelper.parseKey should be 711', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myIntegerNumber.replace(r, '$1')),711);
    });

    test('EnviromentHelper.parseKey should be -9.2', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myFloatNumber.replace(r, '$1')),-9.2);
    });

    test('EnviromentHelper.parseKey should be 255', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myHexNumber.replace(r, '$1')),255);
    });

    test('EnviromentHelper.parseKey should be -0.0299', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myExponentialNumber.replace(r, '$1')),-0.0299);
    });

    test('EnviromentHelper.parseKey should be "It\'s open source!"', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myStringInBraces.replace(r, '$1')),"It's open source!");
    });

    let myMsg = "My message!"

    test('EnviromentHelper.parseKey should be ' + myMsg, ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myEnvironmentVar.replace(r, '$1'), {msg: myMsg}),myMsg);
    });

    test('EnviromentHelper.parseKey should be "shown"', ()  =>{
        assert.equal(EnviromentHelper.parseKey(a.myExpression.replace(r, '$1')),"shown");
    });
});

describe ('EnviromentHelper.replaceExpression', () => {
    test('EnviromentHelper.replaceExpression should be null', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myNull),null);
    });

    test('EnviromentHelper.replaceExpression should be false', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myBoolean),false);
    });

    test('EnviromentHelper.replaceExpression should be 711', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myIntegerNumber),711);
    });

    test('EnviromentHelper.replaceExpression should be -9.2', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myFloatNumber),-9.2);
    });

    test('EnviromentHelper.replaceExpression should be 255', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myHexNumber),255);
    });

    test('EnviromentHelper.replaceExpression should be -0.0299', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myExponentialNumber),-0.0299);
    });

    test('EnviromentHelper.replaceExpression should be "Mona the Octocat"', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myString),'Mona the Octocat');
    });

    test('EnviromentHelper.replaceExpression should be "It\'s open source!"', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myStringInBraces),"It's open source!");
    });

    let myMsg = "My message!"

    test('EnviromentHelper.replaceExpression should be ' + myMsg, ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myEnvironmentVar, {msg: myMsg}),myMsg);
    });

    test('EnviromentHelper.replaceExpression should be "shown"', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myExpression),"shown");
    });

    test('EnviromentHelper.replaceExpression should be "false" -1', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myNegatedExpression),false);
    });

    test('EnviromentHelper.replaceExpression should be "true" -2', ()  =>{
        assert.equal(EnviromentHelper.replaceExpression(a.myNegatedExpression2,{TEST: false}),true);
    });   
});

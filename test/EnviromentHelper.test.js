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

const enviromentHelper = new EnviromentHelper();

describe ('enviromentHelper.replaceEnvVariables', () => {
    test('Test true', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.TRUE',{TRUE: 'true'}),true);
    });
    test('Test false', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.FALSE',{FALSE: 'false'}),false);
    });
    test('Test null', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.NULL',{NULL: 'null'}),null);
    });
    test('Test 1', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '1'}),1);
    });
    test('Test -1', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '-1'}),-1);
    });
    test('Test 0xff', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '0xff'}),255);
    });
    test('Test -2.99e-2', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.NUMBER',{NUMBER: '-2.99e-2'}),-0.0299);
    });
    test('Test some text', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('env.SOME_TEXT',{SOME_TEXT:'some text'}),'some text');
    });
    test('Test github context', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('github.text',{GITHUB_TEXT:'github text'}),'github text');
    });
    test('Test runner context', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('runner.text',{RUNNER_TEXT:'runner text'}),'runner text');
    });
    test('Test vars context', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('vars.TEXT',{},{TEXT:'vars text'}),'vars text');
    });
    test('Test secrets context', ()  =>{
        assert.equal(enviromentHelper.replaceEnvVariables('secrets.TEXT',{},{},{TEXT:'secrets text'},),'secrets text');
    });
});

describe ('enviromentHelper.parseKey', () => {
    const r = enviromentHelper.statementMatcher;
    test('enviromentHelper.parseKey should be null', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myNull.replace(r, '$1')),null);
    });

    test('enviromentHelper.parseKey should be false', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myBoolean.replace(r, '$1')),false);
    });

    test('enviromentHelper.parseKey should be 711', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myIntegerNumber.replace(r, '$1')),711);
    });

    test('enviromentHelper.parseKey should be -9.2', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myFloatNumber.replace(r, '$1')),-9.2);
    });

    test('enviromentHelper.parseKey should be 255', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myHexNumber.replace(r, '$1')),255);
    });

    test('enviromentHelper.parseKey should be -0.0299', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myExponentialNumber.replace(r, '$1')),-0.0299);
    });

    test('enviromentHelper.parseKey should be "It\'s open source!"', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myStringInBraces.replace(r, '$1')),"It's open source!");
    });

    let myMsg = "My message!"

    test('enviromentHelper.parseKey should be ' + myMsg, ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myEnvironmentVar.replace(r, '$1'), {msg: myMsg}),myMsg);
    });

    test('enviromentHelper.parseKey should be "shown"', ()  =>{
        assert.equal(enviromentHelper.parseKey(a.myExpression.replace(r, '$1')),"shown");
    });
});

describe ('enviromentHelper.replaceExpression', () => {
    test('enviromentHelper.replaceExpression should be null', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myNull),null);
    });

    test('enviromentHelper.replaceExpression should be false', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myBoolean),false);
    });

    test('enviromentHelper.replaceExpression should be 711', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myIntegerNumber),711);
    });

    test('enviromentHelper.replaceExpression should be -9.2', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myFloatNumber),-9.2);
    });

    test('enviromentHelper.replaceExpression should be 255', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myHexNumber),255);
    });

    test('enviromentHelper.replaceExpression should be -0.0299', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myExponentialNumber),-0.0299);
    });

    test('enviromentHelper.replaceExpression should be "Mona the Octocat"', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myString),'Mona the Octocat');
    });

    test('enviromentHelper.replaceExpression should be "It\'s open source!"', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myStringInBraces),"It's open source!");
    });

    let myMsg = "My message!"

    test('enviromentHelper.replaceExpression should be ' + myMsg, ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myEnvironmentVar, {msg: myMsg}),myMsg);
    });

    test('enviromentHelper.replaceExpression should be "shown"', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myExpression),"shown");
    });

    test('enviromentHelper.replaceExpression should be "false" -1', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myNegatedExpression),false);
    });

    test('enviromentHelper.replaceExpression should be "true" -2', ()  =>{
        assert.equal(enviromentHelper.replaceExpression(a.myNegatedExpression2,{TEST: false}),true);
    });   
});

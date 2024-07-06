import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import * as sc from '@tsmx/string-crypto'
import { getSecrets } from '../built/SecretsHelper.js'


test('', () => {
    const masterSecret = 'abcdefghijklmnopqrstuvxyzABCDEFG';  // 32 chars
    const mySecret = 'hello world';
    const myEncSecrets = {
        mySecret: sc.encrypt('hello world', { key: masterSecret })
    }

    assert.match(getSecrets(myEncSecrets, masterSecret).mySecret, new RegExp('^' + mySecret + '$',));
});
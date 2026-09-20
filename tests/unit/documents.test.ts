import test from 'node:test';
import assert from 'node:assert/strict';
import {documentType,MAX_DOCUMENT_BYTES} from '../../packages/domain/document.ts';
test('document content signatures reject renamed executable and oversized files',()=>{
 assert.equal(documentType(Buffer.from('%PDF-1.7\n')),'application/pdf');
 assert.equal(documentType(Uint8Array.from([137,80,78,71,13,10,26,10])),'image/png');
 assert.equal(documentType(Uint8Array.from([255,216,255,0,0,0,0,0])),'image/jpeg');
 assert.equal(documentType(Buffer.from('MZfake.pdf')),null);
 assert.equal(documentType(Buffer.from('<script>')),null);
 assert.equal(documentType(Buffer.alloc(MAX_DOCUMENT_BYTES+1)),null);
});

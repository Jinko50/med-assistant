export const MAX_DOCUMENT_BYTES=10*1024*1024;
export const MIN_DOCUMENT_BYTES=8;
// Multipart framing and the server-action payload are sent on top of the file itself, so
// the framework's request limits must exceed MAX_DOCUMENT_BYTES. Next's default
// proxyClientMaxBodySize is exactly 10 MiB, identical to the cap. A larger body is not
// refused; it is silently truncated, the multipart payload then fails to parse, and that
// error is thrown outside uploadDocument's try/catch. The result was a full-page server
// error for the family, for any upload at or near the supported maximum as well as for
// the far larger file they actually tried.
export const MAX_UPLOAD_REQUEST_BYTES=12*1024*1024;

// Decided identically in the browser and on the server. The browser uses it to refuse a
// file before sending anything; the server repeats it because the browser is not trusted.
// Returns a translation key, or null when the size is acceptable.
export function uploadRejection(size:number):'tooLarge'|'chooseFile'|null{
 if(!Number.isFinite(size)||size<MIN_DOCUMENT_BYTES)return 'chooseFile';
 if(size>MAX_DOCUMENT_BYTES)return 'tooLarge';
 return null;
}
export function documentType(bytes:Uint8Array):'application/pdf'|'image/jpeg'|'image/png'|null{
 if(bytes.length<MIN_DOCUMENT_BYTES||bytes.length>MAX_DOCUMENT_BYTES)return null;
 if(bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46&&bytes[4]===0x2d)return 'application/pdf';
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 return null;
}

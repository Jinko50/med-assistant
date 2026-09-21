// Supported original-document size. Raised from 10 MiB to 50 MB at the owner's request so
// that a real scanned PDF (the reported 40,844,643-byte original) can be stored unchanged.
//
// 50,000,000 decimal, not 50 MiB: Supabase documents a 50 MB ceiling for Free projects and
// does not say whether that is decimal or binary, so the smaller reading is used. The app
// cap, the metadata constraint in migration 004 and the bucket's file_size_limit are all
// this exact number, so a file that the interface accepts cannot be refused later by
// Storage for being too large.
export const MAX_DOCUMENT_BYTES=50_000_000;
export const MIN_DOCUMENT_BYTES=8;

// Documents no longer travel through the Next server. The browser uploads directly to
// Supabase Storage with a short-lived signed URL, so the framework's request limits apply
// only to the small metadata calls that open and close the upload. Supabase recommends
// not proxying uploads above ~6 MB, and buffering 50 MB inside the launcher's Node process
// on a family laptop would be wasteful and fragile.
//
// This limit therefore no longer bounds document size. It is kept because a body above
// proxyClientMaxBodySize is silently TRUNCATED rather than refused, the truncated multipart
// payload then fails to parse, and that error is thrown outside any action's try/catch —
// which is exactly how the family's upload became a full-page server error.
export const MAX_UPLOAD_REQUEST_BYTES=12*1024*1024;

// How much of the file's start is sent to the server for signature checking before an
// upload URL is issued. Small enough to sit far below the request limit.
export const HEADER_SAMPLE_BYTES=4096;

// Decided identically in the browser and on the server. The browser uses it to refuse a
// file before anything is sent; the server repeats it because the browser is not trusted.
// Returns a translation key, or null when the size is acceptable.
export function uploadRejection(size:number):'tooLarge'|'chooseFile'|null{
 if(!Number.isFinite(size)||size<MIN_DOCUMENT_BYTES)return 'chooseFile';
 if(size>MAX_DOCUMENT_BYTES)return 'tooLarge';
 return null;
}

// Identifies the format from the first bytes. It is given only the header sample, so it
// must not judge total length; size is decided separately by uploadRejection.
// This catches mistakes such as a renamed executable. It is not malware scanning and not
// full format validation, and it cannot stop an authorized caregiver who deliberately
// crafts a file with a valid header.
export function documentType(bytes:Uint8Array):'application/pdf'|'image/jpeg'|'image/png'|null{
 if(bytes.length<MIN_DOCUMENT_BYTES)return null;
 if(bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46&&bytes[4]===0x2d)return 'application/pdf';
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 return null;
}

// One place decides the object path, so the server, the storage policy and any later
// verification cannot drift apart.
export function storagePath(patientId:string,documentId:string){return `${patientId}/${documentId}`;}

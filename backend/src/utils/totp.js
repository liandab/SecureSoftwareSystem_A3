// Small RFC 6238-compatible TOTP helper for a learning prototype.
const crypto = require('node:crypto');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function encodeBase32(bytes) {
  let bits=0, value=0, out='';
  for(const byte of bytes){ value=(value<<8)|byte; bits+=8; while(bits>=5){out+=alphabet[(value>>>(bits-=5))&31];} }
  if(bits>0) out+=alphabet[(value<<(5-bits))&31];
  return out;
}
function decodeBase32(str) {
  let bits=0, value=0; const out=[];
  for(const char of str.replace(/=+$/,'').toUpperCase()){
    const idx=alphabet.indexOf(char); if(idx<0) throw new Error('Invalid base32');
    value=(value<<5)|idx; bits+=5;
    if(bits>=8){out.push((value>>>(bits-=8))&255);}
  }
  return Buffer.from(out);
}
function codeAt(secret, step) {
  const msg=Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h=crypto.createHmac('sha1',decodeBase32(secret)).update(msg).digest();
  const offset=h[19]&15;
  const n=(h.readUInt32BE(offset)&0x7fffffff)%1000000;
  return String(n).padStart(6,'0');
}
function verifyTotp(secret, code, lastStep=-1, now=Date.now()) {
  if(typeof code!=='string'||!/^\d{6}$/.test(code)) return null;
  const current=Math.floor(now/30000);
  for(let step=current-1;step<=current+1;step++){
    if(step<=Number(lastStep)) continue;
    if(crypto.timingSafeEqual(Buffer.from(code),Buffer.from(codeAt(secret,step)))) return step;
  }
  return null;
}
function generateSecret(){ return encodeBase32(crypto.randomBytes(20)); }
function uri(secret,email){return `otpauth://totp/EVP%20Demo:${encodeURIComponent(email)}?secret=${secret}&issuer=EVP%20Demo&algorithm=SHA1&digits=6&period=30`;}
module.exports = { encodeBase32, decodeBase32, codeAt, verifyTotp, generateSecret, uri };

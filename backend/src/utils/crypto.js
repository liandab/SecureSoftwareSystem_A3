const crypto = require('node:crypto');
function key(name) {
  const raw = process.env[name];
  if (!raw || Buffer.from(raw, 'base64').length !== 32) throw new Error(`${name} must be 32 bytes base64`);
  return Buffer.from(raw, 'base64');
}
function encrypt(value, aad = '') {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key('VOTE_ENCRYPTION_KEY'), iv);
  cipher.setAAD(Buffer.from(aad));
  const sensitive=Buffer.from(JSON.stringify(value),'utf8');
  let ciphertext;
  try{ciphertext=Buffer.concat([cipher.update(sensitive),cipher.final()]);}
  finally{sensitive.fill(0);}
  return { iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), auth_tag: cipher.getAuthTag().toString('base64') };
}
function decrypt(record, aad = '') {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key('VOTE_ENCRYPTION_KEY'), Buffer.from(record.iv,'base64'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(record.auth_tag,'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(record.ciphertext,'base64')), decipher.final()]);
  try{return JSON.parse(plaintext.toString('utf8'));}
  finally{plaintext.fill(0);}
}
function voteHmac(record) {
  const payload = ['v1',record.chamber,record.electorate,record.iv,record.ciphertext,record.auth_tag].map(String);
  return crypto.createHmac('sha256',key('VOTE_HMAC_KEY')).update(JSON.stringify(payload)).digest('hex');
}
function verifyVoteHmac(record) {
  const expected = Buffer.from(voteHmac(record),'hex');
  const actual = Buffer.from(record.integrity_hash || '','hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function encryptTotp(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm',key('TOTP_ENCRYPTION_KEY'),iv);
  const encrypted = Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(x=>x.toString('base64')).join('.');
}
function decryptTotp(encoded) {
  const [iv,tag,data] = encoded.split('.').map(x=>Buffer.from(x,'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm',key('TOTP_ENCRYPTION_KEY'),iv);
  decipher.setAuthTag(tag);
  const raw=Buffer.concat([decipher.update(data),decipher.final()]);
  try{return raw.toString('utf8');}finally{raw.fill(0);}
}
module.exports = { encrypt, decrypt, voteHmac, verifyVoteHmac, encryptTotp, decryptTotp };

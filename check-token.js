const { Connection, PublicKey } = require('@solana/web3.js');

const VYBE_TOKEN_MINT = new PublicKey('GshYgeeG5xmeMJ4crtg1SHGafYXBpnCyPz9VNF8DXxSW');

async function checkToken() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const mintInfo = await connection.getAccountInfo(VYBE_TOKEN_MINT);
  
  if (!mintInfo) {
    console.log('Token mint not found!');
    return;
  }
  
  console.log('Token Mint Program Owner:', mintInfo.owner.toString());
  console.log('Is Token Program:', mintInfo.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  console.log('Is Token-2022 Program:', mintInfo.owner.toString() === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
}

checkToken().catch(console.error);

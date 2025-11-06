import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Keypair } from '@solana/web3.js';
import * as crypto from 'crypto';
import * as bs58Module from 'bs58';

// Get the actual bs58 functions from the module
const bs58 = (bs58Module as any).default || bs58Module;

@Injectable()
export class AuthService {
  private readonly encryptionKey: string = 'emirsuperdeveloper';

  constructor(private jwtService: JwtService) {}

  /**
   * Encrypt private key using AES-256-CBC
   */
  private encryptPrivateKey(privateKey: string): string {
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt private key using AES-256-CBC
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const parts = encryptedPrivateKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Validate base58 private key and return public key
   */
  validatePrivateKey(privateKeyBase58: string): {
    publicKey: string;
    isValid: boolean;
  } {
    try {
      console.log('Validating private key...');
      console.log('Key length:', privateKeyBase58?.length);
      console.log('Key:', privateKeyBase58);

      const privateKeyBytes = bs58.decode(privateKeyBase58);
      console.log('Decoded bytes length:', privateKeyBytes.length);

      const keypair = Keypair.fromSecretKey(privateKeyBytes);
      console.log('✅ Private key validated successfully');
      console.log('Public key:', keypair.publicKey.toString());

      return {
        publicKey: keypair.publicKey.toString(),
        isValid: true,
      };
    } catch (error) {
      console.error('❌ Private key validation failed:', error.message);
      return {
        publicKey: '',
        isValid: false,
      };
    }
  }

  /**
   * Login with private key and return JWT token
   */
  async login(
    privateKeyBase58: string,
  ): Promise<{ accessToken: string; publicKey: string }> {
    const validation = this.validatePrivateKey(privateKeyBase58);

    if (!validation.isValid) {
      throw new UnauthorizedException('Invalid private key format');
    }

    // Encrypt private key for storage in JWT
    const encryptedPrivateKey = this.encryptPrivateKey(privateKeyBase58);

    // Create JWT token with encrypted private key
    const payload = {
      encryptedPrivateKey,
      publicKey: validation.publicKey,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      publicKey: validation.publicKey,
    };
  }

  /**
   * Get keypair from encrypted private key in JWT payload
   */
  getKeypairFromToken(encryptedPrivateKey: string): Keypair {
    try {
      const decryptedPrivateKey = this.decryptPrivateKey(encryptedPrivateKey);
      const privateKeyBytes = bs58.decode(decryptedPrivateKey);
      return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Validate JWT payload
   */
  async validateUser(payload: any): Promise<any> {
    if (!payload.encryptedPrivateKey || !payload.publicKey) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      encryptedPrivateKey: payload.encryptedPrivateKey,
      publicKey: payload.publicKey,
    };
  }
}

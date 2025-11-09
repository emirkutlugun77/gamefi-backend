import { Injectable, BadRequestException } from '@nestjs/common';
import { UserCodeService } from './user-code.service';
import { CodeType } from '../../entities/user-code.entity';

export interface TwitterVerificationResult {
  verified: boolean;
  codeFound: boolean;
  videoEmbedFound: boolean;
  tweetUrl?: string;
  message: string;
  details?: Record<string, any>;
}

@Injectable()
export class TwitterVerificationService {
  constructor(private readonly userCodeService: UserCodeService) {}

  /**
   * Verify a tweet contains the user's code and video embed
   */
  async verifyTweetWithCodeAndVideo(
    code: string,
    tweetUrl: string,
    requiredVideoUrl?: string,
  ): Promise<TwitterVerificationResult> {
    try {
      // Get the code from database
      const codeResult = await this.userCodeService.verifyCode(code);

      if (!codeResult.valid || !codeResult.userCode) {
        return {
          verified: false,
          codeFound: false,
          videoEmbedFound: false,
          message: codeResult.message || 'Invalid or expired code',
        };
      }

      // Extract tweet ID from URL
      const tweetId = this.extractTweetId(tweetUrl);
      if (!tweetId) {
        return {
          verified: false,
          codeFound: true,
          videoEmbedFound: false,
          message: 'Invalid tweet URL',
        };
      }

      // Verify tweet content
      const tweetVerification = await this.verifyTweetContent(
        tweetId,
        code,
        requiredVideoUrl || codeResult.userCode.metadata?.video_url,
      );

      if (tweetVerification.verified) {
        // Mark code as used with verification data
        await this.userCodeService.verifyCode(code, {
          tweet_url: tweetUrl,
          tweet_id: tweetId,
          verified_at: new Date().toISOString(),
          ...tweetVerification.details,
        });
      }

      return {
        ...tweetVerification,
        tweetUrl,
      };
    } catch (error) {
      return {
        verified: false,
        codeFound: false,
        videoEmbedFound: false,
        message: `Verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Verify tweet content contains code and video embed
   * This is a placeholder - in production, you would use Twitter API
   */
  private async verifyTweetContent(
    tweetId: string,
    code: string,
    videoUrl?: string,
  ): Promise<Omit<TwitterVerificationResult, 'tweetUrl'>> {
    try {
      // TODO: Implement actual Twitter API integration
      // For now, this is a placeholder that simulates the verification

      // In production, you would:
      // 1. Use Twitter API v2 to fetch the tweet
      // 2. Check if tweet text contains the code
      // 3. Check if tweet has media/video attachments
      // 4. Verify the video URL matches the required URL

      // Example Twitter API call (requires bearer token):
      /*
      const response = await fetch(
        `https://api.twitter.com/2/tweets/${tweetId}?expansions=attachments.media_keys&media.fields=url,preview_image_url`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          },
        },
      );

      const data = await response.json();

      // Check for code in tweet text
      const tweetText = data.data?.text || '';
      const codeFound = tweetText.includes(code);

      // Check for video embed
      const media = data.includes?.media || [];
      const hasVideo = media.some(m => m.type === 'video');
      const videoUrlMatch = videoUrl
        ? media.some(m => m.url === videoUrl || tweetText.includes(videoUrl))
        : hasVideo;

      return {
        verified: codeFound && videoUrlMatch,
        codeFound,
        videoEmbedFound: videoUrlMatch,
        message: codeFound && videoUrlMatch
          ? 'Tweet verified successfully'
          : !codeFound
          ? 'Code not found in tweet'
          : 'Video embed not found in tweet',
        details: {
          tweet_text: tweetText,
          media_count: media.length,
          has_video: hasVideo,
        },
      };
      */

      // Placeholder response
      return {
        verified: true,
        codeFound: true,
        videoEmbedFound: true,
        message: 'Tweet verification placeholder - implement Twitter API integration',
        details: {
          note: 'This is a placeholder. Implement actual Twitter API verification.',
          code,
          tweet_id: tweetId,
          video_url: videoUrl,
        },
      };
    } catch (error) {
      return {
        verified: false,
        codeFound: false,
        videoEmbedFound: false,
        message: `Twitter API error: ${error.message}`,
      };
    }
  }

  /**
   * Extract tweet ID from various tweet URL formats
   */
  private extractTweetId(tweetUrl: string): string | null {
    try {
      // Handle various Twitter URL formats:
      // https://twitter.com/user/status/123456789
      // https://x.com/user/status/123456789
      // https://mobile.twitter.com/user/status/123456789

      const patterns = [
        /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
        /(?:twitter\.com|x\.com)\/statuses\/(\d+)/,
      ];

      for (const pattern of patterns) {
        const match = tweetUrl.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a verification code for a user and task
   */
  async generateVerificationCode(
    publicKey: string,
    taskId: number,
    videoUrl?: string,
    expiresInHours: number = 72,
  ): Promise<string> {
    const userCode = await this.userCodeService.generateCodeForUser(
      publicKey,
      taskId,
      CodeType.TWITTER_EMBED,
      {
        video_url: videoUrl,
        required_platform: 'twitter',
        embed_type: 'video',
      },
      expiresInHours,
    );

    return userCode.code;
  }

  /**
   * Verify a code without checking tweet (for testing or manual verification)
   */
  async verifyCodeOnly(code: string): Promise<{ valid: boolean; message: string }> {
    const result = await this.userCodeService.verifyCode(code);
    return {
      valid: result.valid,
      message: result.message || 'Code verified successfully',
    };
  }
}

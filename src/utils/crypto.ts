/**
 * Cryptographic utilities for security-sensitive operations.
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if both strings are equal, false otherwise.
 *
 * This function always compares all characters regardless of where
 * a mismatch occurs, preventing attackers from measuring response
 * time to deduce correct characters.
 */
export function timingSafeEqual(a: string, b: string): boolean {
    const maxLen = Math.max(a.length, b.length);
    let result = a.length ^ b.length; // Start with length difference

    for (let i = 0; i < maxLen; i++) {
        // Use 0 as fallback for shorter string to maintain constant time
        const charA = i < a.length ? a.charCodeAt(i) : 0;
        const charB = i < b.length ? b.charCodeAt(i) : 0;
        result |= charA ^ charB;
    }

    return result === 0;
}

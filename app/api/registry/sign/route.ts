import { NextRequest, NextResponse } from "next/server";
import { isAddress, encodePacked, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

/**
 * POST /api/registry/sign
 * Generate platform signature for coin registration
 *
 * Body: { creator: address, coin: address }
 * Returns: { signature: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { creator, coin } = await request.json();

    // Input validation
    if (!creator || !coin || !isAddress(creator) || !isAddress(coin)) {
      return NextResponse.json({ error: "Invalid addresses" }, { status: 400 });
    }

    // Fail fast if env missing
    const privateKey = process.env.REGISTRY_SIGNER_PRIVATE_KEY;
    if (!privateKey) {
      console.error("REGISTRY_SIGNER_PRIVATE_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Sign message matching contract: keccak256(creator, coin, chainId)
    const messageHash = keccak256(
      encodePacked(
        ["address", "address", "uint256"],
        [creator, coin, BigInt(base.id)]
      )
    );

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}

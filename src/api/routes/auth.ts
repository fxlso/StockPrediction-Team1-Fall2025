import express, { type Request, type Response } from "express";

import * as client from 'openid-client'
import { clientConfig, getClientConfig } from "../../lib/auth.js";

export const authRouter = express.Router();

authRouter.get("/login", async (_req: Request, res: Response) => {
    const codeVerifier = client.randomPKCECodeVerifier()
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
    const openIdClientConfig = await getClientConfig();
    const parameters: Record<string, string> = {
        redirect_uri: clientConfig.redirect_uri,
        scope: clientConfig.scope,
        code_challenge: codeChallenge,
        code_challenge_method: clientConfig.code_challenge_method,
    }

    let state!: string;
    if (!openIdClientConfig.serverMetadata().supportsPKCE()) {
        state = client.randomState();
        parameters.state = state;
    }

    const redirectTo = client.buildAuthorizationUrl(openIdClientConfig, parameters);

    // Store codeVerifier and state in session or database associated with the user
    res.cookie('code_verifier', codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    if (state) {
        res.cookie('auth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    }

    console.log("Redirecting to:", clientConfig.redirect_uri);

    res.redirect(redirectTo.toString());
});

authRouter.get("/callback", async (req: Request, res: Response) => {
    const authState = req.cookies['auth_state'];
    const codeVerifier = req.cookies['code_verifier'];

    if (!codeVerifier) {
        return res.status(400).send("Missing code verifier");
    }

    // Clean up cookies
    res.clearCookie('code_verifier');
    res.clearCookie('auth_state');

    const tokenSet = await getAuthorizationCode(req, codeVerifier, authState);
    const idToken = tokenSet.id_token;

    console.log("ID Token:", idToken);
    const claims = tokenSet.claims();
    const userInfo = await client.fetchUserInfo(await getClientConfig(), tokenSet.access_token, claims?.sub!)
    console.log("User Info:", userInfo);


});


/**
 * Function to get the authorization code from the request
 * @param request The request object
 * @returns The token set
 **/
async function getAuthorizationCode(
    req: Request,
    codeVerifier?: string, state?: string,
) {
    const openIdClientConfig = await getClientConfig();

    // Get the current URL
    const host =
        req.get("x-forwarded-host") || req.get("host") || "localhost";
    const protocol = req.get("x-forwarded-proto") || process.env.NODE_ENV === "production"
        ? "https"
        : "http";
    const currentUrl = new URL(
        `${protocol}://${host}${req.originalUrl}`,
    );

    console.log("Current URL:", currentUrl.toString());
    console.log("Code Verifier:", codeVerifier);
    console.log("State:", state);

    try {
        const tokenSet = await client.authorizationCodeGrant(
            openIdClientConfig,
            currentUrl,
            {
                pkceCodeVerifier: codeVerifier!,
                expectedState: state!,
            },
        );
        return tokenSet;
    } catch (err: any) {
        if (err.response && err.body) {
            console.error("OAuth error response:", err.body);
        }
        console.error("Full error:", err);
        throw err;
    }

    // Send a request to the OpenID Provider to exchange the code for tokens
    const tokenSet = await client.authorizationCodeGrant(
        openIdClientConfig,
        currentUrl,
        {
            pkceCodeVerifier: codeVerifier!,
            expectedState: state!,
        },
    );

    console.log("Token Set:", tokenSet);

    return tokenSet;
}


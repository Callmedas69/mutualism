Installation
Install auth-kit and its peer dependency viem.

sh
npm install @farcaster/auth-kit viem
Note: auth-kit is a React library. If you're using a different framework, take a look at the client library instead.

1. Import the libraries
Import auth-kit and CSS styles.

tsx
import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { SignInButton } from '@farcaster/auth-kit';
2. Configure your provider
Configure a provider with an Optimism RPC URL, your app's domain and login URL, and wrap your application in it.

tsx
const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'example.com',
  siweUri: 'https://example.com/login',
};

const App = () => {
  return (
    <AuthKitProvider config={config}>{/*   Your App   */}</AuthKitProvider>
  );
};
3. Add a connect button
Render the SignInButton component. When the user clicks this button, they will be prompted to complete sign in using their Farcaster wallet application.

tsx
export const Login = () => {
  return <SignInButton />;
};
4. Read user profile
Optionally, fetch details about the logged in user anywhere in your app with useProfile.

tsx
import { useProfile } from '@farcaster/auth-kit';

export const UserProfile = () => {
  const {
    isAuthenticated,
    profile: { username, fid },
  } = useProfile();
  return (
    <div>
      {isAuthenticated ? (
        <p>
          Hello, {username}! Your fid is: {fid}
        </p>
      ) : (
        <p>You're not signed in.</p>
      )}
    </div>
  );
};



SignInButton
The main component. Renders a "Sign in With Farcaster" button that prompts the user to scan a QR code with their phone in a web browser or redirects to a mobile device. You can use the onSuccess callback prop or the useProfile hook to access the user's authentication status and profile information.

Note: Make sure you've wrapped your application in an AuthKitProvider to use the SignInButton component.

tsx
import { SignInButton } from '@farcaster/auth-kit';

export const Login = () => {
  return (
    <SignInButton
      onSuccess={({ fid, username }) =>
        console.log(`Hello, ${username}! Your fid is ${fid}.`)
      }
    />
  );
};
Props
Prop	Type	Description	Default
timeout	number	Return an error after polling for this long.	300_000 (5 minutes)
interval	number	Poll the relay server for updates at this interval.	1500 (1.5 seconds)
nonce	string	A random nonce to include in the Sign In With Farcaster message.	None
notBefore	string	Time when the message becomes valid. ISO 8601 datetime string.	None
expirationTime	string	Time when the message expires. ISO 8601 datetime string.	None
requestId	string	An optional system-specific ID to include in the message.	None
onSuccess	function	Callback invoked when sign in is complete and the user is authenticated.	None
onStatusResponse	function	Callback invoked when the component receives a status update from the relay server.	None
onError	function	Error callback function.	None
onSignOut	function	Callback invoked when the user signs out.	None
hideSignOut	function	Hide the Sign out button.	false
debug	boolean	Render a debug panel displaying internal auth-kit state.	false
Examples
Custom nonce
tsx
import { SignInButton } from '@farcaster/auth-kit';

export const Login = ({ nonce }: { nonce: string }) => {
  return (
    <SignInButton
      nonce={nonce}
      onSuccess={({ fid, username }) =>
        console.log(`Hello, ${username}! Your fid is ${fid}.`)
      }
    />
  );
};

AuthKitProvider
Wrap your application in an AuthKitProvider to use Farcaster Auth. This provider component stores configuration information about your app and makes it available to auth-kit components and hooks.

Note: You must create an AuthKitProvider to use Farcaster Connect. Don't forget to create one at the top level of your application.

tsx
const config = {
  domain: 'example.com',
  siweUri: 'https://example.com/login',
  rpcUrl: process.env.OP_MAINNET_RPC_URL,
  relay: 'https://relay.farcaster.xyz',
};

const App = () => {
  return (
    <AuthKitProvider config={config}>{/*   Your App   */}</AuthKitProvider>
  );
};
Props
Prop	Type	Required	Description
config	AuthKitConfig	No	Configuration object. See the options in the table below.
config object options:

Parameter	Type	Required	Description	Default
domain	string	No	The domain of your application.	window.location.host
siweUri	string	No	The login URL of your application.	window.location.href
relay	string	No	Farcaster Auth relay server URL	https://relay.farcaster.xyz
rpcUrl	string	No	Optimism RPC server URL	https://mainnet.optimism.io
version	string	No	Farcaster Auth version	v1



useSignIn
Hook for signing in a user. Connects to the relay server, generates a sign in link to present to the user, and polls the relay server for the user's Farcaster wallet signature.

If you want to build your own sign in component with a custom UI, use the useSignIn hook.

tsx
import { useSignIn, QRCode } from '@farcaster/auth-kit';

function App() {
  const {
    signIn,
    url,
    data: { username },
  } = useSignIn({
    onSuccess: ({ fid }) => console.log('Your fid:', fid),
  });

  return (
    <div>
      <button onClick={signIn}>Sign In</button>
      {url && (
        <span>
          Scan this: <QRCode uri={url} />
        </span>
      )}
      {username && `Hello, ${username}!`}
    </div>
  );
}
Parameters
Parameter	Type	Description	Default
timeout	number	Return an error after polling for this long.	300_000 (5 minutes)
interval	number	Poll the relay server for updates at this interval.	1500 (1.5 seconds)
nonce	string	A random nonce to include in the Sign In With Farcaster message.	None
notBefore	string	Time when the SIWF message becomes valid. ISO 8601 datetime string.	None
expirationTime	string	Time when the SIWF message expires. ISO 8601 datetime string.	None
requestId	string	An optional system-specific ID to include in the SIWF message.	None
onSuccess	function	Callback invoked when sign in is complete and the user is authenticated.	None
onStatusResponse	function	Callback invoked when the component receives a status update from the relay server.	None
onError	function	Error callback function.	None
Returns
ts
  {
    signIn: () => void;
    signOut: () => void;
    connect: () => void;
    reconnect: () => void;
    isConnected: boolean;
    isSuccess: boolean;
    isPolling: boolean;
    isError: boolean;
    error: AuthClientError;
    channelToken: string;
    url: string;
    appClient: AppClient;
    data: {
        state: "pending" | "complete";
        nonce: string;
        message: string;
        signature: Hex;
        fid: number;
        username: string;
        bio: string;
        displayName: string;
        pfpUrl: string;
        custody?: Hex;
        verifications?: Hex[];
    },
    validSignature: boolean;
  };
Parameter	Description
signIn	Call this function following connect to begin polling for a signature.
signOut	Call this function to clear the AuthKit state and sign out the user.
connect	Connect to the auth relay and create a channel.
reconnect	Reconnect to the relay and try again. Call this in the event of an error.
isConnected	True if AuthKit is connected to the relay server and has an active channel.
isSuccess	True when the relay server returns a valid signature.
isPolling	True when the relay state is "pending" and the app is polling the relay server for a response.
isError	True when an error has occurred.
error	AuthClientError instance.
channelToken	Connect relay channel token.
url	Sign in With Farcaster URL to present to the user. Links to the Farcaster client in v1.
appClient	Underlying AppClient instance.
data.state	Status of the sign in request, either "pending" or "complete"
data.nonce	Random nonce used in the SIWE message. If you don't provide a custom nonce as an argument to the hook, you should read this value.
data.message	The generated SIWE message.
data.signature	Hex signature produced by the user's Farcaster client app wallet.
data.fid	User's Farcaster ID.
data.username	User's Farcaster username.
data.bio	User's Farcaster bio.
data.displayName	User's Farcaster display name.
data.pfpUrl	User's Farcaster profile picture URL.
data.custody	User's FID custody address.
data.verifications	List of user's verified addresses.
validSignature	True when the signature returned by the relay server is valid.



useSignInMessage
Hook for reading the Sign in With Farcaster message and signature used to authenticate the user.

If you're providing the message and signature to a backend API, you may want to use this hook.

tsx
import { useSignInMessage } from '@farcaster/auth-kit';

function App() {
  const { message, signature } = useSignInMessage();

  return (
    <div>
      <p>You signed: {message}</p>
      <p>Your signature: {signature}</p>
    </div>
  );
}
Returns
ts
{
  message: string;
  signature: Hex;
}
Parameter	Description
message	SIWE message signed by the user.
signature	Signature produced by the user's Farcaster wallet.

useProfile
Hook for reading information about the authenticated user.

You can use this hook to read the authenticated user's profile information from other components inside your app.

tsx
import { useProfile } from '@farcaster/auth-kit';

function App() {
  const {
    isAuthenticated,
    profile: { username, fid, bio, displayName, pfpUrl },
  } = useProfile();

  return (
    <div>
      {isAuthenticated ? (
        <p>
          Hello, {username}! Your fid is: {fid}
        </p>
      ) : (
        <p>You're not signed in.</p>
      )}
    </div>
  );
}
Returns
ts
  {
    isAuthenticated: boolean;
    profile?: {
        fid?: number;
        username?: string;
        bio?: string;
        displayName?: string;
        pfpUrl?: string;
        custody?: Hex;
        verifications?: Hex[];
    },
  };
Parameter	Description
isAuthenticated	True when the user is logged in.
profile.fid	User's Farcaster ID.
profile.username	User's username.
profile.bio	User's bio text.
profile.displayName	User's display name.
profile.pfpUrl	User's profile picture URL.
profile.custody	User's FID custody address.
profile.verifications	List of user's verified addresses.


App Client
If you're building a connected app and want users to sign in with Farcaster, use an AppClient.

You can use an AppClient to create a Farcaster Auth relay channel, generate a deep link to request a signature from the user's Farcaster wallet app, and verify the returned signature.

ts
import { createAppClient, viemConnector } from '@farcaster/auth-client';

const appClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});
Parameters
Parameter	Type	Description	Required
ethereum	EthereumConnector	
An Ethereum connector, used to query the Farcaster contracts and verify smart contract wallet signatures. @farcaster/auth-client currently provides only the viem connector type.

To use a custom RPC, pass an RPC URL to the viem connector.

Yes
relay	string	Relay server URL. Defaults to the public relay at https://relay.farcaster.xyz	No
version	string	Farcaster Auth version. Defaults to "v1"	No
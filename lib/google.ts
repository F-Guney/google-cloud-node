import { GoogleAuth, GoogleAuthOptions } from "google-auth-library";

const options: GoogleAuthOptions = {
  keyFile: "./credentials.json",
  scopes: "https://www.googleapis.com/auth/cloud-platform",
};

const auth = new GoogleAuth(options);

export default auth;

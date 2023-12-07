import { JWT } from "google-auth-library";
import "dotenv/config";

async function authentication(projectId: string) {
  const client = new JWT({
    email: process.env.EMAIL_USER,
    key: process.env.GOOGLE_API_KEY,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
  return await client.request({ url });
}

export default authentication;

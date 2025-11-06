import axios from "axios";
import { env } from "../config";

type LWUser = { id: string; email: string };
type LWEnrollment = { id: string; user_id: string; product_id: string };

const client = axios.create({
  baseURL: env.LEARNWORLDS_API_BASE.replace(/\/$/, ""),
  headers: {
    Authorization: `Bearer ${env.LEARNWORLDS_API_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

export async function findUserByEmail(email: string): Promise<LWUser | null> {
  // NOTE: Adjust the endpoint if your LW API differs
  const res = await client.get("/users", { params: { email } });
  const users: LWUser[] = res.data?.data || res.data?.users || [];
  return users.length ? users[0] : null;
}

export async function listUserEnrollments(userId: string): Promise<LWEnrollment[]> {
  // NOTE: Adjust the endpoint if your LW API differs
  const res = await client.get(`/users/${userId}/enrollments`);
  const enrollments: LWEnrollment[] = res.data?.data || res.data?.enrollments || [];
  return enrollments;
}

export async function unenrollEnrollment(enrollmentId: string): Promise<void> {
  // NOTE: Adjust the endpoint if your LW API differs
  await client.delete(`/enrollments/${enrollmentId}`);
}
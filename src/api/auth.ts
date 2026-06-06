import { AdminLoginDTO } from "@/types/auth";
import { AdminLoginRes } from '../types/auth';
import {http} from "./http"



export async function adminLogin(body: AdminLoginDTO) {
  return http<AdminLoginRes>("/admin/auth/login", "POST", body)
}
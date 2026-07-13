import { useMutation } from "@tanstack/react-query";

import {
  changePasswordRequest,
  forgotPasswordRequest,
  loginRequest,
  registerRequest,
  resetPasswordRequest,
} from "./api";

export function useLogin() {
  return useMutation({ mutationFn: loginRequest });
}

export function useRegister() {
  return useMutation({ mutationFn: registerRequest });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPasswordRequest });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPasswordRequest });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePasswordRequest });
}

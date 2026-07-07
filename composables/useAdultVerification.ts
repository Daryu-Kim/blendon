import { toUserMessage } from "~/utils/error-message";

export const useAdultVerification = () => {
  const auth = useAuthStore();
  const loading = ref(false);
  const error = ref("");

  const verifyWithIdentityCard = async (input: {
    name: string;
    rrn1: string;
    rrn2: string;
    issueDate: string;
  }) => {
    if (!auth.profile) throw new Error("로그인 후 성인 인증을 진행해 주세요.");
    loading.value = true;
    error.value = "";
    try {
      const result = await $fetch<{
        ok: boolean;
        provider: string;
        birthDate: string;
        verifiedAt: string;
      }>("/api/adult-verifications/identity-card", {
        method: "POST",
        body: {
          ...input,
          idToken: await useNuxtApp().$firebase.auth?.currentUser?.getIdToken(),
        },
      });
      if (!result.ok) throw new Error("성인 인증에 실패했어요.");
      await auth.markAdultVerified(result.provider, result.birthDate);
      return result;
    } catch (e) {
      error.value = toUserMessage(
        e,
        "성인 인증에 실패했어요. 입력한 정보를 다시 확인해 주세요.",
      );
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, verifyWithIdentityCard };
};

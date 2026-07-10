<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>메시지 테스트</h1>
        <p>뿌리오 문자 연동 설정과 발송 상태를 관리자 번호로 확인합니다.</p>
      </div>
    </div>

    <form class="message-test surface" @submit.prevent="sendTestMessage">
      <div class="form-grid">
        <label class="form-row">
          수신 번호
          <Input
            v-model="form.to"
            inputmode="tel"
            placeholder="010-0000-0000"
            required
          />
        </label>
        <label class="form-row">
          예상 유형
          <Input :model-value="`${messageType} / ${byteLength}byte`" readonly />
        </label>
        <label class="form-row wide">
          메시지 내용
          <Textarea v-model="form.message" rows="8" maxlength="2000" required />
        </label>
      </div>

      <div class="message-actions">
        <Button type="button" variant="ghost" @click="resetMessage">
          기본 문구
        </Button>
        <Button type="submit" :disabled="loading">
          {{ loading ? "발송 중" : "테스트 발송" }}
        </Button>
      </div>
    </form>

    <section v-if="result" class="surface result-panel">
      <h2>{{ result.sms.sent ? "발송 요청 완료" : "발송 실패" }}</h2>
      <dl>
        <div>
          <dt>상태</dt>
          <dd>{{ result.sms.status }}</dd>
        </div>
        <div>
          <dt>유형</dt>
          <dd>{{ result.sms.messageType || "-" }}</dd>
        </div>
        <div>
          <dt>Ref Key</dt>
          <dd>{{ result.sms.refKey || "-" }}</dd>
        </div>
        <div>
          <dt>Message Key</dt>
          <dd>{{ result.sms.messageKey || "-" }}</dd>
        </div>
        <div>
          <dt>Byte</dt>
          <dd>{{ result.byteLength }}</dd>
        </div>
      </dl>
      <p v-if="result.sms.message" class="result-message">
        {{ result.sms.message }}
      </p>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { toUserMessage } from "~/utils/error-message";

definePageMeta({ layout: "admin", middleware: "admin" });

interface MessageTestResult {
  ok: boolean;
  byteLength: number;
  sms: {
    sent: boolean;
    status: string;
    message?: string;
    messageType?: "SMS" | "LMS";
    refKey?: string;
    messageKey?: string;
  };
}

const toast = useToast();
const loading = ref(false);
const error = ref("");
const result = ref<MessageTestResult | null>(null);

const defaultMessage = () =>
  `[BLEND ON] 문자 발송 테스트입니다. ${new Date().toLocaleString("ko-KR")}`;

const form = reactive({
  to: "",
  message: defaultMessage(),
});

const byteLength = computed(() =>
  Array.from(form.message).reduce((sum, char) => {
    const code = char.charCodeAt(0);
    return sum + (code <= 0x7f ? 1 : 2);
  }, 0),
);
const messageType = computed(() => "LMS");

const resetMessage = () => {
  form.message = defaultMessage();
};

const sendTestMessage = async () => {
  error.value = "";
  result.value = null;
  loading.value = true;

  try {
    const firebase = useNuxtApp().$firebase;
    const token = await firebase.auth?.currentUser?.getIdToken();
    if (!token) throw new Error("관리자 로그인이 필요합니다.");

    const response = await $fetch<MessageTestResult>(
      "/api/admin/messages/test",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { ...form },
      },
    );
    result.value = response;
    toast.show(
      response.sms.sent
        ? "테스트 메시지 발송 요청이 완료되었습니다."
        : response.sms.message || "테스트 메시지 발송에 실패했습니다.",
      response.sms.sent ? "success" : "warning",
    );
  } catch (e) {
    error.value = toUserMessage(e, "테스트 메시지 발송에 실패했습니다.");
  } finally {
    loading.value = false;
  }
};

useHead({ title: "관리자 메시지 테스트" });
</script>

<style scoped>
.message-test,
.result-panel {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.wide {
  grid-column: 1 / -1;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.result-panel h2,
.result-message {
  margin: 0;
}

dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  border-bottom: 1px solid var(--color-line);
  padding-bottom: 8px;
}

dt {
  color: var(--color-muted);
  font-weight: 900;
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 800;
}

.result-message {
  color: var(--color-warning);
  font-weight: 900;
}

.error {
  color: var(--color-warning);
  font-weight: 900;
}

@media (min-width: 760px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

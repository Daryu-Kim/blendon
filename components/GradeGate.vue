<template>
  <slot v-if="allowed" />
  <div v-else class="grade-gate surface">
    <p class="eyebrow">MEMBERSHIP</p>
    <h2>{{ minGrade }} 등급부터 확인할 수 있어요.</h2>
    <p>회원 등급은 구매 이력과 운영 정책에 따라 조정됩니다.</p>
  </div>
</template>

<script setup lang="ts">
import type { GradeCode } from '~/types/domain'
import { hasGradeAtLeast } from '~/utils/access'

const props = defineProps<{ minGrade: GradeCode }>()
const auth = useAuthStore()
const allowed = computed(() => Boolean(auth.profile && hasGradeAtLeast(auth.profile.userGrade, props.minGrade)))
</script>

<style scoped>
.grade-gate {
  padding: 22px;
}

.grade-gate h2,
.grade-gate p {
  margin: 0;
}

.grade-gate p {
  margin-top: 8px;
  color: var(--color-muted);
}
</style>

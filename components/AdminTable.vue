<template>
  <div class="admin-table surface">
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">
              {{ column.label }}
            </th>
            <th v-if="$slots.actions">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row[rowKey]">
            <td v-for="column in columns" :key="column.key">
              <slot :name="column.key" :row="row">{{ row[column.key] }}</slot>
            </td>
            <td v-if="$slots.actions">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
defineProps<{
  rows: T[];
  columns: readonly { key: keyof T & string; label: string }[];
  rowKey: keyof T & string;
}>();
</script>

<style scoped>
.admin-table {
  overflow: hidden;
}

table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--color-line);
  padding: 12px;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #fbf8f1;
  font-size: 13px;
  font-weight: 900;
}
</style>

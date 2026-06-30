import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['.output/**', '.nuxt/**', 'functions/lib/**', 'node_modules/**']
}).override('nuxt/vue/rules', {
  rules: {
    'vue/multi-word-component-names': ['error', {
      ignores: ['Button', 'Input', 'Select', 'Textarea', 'Modal']
    }]
  }
})

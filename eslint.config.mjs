import nextConfig from "eslint-config-next"

const eslintConfig = [{ ignores: ["src/generated/**", "dist/**"] }, ...nextConfig]

export default eslintConfig

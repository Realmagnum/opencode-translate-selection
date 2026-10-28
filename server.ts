// Root entry shim: local plugin directories are resolved by file name at the package
// root, while published packages use the `exports` map in package.json.
export { default } from "./src/index.ts"
export * from "./src/index.ts"

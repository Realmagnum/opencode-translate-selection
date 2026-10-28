// Root entry shim: local plugin directories are resolved by file name at the package
// root, where OpenCode transpiles TSX with its generic JSX runtime (react). Point at the
// compiled bundle instead, which already carries the Solid transform and the host imports.
export { default } from "./dist/tui.js"
export * from "./dist/tui.js"

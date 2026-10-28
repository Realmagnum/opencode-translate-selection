import { exec, spawn } from "node:child_process"

/**
 * Cross-platform clipboard reader for TUI environments.
 */
export async function readClipboard(): Promise<string> {
  const platform = process.platform

  if (platform === "darwin") {
    return new Promise((resolve) => {
      exec("pbpaste", { encoding: "utf8", timeout: 2000 }, (error, stdout) => {
        if (error) {
          resolve("")
          return
        }
        resolve(stdout || "")
      })
    })
  }

  if (platform === "win32") {
    return new Promise((resolve) => {
      exec("powershell.exe -NoProfile -Command Get-Clipboard", { encoding: "utf8", timeout: 3000 }, (error, stdout) => {
        if (error) {
          resolve("")
          return
        }
        resolve(stdout ? stdout.replace(/\r\n/g, "\n") : "")
      })
    })
  }

  // Linux / BSD: try Wayland (wl-paste), then X11 (xclip / xsel)
  return new Promise((resolve) => {
    exec("wl-paste 2>/dev/null || xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output 2>/dev/null", { encoding: "utf8", timeout: 2000 }, (error, stdout) => {
      if (error) {
        resolve("")
        return
      }
      resolve(stdout || "")
    })
  })
}

/**
 * Cross-platform clipboard writer for TUI environments.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  const platform = process.platform

  if (platform === "darwin") {
    return new Promise((resolve) => {
      try {
        const child = spawn("pbcopy")
        child.stdin.write(text)
        child.stdin.end()
        child.on("close", (code) => resolve(code === 0))
        child.on("error", () => resolve(false))
      } catch {
        resolve(false)
      }
    })
  }

  if (platform === "win32") {
    return new Promise((resolve) => {
      try {
        const child = spawn("powershell.exe", ["-NoProfile", "-Command", "$input | Set-Clipboard"])
        child.stdin.write(text)
        child.stdin.end()
        child.on("close", (code) => resolve(code === 0))
        child.on("error", () => resolve(false))
      } catch {
        resolve(false)
      }
    })
  }

  // Linux / BSD
  return new Promise((resolve) => {
    try {
      const child = spawn("sh", ["-c", "wl-copy 2>/dev/null || xclip -selection clipboard 2>/dev/null || xsel --clipboard --input 2>/dev/null"])
      child.stdin.write(text)
      child.stdin.end()
      child.on("close", (code) => resolve(code === 0))
      child.on("error", () => resolve(false))
    } catch {
      resolve(false)
    }
  })
}

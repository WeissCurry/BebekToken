import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatTokenAmount(amount: string | number, decimals = 6): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function validateStacksAddress(address: string): boolean {
  // Basic Stacks address validation
  const stacksAddressRegex = /^S[0-9A-Z]{39}$|^ST[0-9A-Z]{38}$/
  return stacksAddressRegex.test(address)
}

export function truncateText(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isValidAmount(amount: string): boolean {
  const num = Number.parseFloat(amount)
  return !isNaN(num) && num > 0 && isFinite(num)
}

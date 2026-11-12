'use client'

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "./input"

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={className}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-muted)] hover:text-[var(--fg)]"
        >
          {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.4} /> : <Eye className="h-4 w-4" strokeWidth={1.4} />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }


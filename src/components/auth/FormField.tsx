import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormFieldProps = React.ComponentProps<"input"> & {
  label: string
  name: string
  error?: string
  labelAction?: React.ReactNode
}

export function FormField({ label, name, error, labelAction, ...props }: FormFieldProps) {
  const errorId = `${name}-error`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={name}>{label}</Label>
        {labelAction}
      </div>
      <Input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

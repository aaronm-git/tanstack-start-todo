import * as React from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './ui/input-group'
import { Eye, EyeOff } from 'lucide-react'

function InputPassword({ className, ...props }: React.ComponentProps<'input'>) {
  const [show, setShow] = React.useState(false)

  return (
    <InputGroup>
      <InputGroupInput
        type={show ? 'text' : 'password'}
        className={className}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { InputPassword }

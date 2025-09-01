import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaymentMethod, PaymentMethodIcon } from "./payment-method-icon";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onValueChange: (value: PaymentMethod) => void;
  availableMethods?: PaymentMethod[];
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'card', label: 'Card Payment' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'airtel', label: 'Airtel Money' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'apple_pay', label: 'Apple Pay' },
];

export function PaymentMethodSelector({
  value,
  onValueChange,
  availableMethods = ['card', 'mpesa', 'bank']
}: PaymentMethodSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={value => onValueChange(value as PaymentMethod)}
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
    >
      {PAYMENT_METHODS.filter(method => availableMethods.includes(method.id)).map((method) => (
        <div key={method.id} className="flex items-center space-x-4">
          <RadioGroupItem value={method.id} id={method.id} className="peer" />
          <Label
            htmlFor={method.id}
            className="flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-aria-checked:border-primary peer-aria-checked:ring-1 peer-aria-checked:ring-primary"
          >
            <PaymentMethodIcon method={method.id} className="mb-3" />
            <span className="font-medium text-sm">{method.label}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

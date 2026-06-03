type TabItem<T extends string> = {
  value: T
  label: string
}

type TabsProps<T extends string> = {
  items: Array<TabItem<T>>
  value: T
  onChange: (value: T) => void
}

export default function Tabs<T extends string>({ items, value, onChange }: TabsProps<T>) {
  return (
    <div className="ui-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={item.value === value ? 'active' : ''}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

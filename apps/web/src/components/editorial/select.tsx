'use client';

import { Children, isValidElement, useSyncExternalStore, useState, type ReactNode, type ReactElement } from 'react';
import * as Select from '@radix-ui/react-select';
import styles from './select.module.css';

type Props = {
  children: ReactNode; id?: string; name?: string; value?: string | number; defaultValue?: string | number;
  onValueChange?: (value: string) => void; disabled?: boolean; required?: boolean;
  'aria-label'?: string; 'aria-labelledby'?: string; 'data-testid'?: string;
};
const subscribe = () => () => {};
const client = () => true;
const server = () => false;
const empty = '__grid_atlas_empty__';
type OptionProps = { value?: string | number; children: ReactNode; disabled?: boolean; label?: string };
const optionElements = (children: ReactNode): ReactElement<OptionProps>[] => Children.toArray(children).flatMap(child =>
  !isValidElement<OptionProps>(child) ? [] : child.type === 'optgroup' ? optionElements(child.props.children) : child.type === 'option' ? [child] : []);
const renderItems = (children: ReactNode): ReactNode => Children.toArray(children).map(child => {
  if (!isValidElement<OptionProps>(child)) return null;
  if (child.type === 'optgroup') return <Select.Group key={child.key}><Select.Label className={styles.group}>{child.props.label}</Select.Label>{renderItems(child.props.children)}</Select.Group>;
  if (child.type !== 'option') return null;
  const value = String(child.props.value ?? child.props.children);
  return <Select.Item className={styles.option} key={value} data-value={value} value={value || empty} disabled={child.props.disabled}><Select.ItemText>{child.props.children}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item>;
});

/** Native GET form before hydration; Radix manages keyboard, touch and focus after it. */
export function EditorialSelect({ children, onValueChange, ...props }: Props) {
  const enhanced = useSyncExternalStore(subscribe, client, server);
  const options = optionElements(children);
  const [selection, setSelection] = useState(String(props.defaultValue ?? options[0]?.props.value ?? options[0]?.props.children ?? ''));
  if (!enhanced) return <select {...props} className={styles.trigger} onChange={event => onValueChange?.(event.target.value)}>{children}</select>;
  const { value, defaultValue, name, required, disabled, ...trigger } = props;
  return <Select.Root name={name} required={required} disabled={disabled}
    value={value === undefined ? undefined : String(value) || empty}
    defaultValue={String(defaultValue ?? options[0]?.props.value ?? options[0]?.props.children ?? '') || empty}
    onValueChange={next => { const decoded = next === empty ? '' : next; setSelection(decoded); onValueChange?.(decoded); }}>
    <Select.Trigger {...trigger} data-value={String(value ?? selection)} className={styles.trigger}><Select.Value /><Select.Icon aria-hidden="true">⌄</Select.Icon></Select.Trigger>
    <Select.Portal><Select.Content className={styles.menu} position="popper" sideOffset={6} collisionPadding={12}>
      <Select.ScrollUpButton className={styles.scroll}>⌃</Select.ScrollUpButton>
      <Select.Viewport>{renderItems(children)}</Select.Viewport>
      <Select.ScrollDownButton className={styles.scroll}>⌄</Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>;
}

import React from 'react';
import Select from './ui/Select';
import type { EntityOption } from '../hooks/useEntityOptions';

type Props = {
  label?: string;
  value: string;
  options: EntityOption[];
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  hint?: string;
};

const EntityLinkSelect: React.FC<Props> = ({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  allowClear = true,
}) => {
  return (
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.meta ? `${opt.label} · ${opt.meta}` : opt.label}
        </option>
      ))}
      {allowClear && value ? null : null}
    </Select>
  );
};

export default EntityLinkSelect;

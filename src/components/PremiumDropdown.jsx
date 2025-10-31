import React from 'react'
import './PremiumDropdown.css'

const PremiumDropdown = ({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  label,
}) => {
  return (
    <div className={`premium-dropdown ${disabled ? 'is-disabled' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="pd-label">{label}</label>
      )}
      <div className="pd-control">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="pd-select"
        >
          {placeholder && (
            <option value="" disabled hidden>{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="pd-chevron" aria-hidden>▾</span>
      </div>
    </div>
  )
}

export default PremiumDropdown



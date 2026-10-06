import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getQuickControlActionShortLabel } from './quickControlActionLabels';

/**
 * Chooser for multi-action locations (edit one / edit all, or delete one / delete all).
 */
export default function ActionChooserModal({
  open,
  mode = 'edit',
  actions = [],
  onPick,
  onCancel,
  buttonColor = '#232323',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  const isDelete = mode === 'delete';
  const title = isDelete ? 'Delete which action?' : 'Edit which action?';
  const allLabel = isDelete ? 'Delete All' : 'Edit All';

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 10,
          minWidth: 280,
          maxWidth: 420,
          width: '100%',
          padding: 16,
          boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#111' }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(actions || []).map((action, index) => (
            <button
              key={`${action?.type || 'a'}-${index}`}
              type="button"
              onClick={() => onPick?.(index)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                cursor: 'pointer',
                fontSize: 14,
                color: '#111',
              }}
            >
              {getQuickControlActionShortLabel(action)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPick?.('all')}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: 'none',
              background: buttonColor,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {allLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              color: '#374151',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

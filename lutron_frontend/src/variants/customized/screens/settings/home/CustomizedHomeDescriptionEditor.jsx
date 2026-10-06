import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, FormControl, MenuItem, Select } from '@mui/material';
import { CUSTOMIZED_HOME_FONT_SIZE_WHITELIST } from '../../../utils/customizedQuillFontSize';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { customizedSettingsHomeQuillSx } from '../../../utils/customizedSettingsHomeQuillSx';
import '../../../styles/customizedHomeQuill.css';

const DEFAULT_FONT_SIZE = '12px';

const formatSizeLabel = (size) => String(size).replace(/px$/, '');

const fontSizeSelectSx = {
    minWidth: 58,
    display: 'inline-flex',
    verticalAlign: 'middle',
    '& .MuiOutlinedInput-root': {
        height: 28,
        fontSize: 13,
        backgroundColor: '#fff',
        color: '#444',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#ccc',
    },
    '& .MuiSelect-select': {
        py: 0.25,
        px: 1,
        pr: '24px !important',
    },
};

/**
 * Settings Home description editor with Word-style font size dropdown (customized only).
 * Uses MUI Select in the Quill toolbar (after clear formatting) instead of the native picker.
 */
const CustomizedHomeDescriptionEditor = ({ value, onChange, placeholder = 'Write here' }) => {
    const quillRef = useRef(null);
    const toolbarSlotRef = useRef(null);
    const [toolbarSlot, setToolbarSlot] = useState(null);
    const [currentSize, setCurrentSize] = useState(DEFAULT_FONT_SIZE);

    const modules = useMemo(() => ({
        toolbar: [
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ color: [] }, { background: [] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ align: [] }],
            ['link', 'image'],
            ['clean'],
        ],
        clipboard: {
            matchVisual: false,
        },
    }), []);

    const formats = useMemo(() => [
        'list', 'bullet',
        'size', 'color', 'background',
        'bold', 'italic', 'underline', 'strike',
        'blockquote', 'code-block',
        'align',
        'link', 'image',
    ], []);

    useEffect(() => {
        let frameId = null;

        const mountToolbarSlot = () => {
            const editor = quillRef.current?.getEditor?.();
            if (!editor?.container) return false;

            const toolbar = editor.container.previousSibling;
            if (!toolbar?.classList?.contains('ql-toolbar')) return false;

            const cleanFormats = toolbar.querySelector('button.ql-clean')?.closest('.ql-formats');
            if (!cleanFormats) return false;

            let slot = toolbar.querySelector('.customized-home-font-size-formats');
            if (!slot) {
                slot = document.createElement('span');
                slot.className = 'ql-formats customized-home-font-size-formats';
                cleanFormats.insertAdjacentElement('afterend', slot);
            }

            toolbarSlotRef.current = slot;
            setToolbarSlot(slot);
            return true;
        };

        if (!mountToolbarSlot()) {
            frameId = requestAnimationFrame(() => {
                mountToolbarSlot();
            });
        }

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            toolbarSlotRef.current?.remove();
            toolbarSlotRef.current = null;
            setToolbarSlot(null);
        };
    }, []);

    const syncSizeFromSelection = useCallback((range) => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor || !range) return;

        const format = editor.getFormat(range);
        const nextSize = typeof format.size === 'string' ? format.size : DEFAULT_FONT_SIZE;
        setCurrentSize(CUSTOMIZED_HOME_FONT_SIZE_WHITELIST.includes(nextSize) ? nextSize : DEFAULT_FONT_SIZE);
    }, []);

    const handleSelectionChange = useCallback((range) => {
        syncSizeFromSelection(range);
    }, [syncSizeFromSelection]);

    const handleSizeChange = (event) => {
        const size = event.target.value;
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;

        let range = editor.getSelection();
        if (!range) {
            editor.focus();
            range = editor.getSelection(true);
        }
        if (!range) return;

        if (range.length > 0) {
            editor.formatText(range.index, range.length, 'size', size, 'user');
        } else {
            editor.format('size', size, 'user');
        }

        setCurrentSize(size);
    };

    const selectValue = CUSTOMIZED_HOME_FONT_SIZE_WHITELIST.includes(currentSize)
        ? currentSize
        : DEFAULT_FONT_SIZE;

    const fontSizeSelect = (
        <FormControl
            size="small"
            className="customized-home-font-size-select"
            sx={fontSizeSelectSx}
        >
            <Select
                value={selectValue}
                onChange={handleSizeChange}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            maxHeight: 280,
                            '& .MuiMenuItem-root': {
                                fontSize: 13,
                                color: '#444',
                            },
                        },
                    },
                }}
            >
                {CUSTOMIZED_HOME_FONT_SIZE_WHITELIST.map((size) => (
                    <MenuItem key={size} value={size}>
                        {formatSizeLabel(size)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <>
            <Box
                className="settings-home-quill customized-home-quill-with-size"
                sx={customizedSettingsHomeQuillSx}
            >
                <ReactQuill
                    ref={quillRef}
                    value={value}
                    onChange={onChange}
                    onChangeSelection={handleSelectionChange}
                    placeholder={placeholder}
                    modules={modules}
                    formats={formats}
                    theme="snow"
                />
            </Box>
            {toolbarSlot ? createPortal(fontSizeSelect, toolbarSlot) : null}
        </>
    );
};

export default CustomizedHomeDescriptionEditor;

import React, { useRef, useEffect } from 'react';

const IndeterminateCheckbox: React.FC<{
    checked: boolean;
    indeterminate: boolean;
    onChange: () => void;
    className?: string;
    disabled?: boolean;
    title?: string;
}> = ({ checked, indeterminate, onChange, title, ...rest }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate;
        }
    }, [indeterminate, checked]);
    return <input type="checkbox" ref={ref} checked={checked} onChange={onChange} title={title} {...rest} />;
};

export default IndeterminateCheckbox;

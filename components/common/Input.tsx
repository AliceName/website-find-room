'use client'

type InputProps = {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "number" | "email" | "password";
    required?: boolean;
    className?: string;
};

export default function Input({
    label,
    placeholder,
    value,
    onChange,
    type = "text",
    required = false,
    className = ""
}: InputProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`
                    px-4 py-2 
                    border border-gray-300 
                    rounded-lg 
                    focus:outline-none 
                    focus:ring-2 focus:ring-blue-500 
                    focus:border-transparent 
                    transition-all
                    ${className}
                `}
            />
        </div>
    );
}
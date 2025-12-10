'use client';

import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';

export interface FormOption {
    label: string;
    value: string;
}

export interface FormFieldConfig {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    rows?: number;
    options?: (string | FormOption)[];
}

interface ConfigFormProps {
    config: FormFieldConfig[];
    action: (formData: FormData) => Promise<any>;
    submitLabel?: string;
    initialValues?: Record<string, any>;
}

export function ConfigForm({ config, action, submitLabel = '送信', initialValues = {} }: ConfigFormProps) {
    return (
        <form action={action} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            {config.map((field) => (
                <div key={field.name} className="flex flex-col space-y-2">
                    <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                        <textarea
                            id={field.name}
                            name={field.name}
                            rows={field.rows || 3}
                            required={field.required}
                            placeholder={field.placeholder}
                            defaultValue={initialValues[field.name]}
                            className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    ) : field.type === 'select' ? (
                        <select
                            id={field.name}
                            name={field.name}
                            required={field.required}
                            defaultValue={initialValues[field.name]}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">選択してください</option>
                            {field.options?.map((opt, i) => {
                                const label = typeof opt === 'string' ? opt : opt.label;
                                const value = typeof opt === 'string' ? opt : opt.value;
                                return <option key={i} value={value}>{label}</option>;
                            })}
                        </select>
                    ) : field.type === 'tags' ? (
                        <TagInput
                            id={field.name}
                            name={field.name}
                            value={initialValues[field.name]}
                            onChange={(v) => { }} // Uncontrolled form uses the input's native value
                            suggestions={field.options as string[]}
                            placeholder={field.placeholder}
                        />
                    ) : (
                        <input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder}
                            defaultValue={initialValues[field.name]}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    )}
                </div>
            ))}

            <div className="pt-4">
                <Button type="submit" className="w-full md:w-auto">
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

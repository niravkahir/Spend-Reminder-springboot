
import { ReceiptText } from 'lucide-react';

export default function EmptyState({
    title = 'Nothing here yet',
    message = 'Once you add some expenses, your activity will appear here.'
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <ReceiptText size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-ink">
                {title}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
                {message}
            </p>
        </div>
    );
}

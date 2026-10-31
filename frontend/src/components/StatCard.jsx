
export default function StatCard({
    label,
    value,
    note,
    icon: Icon,
    tone = 'blue'
}) {
    const tones = {
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        violet: 'bg-violet-50 text-violet-700'
    };

    return (
        <div className="panel p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                        {value}
                    </p>
                </div>

                <div className={`rounded-xl p-3 ${tones[tone]}`}>
                    <Icon size={20} />
                </div>
            </div>

            {note && (
                <p className="mt-3 text-xs text-slate-500">
                    {note}
                </p>
            )}
        </div>
    );
}

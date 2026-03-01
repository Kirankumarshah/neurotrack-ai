import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
    );
};

export const DashboardSkeleton = () => {
    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-12 lg:grid-rows-6 lg:h-[900px]">
            <Skeleton className="md:col-span-12 lg:col-span-4 lg:row-span-6" />
            <Skeleton className="md:col-span-12 lg:col-span-8 lg:row-span-2" />
            <div className="md:col-span-6 lg:col-span-5 lg:row-span-2 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-full w-full" />)}
            </div>
            <Skeleton className="md:col-span-6 lg:col-span-3 lg:row-span-4" />
            <Skeleton className="md:col-span-12 lg:col-span-5 lg:row-span-2" />
        </div>
    )
}
